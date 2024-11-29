import mongoose from "mongoose";

const mongoose = require('mongoose');

// StaticRatings Schema
const staticRatingSchema = new mongoose.Schema({
    video_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Videos', required: true },
    static_rating: { type: Number, required: true }
});

// DynamicRatings Schema
const dynamicRatingSchema = new mongoose.Schema({
    video_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Videos', required: true },
    dynamic_rating_data: { type: mongoose.Schema.Types.Mixed, required: true } // JSONB-like structure
});

// Videos Schema
const videoSchema = new mongoose.Schema({
    video_file: { type: String, required: true },
    youtube_link: { type: String, required: false },
});

const Video = mongoose.model('Videos', videoSchema);
const StaticRating = mongoose.model('StaticRatings', staticRatingSchema);
const DynamicRating = mongoose.model('DynamicRatings', dynamicRatingSchema);

module.exports = {
    Video,
    StaticRating,
    DynamicRating
};
