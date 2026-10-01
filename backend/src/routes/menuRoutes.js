const express = require('express');
const controller = require('../controllers/menuController');
const { authenticate, optionalAuth, allowRoles } = require('../middleware/authMiddleware');

const router = express.Router();
const restaurantOwner = [authenticate, allowRoles('RESTAURANT', 'ADMIN')];

router.post('/', ...restaurantOwner, controller.createMenuItem);
router.get('/restaurant/:id', optionalAuth, controller.listRestaurantMenu);
router.put('/:id', ...restaurantOwner, controller.updateMenuItem);
router.delete('/:id', ...restaurantOwner, controller.deleteMenuItem);

module.exports = router;
