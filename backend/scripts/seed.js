//This is a file for seeding the database with initial restaurant data
//Allows us to populate the database with sample restaurants for testing

const mongoose = require('mongoose');
const Restaurant = require('../models/restaurant');

async function seed() {
    await mongoose.connect(process.env.MONGO_URI);

    const sampleRestaurants = [
        {
            name: 'Sushi House',
            address: '1 Ocean Ave, Manchester, NH',
            cuisine: 'Japanese',
            averageRating: 4.2,
            location: { type: 'Point', coordinates: [-71.454, 42.995] },
            description: 'Fresh sushi and sashimi.'
        },
        {
            name: 'Burger Barn',
            address: '50 Elm St, Manchester, NH',
            cuisine: 'American',
            averageRating: 3.8,
            location: { type: 'Point', coordinates: [-71.455, 42.996] },
            description: 'Classic burgers with local ingredients.'
        }
    ];

    await Restaurant.deleteMany();
    await Restaurant.insertMany(sampleRestaurants);

    console.log('Database seeded');
    await mongoose.disconnect();
}

seed().catch((err) => console.error(err));
