//This middleware handles authentication for protected routes

// backend/middleware/auth.js
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Verify token and attach user to request
async function verifyToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    if (!authHeader) return res.status(401).json({ message: 'No token provided' });
    const token = authHeader.split(' ')[1];
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = await User.findById(decoded.id).select('-password');
        if (!req.user) return res.status(401).json({ message: 'User not found' });
        next();
    } catch (err) {
        return res.status(403).json({ message: 'Invalid or expired token' });
    }
}

// Higher‑order function to authorize specific roles
function authorizeRoles(...roles) {
    return (req, res, next) => {
        if (!req.user) return res.status(401).json({ message: 'Not authenticated' });
        if (!roles.includes(req.user.role)) {
            // 403 if user does not have required role:contentReference[oaicite:10]{index=10}
            return res.status(403).json({ message: 'Forbidden: insufficient privileges' });
        }
        next();
    };
}

module.exports = { verifyToken, authorizeRoles };
