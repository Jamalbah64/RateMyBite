//This file will organize admin routes to avoid mixing public APIs with admin logic

const express = require('express');
const router = express.Router();
const restaurantController = require('../../controllers/restaurantController');
const { verifyToken, authorizeRoles } = require('../../middleware/auth');

// list all restaurants (admins may want filters)
router.get('/', verifyToken, authorizeRoles('admin'), restaurantController.getRestaurants);

// create restaurant
router.post('/', verifyToken, authorizeRoles('admin'), restaurantController.createRestaurant);

// update restaurant
router.put('/:id', verifyToken, authorizeRoles('admin'), restaurantController.updateRestaurant);

// delete restaurant
router.delete('/:id', verifyToken, authorizeRoles('admin'), restaurantController.deleteRestaurant);

module.exports = router;
