import React, { useState, useEffect } from 'react';
import { FaPlayCircle, FaPause } from 'react-icons/fa';
import "./Videos.css"

const VideoAnalysisTester = ({ theme }) => {
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [progress, setProgress] = useState(0);
    const [hasStarted, setHasStarted] = useState(false);
    const [analysisComplete, setAnalysisComplete] = useState(false);
    const [emotionData, setEmotionData] = useState({
        joy: 0,
        sadness: 0,
        anger: 0,
        fear: 0,
        surprise: 0,
        disgust: 0,
        trust: 0,
        anticipation: 0
    });

    // Mock API call - replace this with our real API call later
    const generateMockAnalysis = () => {
        // Simulate some randomized but realistic-looking data
        return {
            joy: Math.floor(Math.random() * 5) + 3, // 3-8 range for positive emotions
            sadness: Math.floor(Math.random() * 4) + 1, // 1-5 range for negative emotions
            anger: Math.floor(Math.random() * 3) + 1, // 1-4 range
            fear: Math.floor(Math.random() * 4) + 1, // 1-5 range
            surprise: Math.floor(Math.random() * 4) + 2, // 2-6 range
            disgust: Math.floor(Math.random() * 3) + 1, // 1-4 range
            trust: Math.floor(Math.random() * 4) + 2, // 2-6 range
            anticipation: Math.floor(Math.random() * 4) + 2 // 2-6 range
        };
    };

    // This function will be replaced with your actual API call
    const analyzeSentiment = async () => {
        try {
            // In the future, replace this with:
            // const response = await fetch('/your-api-endpoint');
            // const data = await response.json();
            const mockData = generateMockAnalysis();
            return mockData;
        } catch (error) {
            console.error('Analysis failed:', error);
            return null;
        }
    };

    const startAnalysis = async () => {
        setIsAnalyzing(true);
        setProgress(0);
        setAnalysisComplete(false);
        
        // Get the analysis results
        const results = await analyzeSentiment();

        // Make it so that it looks better 
        
        if (results) {
            // Animate progress bar
            const progressInterval = setInterval(() => {
                setProgress(prev => {
                    if (prev >= 100) {
                        clearInterval(progressInterval);
                        setIsAnalyzing(false);
                        setAnalysisComplete(true);
                        setEmotionData(results); // Set the results when progress completes
                        return 100;
                    }
                    return prev + 2;
                });
            }, 20);
        } else {
            setIsAnalyzing(false);
            // Handle error case
            alert('Analysis failed. Please try again.');
        }
    };

    const getEmotionColor = (emotion) => {
        const colors = {
            joy: '#FFD700',
            sadness: '#4169E1',
            anger: '#FF4500',
            fear: '#800080',
            surprise: '#00CED1',
            disgust: '#32CD32',
            trust: '#FFA500',
            anticipation: '#FF69B4'
        };
        return colors[emotion] || '#666';
    };

    const handleStartAnalysis = () => {
        setHasStarted(true);
        setIsAnalyzing(true);
        setProgress(0);
        setAnalysisComplete(false);

         // Simulate analysis progress
         const interval = setInterval(() => {
            setProgress((prevProgress) => {
                if (prevProgress >= 100) {
                    clearInterval(interval);
                    setIsAnalyzing(false);
                    setAnalysisComplete(true);
                    setEmotionData(generateMockAnalysis());
                    return 100;
                }
                return prevProgress + 50;
            });
        }, 500);
    };

    const getDominantEmotion = () => {
        return Object.entries(emotionData).reduce((a, b) => a[1] > b[1] ? a : b)[0];
    };

    // Make the entire  div of anaylsis results disapaer
    const renderEmotionBars = () => {
        return Object.entries(emotionData).map(([emotion, value]) => (
            <div key={emotion} className="emotion-stat-row">
                <span className="emotion-label">{emotion.charAt(0).toUpperCase() + emotion.slice(1)}</span>
                <div className="stat-bar-container">
                    <div 
                        className="stat-bar-fill"
                        style={{ 
                            width: `${(value / 8) * 100}%`,
                            backgroundColor: getEmotionColor(emotion)
                        }}
                    />
                    <div className="stat-markers">
                        {[...Array(8)].map((_, i) => (
                            <div key={i} className="stat-marker" />
                        ))}
                    </div>
                </div>
                <span className="stat-value">{value}/8</span>
            </div>
        ));
    };

    return (
        <div className={`video-analysis ${theme}`}>
            <div className="analysis-container">
                <h2>Video Emotion Analysis</h2>
                
                <div className="progress-section">
                    <div className="progress-bar">
                        <div 
                            className="progress-fill"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                    {isAnalyzing && (
                        <div className="analyzing-text">
                            Analyzing video... {progress}%
                        </div>
                    )}
                </div>
                
                {/* Make it so that this div appears only when you have put inside data because scrolling is a pain*/}
                {hasStarted && ( 
                <div className={`analysis-results ${analysisComplete ? 'visible' : ''}`}>
                    <div className="sentiment-box">
                        <h3>Primary Emotion</h3>
                        <div className="dominant-emotion" style={{ 
                            backgroundColor: getEmotionColor(getDominantEmotion())
                        }}>
                            {getDominantEmotion().toUpperCase()}
                        </div>
                    </div>

                    <div className="emotion-stats">
                        <h3>Emotion Breakdown</h3>
                        {renderEmotionBars()}
                    </div>
                </div>
                )}

                <button 
                    className="control-button"
                    onClick={handleStartAnalysis}
                    disabled={isAnalyzing}
                >
                    {isAnalyzing ? <FaPause /> : <FaPlayCircle />}
                    {isAnalyzing ? 'Analyzing...' : 'Start Analysis'}
                </button>
            </div>
        </div>
    );
};

export default VideoAnalysisTester;