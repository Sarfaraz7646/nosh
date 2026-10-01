const express = require('express');
const controller = require('../controllers/adminDeliveryController');
const { authenticate, allowRoles } = require('../middleware/authMiddleware');

const router = express.Router();
router.use(authenticate, allowRoles('ADMIN'));
router.get('/delivery-partners', controller.listApplications);
router.put('/delivery-partners/:id/approve', controller.approvePartner);
router.put('/delivery-partners/:id/reject', controller.rejectPartner);

module.exports = router;
