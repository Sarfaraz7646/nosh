const mongoose = require('mongoose');
const Order = require('../models/Order');
const MenuItem = require('../models/MenuItem');
const Restaurant = require('../models/Restaurant');
const httpError = require('./httpError');
const { assertRestaurantAccess } = require('./restaurantService');
const { notifyUser } = require('./notificationService');

const DELIVERY_FEE = 40;
const TAX_RATE = 0.05;
const allowedTransitions = {
  PLACED: ['ACCEPTED', 'REJECTED'],
  ACCEPTED: ['PREPARING'],
  PREPARING: ['READY_FOR_PICKUP'],
};

function validateObjectId(id, label) {
  if (!mongoose.isValidObjectId(id)) throw httpError(400, `Invalid ${label} id.`);
}

function normalizeItems(items) {
  if (!Array.isArray(items) || items.length === 0) throw httpError(400, 'An order must contain at least one item.');
  const quantities = new Map();
  for (const item of items) {
    validateObjectId(item.menuItemId, 'menu item');
    if (!Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > 99) {
      throw httpError(400, 'Item quantity must be an integer between 1 and 99.');
    }
    quantities.set(item.menuItemId, (quantities.get(item.menuItemId) || 0) + item.quantity);
  }
  return quantities;
}

async function createOrder({ customerId, restaurantId, items, address, paymentMethod }, io) {
  validateObjectId(restaurantId, 'restaurant');
  const restaurant = await Restaurant.findOne({ _id: restaurantId, isApproved: true, isActive: true }).select('_id name ownerId location address');
  if (!restaurant) throw httpError(404, 'This restaurant is not accepting orders.');
  const quantities = normalizeItems(items);
  const menuItems = await MenuItem.find({
    _id: { $in: [...quantities.keys()] },
    restaurantId,
    isAvailable: true,
  });
  if (menuItems.length !== quantities.size) {
    throw httpError(400, 'One or more dishes are unavailable or do not belong to this restaurant.');
  }

  const orderItems = menuItems.map((item) => ({
    menuItemId: item._id,
    name: item.name,
    price: item.price,
    quantity: quantities.get(item._id.toString()),
  }));
  const subtotal = orderItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const tax = Math.floor(subtotal * TAX_RATE);
  const totalAmount = subtotal + DELIVERY_FEE + tax;

  const order = await Order.create({
    customerId,
    restaurantId,
    items: orderItems,
    address,
    subtotal,
    deliveryFee: DELIVERY_FEE,
    tax,
    totalAmount,
    paymentMethod,
    paymentStatus: 'PENDING',
    orderStatus: 'PLACED',
  });
  const populatedOrder = await Order.findById(order._id)
    .populate({ path: 'restaurantId', select: 'name image location address', populate: { path: 'address', select: 'location addressLine1 city state postalCode' } })
    .populate('customerId', 'name phone');
  const savedOrder = {
    ...(populatedOrder.toObject()),
    restaurantName: restaurant.name,
    orderNumber: order._id.toString().slice(-6).toUpperCase(),
  };
  if (paymentMethod === 'Cash on delivery') {
    io?.to(`restaurant:${restaurantId}`).emit('order:new', savedOrder);
    io?.to(`user:${customerId}`).emit('order:created', savedOrder);
    await Promise.all([
      notifyUser(io, {
        userId: restaurant.ownerId,
        type: 'ORDER_UPDATE',
        title: 'New order received',
        message: `Order #${savedOrder.orderNumber} is ready for your review.`,
        data: { orderId: order._id, orderStatus: order.orderStatus },
      }),
      notifyUser(io, {
        userId: customerId,
        type: 'ORDER_UPDATE',
        title: 'Order placed',
        message: `Your order from ${restaurant.name} has been placed.`,
        data: { orderId: order._id, orderStatus: order.orderStatus },
      }),
    ]);
  }
  return savedOrder;
}

async function listCustomerOrders(customerId) {
  return Order.find({ customerId })
    .populate({ path: 'restaurantId', select: 'name image location address', populate: { path: 'address', select: 'location addressLine1 city state postalCode' } })
    .sort({ createdAt: -1 });
}

async function listRestaurantOrders(restaurantId, user) {
  await assertRestaurantAccess(restaurantId, user);
  return Order.find({ restaurantId }).populate('customerId', 'name phone').sort({ createdAt: -1 });
}

async function listRestaurantOrdersForOwner(user) {
  const restaurants = await Restaurant.find({ ownerId: user.id }).select('_id');
  const restaurantIds = restaurants.map((restaurant) => restaurant._id);
  return Order.find({ restaurantId: { $in: restaurantIds } })
    .populate('customerId', 'name phone')
    .populate('restaurantId', 'name image')
    .sort({ createdAt: -1 });
}

async function getOrder(id, user) {
  validateObjectId(id, 'order');
  const order = await Order.findById(id)
    .populate({ path: 'restaurantId', select: 'name image location address', populate: { path: 'address', select: 'location addressLine1 city state postalCode' } })
    .populate('customerId', 'name phone');
  if (!order) throw httpError(404, 'Order not found.');
  if (user.role === 'ADMIN') return order;
  if (user.role === 'CUSTOMER' && String(order.customerId._id) === user.id) return order;
  if (user.role === 'RESTAURANT') {
    await assertRestaurantAccess(order.restaurantId._id, user);
    return order;
  }
  throw httpError(403, 'You do not have permission to view this order.');
}

async function updateRestaurantOrderStatus(id, orderStatus, user, io) {
  validateObjectId(id, 'order');
  if (!Object.values(allowedTransitions).flat().includes(orderStatus)) {
    throw httpError(400, 'Invalid restaurant order status.');
  }
  const order = await Order.findById(id);
  if (!order) throw httpError(404, 'Order not found.');
  await assertRestaurantAccess(order.restaurantId, user);
  if (!allowedTransitions[order.orderStatus]?.includes(orderStatus)) {
    throw httpError(409, `Cannot change an order from ${order.orderStatus} to ${orderStatus}.`);
  }

  order.orderStatus = orderStatus;
  await order.save();
  const populatedOrder = await Order.findById(order._id)
    .populate({ path: 'restaurantId', select: 'name image location address', populate: { path: 'address', select: 'location addressLine1 city state postalCode' } })
    .populate('customerId', 'name phone');
  const savedOrder = { ...populatedOrder.toObject(), orderNumber: order._id.toString().slice(-6).toUpperCase() };
  io?.to(`user:${order.customerId}`).emit('order:updated', savedOrder);
  io?.to(`restaurant:${order.restaurantId}`).emit('order:updated', savedOrder);
  await notifyUser(io, {
    userId: order.customerId,
    type: 'ORDER_UPDATE',
    title: 'Order status updated',
    message: `Your order is now ${orderStatus.toLowerCase().replaceAll('_', ' ')}.`,
    data: { orderId: order._id, orderStatus },
  });
  if (orderStatus === 'READY_FOR_PICKUP') {
    const { dispatchNextPartner } = require('./deliveryService');
    await dispatchNextPartner(order._id, io);
  }
  return savedOrder;
}

module.exports = {
  createOrder,
  listCustomerOrders,
  listRestaurantOrders,
  listRestaurantOrdersForOwner,
  getOrder,
  updateRestaurantOrderStatus,
};
