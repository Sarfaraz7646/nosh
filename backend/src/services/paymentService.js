const crypto = require('crypto');
const mongoose = require('mongoose');
const Razorpay = require('razorpay');
const Order = require('../models/Order');
const Payment = require('../models/Payment');
const httpError = require('./httpError');
const { notifyUser } = require('./notificationService');

function getRazorpayClient() {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret) throw httpError(503, 'Razorpay is not configured on the server.');
  return { client: new Razorpay({ key_id: keyId, key_secret: keySecret }), keyId };
}

function validateId(id, label) {
  if (!mongoose.isValidObjectId(id)) throw httpError(400, `Invalid ${label} id.`);
}

function matchesSignature(orderId, paymentId, signature, secret) {
  const expected = crypto
    .createHmac('sha256', secret)
    .update(`${orderId}|${paymentId}`)
    .digest();
  let provided;
  try {
    provided = Buffer.from(signature, 'hex');
  } catch {
    return false;
  }
  return provided.length === expected.length && crypto.timingSafeEqual(provided, expected);
}

function getCheckoutDetails(payment) {
  return {
    keyId: process.env.RAZORPAY_KEY_ID,
    orderId: payment.orderId.toString(),
    razorpayOrderId: payment.razorpayOrderId,
    amount: payment.amountPaise,
    currency: payment.currency,
  };
}

async function createRazorpayOrder({ orderId, customerId }) {
  validateId(orderId, 'order');
  const order = await Order.findOne({ _id: orderId, customerId });
  if (!order) throw httpError(404, 'Order not found.');
  if (order.paymentMethod !== 'UPI / card') throw httpError(400, 'This order is not configured for online payment.');
  if (order.paymentStatus === 'PAID') throw httpError(409, 'This order has already been paid.');
  if (order.orderStatus !== 'PLACED') throw httpError(409, 'Only placed orders can be paid.');

  const { client, keyId } = getRazorpayClient();
  let payment = await Payment.findOne({
    orderId: order._id,
    customerId,
    provider: 'RAZORPAY',
    status: 'PENDING',
    razorpayOrderId: { $exists: true },
  }).sort({ createdAt: -1 });

  if (!payment) {
    const amountPaise = Math.round(order.totalAmount * 100);
    const razorpayOrder = await client.orders.create({
      amount: amountPaise,
      currency: 'INR',
      receipt: order._id.toString(),
      notes: { appOrderId: order._id.toString(), customerId: String(customerId) },
    });
    payment = await Payment.create({
      orderId: order._id,
      customerId,
      amount: order.totalAmount,
      amountPaise,
      currency: 'INR',
      provider: 'RAZORPAY',
      razorpayOrderId: razorpayOrder.id,
      status: 'PENDING',
    });
  }

  return {
    payment: getCheckoutDetails(payment),
    keyId,
  };
}

async function verifyRazorpayPayment({
  orderId,
  customerId,
  razorpayOrderId,
  razorpayPaymentId,
  razorpaySignature,
}, io) {
  validateId(orderId, 'order');
  if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
    throw httpError(400, 'Razorpay payment details are incomplete.');
  }

  const payment = await Payment.findOne({
    orderId,
    customerId,
    provider: 'RAZORPAY',
    razorpayOrderId,
  });
  if (!payment) throw httpError(404, 'Payment attempt not found.');

  const { client } = getRazorpayClient();
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!matchesSignature(razorpayOrderId, razorpayPaymentId, razorpaySignature, keySecret)) {
    throw httpError(400, 'Razorpay payment signature is invalid.');
  }

  const [gatewayPayment, gatewayOrder] = await Promise.all([
    client.payments.fetch(razorpayPaymentId),
    client.orders.fetch(razorpayOrderId),
  ]);
  if (
    gatewayPayment.order_id !== razorpayOrderId ||
    gatewayOrder.id !== razorpayOrderId ||
    gatewayPayment.amount !== payment.amountPaise ||
    gatewayOrder.amount !== payment.amountPaise ||
    gatewayPayment.currency !== payment.currency
  ) {
    throw httpError(400, 'Razorpay payment amount or order does not match.');
  }

  let confirmedPayment = gatewayPayment;
  if (gatewayPayment.status === 'authorized') {
    confirmedPayment = await client.payments.capture(
      razorpayPaymentId,
      payment.amountPaise,
      payment.currency
    );
  }
  if (confirmedPayment.status !== 'captured') {
    throw httpError(409, 'Razorpay has not captured this payment.');
  }

  payment.paymentId = confirmedPayment.id;
  payment.providerPaymentId = confirmedPayment.id;
  payment.method = confirmedPayment.method;
  payment.status = 'CAPTURED';
  payment.paidAt = new Date();
  await payment.save();

  const order = await Order.findOneAndUpdate(
    { _id: orderId, customerId, paymentStatus: { $ne: 'PAID' } },
    { $set: { paymentStatus: 'PAID' } },
    { new: true }
  ).populate({ path: 'restaurantId', select: 'name image ownerId location address', populate: { path: 'address', select: 'location addressLine1 city state postalCode' } }).populate('customerId', 'name phone');

  let verifiedOrder = order;
  if (!verifiedOrder) {
    verifiedOrder = await Order.findOne({ _id: orderId, customerId })
      .populate({ path: 'restaurantId', select: 'name image ownerId location address', populate: { path: 'address', select: 'location addressLine1 city state postalCode' } })
      .populate('customerId', 'name phone');
    if (!verifiedOrder || verifiedOrder.paymentStatus !== 'PAID') {
      throw httpError(409, 'Payment was captured but the order could not be confirmed. Contact support.');
    }
  } else {
    const restaurantId = verifiedOrder.restaurantId._id;
    const savedOrder = {
      ...verifiedOrder.toObject(),
      orderNumber: verifiedOrder._id.toString().slice(-6).toUpperCase(),
    };
    io?.to(`restaurant:${restaurantId}`).emit('order:new', savedOrder);
    io?.to(`user:${customerId}`).emit('order:updated', savedOrder);
    await Promise.all([
      notifyUser(io, {
        userId: verifiedOrder.restaurantId.ownerId,
        type: 'ORDER_UPDATE',
        title: 'New paid order',
        message: `Order #${savedOrder.orderNumber} has been paid and is ready for your kitchen.`,
        data: { orderId: verifiedOrder._id, orderStatus: verifiedOrder.orderStatus },
      }),
      notifyUser(io, {
        userId: customerId,
        type: 'PAYMENT_UPDATE',
        title: 'Payment verified',
        message: `Payment for order #${savedOrder.orderNumber} was verified.`,
        data: { orderId: verifiedOrder._id, paymentId: payment.paymentId, status: payment.status },
      }),
    ]);
  }

  return {
    order: {
      ...verifiedOrder.toObject(),
      orderNumber: verifiedOrder._id.toString().slice(-6).toUpperCase(),
    },
    payment: {
      paymentId: payment.paymentId,
      orderId: payment.orderId,
      amount: payment.amount,
      currency: payment.currency,
      status: payment.status,
    },
  };
}

module.exports = { createRazorpayOrder, verifyRazorpayPayment };
