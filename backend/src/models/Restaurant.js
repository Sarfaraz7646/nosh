const { Schema, model, models } = require('mongoose');
const geoPointSchema = require('./schemas/geoPointSchema');

const restaurantSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 150 },
    description: { type: String, trim: true, maxlength: 2000 },
    image: { type: String, trim: true },
    address: { type: Schema.Types.ObjectId, ref: 'Address', required: true },
    location: { type: geoPointSchema, default: undefined },
    cuisine: [{ type: String, trim: true, maxlength: 60 }],
    rating: { type: Number, min: 0, max: 5, default: 0 },
    reviewCount: { type: Number, min: 0, default: 0 },
    isApproved: { type: Boolean, default: false, index: true },
    isActive: { type: Boolean, default: true, index: true },
    ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

restaurantSchema.index({ location: '2dsphere' });
restaurantSchema.index({ ownerId: 1 });

module.exports = models.Restaurant || model('Restaurant', restaurantSchema);
