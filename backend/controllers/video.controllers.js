import mongoose from "mongoose";
import { Video, StaticRating, DynamicRating } from '../models/videos.model.js';

export const getVideos = async (req, res) => {
    try {
        const videos = await Video.find({});
        res.status(200).json({ success: true, data: videos });
    } catch (error) {
        console.error("Error in gathering video data:", error.message);
        res.status(500).json({ success: false, message: "Server Error" });
    }
};

export const createVideo = async (req, res) => {
    const { video_file, youtube_link } = req.body;

    if (!video_file) {
        return res.status(400).json({ success: false, message: "Video file is required" });
    }

    try {
        // Create a new video document
        const video = new Video({ video_file, youtube_link });
        await video.save();

        // Create a corresponding static rating
        const staticRating = new StaticRating({
            video_id: video._id,
            static_rating: 0, // Default static rating, adjust as needed
        });

        // Create a corresponding dynamic rating
        const dynamicRating = new DynamicRating({
            video_id: video._id,
            dynamic_rating_data: {}, // Default empty structure, adjust as needed
        });

        // Save both ratings
        await Promise.all([staticRating.save(), dynamicRating.save()]);

        res.status(201).json({
            success: true,
            data: { video, staticRating, dynamicRating },
        });
    } catch (error) {
        console.error("Error in saving video and ratings:", error.message);
        res.status(500).json({ success: false, message: "Server Error" });
    }
};

export const updateVideo = async (req, res) => {
    const { id } = req.params;
    const video = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ success: false, message: "Invalid video ID" });
    }

    try {
        const updatedVideo = await Video.findByIdAndUpdate(id, video, { new: true });
        if (!updatedVideo) {
            return res.status(404).json({ success: false, message: "Video not found" });
        }
        res.status(200).json({ success: true, data: updatedVideo });
    } catch (error) {
        console.error("Error in updating video:", error.message);
        res.status(500).json({ success: false, message: "Server Error" });
    }
};

export const deleteVideo = async (req, res) => {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ success: false, message: "Invalid video ID" });
    }

    try {
        const deletedVideo = await Video.findByIdAndDelete(id);

        if (!deletedVideo) {
            return res.status(404).json({ success: false, message: "Video not found" });
        }

        res.status(200).json({ success: true, message: "Video deleted successfully" });
    } catch (error) {
        console.error("Error in deleting video:", error.message);
        res.status(500).json({ success: false, message: "Server Error" });
    }
};