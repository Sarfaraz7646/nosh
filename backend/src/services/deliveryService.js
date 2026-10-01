const mongoose = require('mongoose');
const DeliveryPartner = require('../models/DeliveryPartner');
const DeliveryAssignment = require('../models/DeliveryAssignment');
const Order = require('../models/Order');
const Restaurant = require('../models/Restaurant');
const httpError = require('./httpError');
const { notifyUser } = require('./notificationService');

const DELIVERY_RADIUS_METERS = 5000;
const OFFER_TIMEOUT_MS = 30000;
const offerTimers = new Map();

function distanceBetweenKm(coordinatesA, coordinatesB) {
  const [longitudeA, latitudeA] = coordinatesA.map((coordinate) => coordinate * Math.PI / 180);
  const [longitudeB, latitudeB] = coordinatesB.map((coordinate) => coordinate * Math.PI / 180);
  const latitudeDelta = latitudeB - latitudeA;
  const longitudeDelta = longitudeB - longitudeA;
  const haversine = Math.sin(latitudeDelta / 2) ** 2
    + Math.cos(latitudeA) * Math.cos(latitudeB) * Math.sin(longitudeDelta / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine));
}

function estimateDeliveryEarning(distanceKm) {
  return Math.ceil(45 + distanceKm * 8);
}

function validateId(id, label) {
  if (!mongoose.isValidObjectId(id)) throw httpError(400, `Invalid ${label} id.`);
}

async function getPartner(userId) {
  const partner = await DeliveryPartner.findOne({ userId });
  if (!partner) throw httpError(404, 'Complete your delivery partner profile first.');
  return partner;
}

async function getProfile(userId) {
  return DeliveryPartner.findOne({ userId }).populate('userId', 'name email phone');
}

async function updateProfile(userId, data) {
  const updates = {
    vehicleType: data.vehicleType,
    vehicleNumber: data.vehicleNumber,
    licenseDocument: data.licenseDocument,
  };
  for (const [key, value] of Object.entries(updates)) {
    if (value === undefined) delete updates[key];
  }
  const existing = await DeliveryPartner.findOne({ userId });
  if (!existing && (!updates.vehicleType || !updates.vehicleNumber || !updates.licenseDocument)) {
    throw httpError(400, 'Vehicle type, vehicle number, and license document are required.');
  }
  const submittedDetailsChanged = existing && Object.entries(updates).some(([key, value]) => {
    const normalizedValue = key === 'vehicleNumber' && typeof value === 'string' ? value.trim().toUpperCase() : value?.trim?.() ?? value;
    return normalizedValue !== existing[key];
  });
  if (!existing || submittedDetailsChanged) {
    updates.isVerified = false;
    updates.verificationStatus = 'PENDING';
    updates.isOnline = false;
    updates.isAvailable = false;
    updates.reviewedAt = null;
    updates.reviewedBy = null;
    updates.rejectionReason = '';
  }
  const partner = await DeliveryPartner.findOneAndUpdate(
    { userId },
    { $set: updates, $setOnInsert: { userId } },
    { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
  ).populate('userId', 'name email phone');
  return partner;
}

async function setOnline(userId, isOnline, io) {
  if (typeof isOnline !== 'boolean') throw httpError(400, 'isOnline must be a boolean.');
  const partner = await getPartner(userId);
  if (isOnline && (!partner.isVerified || partner.verificationStatus !== 'APPROVED')) {
    throw httpError(403, 'Your profile must be approved before going online.');
  }
  partner.isOnline = isOnline;
  partner.isAvailable = isOnline;
  await partner.save();
  if (isOnline) {
    const readyOrders = await Order.find({ orderStatus: 'READY_FOR_PICKUP', deliveryPartnerId: null }).select('_id');
    for (const order of readyOrders) await dispatchNextPartner(order._id, io);
  } else {
    await cancelPartnerOffers(partner._id, io);
  }
  return partner;
}

async function updateLocation(userId, coordinates, io) {
  if (!Array.isArray(coordinates) || coordinates.length !== 2) {
    throw httpError(400, 'Location must be [longitude, latitude].');
  }
  const partner = await getPartner(userId);
  partner.currentLocation = { type: 'Point', coordinates };
  await partner.save();
  if (partner.isVerified && partner.verificationStatus === 'APPROVED' && partner.isOnline) {
    const readyOrders = await Order.find({ orderStatus: 'READY_FOR_PICKUP', deliveryPartnerId: null }).select('_id');
    for (const order of readyOrders) await dispatchNextPartner(order._id, io);
  }
  const activeAssignment = await DeliveryAssignment.findOne({
    deliveryPartnerId: partner._id,
    status: { $in: ['ACCEPTED', 'PICKED_UP'] },
  }).populate({ path: 'orderId', populate: { path: 'customerId', select: 'name' } });
  const order = activeAssignment?.orderId;
  if (order) {
    const distanceKm = order.address?.location?.coordinates
      ? Number(distanceBetweenKm(coordinates, order.address.location.coordinates).toFixed(2))
      : null;
    const locationUpdate = {
      orderId: order._id,
      latitude: coordinates[1],
      longitude: coordinates[0],
      coordinates,
      distanceKm,
      updatedAt: new Date(),
    };
    io?.to(`user:${order.customerId._id}`).emit('delivery:location', locationUpdate);
    io?.to(`restaurant:${order.restaurantId}`).emit('delivery:location', locationUpdate);
  }
  return partner.currentLocation;
}

function startOfToday() {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date;
}

function scheduleOfferExpiry(assignmentId, io) {
  const key = String(assignmentId);
  const previousTimer = offerTimers.get(key);
  if (previousTimer) clearTimeout(previousTimer);
  const timer = setTimeout(() => {
    offerTimers.delete(key);
    expireOffer(assignmentId, io).catch(() => {});
  }, OFFER_TIMEOUT_MS);
  timer.unref?.();
  offerTimers.set(key, timer);
}

async function expireOffer(assignmentId, io) {
  const offer = await DeliveryAssignment.findOneAndUpdate(
    { _id: assignmentId, status: 'OFFERED', offerExpiresAt: { $lte: new Date() } },
    { $set: { status: 'EXPIRED' } },
    { new: true }
  );
  if (!offer) {
    const current = await DeliveryAssignment.findById(assignmentId);
    if (current?.status === 'OFFERED') scheduleOfferExpiry(current._id, io);
    return current;
  }
  await Order.updateOne(
    { _id: offer.orderId, deliveryPartnerId: offer.deliveryPartnerId, orderStatus: 'READY_FOR_PICKUP' },
    { $set: { deliveryPartnerId: null } }
  );
  io?.to(`user:${offer.deliveryPartnerId}`).emit('delivery:request-expired', { orderId: offer.orderId });
  return dispatchNextPartner(offer.orderId, io);
}

async function expirePartnerOffers(partnerId, io) {
  const expiredOffers = await DeliveryAssignment.find({
    deliveryPartnerId: partnerId,
    status: 'OFFERED',
    offerExpiresAt: { $lte: new Date() },
  }).select('_id');
  for (const offer of expiredOffers) await expireOffer(offer._id, io);
}

async function expireTimedOutOffers(io) {
  const expiredOffers = await DeliveryAssignment.find({
    status: 'OFFERED',
    offerExpiresAt: { $lte: new Date() },
  }).select('_id');
  for (const offer of expiredOffers) await expireOffer(offer._id, io);
}

async function cancelPartnerOffers(partnerId, io) {
  const offers = await DeliveryAssignment.find({ deliveryPartnerId: partnerId, status: 'OFFERED' });
  for (const offer of offers) {
    offer.status = 'CANCELLED';
    offer.cancelledAt = new Date();
    await offer.save();
    const timer = offerTimers.get(String(offer._id));
    if (timer) clearTimeout(timer);
    offerTimers.delete(String(offer._id));
    await Order.updateOne(
      { _id: offer.orderId, deliveryPartnerId: partnerId, orderStatus: 'READY_FOR_PICKUP' },
      { $set: { deliveryPartnerId: null } }
    );
    await dispatchNextPartner(offer.orderId, io);
  }
}

async function dispatchNextPartner(orderId, io) {
  const order = await Order.findOne({ _id: orderId, orderStatus: 'READY_FOR_PICKUP', deliveryPartnerId: null });
  if (!order) return null;

  const activeOffer = await DeliveryAssignment.findOne({
    orderId,
    status: { $in: ['OFFERED', 'ACCEPTED', 'PICKED_UP'] },
  });
  if (activeOffer) {
    if (activeOffer.status !== 'OFFERED' || activeOffer.offerExpiresAt > new Date()) return activeOffer;
    activeOffer.status = 'EXPIRED';
    await activeOffer.save();
  }

  const restaurant = await Restaurant.findById(order.restaurantId).populate('address', 'location');
  const restaurantCoordinates = restaurant?.location?.coordinates || restaurant?.address?.location?.coordinates;
    if (!restaurantCoordinates || restaurantCoordinates.length !== 2) {
    io?.to(`restaurant:${order.restaurantId}`).emit('delivery:dispatch-unavailable', {
      orderId: order._id,
      reason: 'Add a restaurant GeoJSON location to dispatch nearby partners.',
    });
        if (restaurant?.ownerId) {
          await notifyUser(io, {
            userId: restaurant.ownerId,
            type: 'DELIVERY_UPDATE',
            title: 'Delivery assignment needs attention',
            message: 'Add the restaurant pickup coordinates to enable nearby partner matching.',
            data: { orderId, status: 'LOCATION_REQUIRED' },
          });
        }
    return null;
  }

  const previousPartnerIds = await DeliveryAssignment.distinct('deliveryPartnerId', {
    orderId,
    status: { $in: ['OFFERED', 'ACCEPTED', 'PICKED_UP', 'REJECTED', 'EXPIRED', 'CANCELLED', 'DELIVERED'] },
  });
  const busyPartnerIds = await DeliveryAssignment.distinct('deliveryPartnerId', {
    status: { $in: ['OFFERED', 'ACCEPTED', 'PICKED_UP'] },
  });
  const excludedIds = [...new Set([...previousPartnerIds, ...busyPartnerIds].map(String))]
    .map((id) => new mongoose.Types.ObjectId(id));
  const partners = await DeliveryPartner.find({
    _id: { $nin: excludedIds },
    isVerified: true,
    verificationStatus: 'APPROVED',
    isOnline: true,
    isAvailable: true,
    currentLocation: {
      $near: {
        $geometry: { type: 'Point', coordinates: restaurantCoordinates },
        $maxDistance: DELIVERY_RADIUS_METERS,
      },
    },
  }).select('userId currentLocation').populate('userId', 'name').limit(50);

  const nearbyPartners = partners
    .map((partner) => ({
      partner,
      distanceKm: distanceBetweenKm(restaurantCoordinates, partner.currentLocation.coordinates),
    }))
    .filter(({ distanceKm }) => distanceKm <= DELIVERY_RADIUS_METERS / 1000)
    .sort((a, b) => a.distanceKm - b.distanceKm);

  for (let index = 0; index < nearbyPartners.length; index += 1) {
    const { partner, distanceKm } = nearbyPartners[index];
    const reservedOrder = await Order.findOneAndUpdate(
      { _id: orderId, orderStatus: 'READY_FOR_PICKUP', deliveryPartnerId: null },
      { $set: { deliveryPartnerId: partner._id } },
      { new: true }
    );
    if (!reservedOrder) return null;

    const offeredAt = new Date();
    const offerExpiresAt = new Date(offeredAt.getTime() + OFFER_TIMEOUT_MS);
    let assignment;
    try {
      assignment = await DeliveryAssignment.create({
        orderId,
        deliveryPartnerId: partner._id,
        status: 'OFFERED',
        assignedAt: offeredAt,
        offeredAt,
        offerExpiresAt,
        distanceMeters: Math.round(distanceKm * 1000),
        earning: estimateDeliveryEarning(distanceKm),
      });
    } catch (error) {
      await Order.updateOne({ _id: orderId, deliveryPartnerId: partner._id }, { $set: { deliveryPartnerId: null } });
      throw error;
    }

    const populatedOrder = await Order.findById(orderId)
      .populate('restaurantId', 'name image')
      .populate('customerId', 'name phone');
    const payload = {
      ...populatedOrder.toObject(),
      orderNumber: orderId.toString().slice(-6).toUpperCase(),
      deliveryStatus: 'OFFERED',
      deliveryAssignmentId: assignment._id,
      distanceKm: Number(distanceKm.toFixed(1)),
      estimatedEarning: assignment.earning,
      offerExpiresAt,
    };
    io?.to(`user:${partner.userId._id}`).emit('delivery:request', payload);
    await notifyUser(io, {
      userId: partner.userId._id,
      type: 'DELIVERY_UPDATE',
      title: 'New delivery request',
      message: `Order #${payload.orderNumber} is ${distanceKm.toFixed(1)} km away. Estimated earning ₹${assignment.earning}.`,
      data: { orderId, assignmentId: assignment._id, distanceKm: Number(distanceKm.toFixed(1)), earning: assignment.earning },
    });
    io?.to(`restaurant:${order.restaurantId}`).emit('delivery:dispatch', {
      orderId,
      nearbyPartners: nearbyPartners.map(({ partner: nearbyPartner, distanceKm: nearbyDistance }) => ({
        name: nearbyPartner.userId?.name || 'Delivery partner',
        distanceKm: Number(nearbyDistance.toFixed(1)),
      })),
      offeredTo: partner.userId.name,
      distanceKm: Number(distanceKm.toFixed(1)),
      rank: index + 1,
    });
    if (restaurant.ownerId) {
      await notifyUser(io, {
        userId: restaurant.ownerId,
        type: 'DELIVERY_UPDATE',
        title: 'Delivery request sent',
        message: `Order #${payload.orderNumber} was offered to ${partner.userId.name} first (${distanceKm.toFixed(1)} km).`,
        data: { orderId, deliveryPartnerId: partner._id, distanceKm, rank: index + 1 },
      });
    }
    scheduleOfferExpiry(assignment._id, io);
    return { assignment, order: populatedOrder, nearbyPartners, offeredTo: partner.userId.name, distanceKm };
  }

  io?.to(`restaurant:${order.restaurantId}`).emit('delivery:dispatch-unavailable', {
    orderId: order._id,
    reason: 'No approved online delivery partners are currently within 5 km.',
  });
    if (restaurant.ownerId) {
      await notifyUser(io, {
        userId: restaurant.ownerId,
        type: 'DELIVERY_UPDATE',
        title: 'No delivery partner nearby',
        message: `Order #${order._id.toString().slice(-6).toUpperCase()} is waiting for an online partner within 5 km.`,
        data: { orderId, status: 'NO_PARTNER_WITHIN_RADIUS' },
      });
    }
  return null;
}

function formatOffer(offer) {
  if (!offer?.orderId) return null;
  return {
    ...offer.orderId.toObject(),
    orderNumber: offer.orderId._id.toString().slice(-6).toUpperCase(),
    deliveryStatus: 'OFFERED',
    deliveryAssignmentId: offer._id,
    distanceKm: Number((offer.distanceMeters / 1000).toFixed(1)),
    estimatedEarning: offer.earning,
    earning: offer.earning,
    offerExpiresAt: offer.offerExpiresAt,
  };
}

async function getDashboard(userId, io) {
  const partner = await getPartner(userId);
  await expirePartnerOffers(partner._id, io);
  const today = startOfToday();
  const [activeAssignment, availableOffers, completedToday, earningsToday] = await Promise.all([
    DeliveryAssignment.findOne({
      deliveryPartnerId: partner._id,
      status: { $in: ['ACCEPTED', 'PICKED_UP'] },
    }).sort({ assignedAt: -1 }).populate({
      path: 'orderId',
      populate: [
        { path: 'restaurantId', select: 'name image address', populate: { path: 'address' } },
        { path: 'customerId', select: 'name phone' },
      ],
    }),
    partner.isVerified && partner.verificationStatus === 'APPROVED' && partner.isOnline
      ? DeliveryAssignment.find({
        deliveryPartnerId: partner._id,
        status: 'OFFERED',
        offerExpiresAt: { $gt: new Date() },
      }).sort({ distanceMeters: 1, offeredAt: 1 }).populate({
        path: 'orderId',
        populate: [
          { path: 'restaurantId', select: 'name image' },
          { path: 'customerId', select: 'name phone' },
        ],
      })
      : [],
    DeliveryAssignment.countDocuments({
      deliveryPartnerId: partner._id,
      status: 'DELIVERED',
      completedAt: { $gte: today },
    }),
    DeliveryAssignment.aggregate([
      { $match: { deliveryPartnerId: partner._id, status: 'DELIVERED', completedAt: { $gte: today } } },
      { $group: { _id: null, total: { $sum: '$earning' } } },
    ]),
  ]);

  return {
    partner,
    activeDelivery: activeAssignment ? {
      assignment: activeAssignment,
      order: activeAssignment.orderId,
    } : null,
    availableOrders: availableOffers.map(formatOffer).filter(Boolean),
    today: {
      deliveries: completedToday,
      earnings: earningsToday[0]?.total || 0,
      rating: partner.rating,
    },
  };
}

async function listOrders(userId, io) {
  const partner = await getPartner(userId);
  await expirePartnerOffers(partner._id, io);
  const [assigned, offers] = await Promise.all([
    DeliveryAssignment.find({
      deliveryPartnerId: partner._id,
      status: { $in: ['ACCEPTED', 'PICKED_UP', 'DELIVERED'] },
    }).sort({ assignedAt: -1 }).limit(30).populate({
      path: 'orderId',
      populate: [
        { path: 'restaurantId', select: 'name image address', populate: { path: 'address' } },
        { path: 'customerId', select: 'name phone' },
      ],
    }),
    partner.isVerified && partner.verificationStatus === 'APPROVED' && partner.isOnline
      ? DeliveryAssignment.find({
        deliveryPartnerId: partner._id,
        status: 'OFFERED',
        offerExpiresAt: { $gt: new Date() },
      }).sort({ distanceMeters: 1, offeredAt: 1 }).populate({
        path: 'orderId',
        populate: [
          { path: 'restaurantId', select: 'name image' },
          { path: 'customerId', select: 'name phone' },
        ],
      })
      : [],
  ]);
  return { assigned, available: offers.map(formatOffer).filter(Boolean) };
}

async function acceptOrder(userId, orderId, io) {
  validateId(orderId, 'order');
  const partner = await getPartner(userId);
  await partner.populate('userId', 'name');
  if (!partner.isVerified || partner.verificationStatus !== 'APPROVED' || !partner.isOnline) {
    throw httpError(403, 'An approved partner profile must be online to accept deliveries.');
  }
  await expirePartnerOffers(partner._id, io);
  const active = await DeliveryAssignment.exists({
    deliveryPartnerId: partner._id,
    status: { $in: ['ACCEPTED', 'PICKED_UP'] },
  });
  if (active) throw httpError(409, 'Complete your current delivery before accepting another.');
  const assignment = await DeliveryAssignment.findOneAndUpdate(
    { orderId, deliveryPartnerId: partner._id, status: 'OFFERED', offerExpiresAt: { $gt: new Date() } },
    { $set: { status: 'ACCEPTED', acceptedAt: new Date() } },
    { new: true }
  );
  if (!assignment) throw httpError(409, 'This delivery offer expired or is no longer assigned to you.');
  const timer = offerTimers.get(String(assignment._id));
  if (timer) clearTimeout(timer);
  offerTimers.delete(String(assignment._id));

  const order = await Order.findOne({
    _id: orderId,
    orderStatus: 'READY_FOR_PICKUP',
    deliveryPartnerId: partner._id,
  });
  if (!order) {
    assignment.status = 'CANCELLED';
    await assignment.save();
    throw httpError(409, 'This delivery is no longer available.');
  }
  order.orderStatus = 'PARTNER_ASSIGNED';
  await order.save();
  await order.populate([
    { path: 'restaurantId', select: 'name image ownerId location address', populate: { path: 'address', select: 'location addressLine1 city state postalCode' } },
    { path: 'customerId', select: 'name phone' },
  ]);
  const payload = { ...order.toObject(), orderNumber: order._id.toString().slice(-6).toUpperCase() };
  io?.to(`user:${order.customerId._id}`).emit('order:updated', payload);
  io?.to(`restaurant:${order.restaurantId._id}`).emit('order:updated', payload);
  io?.to(`user:${order.customerId._id}`).emit('delivery:accepted', {
    orderId: order._id,
    orderNumber: payload.orderNumber,
    partnerName: partner.userId?.name || 'Your delivery partner',
  });
  io?.to(`restaurant:${order.restaurantId._id}`).emit('delivery:accepted', {
    orderId: order._id,
    orderNumber: payload.orderNumber,
    partnerName: partner.userId?.name || 'Delivery partner',
  });
  await notifyUser(io, {
    userId: order.customerId._id,
    type: 'DELIVERY_UPDATE',
    title: 'Delivery partner assigned',
    message: `${partner.userId?.name || 'A delivery partner'} accepted order #${payload.orderNumber}.`,
    data: { orderId: order._id, deliveryPartnerId: partner._id, orderStatus: order.orderStatus },
  });
  if (order.restaurantId.ownerId) {
    await notifyUser(io, {
      userId: order.restaurantId.ownerId,
      type: 'DELIVERY_UPDATE',
      title: 'Partner accepted delivery',
      message: `A delivery partner accepted order #${payload.orderNumber}.`,
      data: { orderId: order._id, deliveryPartnerId: partner._id },
    });
  }
  return { assignment, order };
}

async function declineOrder(userId, orderId, io) {
  validateId(orderId, 'order');
  const partner = await getPartner(userId);
  const offer = await DeliveryAssignment.findOneAndUpdate(
    {
      orderId,
      deliveryPartnerId: partner._id,
      status: 'OFFERED',
      offerExpiresAt: { $gt: new Date() },
    },
    { $set: { status: 'REJECTED', cancelledAt: new Date() } },
    { new: true }
  );
  if (!offer) throw httpError(409, 'This delivery request expired or is no longer assigned to you.');

  const timer = offerTimers.get(String(offer._id));
  if (timer) clearTimeout(timer);
  offerTimers.delete(String(offer._id));
  await Order.updateOne(
    { _id: orderId, deliveryPartnerId: partner._id, orderStatus: 'READY_FOR_PICKUP' },
    { $set: { deliveryPartnerId: null } }
  );
  const nextOffer = await dispatchNextPartner(orderId, io);
  return { declined: true, nextPartnerOffered: Boolean(nextOffer) };
}

async function markPickedUp(userId, orderId, io) {
  validateId(orderId, 'order');
  const partner = await getPartner(userId);
  const assignment = await DeliveryAssignment.findOneAndUpdate(
    { orderId, deliveryPartnerId: partner._id, status: 'ACCEPTED' },
    { $set: { status: 'PICKED_UP', pickedUpAt: new Date() } },
    { new: true }
  );
  if (!assignment) throw httpError(409, 'Accept this delivery before marking it picked up.');
  const order = await Order.findOneAndUpdate(
    { _id: orderId, deliveryPartnerId: partner._id, orderStatus: 'PARTNER_ASSIGNED' },
    { $set: { orderStatus: 'OUT_FOR_DELIVERY' } },
    { new: true }
  ).populate({ path: 'restaurantId', select: 'name image ownerId location address', populate: { path: 'address', select: 'location addressLine1 city state postalCode' } }).populate('customerId', 'name phone');
  if (!order) throw httpError(409, 'Order is not ready for pickup.');
  const savedOrder = {
    ...order.toObject(),
    orderNumber: order._id.toString().slice(-6).toUpperCase(),
  };
  io?.to(`user:${order.customerId._id}`).emit('order:updated', savedOrder);
  io?.to(`restaurant:${order.restaurantId._id}`).emit('order:updated', savedOrder);
  await notifyUser(io, {
    userId: order.customerId._id,
    type: 'DELIVERY_UPDATE',
    title: 'Order picked up',
    message: `Order #${savedOrder.orderNumber} is on the way.`,
    data: { orderId: order._id, orderStatus: order.orderStatus },
  });
  return { assignment, order };
}

async function markDelivered(userId, orderId, io) {
  validateId(orderId, 'order');
  const partner = await getPartner(userId);
  const assignment = await DeliveryAssignment.findOne({
    orderId,
    deliveryPartnerId: partner._id,
    status: 'PICKED_UP',
  });
  if (!assignment) throw httpError(409, 'Pick up this delivery before completing it.');

  const order = await Order.findOneAndUpdate(
    { _id: orderId, deliveryPartnerId: partner._id, orderStatus: 'OUT_FOR_DELIVERY' },
    { $set: { orderStatus: 'DELIVERED' } },
    { new: true }
  ).populate({ path: 'restaurantId', select: 'name image ownerId location address', populate: { path: 'address', select: 'location addressLine1 city state postalCode' } }).populate('customerId', 'name phone');
  if (!order) throw httpError(409, 'Order is not out for delivery.');

  assignment.status = 'DELIVERED';
  assignment.completedAt = new Date();
  assignment.earning = order.deliveryFee;
  await assignment.save();
  partner.earnings += assignment.earning;
  await partner.save();
  const savedOrder = {
    ...order.toObject(),
    orderNumber: order._id.toString().slice(-6).toUpperCase(),
  };
  io?.to(`user:${order.customerId._id}`).emit('order:updated', savedOrder);
  io?.to(`restaurant:${order.restaurantId._id}`).emit('order:updated', savedOrder);
  await notifyUser(io, {
    userId: order.customerId._id,
    type: 'DELIVERY_UPDATE',
    title: 'Delivery completed',
    message: `Order #${savedOrder.orderNumber} has been delivered.`,
    data: { orderId: order._id, orderStatus: order.orderStatus },
  });
  return { assignment, order, earning: assignment.earning };
}

async function getEarnings(userId) {
  const partner = await getPartner(userId);
  const today = startOfToday();
  const [daily, recent] = await Promise.all([
    DeliveryAssignment.aggregate([
      { $match: { deliveryPartnerId: partner._id, status: 'DELIVERED' } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$completedAt' } }, deliveries: { $sum: 1 }, amount: { $sum: '$earning' } } },
      { $sort: { _id: -1 } },
      { $limit: 7 },
    ]),
    DeliveryAssignment.find({ deliveryPartnerId: partner._id, status: 'DELIVERED' })
      .sort({ completedAt: -1 }).limit(20).populate('orderId', 'restaurantId totalAmount'),
  ]);
  return {
    today: await DeliveryAssignment.aggregate([
      { $match: { deliveryPartnerId: partner._id, status: 'DELIVERED', completedAt: { $gte: today } } },
      { $group: { _id: null, amount: { $sum: '$earning' }, deliveries: { $sum: 1 } } },
    ]).then((result) => result[0] || { amount: 0, deliveries: 0 }),
    lifetime: partner.earnings,
    daily,
    recent,
  };
}

module.exports = {
  getProfile,
  updateProfile,
  setOnline,
  updateLocation,
  getDashboard,
  listOrders,
  acceptOrder,
  declineOrder,
  markPickedUp,
  markDelivered,
  getEarnings,
  dispatchNextPartner,
  expireTimedOutOffers,
  DELIVERY_RADIUS_METERS,
  distanceBetweenKm,
  estimateDeliveryEarning,
};
