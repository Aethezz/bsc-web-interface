// Batch analyze multiple YouTube links
export const batchAnalyzeVideos = async (youtubeLinks, outputFormat = 'json') => {
    try {
        const url = `${API_URL}/batch-analyze`;
        if (outputFormat === 'csv') {
            // Download CSV as file
            const response = await axios.post(url, { youtube_links: youtubeLinks, output_format: 'csv' }, { responseType: 'blob' });
            const blob = new Blob([response.data], { type: 'text/csv' });
            const link = document.createElement('a');
            link.href = window.URL.createObjectURL(blob);
            link.download = 'batch_analysis_results.csv';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            return;
        } else {
            const response = await axios.post(url, { youtube_links: youtubeLinks, output_format: 'json' });
            return response.data;
        }
    } catch (error) {
        throw error;
    }
};
import axios from "axios";

// Use production URL when deployed, localhost for development
const API_BASE_URL = process.env.NODE_ENV === 'production'
    ? 'https://bsc-backend-f2ou.onrender.com'  // Your actual Render backend URL
    : 'http://localhost:5003';

const API_URL = `${API_BASE_URL}/api/videos`; // Adjust this URL if needed

// Fetch all videos
export const getVideos = async () => {
    try {
        const response = await axios.get(API_URL);
        return response.data;
    } catch (error) {
        console.error("Error fetching videos:", error.message);
        throw error;
    }
};

// Create a new video
export const createVideo = async (videoData) => {
    try {
        const response = await axios.post(API_URL, videoData);
        console.log('response.data = ', response.data);
        console.log(response)
        return response.data;
    } catch (error) {
        console.error("Error creating video:", error.message);
        throw error;
    }
};

// NEW: Analyze video using ML service - fetches all comments, sorts by likes, analyzes top 30
export const analyzeVideoML = async (youtubeLink, method = 'sentiment') => {
    try {
        console.log(`[FRONTEND API] 🚀 Starting ML analysis for: ${youtubeLink}`);
        console.log(`[FRONTEND API] Method: ${method} (fetches all comments, sorts by likes, takes top 30)`);

        const response = await axios.post(`${API_URL}/analyze`, {
            youtube_link: youtubeLink,
            method: method  // Using 'sentiment' for ML analysis with top 30 most-liked comments
        });

        console.log(`[FRONTEND API] ✅ ML analysis response received:`, response.data);
        console.log(`[FRONTEND API] Predicted emotion from top comments: ${response.data.data.dominant_emotion}`);

        return response.data;
    } catch (error) {
        console.error("[FRONTEND API] ❌ Error analyzing video:", error.message);
        throw error;
    }
};

// NEW: Get real-time emotions
export const getRealtimeEmotions = async (youtubeLink, currentTime) => {
    try {
        const response = await axios.post(`${API_URL}/realtime-emotions`, {
            youtube_link: youtubeLink,
            current_time: currentTime
        });
        return response.data;
    } catch (error) {
        console.error("Error getting real-time emotions:", error.message);
        throw error;
    }
};

// Update a video
export const updateVideo = async (id, updatedData) => {
    try {
        const response = await axios.put(`${API_URL}/${id}`, updatedData);
        return response.data;
    } catch (error) {
        console.error("Error updating video:", error.message);
        throw error;
    }
};

// Delete a video
export const deleteVideo = async (id) => {
    try {
        const response = await axios.delete(`${API_URL}/${id}`);
        return response.data;
    } catch (error) {
        console.error("Error deleting video:", error.message);
        throw error;
    }
};