//This file is for the restaurant model

const mongoose = require('mongoose');

const restaurantSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
        },
        address: {
            type: String,
            required: true,
        },
        cuisine: {
            type: String,
            required: true,
        },
        // Average rating (computed from reviews)
        averageRating: {
            type: Number,
            default: 0,
            min: 0,
            max: 5,
        },
        // GeoJSON point for map integration
        location: {
            type: {
                type: String,
                enum: ['Point'],
                default: 'Point',
            },
            coordinates: {
                type: [Number], // [longitude, latitude]
                required: true,
            },
        },
        description: {
            type: String,
        },
        imageUrl: {
            type: String,
        },
    },
    {
        timestamps: true, // automatically adds createdAt and updatedAt
    }
);

// Create a 2dsphere index for geospatial queries
restaurantSchema.index({ location: '2dsphere' });

const Restaurant = mongoose.model('Restaurant', restaurantSchema);

module.exports = Restaurant;

/*
Notes for what's going on here:

We define a restaurantSchema object describing each field’s type and validation rules.

The location field uses the GeoJSON format (type Point with coordinates) so we can query restaurants by proximity on the map later.

timestamps: true automatically adds createdAt and updatedAt fields.

Restaurant is the model; Mongoose will create a restaurants collection in the database based on this schema.
*/
