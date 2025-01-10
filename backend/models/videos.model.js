import mongoose from "mongoose";

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

// Video Schema
const videoSchema = new mongoose.Schema({
    video_file: { type: String, required: true },
    youtube_link: { type: String, required: false },
});

export const Video = mongoose.model('Videos', videoSchema);
export const StaticRating = mongoose.model('StaticRatings', staticRatingSchema);
export const DynamicRating = mongoose.model('DynamicRatings', dynamicRatingSchema);

export default { Video, StaticRating, DynamicRating };
