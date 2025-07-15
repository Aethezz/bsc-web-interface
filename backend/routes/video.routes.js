import express from "express";
import { deleteVideo, getVideos, createVideo, updateVideo, clearDatabase, analyzeVideo, getRealtimeEmotions, clearDuplicateVideos } from "../controllers/video.controllers.js";

const router = express.Router();

// Route to gather and list all video data
router.get("/", getVideos);

// Route to create a new video entry
router.post("/", createVideo);

router.post("/analyze", analyzeVideo);

// NEW: Route to get real-time emotions
router.post("/realtime-emotions", getRealtimeEmotions);
// Route to update video data by ID
router.put("/:id", updateVideo);

// Route to delete video data by ID
router.delete("/:id", deleteVideo);

router.post('/clear-database', clearDatabase);

router.post('/cleanup-duplicates', clearDuplicateVideos);

export default router;