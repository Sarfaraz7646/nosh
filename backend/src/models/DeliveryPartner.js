const { Schema, model, models } = require('mongoose');
const geoPointSchema = require('./schemas/geoPointSchema');

const deliveryPartnerSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    vehicleType: { type: String, required: true, trim: true, maxlength: 60 },
    vehicleNumber: { type: String, required: true, trim: true, uppercase: true, maxlength: 30 },
    licenseDocument: { type: String, required: true, trim: true, maxlength: 500 },
    isVerified: { type: Boolean, default: false, index: true },
    verificationStatus: {
      type: String,
      enum: ['PENDING', 'APPROVED', 'REJECTED'],
      default: 'PENDING',
      index: true,
    },
    reviewedAt: Date,
    reviewedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    rejectionReason: { type: String, trim: true, maxlength: 1000 },
    isOnline: { type: Boolean, default: false, index: true },
    isAvailable: { type: Boolean, default: false, index: true },
    currentLocation: { type: geoPointSchema, default: undefined },
    rating: { type: Number, min: 0, max: 5, default: 0 },
    earnings: { type: Number, min: 0, default: 0 },
  },
  { timestamps: true }
);

deliveryPartnerSchema.index({ currentLocation: '2dsphere' });

module.exports = models.DeliveryPartner || model('DeliveryPartner', deliveryPartnerSchema);
