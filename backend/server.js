import express from "express";
import dotenv from "dotenv";
import mongoose from "mongoose";
import cors from "cors";
import videoRoutes from "./routes/video.routes.js";
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


dotenv.config();

const app = express();

// Middleware
app.use(cors({
    origin: 'http://localhost:5173',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    credentials: true
}));
app.use(express.json());

// Connect to MongoDB
const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("MongoDB connected");
    } catch (error) {
        console.error(`Error connecting to MongoDB: ${error.message}`);
        process.exit(1);
    }
};

// Routes
app.use("/api/videos", videoRoutes);

// Start server after DB connection
(async () => {
    await connectDB();
    const PORT = process.env.PORT || 5003;
    app.listen(PORT, () => {
        console.log(`Server started at http://localhost:${PORT}`);
    });
})();
