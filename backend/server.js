import express from "express";
import dotenv from "dotenv";
import mongoose from "mongoose";
import videoRoutes from "./routes/video.routes.js";

dotenv.config();

const app = express();

// Middleware to parse JSON
app.use(express.json());

// Connect to MongoDB
const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log("MongoDB connected");
    } catch (error) {
        console.error(`Error connecting to MongoDB: ${error.message}`);
        process.exit(1); // Exit process if connection fails
    }
};

// Define API routes
app.use("/api/videos", videoRoutes);

// Start the server only after connecting to the database
(async () => {
    await connectDB(); // Ensure the database connection is established
    const PORT = process.env.PORT || 5001;
    app.listen(PORT, () => {
        console.log(`Server started at http://localhost:${PORT}`);
    });
})();
