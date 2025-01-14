import mongoose from "mongoose";

// StaticRatings Schema
const staticRatingSchema = new mongoose.Schema({
    video_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Videos', required: true },
    static_rating: { type: Number, required: true }
});

// DynamicRatings Schema
const dynamicRatingSchema = new mongoose.Schema({
    video_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Videos', required: true },
    dynamic_rating_data: { type: mongoose.Schema.Types.Mixed, required: true }
});

// Video Schema
const videoSchema = new mongoose.Schema({
    youtube_link: { 
        type: String, 
        required: true,
        unique: true 
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

export const Video = mongoose.model('Videos', videoSchema);
export const StaticRating = mongoose.model('StaticRatings', staticRatingSchema);
export const DynamicRating = mongoose.model('DynamicRatings', dynamicRatingSchema);

export default { Video, StaticRating, DynamicRating };