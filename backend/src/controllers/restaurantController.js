const asyncHandler = require('../middleware/asyncHandler');
const restaurantService = require('../services/restaurantService');

const createRestaurant = asyncHandler(async (req, res) => {
  const restaurant = await restaurantService.createRestaurant(req.body || {}, req.user.id);
  res.status(201).json({ restaurant });
});

const listRestaurants = asyncHandler(async (req, res) => {
  const restaurants = await restaurantService.listApprovedRestaurants({
    cuisine: req.query.cuisine,
    search: req.query.search,
  });
  res.json({ restaurants, count: restaurants.length });
});

const listMyRestaurants = asyncHandler(async (req, res) => {
  const restaurants = await restaurantService.listOwnedRestaurants(req.user.id);
  res.json({ restaurants, count: restaurants.length });
});

const getRestaurant = asyncHandler(async (req, res) => {
  const restaurant = await restaurantService.getRestaurant(req.params.id, req.user);
  res.json({ restaurant });
});

const updateRestaurant = asyncHandler(async (req, res) => {
  const restaurant = await restaurantService.updateRestaurant(req.params.id, req.body || {}, req.user);
  res.json({ restaurant });
});

const deleteRestaurant = asyncHandler(async (req, res) => {
  await restaurantService.archiveRestaurant(req.params.id, req.user);
  res.status(204).end();
});

module.exports = { createRestaurant, listRestaurants, listMyRestaurants, getRestaurant, updateRestaurant, deleteRestaurant };
