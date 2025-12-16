const mongoose = require("mongoose");

//This new schema now allows users to leave reviews that need to be approved first by an admin
const reviewSchema = new mongoose.Schema({
  restaurantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant', required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: String,
  status: { type: String, enum: ['pending', 'approved', 'removed'], default: 'pending' },
  createdAt: { type: Date, default: Date.now },
});


module.exports = mongoose.model("Review", reviewSchema);

/*
const reviewSchema = new mongoose.Schema({
//   restaurantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant', required: true },
//   userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
//   rating: { type: Number, required: true, min: 1, max: 5 },
//   comment: String,
//   status: { type: String, enum: ['pending', 'approved', 'removed'], default: 'pending' },
//   createdAt: { type: Date, default: Date.now },
// });
*/
