import express from "express";
import { deleteVideo, getVideos, createVideo, updateVideo } from "../controllers/video.controllers.js";

const router = express.Router();

// Route to gather and list all video data
router.get("/", getVideos);

// Route to create a new video entry
router.post("/", createVideo);

// Route to update video data by ID
router.put("/:id", updateVideo);

// Route to delete video data by ID
router.delete("/:id", deleteVideo);

export default router;