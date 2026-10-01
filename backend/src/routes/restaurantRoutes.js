const express = require('express');
const controller = require('../controllers/restaurantController');
const { authenticate, optionalAuth, allowRoles } = require('../middleware/authMiddleware');

const router = express.Router();
const restaurantOwner = [authenticate, allowRoles('RESTAURANT', 'ADMIN')];

router.get('/mine', ...restaurantOwner, controller.listMyRestaurants);
router.post('/', ...restaurantOwner, controller.createRestaurant);
router.get('/', controller.listRestaurants);
router.get('/:id', optionalAuth, controller.getRestaurant);
router.put('/:id', ...restaurantOwner, controller.updateRestaurant);
router.delete('/:id', ...restaurantOwner, controller.deleteRestaurant);

module.exports = router;
