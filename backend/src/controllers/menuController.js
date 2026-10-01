const asyncHandler = require('../middleware/asyncHandler');
const menuService = require('../services/menuService');

const createMenuItem = asyncHandler(async (req, res) => {
  const menuItem = await menuService.createMenuItem(req.body || {}, req.user);
  res.status(201).json({ menuItem });
});

const listRestaurantMenu = asyncHandler(async (req, res) => {
  const includeUnavailable = req.query.includeUnavailable === 'true';
  const menuItems = await menuService.listRestaurantMenu(req.params.id, req.user, includeUnavailable);
  res.json({ menuItems, count: menuItems.length });
});

const updateMenuItem = asyncHandler(async (req, res) => {
  const menuItem = await menuService.updateMenuItem(req.params.id, req.body || {}, req.user);
  res.json({ menuItem });
});

const deleteMenuItem = asyncHandler(async (req, res) => {
  await menuService.deleteMenuItem(req.params.id, req.user);
  res.status(204).end();
});

module.exports = { createMenuItem, listRestaurantMenu, updateMenuItem, deleteMenuItem };
