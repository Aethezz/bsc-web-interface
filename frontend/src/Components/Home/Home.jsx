import React, {useState} from 'react';
import './HomePage.css';
import LinkInput from './LinkInput';
import { saveVideo } from '../../services/Service.js';
import {FaHeart, FaSmile, FaSadTear, FaFlushed } from 'react-icons/fa';

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

    // JOy, pleased, fear, sad 

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