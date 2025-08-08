import axios from 'axios';

// Use production URL when deployed, localhost for development
const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://bsc-backend-f2ou.onrender.com'  // Your actual Render backend URL
  : 'http://localhost:5003';

const API_URL = `${API_BASE_URL}/api/videos`; // Adjust this URL if needed

// Create a new video
export const createVideo = async (videoData) => {
    try {
        const response = await axios.post(API_URL, videoData);
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

// Get all videos
export const getVideos = async () => {
  try {
      const response = await axios.get(API_URL);
      return response.data.data;
  } catch (error) {
      console.error("Error fetching videos:", error.message);
      throw error;
  }
};
