// src/api/videos.js
import axios from "axios";

const API_URL = "http://localhost:5001/api/videos"; // Adjust this URL if needed

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