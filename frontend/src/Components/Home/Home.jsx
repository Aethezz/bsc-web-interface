import React from 'react';
import './HomePage.css';
import LinkInput from './LinkInput';
import {FaHeart, FaSmile, FaSadTear, FaFlushed } from 'react-icons/fa';

const Home = ({ theme }) => {
    const handleLinkSubmit = (link) => {
        console.log('Submitted link:', link);
        // Handle the submitted link here

        
    };

    const emotionCards = [
        { name: 'Joy', icon: <FaSmile />, color: '#ffd700' },
        { name: 'Sadness', icon: <FaSadTear />, color: '#4169e1' },
        { name: 'Fear', icon: <FaFlushed />, color: '#BB86FC' },
        { name: 'Love', icon: <FaHeart />, color: '#ff4444' }
    ];

    return (
        <div className={`home-container ${theme}`}>
            <div className='home-text'>
                <h1>Discover AI Powered Emotions</h1>
                <p>Link your YouTube video below</p>
                <p>And we will show you the emotional classification of the video</p>
                <LinkInput onSubmit={handleLinkSubmit} theme={theme} />
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
                <h2>Featured emotions</h2>
                <p>We would put them down as icons here</p>
                <div className="emotion-cards">
                    {emotionCards.map((emotion) => (
                        <div key={emotion.name} className={`emotion-card ${theme}`}>
                            <div className="emotion-icon">
                                <span className="icon-wrapper" style={{ color: emotion.color }}>
                                    {emotion.icon}
                                </span>
                            </div>
                            <h3 className={`emotion-name ${theme}`}>{emotion.name}</h3>
                            <button className={`see-more ${theme}`}>See More ›</button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Home;