import express from 'express';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import  models  from './models/videos.model.js'; 
const {Video} = models;

dotenv.config();

const app = express();

// Middleware to parse JSON
app.use(express.json());

// in theory should gather and list all the video ids submitted
app.get("/api/videos", async (req, res) => {
    try {
        const videos = await Video.find({});
        res.status(200).json({ success: true, data: videos});
    } catch (error) { 
        console.log("error in gathering video data", error.message);
        res.status(500).json({ success:false, message: "Server Error" })
    }
})

// Connect to MongoDB (if not imported from `./config/db.js`)
/* Remove the next block if `connectDB` is defined externally */
const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log('MongoDB connected');
    } catch (error) {
        console.error(`Error connecting to MongoDB: ${error.message}`);
        process.exit(1); // Exit process if connection fails
    }
};

// Define routes
app.get("/", (req, res) => {
    res.send("Server is ready");
});

app.post("/api/videos", async (req, res) => {
    const { video_file, youtube_link } = req.body; // Extract video data from request body

    // Check for missing required field
    if (!video_file) {
        return res.status(400).json({ success: false, message: "Video file is required" });
    }

    // Create a new video instance 
    try {
        const video = new Video({ video_file, youtube_link }); // Import Video model
        await video.save(); // Save video details to the database
        res.status(201).json({ success: true, data: video });
    } catch (error) {
        console.error("Error in saving video details:", error.message);
        res.status(500).json({ success: false, message: "Server Error" });
    }
});

// is meant to delete a videos data based on its video id
app.delete("/api/videos/:id", async (req, res) => {
    const { id } = req.params;

    try {
        const deletedVideo = await Video.findByIdAndDelete(id);

        if (!deletedVideo) {
            return res.status(404).json({ success: false, message: "Video not found" });
        }

        res.status(200).json({ success: true, message: "Video Data Deleted" });
    } catch (error) {
        res.status(500).json({ success: false, message: "Error deleting video", error: error.message });
    }
});

// Start the server only after connecting to the database
(async () => {
    await connectDB(); // Ensure the database connection is established
    const PORT = process.env.PORT || 5001;
    app.listen(PORT, () => {
        console.log(`Server started at http://localhost:${PORT}`);
    });
})();
