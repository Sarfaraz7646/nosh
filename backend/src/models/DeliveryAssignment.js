const { Schema, model, models } = require('mongoose');

const deliveryAssignmentSchema = new Schema(
  {
    orderId: { type: Schema.Types.ObjectId, ref: 'Order', required: true, index: true },
    deliveryPartnerId: {
      type: Schema.Types.ObjectId,
      ref: 'DeliveryPartner',
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['OFFERED', 'ASSIGNED', 'ACCEPTED', 'PICKED_UP', 'DELIVERED', 'REJECTED', 'EXPIRED', 'CANCELLED'],
      default: 'ASSIGNED',
      required: true,
    },
    assignedAt: { type: Date, default: Date.now, required: true },
    offeredAt: Date,
    offerExpiresAt: Date,
    distanceMeters: { type: Number, min: 0 },
    acceptedAt: Date,
    pickedUpAt: Date,
    completedAt: Date,
    cancelledAt: Date,
    earning: { type: Number, min: 0, default: 0 },
  },
  { timestamps: true }
);

deliveryAssignmentSchema.index({ deliveryPartnerId: 1, status: 1, assignedAt: -1 });

module.exports = models.DeliveryAssignment || model('DeliveryAssignment', deliveryAssignmentSchema);
