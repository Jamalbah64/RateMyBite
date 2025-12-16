//Review moderation routes for admin actions

const express = require('express');
const router = express.Router();
const controller = require('../../controllers/admin/reviewAdminController');
const { verifyToken, authorizeRoles } = require('../../middleware/auth');

router.get('/pending', verifyToken, authorizeRoles('admin'), controller.listPendingReviews);
router.patch('/:id/approve', verifyToken, authorizeRoles('admin'), controller.approveReview);
router.delete('/:id', verifyToken, authorizeRoles('admin'), controller.deleteReview);

module.exports = router;
