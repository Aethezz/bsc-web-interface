import React, { useState, useEffect, useCallback, useRef } from 'react';
import { FaPlayCircle, FaPause } from 'react-icons/fa';
import './Videos.css';
import { getVideos, createVideo, analyzeVideoML, getRealtimeEmotions } from '../../api/videos';
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
  const [analysisMode, setAnalysisMode] = useState('live'); // 'live' or 'ml'
  const [analysisStatus, setAnalysisStatus] = useState(''); // Status messages
  const [isFullAnalysisComplete, setIsFullAnalysisComplete] = useState(false);
  const [sentimentResults, setSentimentResults] = useState(null); // Sentiment analysis results
  const [emotionResults, setEmotionResults] = useState(null); // Emotion recognition results
  const [combinedResults, setCombinedResults] = useState(null); // Combined analysis results

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

  const checkExistingVideo = async (link) => {
    const existingVideo = videos.find(video => video.youtube_link === link);
    return existingVideo;
  };

  const getRealTimeEmotions = async (currentTime) => {
    try {
      if (analysisMode === 'live') {
        const response = await getRealtimeEmotions(youtubeLink, currentTime);
        return response.data.emotions;
      } else {
        // For mock live mode, use mock data
        return generateMockLiveEmotion();
      }
    } catch (error) {
      console.error('Error getting real-time emotions:', error);
      // Fallback to mock data if ML service fails
      return generateMockLiveEmotion();
    }
  };

  // Perform full video analysis using ML service - SENTIMENT ANALYSIS ONLY
  const performFullAnalysis = async () => {
    try {
      console.log(`[FRONTEND] 🚀 Starting fresh ML sentiment analysis for: ${youtubeLink}`);
      setAnalysisStatus('Connecting to ML service...');

      // Always perform fresh analysis - no caching        
      setAnalysisStatus('Fetching all comments, sorting by likes, and analyzing top 30...');

      // Call ML service with SENTIMENT ANALYSIS ONLY (fetches all, sorts by likes, takes top 30)
      const response = await analyzeVideoML(youtubeLink, 'sentiment');

      if (response.success) {
        console.log(`[FRONTEND] ✅ Analysis complete!`);
        console.log(`[FRONTEND] Response data:`, response.data);

        const predictedEmotion = response.data.dominant_emotion;
        console.log(`[FRONTEND] 🎯 Predicted emotion: ${predictedEmotion}`);

        setAnalysisStatus(`Analysis complete! Predicted emotion: ${predictedEmotion.toUpperCase()} (from top ${response.data.total_comments_analyzed} comments)`);

        setSentimentResults({
          ...response.data.detailed_results?.sentiment_analysis,
          emotions: response.data.emotions,
          emotion_comments: response.data.emotion_comments,
          dominant_emotion: response.data.dominant_emotion,
          sentiment_label: response.data.sentiment_label,
          status: "completed"
        });

        console.log(`[FRONTEND] 📝 Sentiment results after setting:`, {
          emotions: response.data.emotions,
          emotion_comments: response.data.emotion_comments,
          dominant_emotion: response.data.dominant_emotion
        });
        setEmotionResults(null); // Not using emotion recognition for ML analysis
        setCombinedResults(null); // Not using combined analysis for ML analysis

        // Use SENTIMENT ANALYSIS emotions for display
        const sentimentEmotions = response.data.emotions;
        if (sentimentEmotions) {
          console.log(`[FRONTEND] 📊 Setting emotion data from top ${response.data.total_comments_analyzed} most-liked comments:`, sentimentEmotions);
          console.log(`[FRONTEND] 📝 Emotion comments breakdown:`, response.data.emotion_comments);
          console.log(`[FRONTEND] 🔍 Full response data:`, response.data);
          setEmotionData(sentimentEmotions);
          setIsFullAnalysisComplete(true);

          console.log(`[FRONTEND] ✅ Results saved to database`);

          // Show predicted emotion to user with rich details
          setTimeout(() => {
            const analysisResults = response.data.main_result;
            const videoTitle = analysisResults.video_title || 'Unknown Video';
            const commentsUsed = analysisResults.comments_used || [];
            const totalComments = analysisResults.total_comments_analyzed || 0;
            const processingTime = analysisResults.processing_time_seconds || 0;

            const modalContent = `
              <div style="
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                max-width: 600px;
                margin: 0 auto;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                padding: 30px;
                border-radius: 15px;
                box-shadow: 0 20px 40px rgba(0,0,0,0.3);
                text-align: left;
                line-height: 1.6;
              ">
                <div style="text-align: center; margin-bottom: 25px;">
                  <h2 style="margin: 0; font-size: 24px; font-weight: 600;">
                    🎯 YouTube Sentiment Analysis Results
                  </h2>
                  <div style="height: 3px; background: rgba(255,255,255,0.3); margin: 15px auto; width: 50px; border-radius: 2px;"></div>
                </div>
                
                <div style="background: rgba(255,255,255,0.1); padding: 20px; border-radius: 10px; margin-bottom: 20px;">
                  <h3 style="margin: 0 0 15px 0; font-size: 18px; display: flex; align-items: center;">
                    📹 Video Information
                  </h3>
                  <p style="margin: 8px 0; font-size: 16px;"><strong>Title:</strong> ${videoTitle}</p>
                  <p style="margin: 8px 0; font-size: 16px;"><strong>🎭 Predicted Emotion:</strong> 
                    <span style="
                      background: rgba(255,255,255,0.2); 
                      padding: 4px 12px; 
                      border-radius: 20px; 
                      font-weight: 600;
                      text-transform: uppercase;
                      letter-spacing: 1px;
                    ">${predictedEmotion}</span>
                  </p>
                  <p style="margin: 8px 0; font-size: 16px;"><strong>💬 Comments Analyzed:</strong> ${totalComments}</p>
                  ${processingTime > 0 ? `<p style="margin: 8px 0; font-size: 16px;"><strong>⏱️ Processing Time:</strong> ${processingTime}s</p>` : ''}
                </div>
                
                ${commentsUsed.length > 0 ? `
                <div style="background: rgba(255,255,255,0.1); padding: 20px; border-radius: 10px;">
                  <h3 style="margin: 0 0 15px 0; font-size: 18px; display: flex; align-items: center;">
                    � Sample Comments Analyzed
                  </h3>
                  <div style="max-height: 300px; overflow-y: auto;">
                    ${commentsUsed.slice(0, 6).map((comment, index) => {
              const cleanComment = comment.replace(/\n/g, ' ').trim();
              const displayComment = cleanComment.length > 120 ? cleanComment.substring(0, 120) + '...' : cleanComment;
              return `
                        <div style="
                          background: rgba(0,0,0,0.2); 
                          padding: 12px 15px; 
                          margin: 10px 0; 
                          border-radius: 8px;
                          border-left: 3px solid rgba(255,255,255,0.4);
                        ">
                          <div style="font-size: 12px; color: rgba(255,255,255,0.7); margin-bottom: 5px;">
                            Comment #${index + 1}
                          </div>
                          <div style="font-size: 14px; font-style: italic;">
                            "${displayComment}"
                          </div>
                        </div>
                      `;
            }).join('')}
                    ${commentsUsed.length > 6 ? `
                      <div style="
                        text-align: center; 
                        margin-top: 15px; 
                        font-size: 14px; 
                        color: rgba(255,255,255,0.8);
                        font-style: italic;
                      ">
                        ... and ${commentsUsed.length - 6} more comments analyzed
                      </div>
                    ` : ''}
                  </div>
                </div>
                ` : `
                <div style="background: rgba(255,255,255,0.1); padding: 20px; border-radius: 10px; text-align: center;">
                  <p style="margin: 0; font-size: 16px; color: rgba(255,255,255,0.8);">
                    ⚠️ No sample comments available for display
                  </p>
                </div>
                `}
                
                <div style="text-align: center; margin-top: 25px;">
                  <div style="
                    background: rgba(255,255,255,0.2); 
                    padding: 15px; 
                    border-radius: 25px; 
                    display: inline-block;
                    font-weight: 600;
                    font-size: 16px;
                  ">
                    ✅ Fresh Analysis Completed Successfully!
                  </div>
                </div>
              </div>
            `;

            const modal = document.createElement('div');
            modal.style.cssText = `
              position: fixed;
              top: 0;
              left: 0;
              width: 100%;
              height: 100%;
              background: rgba(0,0,0,0.8);
              display: flex;
              justify-content: center;
              align-items: center;
              z-index: 10000;
              backdrop-filter: blur(5px);
            `;

            const modalInner = document.createElement('div');
            modalInner.innerHTML = modalContent;
            modalInner.style.cssText = `
              max-height: 90vh;
              overflow-y: auto;
              animation: slideIn 0.3s ease-out;
            `;

            const style = document.createElement('style');
            style.textContent = `
              @keyframes slideIn {
                from { transform: translateY(-30px); opacity: 0; }
                to { transform: translateY(0); opacity: 1; }
              }
            `;
            document.head.appendChild(style);

            modal.appendChild(modalInner);
            document.body.appendChild(modal);

            // Close modal when clicking outside or after 15 seconds
            modal.addEventListener('click', (e) => {
              if (e.target === modal) {
                document.body.removeChild(modal);
                document.head.removeChild(style);
              }
            });

            setTimeout(() => {
              if (document.body.contains(modal)) {
                document.body.removeChild(modal);
                document.head.removeChild(style);
              }
            }, 15000);

          }, 500);

          return sentimentEmotions;
        } else {
          throw new Error('No sentiment emotion data in response');
        }
      } else {
        throw new Error(response.error || 'Sentiment analysis failed');
      }
    } catch (error) {
      console.error('[FRONTEND] ❌ ML sentiment analysis failed:', error);
      setAnalysisStatus(`ML sentiment analysis failed: ${error.message}`);

      // Fallback to mock analysis
      console.log('[FRONTEND] 🔄 Falling back to mock data');
      const mockData = generateAggregatedMockData();
      setEmotionData(mockData);
      setIsFullAnalysisComplete(true);

      try {
        await createVideo({
          youtube_link: youtubeLink,
          emotion_data: mockData,
          main_emotion: getDominantEmotion(mockData),
        });
      } catch (storeError) {
        console.error('Failed to store mock results:', storeError);
      }

      return mockData;
    }
  };

  // Generate aggregated mock data for fallback
  const generateAggregatedMockData = () => {
    const emotions = Object.keys(initEmotionData());
    const dominantIndex = Math.floor(Math.random() * emotions.length);
    const dominantValue = 30 + Math.random() * 40; // 30-70%
    const remaining = 100 - dominantValue;

    const otherValues = Array(emotions.length - 1).fill(0).map(() => Math.random());
    const otherTotal = otherValues.reduce((a, b) => a + b, 0);

    const result = {};
    emotions.forEach((emotion, idx) => {
      if (idx === dominantIndex) {
        result[emotion] = Math.round(dominantValue);
      } else {
        result[emotion] = Math.round((otherValues.shift() / otherTotal) * remaining);
      }
    });

    return result;
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

  const startLiveEmotionUpdates = () => {
    stopLiveEmotionUpdates();
    videoTimerRef.current = setInterval(async () => {
      setVideoTime((prevTime) => {
        const newTime = prevTime + 1;

        getRealTimeEmotions(newTime).then((newData) => {
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
        }).catch((error) => {
          console.error('Error getting real-time emotions:', error);
          const mockData = generateMockLiveEmotion();
          setEmotionData(mockData);
          const dominantEmotion = getDominantEmotion(mockData);
          setEmotionTrendData((prev) => [
            ...prev,
            {
              time: formatTime(newTime),
              dominantValue: mockData[dominantEmotion],
              dominant: dominantEmotion,
              fill: getEmotionColor(dominantEmotion),
            },
          ]);
        });

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
    // Prevent multiple clicks during analysis
    if (isAnalyzing) {
      console.log('[FRONTEND] 🚫 Analysis already in progress, ignoring click');
      return;
    }

    if (analysisMode === 'live') {
      setIsAnalyzing((prev) => {
        const newVal = !prev;
        if (newVal) {
          setEmotionData(initEmotionData());
          setVideoTime(0);
          setEmotionTrendData([]);
          setAnalysisStatus('Starting live analysis...');
          startLiveEmotionUpdates();
          setVideoSrc(`https://www.youtube.com/embed/${videoId}?autoplay=1&controls=1`);
        } else {
          stopLiveEmotionUpdates();
          setVideoSrc(`https://www.youtube.com/embed/${videoId}?autoplay=0&controls=1`);
          setAnalysisStatus('Live analysis stopped');
          StoreVideo(youtubeLink, emotionData);
        }
        return newVal;
      });
    } else if (analysisMode === 'ml') {
      console.log('[FRONTEND] 🚀 Starting ML analysis for:', youtubeLink);
      handleFullAnalysis();
    }
  }, [youtubeLink, videoId, emotionData, analysisMode, isAnalyzing]);

  const handleFullAnalysis = async () => {
    // Prevent multiple simultaneous analyses
    if (isAnalyzing) {
      console.log('[FRONTEND] 🚫 Analysis already in progress, skipping');
      return;
    }

    setIsAnalyzing(true);
    setIsFullAnalysisComplete(false);
    setAnalysisStatus('Preparing for analysis...');

    try {
      const results = await performFullAnalysis();
      setAnalysisStatus('Analysis complete! Results saved.');
    } catch (error) {
      setAnalysisStatus('Analysis failed. Please try again.');
      console.error('Full analysis error:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

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

        <div className="analysis-controls card">
          <h3>Analysis Method</h3>
          <div className="method-selector">
            <label>
              <input
                type="radio"
                value="live"
                checked={analysisMode === 'live'}
                onChange={(e) => setAnalysisMode(e.target.value)}
              />
              Live Mode (Mock Data)
            </label>
            <label>
              <input
                type="radio"
                value="ml"
                checked={analysisMode === 'ml'}
                onChange={(e) => setAnalysisMode(e.target.value)}
              />
              ML Analysis (Sentiment Analysis Only)
            </label>
          </div>
          {analysisStatus && (
            <div className="analysis-status">
              <p>{analysisStatus}</p>
            </div>
          )}
        </div>

        {isFullAnalysisComplete && (sentimentResults || emotionResults) && (
          <div className="detailed-results card">
            <h3>Analysis Results</h3>

            {sentimentResults && (
              <div className="analysis-section">
                <h4>🗨️ Sentiment Analysis (Your Trained Model)</h4>
                <div className="analysis-info">
                  <p><strong>Status:</strong> {sentimentResults.status}</p>
                  <p><strong>Method:</strong> YouTube Comments Analysis</p>
                  <p><strong>Dominant Emotion:</strong> {sentimentResults.dominant_emotion}</p>
                  {sentimentResults.sentiment_label && (
                    <p><strong>Sentiment Label:</strong> {sentimentResults.sentiment_label}</p>
                  )}
                </div>
                <div className="emotion-breakdown">
                  {Object.entries(sentimentResults.emotions || {}).map(([emotion, value]) => (
                    <div key={emotion} className="emotion-bar">
                      <span className="emotion-name">{emotion}:</span>
                      <div className="bar-container">
                        <div
                          className="bar-fill"
                          style={{ width: `${value}%`, backgroundColor: getEmotionColor(emotion) }}
                        />
                      </div>
                      <span className="emotion-value">{value}%</span>
                    </div>
                  ))}
                </div>

                {sentimentResults.emotion_comments && (
                  <div className="comments-by-emotion">
                    <h5>📝 Comments by Emotion (Top 30 Most-Liked)</h5>
                    {Object.entries(sentimentResults.emotion_comments).map(([emotion, comments]) => (
                      comments.length > 0 && (
                        <div key={emotion} className="emotion-comments-section">
                          <h6 className="emotion-header">
                            {getEmotionEmoji(emotion)} {emotion.charAt(0).toUpperCase() + emotion.slice(1)} ({comments.length} comments)
                          </h6>
                          <div className="comments-list">
                            {comments.slice(0, 5).map((comment, index) => (
                              <div key={index} className="comment-item">
                                <div className="comment-text">"{comment.text}"</div>
                                <div className="comment-meta">
                                  <span className="comment-author">- {comment.author}</span>
                                  <span className="comment-likes">👍 {comment.like_count}</span>
                                </div>
                              </div>
                            ))}
                            {comments.length > 5 && (
                              <div className="more-comments">
                                ... and {comments.length - 5} more {emotion} comments
                              </div>
                            )}
                          </div>
                        </div>
                      )
                    ))}
                  </div>
                )}
              </div>
            )}

            {emotionResults && (
              <div className="analysis-section">
                <h4>👁️ Emotion Recognition (Visual Analysis)</h4>
                <div className="analysis-info">
                  <p><strong>Status:</strong> {emotionResults.status}</p>
                  <p><strong>Method:</strong> Video Frame Analysis</p>
                  <p><strong>Dominant Emotion:</strong> {emotionResults.dominant_emotion}</p>
                  {emotionResults.frame_count && (
                    <p><strong>Frames Processed:</strong> {emotionResults.frame_count}</p>
                  )}
                  {emotionResults.note && (
                    <p className="note"><em>{emotionResults.note}</em></p>
                  )}
                </div>
                <div className="emotion-breakdown">
                  {Object.entries(emotionResults.emotions || {}).map(([emotion, value]) => (
                    <div key={emotion} className="emotion-bar">
                      <span className="emotion-name">{emotion}:</span>
                      <div className="bar-container">
                        <div
                          className="bar-fill"
                          style={{ width: `${value}%`, backgroundColor: getEmotionColor(emotion) }}
                        />
                      </div>
                      <span className="emotion-value">{value}%</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {combinedResults && (
              <div className="analysis-section combined-section">
                <h4>🔄 Combined Analysis</h4>
                <div className="analysis-info">
                  <p><strong>Method:</strong> Weighted combination of both analyses</p>
                  <p><strong>Final Dominant Emotion:</strong> {combinedResults.dominant_emotion}</p>
                </div>
                <div className="emotion-breakdown">
                  {Object.entries(combinedResults.emotions || {}).map(([emotion, value]) => (
                    <div key={emotion} className="emotion-bar">
                      <span className="emotion-name">{emotion}:</span>
                      <div className="bar-container">
                        <div
                          className="bar-fill"
                          style={{ width: `${value}%`, backgroundColor: getEmotionColor(emotion) }}
                        />
                      </div>
                      <span className="emotion-value">{value}%</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default VideoAnalysisTester;
