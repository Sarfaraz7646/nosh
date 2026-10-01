const asyncHandler = require('../middleware/asyncHandler');
const adminDeliveryService = require('../services/adminDeliveryService');

const listApplications = asyncHandler(async (req, res) => {
  const partners = await adminDeliveryService.listApplications(String(req.query.status || 'PENDING').toUpperCase());
  res.json({ partners, count: partners.length });
});

const approvePartner = asyncHandler(async (req, res) => {
  const partner = await adminDeliveryService.reviewApplication(req.params.id, req.user.id, 'APPROVED');
  res.json({ partner });
});

const rejectPartner = asyncHandler(async (req, res) => {
  const partner = await adminDeliveryService.reviewApplication(req.params.id, req.user.id, 'REJECTED', req.body?.reason);
  res.json({ partner });
});

module.exports = { listApplications, approvePartner, rejectPartner };
