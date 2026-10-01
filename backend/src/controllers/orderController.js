const asyncHandler = require('../middleware/asyncHandler');
const orderService = require('../services/orderService');

const createOrder = asyncHandler(async (req, res) => {
  const order = await orderService.createOrder({ ...req.body, customerId: req.user.id }, req.app.get('io'));
  res.status(201).json({ order });
});

const listMyOrders = asyncHandler(async (req, res) => {
  const orders = await orderService.listCustomerOrders(req.user.id);
  res.json({ orders, count: orders.length });
});

const listRestaurantOrders = asyncHandler(async (req, res) => {
  const orders = await orderService.listRestaurantOrders(req.params.restaurantId, req.user);
  res.json({ orders, count: orders.length });
});

const listMyRestaurantOrders = asyncHandler(async (req, res) => {
  const orders = await orderService.listRestaurantOrdersForOwner(req.user);
  res.json({ orders, count: orders.length });
});

const getOrder = asyncHandler(async (req, res) => {
  const order = await orderService.getOrder(req.params.id, req.user);
  res.json({ order });
});

const updateOrderStatus = asyncHandler(async (req, res) => {
  const order = await orderService.updateRestaurantOrderStatus(
    req.params.id,
    req.body?.orderStatus || req.body?.status,
    req.user,
    req.app.get('io')
  );
  res.json({ order });
});

const acceptOrder = asyncHandler(async (req, res) => {
  const order = await orderService.updateRestaurantOrderStatus(
    req.params.id,
    'ACCEPTED',
    req.user,
    req.app.get('io')
  );
  res.json({ order });
});

const rejectOrder = asyncHandler(async (req, res) => {
  const order = await orderService.updateRestaurantOrderStatus(
    req.params.id,
    'REJECTED',
    req.user,
    req.app.get('io')
  );
  res.json({ order });
});

module.exports = {
  createOrder,
  listMyOrders,
  listRestaurantOrders,
  listMyRestaurantOrders,
  getOrder,
  acceptOrder,
  rejectOrder,
  updateOrderStatus,
};
