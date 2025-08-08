import React, { useState } from 'react';
import './HomePage.css';
import LinkInput from './LinkInput';
import { saveVideo } from '../../services/Service.js';
import { FaSmile, FaSadTear, FaFlushed, FaLaugh, FaMeh } from 'react-icons/fa';
import { Link } from "react-router-dom"; // If using React Router

// Consider adding a hover affect to the cars instead of the crazy spin they have 

const Home = ({ theme }) => {

    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);

    const handleLinkSubmit = async (link) => {
        try {
            setLoading(true);
            await saveVideo(link);
            console.log('Video link saved successfully');
        } catch (error) {
            console.error('Error saving video:', error);
        } finally {
            setLoading(false);
        }
    };


    const emotionCards = [
        { name: 'Neutral', icon: <FaMeh />, color: '#808080' },
        { name: 'Happy', icon: <FaSmile />, color: '#FFD700' },
        { name: 'Funny', icon: <FaLaugh />, color: '#FFA500' },
        { name: 'Fear', icon: <FaFlushed />, color: '#800080' },
        { name: 'Sad', icon: <FaSadTear />, color: '#4169E1' }
    ];

    return (
        <div className={`home-container ${theme}`}>
            <div className='home-text'>
                <h1>Discover AI Powered Emotions</h1>
                <p>Link your YouTube video below</p>
                <p>And we will show you the emotional classification of the video</p>
                <LinkInput onSubmit={handleLinkSubmit} theme={theme} />
                {loading && <p>Saving...</p>}
                {error && <p className="error">{error}</p>}
            </div>

            {/* What We Do Section */}
            <div className="what-we-do-section">
                <h2>What we do</h2>
                <p>Here we put a video or gif animation of the model at work analyzing</p>
                {/*Might learn framer or some js library for this*/}
                <button className={`trial-button ${theme}`}>
                    View
                </button>
            </div>

            {/* Emotion Cards Section */}
            <div className="emotions-section">
                <h2>Supported Sentiment Emotions</h2>
                <p>Our ML model analyzes YouTube comments to detect these 5 core emotions</p>
                <div className="emotion-cards">
                    {emotionCards.map((emotion) => (
                        <div key={emotion.name} className={`emotion-card ${theme}`}>
                            <div className="emotion-icon">
                                <span className="icon-wrapper" style={{ color: emotion.color }}>
                                    {emotion.icon}
                                </span>
                            </div>
                            <h3 className={`emotion-name ${theme}`}>{emotion.name}</h3>
                            <Link to={`/emotions/${emotion.name}`} className={`see-more ${theme}`}>
                                See More ›
                            </Link>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Home;