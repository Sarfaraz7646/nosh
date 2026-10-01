const express = require('express');
const controller = require('../controllers/orderController');
const { authenticate, allowRoles } = require('../middleware/authMiddleware');

const router = express.Router();
router.use(authenticate);
router.post('/', allowRoles('CUSTOMER'), controller.createOrder);
router.get('/mine', allowRoles('CUSTOMER'), controller.listMyOrders);
router.get('/restaurant', allowRoles('RESTAURANT', 'ADMIN'), controller.listMyRestaurantOrders);
router.get('/restaurant/:restaurantId', allowRoles('RESTAURANT', 'ADMIN'), controller.listRestaurantOrders);
router.put('/:id/accept', allowRoles('RESTAURANT', 'ADMIN'), controller.acceptOrder);
router.put('/:id/reject', allowRoles('RESTAURANT', 'ADMIN'), controller.rejectOrder);
router.put('/:id/status', allowRoles('RESTAURANT', 'ADMIN'), controller.updateOrderStatus);
router.patch('/:id/status', allowRoles('RESTAURANT', 'ADMIN'), controller.updateOrderStatus);
router.get('/:id', controller.getOrder);

module.exports = router;
