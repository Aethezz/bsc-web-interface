import express from 'express';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import Video from './models/videos.model.js'; 

dotenv.config();

const app = express();

// Middleware to parse JSON
app.use(express.json());

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

// Start the server only after connecting to the database
(async () => {
    await connectDB(); // Ensure the database connection is established
    app.listen(5000, () => {
        console.log('Server started at http://localhost:5000');
    });
})();
