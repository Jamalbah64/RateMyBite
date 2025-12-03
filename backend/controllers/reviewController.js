const Review = require("../models/review");
const Restaurant = require("../models/restaurant");

// GET /api/reviews/restaurant/:restaurantId
const getReviewsForRestaurant = async (req, res) => {
  try {
    const reviews = await Review.find({
      restaurantId: req.params.restaurantId
    }).sort({ createdAt: -1 });

    res.json(reviews);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// POST /api/reviews/restaurant/:restaurantId
const createReview = async (req, res) => {
  try {
    const { rating, comment, userId } = req.body;

    const review = new Review({
      restaurantId: req.params.restaurantId,
      userId,
      rating,
      comment
    });

    const saved = await review.save();

    //　Update the restaurant’s rating and review count
    const stats = await Review.aggregate([
      { $match: { restaurantId: review.restaurantId } },
      {
        $group: {
          _id: "$restaurantId",
          avgRating: { $avg: "$rating" },
          count: { $sum: 1 }
        }
      }
    ]);

    if (stats.length > 0) {
      await Restaurant.findByIdAndUpdate(review.restaurantId, {
        avgRating: stats[0].avgRating,
        reviewCount: stats[0].count
      });
    }

    res.status(201).json(saved);
  } catch (err) {
    console.error(err);
    res.status(400).json({ message: "Invalid review data" });
  }
};

module.exports = {
  getReviewsForRestaurant,
  createReview
};

