const { Schema, model, models } = require('mongoose');

const notificationSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    type: {
      type: String,
      enum: [
        'ORDER_UPDATE',
        'PAYMENT_UPDATE',
        'DELIVERY_UPDATE',
        'PROMOTION',
        'SYSTEM',
      ],
      required: true,
    },
    title: { type: String, required: true, trim: true, maxlength: 150 },
    message: { type: String, required: true, trim: true, maxlength: 1000 },
    data: { type: Schema.Types.Mixed, default: {} },
    readAt: Date,
  },
  { timestamps: true }
);

notificationSchema.index({ userId: 1, readAt: 1, createdAt: -1 });

module.exports = models.Notification || model('Notification', notificationSchema);
