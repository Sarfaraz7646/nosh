const { Schema, model, models } = require('mongoose');

const userSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      maxlength: 254,
    },
    password: { type: String, required: true, select: false },
    phone: { type: String, trim: true, maxlength: 30 },
    role: {
      type: String,
      enum: ['CUSTOMER', 'RESTAURANT', 'DELIVERY_PARTNER', 'ADMIN'],
      default: 'CUSTOMER',
      required: true,
    },
    addresses: [{ type: Schema.Types.ObjectId, ref: 'Address' }],
  },
  { timestamps: true }
);

module.exports = models.User || model('User', userSchema);
