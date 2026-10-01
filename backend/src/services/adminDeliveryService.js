const mongoose = require('mongoose');
const DeliveryPartner = require('../models/DeliveryPartner');
const httpError = require('./httpError');

async function listApplications(status = 'PENDING') {
  if (!['PENDING', 'APPROVED', 'REJECTED', 'ALL'].includes(status)) {
    throw httpError(400, 'Invalid verification status filter.');
  }
  const filter = status === 'ALL' ? {} : { verificationStatus: status };
  return DeliveryPartner.find(filter)
    .populate('userId', 'name email phone')
    .populate('reviewedBy', 'name email')
    .sort({ updatedAt: -1 });
}

async function reviewApplication(id, adminId, decision, reason) {
  if (!mongoose.isValidObjectId(id)) throw httpError(400, 'Invalid delivery partner id.');
  if (!['APPROVED', 'REJECTED'].includes(decision)) throw httpError(400, 'Invalid review decision.');
  if (decision === 'REJECTED' && !reason?.trim()) throw httpError(400, 'A rejection reason is required.');

  const partner = await DeliveryPartner.findOne({ _id: id, verificationStatus: 'PENDING' });
  if (!partner) throw httpError(404, 'Pending delivery partner application not found.');
  partner.verificationStatus = decision;
  partner.isVerified = decision === 'APPROVED';
  partner.isOnline = false;
  partner.isAvailable = false;
  partner.reviewedAt = new Date();
  partner.reviewedBy = adminId;
  partner.rejectionReason = decision === 'REJECTED' ? reason.trim() : '';
  await partner.save();
  return partner.populate([{ path: 'userId', select: 'name email phone' }, { path: 'reviewedBy', select: 'name email' }]);
}

module.exports = { listApplications, reviewApplication };
