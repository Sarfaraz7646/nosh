const express = require('express');
const controller = require('../controllers/paymentController');
const { authenticate, allowRoles } = require('../middleware/authMiddleware');

const router = express.Router();
router.use(authenticate, allowRoles('CUSTOMER'));
router.post('/razorpay/order', controller.createRazorpayOrder);
router.post('/razorpay/verify', controller.verifyRazorpayPayment);

module.exports = router;
