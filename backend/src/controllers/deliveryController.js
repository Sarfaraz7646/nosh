const asyncHandler = require('../middleware/asyncHandler');
const deliveryService = require('../services/deliveryService');

const getProfile = asyncHandler(async (req, res) => {
  const partner = await deliveryService.getProfile(req.user.id);
  res.json({ partner });
});

const updateProfile = asyncHandler(async (req, res) => {
  const partner = await deliveryService.updateProfile(req.user.id, req.body || {});
  res.json({ partner });
});

const getDashboard = asyncHandler(async (req, res) => {
  const dashboard = await deliveryService.getDashboard(req.user.id, req.app.get('io'));
  res.json(dashboard);
});

const listOrders = asyncHandler(async (req, res) => {
  const orders = await deliveryService.listOrders(req.user.id, req.app.get('io'));
  res.json(orders);
});

const setOnline = asyncHandler(async (req, res) => {
  const partner = await deliveryService.setOnline(req.user.id, req.body?.isOnline, req.app.get('io'));
  res.json({ isOnline: partner.isOnline, partner });
});

const updateLocation = asyncHandler(async (req, res) => {
  const currentLocation = await deliveryService.updateLocation(req.user.id, req.body?.coordinates, req.app.get('io'));
  res.json({ currentLocation });
});

const acceptOrder = asyncHandler(async (req, res) => {
  const result = await deliveryService.acceptOrder(req.user.id, req.params.orderId, req.app.get('io'));
  res.json(result);
});

const declineOrder = asyncHandler(async (req, res) => {
  const result = await deliveryService.declineOrder(req.user.id, req.params.orderId, req.app.get('io'));
  res.json(result);
});

const markPickedUp = asyncHandler(async (req, res) => {
  const result = await deliveryService.markPickedUp(req.user.id, req.params.orderId, req.app.get('io'));
  res.json(result);
});

const markDelivered = asyncHandler(async (req, res) => {
  const result = await deliveryService.markDelivered(req.user.id, req.params.orderId, req.app.get('io'));
  res.json(result);
});

const getEarnings = asyncHandler(async (req, res) => {
  const earnings = await deliveryService.getEarnings(req.user.id);
  res.json(earnings);
});

module.exports = { getProfile, updateProfile, getDashboard, listOrders, setOnline, updateLocation, acceptOrder, declineOrder, markPickedUp, markDelivered, getEarnings };
