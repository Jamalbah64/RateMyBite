//This file maps HTTP endpoints to controller functions for the restaurant model

const express = require('express');
const router = express.Router();
const {
    getRestaurants,
    getRestaurantById,
    createRestaurant,
    updateRestaurant,
    deleteRestaurant,
} = require('../controllers/restaurantController');

// GET /api/restaurants  – list all restaurants
router.get('/', getRestaurants);

// GET /api/restaurants/:id  – get a single restaurant
router.get('/:id', getRestaurantById);

// POST /api/restaurants  – create a new restaurant
router.post('/', createRestaurant);

// PUT /api/restaurants/:id  – update a restaurant
router.put('/:id', updateRestaurant);

// DELETE /api/restaurants/:id  – delete a restaurant
router.delete('/:id', deleteRestaurant);

module.exports = router;

//In server.js, the routes are already imported (app.use('/api/restaurants', restaurantRoutes);), so the route definitions will take effect.
