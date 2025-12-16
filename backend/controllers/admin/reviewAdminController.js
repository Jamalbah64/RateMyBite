//Review moderation controller for admin actions

const Review = require('../../models/Review');

// List pending reviews
exports.listPendingReviews = async (req, res) => {
    const reviews = await Review.find({ status: 'pending' }).populate('restaurantId', 'name');
    res.json(reviews);
};

// Approve a review
exports.approveReview = async (req, res) => {
    const { id } = req.params;
    const review = await Review.findByIdAndUpdate(id, { status: 'approved' }, { new: true });
    if (!review) return res.status(404).json({ message: 'Review not found' });
    res.json(review);
};

// Remove (or reject) a review
exports.deleteReview = async (req, res) => {
    const { id } = req.params;
    const review = await Review.findByIdAndUpdate(id, { status: 'removed' }, { new: true });
    if (!review) return res.status(404).json({ message: 'Review not found' });
    res.json({ message: 'Review removed' });
};
