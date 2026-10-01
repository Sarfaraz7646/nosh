const asyncHandler = require('../middleware/asyncHandler');
const paymentService = require('../services/paymentService');

const createRazorpayOrder = asyncHandler(async (req, res) => {
  const result = await paymentService.createRazorpayOrder({
    orderId: req.body?.orderId,
    customerId: req.user.id,
  });
  res.status(201).json(result);
});

const verifyRazorpayPayment = asyncHandler(async (req, res) => {
  const result = await paymentService.verifyRazorpayPayment({
    orderId: req.body?.orderId,
    customerId: req.user.id,
    razorpayOrderId: req.body?.razorpay_order_id,
    razorpayPaymentId: req.body?.razorpay_payment_id,
    razorpaySignature: req.body?.razorpay_signature,
  }, req.app.get('io'));
  res.json(result);
});

module.exports = { createRazorpayOrder, verifyRazorpayPayment };
