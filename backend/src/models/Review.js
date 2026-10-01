const { Schema, model, models } = require('mongoose');

const reviewSchema = new Schema(
  {
    customerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    restaurantId: { type: Schema.Types.ObjectId, ref: 'Restaurant', required: true },
    orderId: { type: Schema.Types.ObjectId, ref: 'Order', required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, trim: true, maxlength: 2000 },
  },
  { timestamps: true }
);

reviewSchema.index({ customerId: 1, orderId: 1 }, { unique: true });
reviewSchema.index({ restaurantId: 1, createdAt: -1 });

module.exports = models.Review || model('Review', reviewSchema);
