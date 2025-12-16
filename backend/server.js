//This file is for the main server setup and configuration
const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const dotenv = require('dotenv');
dotenv.config();

const restaurantRoutes = require('./routes/restaurants');
const authRoutes = require('./routes/auth');
const adminRestaurantRoutes = require('./routes/admin/restaurants');
const adminReviewRoutes = require('./routes/admin/review'); // added admin review routes

const app = express();
app.use(express.json()); // parse JSON bodies

// Serve static files from the frontend directory
app.use(express.static(path.join(__dirname, '../frontend')));

// Register API routes
app.use('/api/restaurants', restaurantRoutes);

// Authentication routes
app.use('/api/auth', authRoutes);

// Admin routes
app.use('/api/admin/restaurants', adminRestaurantRoutes);
app.use('/api/admin/reviews', adminReviewRoutes); // added admin review routes

// Serve index.html for the homepage
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
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
