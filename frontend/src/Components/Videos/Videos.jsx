import React, { useState, useEffect, useCallback, useRef } from 'react';
import { FaPlayCircle, FaPause } from 'react-icons/fa';
import './Videos.css';
import { getVideos, createVideo } from '../../api/videos';
import { useLocation } from 'react-router-dom';

const VideoAnalysisTester = ({ theme }) => {
  const location = useLocation();
  const youtubeLink = location.state?.youtubeLink || '';
  const videoId = youtubeLink.split('v=')[1]?.split('&')[0];
  const iframeRef = useRef(null);

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [videos, setVideos] = useState([]);
  const [emotionData, setEmotionData] = useState(initEmotionData());
  const [dominantLog, setDominantLog] = useState([]);
  const [videoSrc, setVideoSrc] = useState(`https://www.youtube.com/embed/${videoId}?autoplay=0&controls=1`);

  const emotionIntervalRef = useRef(null);
  const timerRef = useRef(null);

  function initEmotionData() {
    return {
      anger: 0,
      disgust: 0,
      fear: 0,
      happy: 0,
      sad: 0,
      surprise: 0,
      neutral: 0,
    };
  }

  useEffect(() => {
    const fetchStoredVideos = async () => {
      try {
        const fetchedVideos = await getVideos();
        setVideos(fetchedVideos);
      } catch (error) {
        console.error('Error fetching videos:', error.message);
      }
    };
    fetchStoredVideos();
  }, []);

  const checkIfVideoExists = (link) =>
    videos.find((video) => video.youtube_link === link);

  const generateMockLiveEmotion = () => {
    const emotions = Object.keys(initEmotionData());
    const newData = {};
    emotions.forEach((emotion) => {
      newData[emotion] = Math.floor(Math.random() * 11); // 0-10
    });
    return newData;
  };

  const getEmotionColor = (emotion) => {
    const colors = {
      anger: '#FF4500',
      disgust: '#228B22',
      fear: '#800080',
      happy: '#FFD700',
      sad: '#4169E1',
      surprise: '#FF69B4',
      neutral: '#808080',
    };
    return colors[emotion] || '#666';
  };

  const getDominantEmotion = (data = emotionData) =>
    Object.entries(data).reduce((a, b) => (a[1] > b[1] ? a : b))[0];

  const startLiveEmotionUpdates = () => {
    emotionIntervalRef.current = setInterval(() => {
      const newData = generateMockLiveEmotion();
      const dominant = getDominantEmotion(newData);
      const timestamp = new Date().toLocaleTimeString();

      setEmotionData(newData);
      setDominantLog((log) => [...log.slice(-19), `${timestamp}: ${dominant.toUpperCase()}`]);
    }, 1000);

    timerRef.current = setInterval(() => {
      setVideoTime((prev) => prev + 1);
    }, 1000);
  };

  const stopLiveEmotionUpdates = () => {
    clearInterval(emotionIntervalRef.current);
    clearInterval(timerRef.current);
  };

  const StoreVideo = async (videoLink, emotionData) => {
    const dominant = getDominantEmotion(emotionData);
    try {
      const newVideo = await createVideo({
        youtube_link: videoLink,
        emotion_data: emotionData,
        main_emotion: dominant,
      });
      console.log('Video stored successfully:', newVideo);
    } catch (error) {
      console.error('Error storing video:', error.message);
      alert('Failed to store video.');
    }
  };

  const handleStartAnalysis = useCallback(() => {
    setIsAnalyzing((prev) => {
      const newVal = !prev;

      if (newVal) {
        startLiveEmotionUpdates();
        setVideoSrc(`https://www.youtube.com/embed/${videoId}?autoplay=1&controls=1`);
        } else {
        stopLiveEmotionUpdates();
        setVideoSrc(`https://www.youtube.com/embed/${videoId}?autoplay=0&controls=1`);
        StoreVideo(youtubeLink, emotionData);
        }

      return newVal;
    });
  }, [youtubeLink, videos]);

  const renderEmotionBars = () => {
    return Object.entries(emotionData).map(([emotion, value]) => (
      <div key={emotion} className="emotion-stat-row">
        <span className="emotion-label">{emotion.charAt(0).toUpperCase() + emotion.slice(1)}</span>
        <div className="stat-bar-container">
          <div
            className="stat-bar-fill"
            style={{
              width: `${(value / 10) * 100}%`,
              backgroundColor: getEmotionColor(emotion),
            }}
          />
          <div className="stat-markers">
            {[...Array(10)].map((_, i) => (
              <div key={i} className="stat-marker" />
            ))}
          </div>
        </div>
        <span className="stat-value">{value}/10</span>
      </div>
    ));
  };

  return (
    <div className={`video-analysis ${theme}`}>
      <div className="analysis-container">
        <h2>Live Video Emotion Analysis</h2>
        <div className="video-and-results">
        {/* YouTube Video Section */}
        <div className="youtube-wrapper">
            {videoId && (
            <iframe
                ref={iframeRef}
                width="100%"
                height="360"
                src={videoSrc}
                title="YouTube video"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
            />
            )}
        </div>

        {/* Right-Side: Emotions + Ticker + Button */}
        <div className="right-panel">
            <div className="emotion-results">
            <h3>Live Emotion Breakdown</h3>
            {renderEmotionBars()}
            </div>

            <div className="dominant-log">
            <h4>Emotion Ticker</h4>
            <ul>
                {dominantLog.map((entry, idx) => (
                <li key={idx}>{entry}</li>
                ))}
            </ul>
            </div>

            {/* Control Button */}
            <button className="control-button" onClick={handleStartAnalysis}>
            {isAnalyzing ? <FaPause /> : <FaPlayCircle />}
            {isAnalyzing ? 'Pause Analysis' : 'Start Live Analysis'}
            </button>
        </div>
        </div>
      </div>
    </div>
  );
};

export default VideoAnalysisTester;
