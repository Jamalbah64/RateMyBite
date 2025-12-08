//This file is for the main server setup and configuration
const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const dotenv = require('dotenv');
dotenv.config();

const restaurantRoutes = require('./routes/restaurants');

const app = express();
app.use(express.json()); // parse JSON bodies

// Serve static files from the frontend directory
app.use(express.static(path.join(__dirname, '../frontend')));

// Register API routes
app.use('/api/restaurants', restaurantRoutes);

// Home route for testing
app.get('/', (req, res) => {
    res.send('RateMyBite API is running');
});

const PORT = process.env.PORT || 3000;

async function startServer() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        app.listen(PORT, () => {
            console.log(`Server listening on http://localhost:${PORT}`);
        });
    } catch (error) {
        console.error('MongoDB connection error:', error);
        process.exit(1); // Exit the process on failure
    }
}

startServer();
