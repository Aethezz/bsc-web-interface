import axios from 'axios';

const API_URL = 'http://localhost:5001/api/videos';

export const saveVideo = async (link) => {
    try {
      const response = await axios.post('http://localhost:5001/api/videos', {
        youtube_link: link
      });
      return response.data;
    } catch (error) {
      throw error;
    }
};
  