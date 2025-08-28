import { Parser as Json2csvParser } from 'json2csv';
// Batch analyze multiple YouTube links and return results as JSON or CSV
export const batchAnalyzeVideos = async (req, res) => {
    let { youtube_links, output_format } = req.body;
    if (!Array.isArray(youtube_links) || youtube_links.length === 0) {
        return res.status(400).json({ success: false, message: "youtube_links must be a non-empty array" });
    }

    output_format = output_format || 'json';
    const results = [];
    for (const link of youtube_links) {
        try {
            // Call ML service for each link
            const mlResponse = await axios.post(`${ML_SERVICE_URL}/analyze`, { youtube_url: link }, { timeout: 300000 });
            const data = mlResponse.data;
            // Extract fields as in analyzeVideo
            let emotions, dominant_emotion, sentiment_label, xgboost_emotion, frame_count, comments_used = [], total_comments_analyzed = 0, video_title = "Unknown", emotion_comments = {};
            if (data.detailed_results) {
                const sentimentAnalysis = data.detailed_results.sentiment_analysis;
                if (sentimentAnalysis && sentimentAnalysis.emotions) {
                    emotions = sentimentAnalysis.emotions;
                    xgboost_emotion = sentimentAnalysis.dominant_emotion;
                    sentiment_label = sentimentAnalysis.sentiment_label;
                    dominant_emotion = sentiment_label || xgboost_emotion;
                    comments_used = sentimentAnalysis.comments_used || [];
                    total_comments_analyzed = sentimentAnalysis.total_comments_analyzed || 0;
                    video_title = sentimentAnalysis.video_title || "Unknown";
                    emotion_comments = sentimentAnalysis.emotion_comments || {};
                } else {
                    emotions = {};
                    dominant_emotion = "neutral";
                    sentiment_label = "neutral";
                    xgboost_emotion = "neutral";
                    emotion_comments = {};
                }
                frame_count = data.detailed_results.emotion_recognition?.frame_count;
            } else {
                emotions = data.emotions;
                xgboost_emotion = data.dominant_emotion;
                sentiment_label = data.sentiment_label || data.dominant_emotion;
                dominant_emotion = sentiment_label || xgboost_emotion;
                frame_count = data.frame_count;
                comments_used = data.comments_used || [];
                total_comments_analyzed = data.total_comments_analyzed || 0;
                video_title = data.video_title || "Unknown";
                emotion_comments = data.emotion_comments || {};
            }
            results.push({
                youtube_link: link,
                emotions,
                dominant_emotion,
                sentiment_label,
                xgboost_emotion,
                emotion_comments,
                frame_count,
                comments_used,
                total_comments_analyzed,
                video_title
            });
        } catch (error) {
            results.push({ youtube_link: link, error: error.message });
        }
    }

    if (output_format === 'csv') {
        try {
            const fields = Object.keys(results[0] || {});
            const json2csv = new Json2csvParser({ fields });
            const csv = json2csv.parse(results);
            res.header('Content-Type', 'text/csv');
            res.attachment('batch_analysis_results.csv');
            return res.send(csv);
        } catch (err) {
            return res.status(500).json({ success: false, message: 'CSV generation failed', error: err.message });
        }
    }
    res.json({ success: true, results });
};

import mongoose from "mongoose";
import { Video, StaticRating, DynamicRating } from '../models/videos.model.js';
import axios from 'axios';
import axiosRetry from 'axios-retry';

// Retry up to 6 times, with 10s delay between retries, on 429 or 503 errors
axiosRetry(axios, {
    retries: 6,
    retryDelay: () => 10000, // 10 seconds between retries
    retryCondition: (error) => {
        return (
            axiosRetry.isNetworkOrIdempotentRequestError(error) ||
            (error.response && (error.response.status === 429 || error.response.status === 503))
        );
    },
    onRetry: (retryCount, error, requestConfig) => {
        console.log(`[ML SERVICE] Retry attempt ${retryCount} for ${requestConfig.url} due to status ${error.response?.status}`);
    }
});

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:5002';

export const getVideos = async (req, res) => {
    try {
        const videos = await Video.find({});
        res.status(200).json(videos);
    } catch (error) {
        console.error("Error in gathering video data:", error.message);
        res.status(500).json({ message: "Server Error" });
    }
};

export const createVideo = async (req, res) => {
    const { youtube_link, emotion_data, main_emotion, video_title, comments_used, total_comments_analyzed } = req.body;

    if (!youtube_link || typeof youtube_link !== "string") {
        return res.status(400).json({ success: false, message: "Invalid or missing YouTube link" });
    }

    if (!emotion_data || typeof emotion_data !== "object") {
        return res.status(400).json({ success: false, message: "Invalid or missing emotion data" });
    }

    console.log(`[CREATE VIDEO] 📝 Received data: title="${video_title}", comments=${total_comments_analyzed}, emotion=${main_emotion}`);

    try {
        const existingVideo = await Video.findOne({ youtube_link });

        if (existingVideo) {
            console.log(`[CREATE VIDEO] 🔄 Updating existing video with new analysis: ${youtube_link}`);
            console.log(`[CREATE VIDEO] Old main_emotion: ${existingVideo.main_emotion}, New main_emotion: ${main_emotion}`);
            console.log(`[CREATE VIDEO] Old title: ${existingVideo.video_title}, New title: ${video_title}`);

            // Update existing video with new emotion data and metadata
            existingVideo.emotion_data = emotion_data;
            existingVideo.main_emotion = main_emotion;
            existingVideo.video_title = video_title || existingVideo.video_title || 'Unknown Video';
            existingVideo.comments_used = comments_used || existingVideo.comments_used || [];
            existingVideo.total_comments_analyzed = total_comments_analyzed || existingVideo.total_comments_analyzed || 0;
            await existingVideo.save();

            console.log(`[CREATE VIDEO] ✅ Video updated successfully: ${youtube_link}`);

            return res.status(200).json({
                success: true,
                data: existingVideo,
                message: "Video updated with new analysis"
            });
        }

        const video = new Video({
            youtube_link,
            emotion_data,
            main_emotion,
            video_title: video_title || 'Unknown Video',
            comments_used: comments_used || [],
            total_comments_analyzed: total_comments_analyzed || 0
        });
        await video.save();

        console.log(`[CREATE VIDEO] ✅ New video saved: ${youtube_link}`);

        res.status(201).json({
            success: true,
            data: video,
        });
    } catch (error) {
        console.error("Error in saving video:", error.message);
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

export const clearDatabase = async (req, res) => {
    try {
        // Delete all documents from each collection
        await Video.deleteMany({});
        await StaticRating.deleteMany({});
        await DynamicRating.deleteMany({});

        console.log("Database cleared successfully.");
        res.status(200).json({ success: true, message: "Database cleared successfully." });
    } catch (error) {
        console.error("Error clearing database:", error.message);
        res.status(500).json({ success: false, message: "Server Error" });
    }
};

export const analyzeVideo = async (req, res) => {
    const { youtube_link } = req.body;

    console.log(`[BACKEND] Received analyze request: ${JSON.stringify(req.body)}`);

    if (!youtube_link || typeof youtube_link !== "string") {
        console.log(`[BACKEND] Invalid YouTube link: ${youtube_link}`);
        return res.status(400).json({ success: false, message: "Invalid or missing YouTube link" });
    }

    const videoId = youtube_link.split('v=')[1]?.split('&')[0];
    if (!videoId) {
        return res.status(400).json({ success: false, message: "Could not extract video ID from YouTube link" });
    }

    try {
        console.log(`[BACKEND] ========== STARTING ML ANALYSIS ==========`);
        console.log(`[BACKEND] Analyzing video with ML service: ${youtube_link}`);
        console.log(`[BACKEND] ML Service URL: ${ML_SERVICE_URL}/analyze`);
        console.log(`[BACKEND] Fetching all comments, sorting by like count, and analyzing top 30...`);

        // Call ML service for sentiment analysis (fetches all comments, sorts by likes, takes top 30)
        const mlResponse = await axios.post(`${ML_SERVICE_URL}/analyze`, {
            youtube_url: youtube_link
        }, {
            timeout: 300000 // 5 minutes timeout for comment processing
        });

        console.log('[BACKEND] ✅ ML Service Response received!');
        console.log('[BACKEND] ML Service Response Status:', mlResponse.status);
        console.log('[BACKEND] ML Service Response:', JSON.stringify(mlResponse.data, null, 2));

        const responseData = mlResponse.data;
        let emotions, dominant_emotion, sentiment_label, xgboost_emotion, frame_count, comments_used = [], total_comments_analyzed = 0, video_title = "Unknown", emotion_comments = {};

        if (responseData.detailed_results) {
            const sentimentAnalysis = responseData.detailed_results.sentiment_analysis;

            if (sentimentAnalysis && sentimentAnalysis.emotions) {
                emotions = sentimentAnalysis.emotions;
                // Store both emotions for reference
                xgboost_emotion = sentimentAnalysis.dominant_emotion;
                sentiment_label = sentimentAnalysis.sentiment_label;
                // Use Random Forest sentiment_label instead of XGBoost dominant_emotion for database storage
                dominant_emotion = sentiment_label || xgboost_emotion;
                comments_used = sentimentAnalysis.comments_used || [];
                total_comments_analyzed = sentimentAnalysis.total_comments_analyzed || 0;
                video_title = sentimentAnalysis.video_title || "Unknown";
                emotion_comments = sentimentAnalysis.emotion_comments || {};
                console.log(`[BACKEND] Using sentiment analysis emotions: ${JSON.stringify(emotions)}`);
                console.log(`[BACKEND] XGBoost dominant emotion: ${xgboost_emotion}`);
                console.log(`[BACKEND] Random Forest sentiment label: ${sentiment_label}`);
                console.log(`[BACKEND] Using for database: ${dominant_emotion}`);
                console.log(`[BACKEND] Emotion comments: ${JSON.stringify(emotion_comments)}`);
                console.log(`[BACKEND] Analyzed top ${total_comments_analyzed} comments sorted by like count`);
                console.log(`[BACKEND] Sample top comments: ${comments_used.slice(0, 3).join(' | ')}`);
            } else {
                console.log(`[BACKEND] No sentiment analysis data found, using fallback`);
                emotions = get_fallback_emotions();
                dominant_emotion = "neutral";
                sentiment_label = "neutral";
                xgboost_emotion = "neutral";
                emotion_comments = {};
            }

            frame_count = responseData.detailed_results.emotion_recognition?.frame_count;
        } else {
            // Fallback to old format if available
            emotions = responseData.emotions;
            xgboost_emotion = responseData.dominant_emotion;
            sentiment_label = responseData.sentiment_label || responseData.dominant_emotion;
            dominant_emotion = sentiment_label || xgboost_emotion;
            frame_count = responseData.frame_count;
            comments_used = responseData.comments_used || [];
            total_comments_analyzed = responseData.total_comments_analyzed || 0;
            video_title = responseData.video_title || "Unknown";
            emotion_comments = responseData.emotion_comments || {};
        }

        if (!emotions) {
            emotions = {
                anger: 5,
                disgust: 5,
                fear: 10,
                happy: 40,
                sad: 15,
                surprise: 10,
                neutral: 15
            };
        }

        if (!dominant_emotion) {
            dominant_emotion = 'neutral';
        }

        if (!sentiment_label) {
            sentiment_label = 'neutral';
        }

        if (!xgboost_emotion) {
            xgboost_emotion = 'neutral';
        }

        console.log(`[BACKEND] Final emotion data: emotions=${JSON.stringify(emotions)}, dominant=${dominant_emotion}, sentiment_label=${sentiment_label}`);

        // Return analysis results without auto-saving - let frontend handle storage with correct sentiment label
        console.log(`[BACKEND] ✅ Analysis complete - returning data to frontend for storage`);
        console.log(`[BACKEND] ========== ML ANALYSIS COMPLETE ==========`);

        res.status(200).json({
            success: true,
            data: {
                emotions,
                dominant_emotion,
                sentiment_label,
                xgboost_emotion,
                emotion_comments,
                frame_count,
                detailed_results: responseData.detailed_results,
                main_result: {
                    video_title: video_title,
                    comments_used: comments_used,
                    total_comments_analyzed: total_comments_analyzed,
                    dominant_emotion: dominant_emotion,
                    sentiment_label: sentiment_label,
                    xgboost_emotion: xgboost_emotion,
                    emotions: emotions,
                    emotion_comments: emotion_comments
                },
                message: "Video analyzed successfully - ready for storage"
            }
        });

    } catch (error) {
        console.error("[BACKEND] Error analyzing video:", error.message);
        console.error("[BACKEND] Error stack:", error.stack);

        if (error.code === 'ECONNREFUSED') {
            console.error("[BACKEND] ML service connection refused");
            return res.status(503).json({
                success: false,
                message: "ML service is not available. Please ensure the Python ML service is running."
            });
        }

        if (error.response) {
            console.error("[BACKEND] ML service error response:", error.response.status, error.response.data);
            return res.status(error.response.status).json({
                success: false,
                message: error.response.data.error || "ML analysis failed"
            });
        }

        res.status(500).json({
            success: false,
            message: "Failed to analyze video"
        });
    }
};

// NEW: Get real-time emotions at specific timestamp
export const getRealtimeEmotions = async (req, res) => {
    const { youtube_link, current_time } = req.body;

    if (!youtube_link) {
        return res.status(400).json({ success: false, message: "YouTube link is required" });
    }

    try {
        const mlResponse = await axios.post(`${ML_SERVICE_URL}/analyze-realtime`, {
            youtube_url: youtube_link,
            current_time: current_time || 0
        });

        res.status(200).json({
            success: true,
            data: mlResponse.data
        });

    } catch (error) {
        console.error("Error getting real-time emotions:", error.message);
        res.status(500).json({
            success: false,
            message: "Failed to get real-time emotions"
        });
    }
};

// NEW: Database maintenance endpoint
export const clearDuplicateVideos = async (req, res) => {
    try {
        console.log('[DB CLEANUP] 🔄 Starting duplicate video cleanup...');

        const allVideos = await Video.find({});
        console.log(`[DB CLEANUP] 📊 Found ${allVideos.length} total videos`);

        // Group by youtube_link to find duplicates
        const videoMap = new Map();
        const duplicates = [];

        for (const video of allVideos) {
            const key = video.youtube_link;
            if (videoMap.has(key)) {
                duplicates.push(video._id);
                console.log(`[DB CLEANUP] 🔍 Found duplicate: ${key}`);
            } else {
                videoMap.set(key, video._id);
            }
        }

        if (duplicates.length > 0) {
            // Delete duplicate videos
            const deleteResult = await Video.deleteMany({ _id: { $in: duplicates } });
            console.log(`[DB CLEANUP] 🗑️ Deleted ${deleteResult.deletedCount} duplicate videos`);

            // Also clean up related ratings
            await StaticRating.deleteMany({ video_id: { $in: duplicates } });
            await DynamicRating.deleteMany({ video_id: { $in: duplicates } });
            console.log(`[DB CLEANUP] 🗑️ Deleted related ratings for duplicate videos`);
        }

        const finalCount = await Video.countDocuments();
        console.log(`[DB CLEANUP] ✅ Cleanup complete.Final video count: ${finalCount} `);

        res.status(200).json({
            success: true,
            message: "Database cleanup completed",
            duplicatesRemoved: duplicates.length,
            finalVideoCount: finalCount
        });

    } catch (error) {
        console.error("[DB CLEANUP] ❌ Error cleaning duplicates:", error.message);
        res.status(500).json({
            success: false,
            message: "Error cleaning database",
            error: error.message
        });
    }
};