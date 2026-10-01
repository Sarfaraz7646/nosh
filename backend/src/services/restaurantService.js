const mongoose = require('mongoose');
const Restaurant = require('../models/Restaurant');
const MenuItem = require('../models/MenuItem');
const Address = require('../models/Address');
const httpError = require('./httpError');

const writableFields = ['name', 'description', 'image', 'address', 'location', 'cuisine'];

function pickFields(source, fields) {
  return Object.fromEntries(fields.filter((field) => source[field] !== undefined).map((field) => [field, source[field]]));
}

function validateId(id) {
  if (!mongoose.isValidObjectId(id)) throw httpError(400, 'Invalid restaurant id.');
}

async function assertRestaurantAccess(id, user) {
  validateId(id);
  const restaurant = await Restaurant.findById(id);
  if (!restaurant || !restaurant.isActive) throw httpError(404, 'Restaurant not found.');
  if (user.role !== 'ADMIN' && String(restaurant.ownerId) !== user.id) {
    throw httpError(403, 'You can only manage your own restaurant.');
  }
  return restaurant;
}

async function createRestaurant(data, ownerId) {
  const restaurantId = new mongoose.Types.ObjectId();
  let addressId = data.address;
  let createdAddress;

  if (data.address && typeof data.address === 'object' && !Array.isArray(data.address)) {
    createdAddress = await Address.create({
      ...data.address,
      ownerId: restaurantId,
      ownerType: 'RESTAURANT',
    });
    addressId = createdAddress._id;
  } else if (!mongoose.isValidObjectId(addressId)) {
    throw httpError(400, 'A restaurant address is required.');
  }

  const fields = pickFields(data, writableFields);
  delete fields.address;
  const restaurant = new Restaurant({ ...fields, _id: restaurantId, address: addressId, ownerId });
  try {
    return await restaurant.save();
  } catch (error) {
    if (createdAddress) await createdAddress.deleteOne();
    throw error;
  }
}

async function listApprovedRestaurants({ cuisine, search } = {}) {
  const filter = { isApproved: true, isActive: true };
  if (cuisine) filter.cuisine = { $in: [new RegExp(`^${escapeRegex(cuisine)}$`, 'i')] };
  if (search) {
    const safeSearch = new RegExp(escapeRegex(search), 'i');
    filter.$or = [{ name: safeSearch }, { description: safeSearch }, { cuisine: safeSearch }];
  }
  return Restaurant.find(filter).populate('address').sort({ rating: -1, name: 1 });
}

async function listOwnedRestaurants(ownerId) {
  return Restaurant.find({ ownerId }).populate('address').sort({ createdAt: -1 });
}

async function getRestaurant(id, user) {
  validateId(id);
  const filter = { _id: id, isActive: true };
  if (!user || (user.role !== 'ADMIN' && String((await Restaurant.findById(id))?.ownerId) !== user.id)) {
    filter.isApproved = true;
  }
  const restaurant = await Restaurant.findOne(filter).populate('address');
  if (!restaurant) throw httpError(404, 'Restaurant not found.');
  return restaurant;
}

async function updateRestaurant(id, data, user) {
  await assertRestaurantAccess(id, user);
  const updates = pickFields(data, writableFields);
  return Restaurant.findByIdAndUpdate(id, updates, { new: true, runValidators: true }).populate('address');
}

async function archiveRestaurant(id, user) {
  const restaurant = await assertRestaurantAccess(id, user);
  restaurant.isActive = false;
  await restaurant.save();
  await MenuItem.updateMany({ restaurantId: restaurant._id }, { isAvailable: false });
}

function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

module.exports = {
  assertRestaurantAccess,
  createRestaurant,
  listApprovedRestaurants,
  listOwnedRestaurants,
  getRestaurant,
  updateRestaurant,
  archiveRestaurant,
};
