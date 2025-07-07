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
  const [videoWidth, setVideoWidth] = useState(0);

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [videos, setVideos] = useState([]);
  const [emotionData, setEmotionData] = useState(initEmotionData());
  const [videoTime, setVideoTime] = useState(0);
  const [emotionTrendData, setEmotionTrendData] = useState([]);
  const [hoveredIndex, setHoveredIndex] = useState(null); // For tooltip on timeline

  const [videoSrc, setVideoSrc] = useState(
    videoId ? `https://www.youtube.com/embed/${videoId}?autoplay=0&controls=1` : ''
  );

  const videoTimerRef = useRef(null);

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

  const getEmotionEmoji = (emotion) => {
    const emojis = {
      anger: '😡',
      disgust: '🤢',
      fear: '😨',
      happy: '😊',
      sad: '😢',
      surprise: '😲',
      neutral: '😐',
    };
    return <span style={{ color: getEmotionColor(emotion), fontSize: '20px' }}>{emojis[emotion] || '❓'}</span>;
  };

  const formatTime = (totalSeconds) => {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  };

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

  // Track iframe width
  useEffect(() => {
    const updateWidth = () => {
      if (iframeRef.current) {
        setVideoWidth(iframeRef.current.offsetWidth);
      }
    };
    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, []);

  const [currentDominantIndex, setCurrentDominantIndex] = useState(null);
  const [dominantCount, setDominantCount] = useState(0);

  const generateMockLiveEmotion = () => {
    const emotions = Object.keys(initEmotionData());

    // If no current dominant or count reached 5, pick new dominant
    let dominantIndex = currentDominantIndex;
    if (dominantIndex === null || dominantCount >= 5) {
      dominantIndex = Math.floor(Math.random() * emotions.length);
      setCurrentDominantIndex(dominantIndex);
      setDominantCount(1);
    } else {
      // Continue with current dominant
      setDominantCount(dominantCount + 1);
    }

    const dominantValue = 40 + Math.random() * 30;
    const remaining = 100 - dominantValue;
    const otherRawValues = Array(emotions.length - 1)
      .fill(0)
      .map(() => Math.random());
    const otherRawTotal = otherRawValues.reduce((a, b) => a + b, 0);

    const newData = {};
    emotions.forEach((emotion, idx) => {
      if (idx === dominantIndex) {
        newData[emotion] = dominantValue;
      } else {
        newData[emotion] = (otherRawValues.shift() / otherRawTotal) * remaining;
      }
    });

    const roundedData = {};
    emotions.forEach((emotion) => {
      roundedData[emotion] = Math.floor(newData[emotion]);
    });

    const total = Object.values(roundedData).reduce((a, b) => a + b, 0);
    const diff = 100 - total;
    roundedData[emotions[dominantIndex]] += diff;

    return roundedData;
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

  const getDominantEmotion = (data = emotionData) => {
    return Object.entries(data).reduce((a, b) => (a[1] > b[1] ? a : b))[0];
  };

  const startLiveEmotionUpdates = () => {
    stopLiveEmotionUpdates();
    videoTimerRef.current = setInterval(() => {
      setVideoTime((prevTime) => {
        const newTime = prevTime + 1;
        const newData = generateMockLiveEmotion();
        setEmotionData(newData);
        const dominantEmotion = getDominantEmotion(newData);
        setEmotionTrendData((prev) => [
          ...prev,
          {
            time: formatTime(newTime),
            dominantValue: newData[dominantEmotion],
            dominant: dominantEmotion,
            fill: getEmotionColor(dominantEmotion),
          },
        ]);
        return newTime;
      });
    }, 1000);
  };

  const stopLiveEmotionUpdates = () => {
    clearInterval(videoTimerRef.current);
  };

  const StoreVideo = async (link, data) => {
    const dominant = getDominantEmotion(data);
    try {
      await createVideo({
        youtube_link: link,
        emotion_data: data,
        main_emotion: dominant,
      });
      alert('Video analysis saved successfully!');
    } catch (e) {
      alert('Failed to store video analysis.');
    }
  };

  const handleStartAnalysis = useCallback(() => {
    setIsAnalyzing((prev) => {
      const newVal = !prev;
      if (newVal) {
        setEmotionData(initEmotionData());
        setVideoTime(0);
        setEmotionTrendData([]);
        startLiveEmotionUpdates();
        setVideoSrc(`https://www.youtube.com/embed/${videoId}?autoplay=1&controls=1`);
      } else {
        stopLiveEmotionUpdates();
        setVideoSrc(`https://www.youtube.com/embed/${videoId}?autoplay=0&controls=1`);
        StoreVideo(youtubeLink, emotionData);
      }
      return newVal;
    });
  }, [youtubeLink, videoId, emotionData]);

  const CustomTrendTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const { dominant } = emotionTrendData.find((d) => d.time === label);
      return (
        <div className="custom-tooltip">
          <p><strong>Time:</strong> {label}</p>
          <p>{getEmotionEmoji(dominant)} {dominant.charAt(0).toUpperCase() + dominant.slice(1)}: {payload[0].value}%</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className={`video-analysis ${theme}`}>
      <div className="analysis-container">
        <h2>Live Video Emotion Analysis</h2>
        <div className="video-and-results">
          <div className="youtube-wrapper" style={{ width: '100%' }}>
            {videoId ? (
              <>
                <iframe
                  ref={iframeRef}
                  width="100%"
                  height="360"
                  src={videoSrc}
                  title="YouTube video player"
                  allow="autoplay; encrypted-media"
                  allowFullScreen
                />
                {/* Emotion Timeline under video */}
                <div
                  style={{
                    position: 'relative',
                    width: `${videoWidth}px`,
                    marginTop: '8px',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      height: '24px',
                      overflowX: 'hidden',
                      border: '1px solid #ccc',
                      borderRadius: '6px',
                    }}
                  >
                    {emotionTrendData.map((entry, index) => (
                      <div
                        key={index}
                        // onMouseEnter={() => setHoveredIndex(index)}
                        // onMouseLeave={() => setHoveredIndex(null)}
                        style={{
                          backgroundColor: entry.fill,
                          width: '6px',
                          height: '100%',
                          flexShrink: 0,
                          position: 'relative',
                          cursor: 'pointer',
                        }}
                      >
                        {hoveredIndex === index && (
                          <div
                            style={{
                              position: 'absolute',
                              bottom: '100%',
                              left: '50%',
                              transform: 'translateX(-50%)',
                              backgroundColor: 'white',
                              border: '1px solid #ccc',
                              borderRadius: '6px',
                              padding: '4px 8px',
                              whiteSpace: 'nowrap',
                              fontSize: '14px',
                              zIndex: 10,
                              boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
                            }}
                          >
                            {getEmotionEmoji(entry.dominant)} {entry.dominant}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <div className="no-video-placeholder">
                <p>No YouTube link provided.</p>
              </div>
            )}
          </div>

          <div className="right-panel">
            <div className="emotion-results card">
              <h3>Live Emotion Breakdown</h3>
              {Object.entries(emotionData).map(([emotion, value]) => (
                <div key={emotion} className="emotion-stat-row">
                  <span className="emotion-label">{getEmotionEmoji(emotion)} {emotion}</span>
                  <div className="stat-bar-container">
                    <div
                      className="stat-bar-fill"
                      style={{ width: `${value}%`, background: getEmotionColor(emotion) }}
                    />
                  </div>
                  <span className="stat-value">{value}%</span>
                </div>
              ))}
            </div>
            <button className="control-button" onClick={handleStartAnalysis} disabled={!videoId}>
              {isAnalyzing ? <FaPause /> : <FaPlayCircle />} {isAnalyzing ? 'Pause Analysis' : 'Start Live Analysis'}
            </button>
          </div>
        </div>

        {/* Removed Legend as requested */}
      </div>
    </div>
  );
};

export default VideoAnalysisTester;
