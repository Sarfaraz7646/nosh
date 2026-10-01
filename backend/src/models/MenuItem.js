const { Schema, model, models } = require('mongoose');

const menuItemSchema = new Schema(
  {
    restaurantId: {
      type: Schema.Types.ObjectId,
      ref: 'Restaurant',
      required: true,
      index: true,
    },
    name: { type: String, required: true, trim: true, maxlength: 150 },
    description: { type: String, trim: true, maxlength: 1000 },
    price: { type: Number, required: true, min: 0 },
    image: { type: String, trim: true },
    category: { type: String, required: true, trim: true, maxlength: 80 },
    isAvailable: { type: Boolean, default: true },
  },
  { timestamps: true }
);

menuItemSchema.index({ restaurantId: 1, category: 1, isAvailable: 1 });

module.exports = models.MenuItem || model('MenuItem', menuItemSchema);
