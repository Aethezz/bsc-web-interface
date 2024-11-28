import React from 'react';
import './HomePage.css';
import LinkInput from './LinkInput';

const Home = ({ theme }) => {
    const handleLinkSubmit = (link) => {
        console.log('Submitted link:', link);
        // Handle the submitted link here
    };

    return (
        <div className={`home-container ${theme}`}>
            <div className='home-text'>
                <h1>Discover AI Powered Emotions</h1>
                <p>Link your YouTube video below</p>
                <p>And we will show you the emotioal classification of the video</p>
                <LinkInput onSubmit={handleLinkSubmit} />
            </div>
        </div>
    );
};

export default Home;