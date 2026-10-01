const express = require('express');
const controller = require('../controllers/deliveryController');
const { authenticate, allowRoles } = require('../middleware/authMiddleware');

const router = express.Router();
router.use(authenticate, allowRoles('DELIVERY_PARTNER'));
router.get('/me', controller.getProfile);
router.put('/me', controller.updateProfile);
router.get('/dashboard', controller.getDashboard);
router.get('/orders', controller.listOrders);
router.get('/earnings', controller.getEarnings);
router.patch('/status', controller.setOnline);
router.patch('/online', controller.setOnline);
router.patch('/location', controller.updateLocation);
router.put('/orders/:orderId/accept', controller.acceptOrder);
router.put('/orders/:orderId/decline', controller.declineOrder);
router.put('/orders/:orderId/pickup', controller.markPickedUp);
router.put('/orders/:orderId/deliver', controller.markDelivered);

module.exports = router;
