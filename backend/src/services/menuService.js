const mongoose = require('mongoose');
const MenuItem = require('../models/MenuItem');
const Restaurant = require('../models/Restaurant');
const httpError = require('./httpError');
const { assertRestaurantAccess } = require('./restaurantService');

const writableFields = ['name', 'description', 'price', 'image', 'category', 'isAvailable'];

function pickFields(source) {
  return Object.fromEntries(writableFields.filter((field) => source[field] !== undefined).map((field) => [field, source[field]]));
}

function validateId(id, label) {
  if (!mongoose.isValidObjectId(id)) throw httpError(400, `Invalid ${label} id.`);
}

async function createMenuItem(data, user) {
  await assertRestaurantAccess(data.restaurantId, user);
  const item = new MenuItem({
    restaurantId: data.restaurantId,
    ...pickFields(data),
  });
  return item.save();
}

async function listRestaurantMenu(restaurantId, user, includeUnavailable = false) {
  validateId(restaurantId, 'restaurant');
  if (includeUnavailable) {
    if (!user) throw httpError(401, 'Authentication is required to view unavailable menu items.');
    await assertRestaurantAccess(restaurantId, user);
  } else {
    const restaurant = await Restaurant.findOne({ _id: restaurantId, isActive: true, isApproved: true }).select('_id');
    if (!restaurant) throw httpError(404, 'Restaurant not found.');
  }
  const filter = { restaurantId };
  if (!includeUnavailable) filter.isAvailable = true;
  return MenuItem.find(filter).sort({ category: 1, name: 1 });
}

async function updateMenuItem(id, data, user) {
  validateId(id, 'menu item');
  const item = await MenuItem.findById(id);
  if (!item) throw httpError(404, 'Menu item not found.');
  await assertRestaurantAccess(item.restaurantId, user);
  Object.assign(item, pickFields(data));
  return item.save();
}

async function deleteMenuItem(id, user) {
  validateId(id, 'menu item');
  const item = await MenuItem.findById(id);
  if (!item) throw httpError(404, 'Menu item not found.');
  await assertRestaurantAccess(item.restaurantId, user);
  await item.deleteOne();
}

module.exports = { createMenuItem, listRestaurantMenu, updateMenuItem, deleteMenuItem };
