const { Schema, model, models } = require('mongoose');
const geoPointSchema = require('./schemas/geoPointSchema');

const addressSchema = new Schema(
  {
    ownerId: { type: Schema.Types.ObjectId, required: true, index: true },
    ownerType: {
      type: String,
      enum: ['USER', 'RESTAURANT'],
      required: true,
    },
    label: { type: String, trim: true, maxlength: 40 },
    recipientName: { type: String, trim: true, maxlength: 120 },
    phone: { type: String, trim: true, maxlength: 30 },
    addressLine1: { type: String, required: true, trim: true, maxlength: 200 },
    addressLine2: { type: String, trim: true, maxlength: 200 },
    landmark: { type: String, trim: true, maxlength: 120 },
    city: { type: String, required: true, trim: true, maxlength: 100 },
    state: { type: String, required: true, trim: true, maxlength: 100 },
    postalCode: { type: String, required: true, trim: true, maxlength: 20 },
    country: { type: String, required: true, trim: true, default: 'India' },
    location: { type: geoPointSchema, default: undefined },
  },
  { timestamps: true }
);

addressSchema.index({ ownerId: 1, ownerType: 1 });
addressSchema.index({ location: '2dsphere' });

module.exports = models.Address || model('Address', addressSchema);
