const { Schema, model, models } = require('mongoose');

const paymentSchema = new Schema(
  {
    orderId: { type: Schema.Types.ObjectId, ref: 'Order', required: true, index: true },
    customerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    amount: { type: Number, required: true, min: 0 },
    amountPaise: { type: Number, min: 0 },
    currency: { type: String, uppercase: true, trim: true, default: 'INR' },
    provider: { type: String, enum: ['RAZORPAY', 'CASH'], required: true },
    razorpayOrderId: { type: String, trim: true, sparse: true, unique: true },
    paymentId: { type: String, trim: true, sparse: true, unique: true },
    providerPaymentId: { type: String, trim: true, sparse: true, unique: true },
    method: { type: String, trim: true },
    status: {
      type: String,
      enum: ['PENDING', 'AUTHORIZED', 'CAPTURED', 'FAILED', 'REFUNDED'],
      default: 'PENDING',
      required: true,
    },
    paidAt: Date,
    failureReason: { type: String, trim: true, maxlength: 500 },
  },
  { timestamps: true }
);

module.exports = models.Payment || model('Payment', paymentSchema);
