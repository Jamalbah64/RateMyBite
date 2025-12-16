//Routing for the authentication endpoints

const express = require('express');
const router = express.Router();
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// POST /api/auth/register
router.post('/register', async (req, res) => {
    const { email, password } = req.body;
    try {
        const userExists = await User.findOne({ email });
        if (userExists) return res.status(400).json({ message: 'User already exists' });
        const user = new User({ email, password });
        await user.save();
        res.status(201).json({ message: 'User registered' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'User not found' });
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ message: 'Invalid credentials' });
    // Create JWT payload; include role for convenience
    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
        expiresIn: '24h',
    });
    res.json({ token });
});

module.exports = router;
