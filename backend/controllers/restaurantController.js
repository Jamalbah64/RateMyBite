//This file is for the restuarant model's controller functions

const Restaurant = require('../models/restaurant');

// GET /api/restaurants  – list all restaurants
async function getRestaurants(req, res) {
    try {
        const restaurants = await Restaurant.find();
        res.json(restaurants);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch restaurants' });
    }
}

// GET /api/restaurants/:id  – get a single restaurant by ID
async function getRestaurantById(req, res) {
    try {
        const { id } = req.params;
        const restaurant = await Restaurant.findById(id);
        if (!restaurant) {
            return res.status(404).json({ error: 'Restaurant not found' });
        }
        res.json(restaurant);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch restaurant' });
    }
}

// POST /api/restaurants
async function createRestaurant(req, res) {
    try {
        const { name, address, cuisine } = req.body;

        let lat = null;
        let lng = null;

        if (address && address.trim() !== '') {
            const coords = await geocodeAddress(address.trim());
            if (!coords) {
                return res.status(400).json({ error: 'Failed to geocode address' });
            }
            lat = coords.lat;
            lng = coords.lng;
        }

        const newRestaurant = await Restaurant.create({
            name,
            address,
            category: cuisine, // ★ ここ重要
            lat,
            lng
        });

        res.status(201).json(newRestaurant);
    } catch (error) {
        res.status(400).json({ error: 'Failed to create restaurant', details: error.message });
    }
}

// PUT /api/restaurants/:id  – update an existing restaurant
async function updateRestaurant(req, res) {
    try {
        const { id } = req.params;
        const updated = await Restaurant.findByIdAndUpdate(id, req.body, {
            new: true,
            runValidators: true,
        });
        if (!updated) {
            return res.status(404).json({ error: 'Restaurant not found' });
        }
        res.json(updated);
    } catch (error) {
        res.status(400).json({ error: 'Failed to update restaurant', details: error.message });
    }
}

// DELETE /api/restaurants/:id  – delete a restaurant
async function deleteRestaurant(req, res) {
    try {
        const { id } = req.params;
        const deleted = await Restaurant.findByIdAndDelete(id);
        if (!deleted) {
            return res.status(404).json({ error: 'Restaurant not found' });
        }
        res.json({ message: 'Restaurant deleted' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete restaurant' });
    }
}

module.exports = {
    getRestaurants,
    getRestaurantById,
    createRestaurant,
    updateRestaurant,
    deleteRestaurant,
};

/*
What's going on here:
Each function is async and uses await to interact with MongoDB.

Errors are caught and the client receives an appropriate HTTP status code.

findByIdAndUpdate with { new: true } returns the updated document.

The functions are exported for use in route definitions.
*/
