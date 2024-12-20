import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './LinkInput.css';

const LinkInput = ({ theme, onSubmit }) => {
    const [link, setLink] = useState('');
    const navigate = useNavigate();

    const handleSubmit = (e) => {
        e.preventDefault();
        if (isValidYouTubeLink(link)) {
            onSubmit(link);
            navigate('/videos');
        } else {
            alert('Please enter a valid YouTube link.');
        }
        setLink('');
    };

    const isValidYouTubeLink = (url) => {
        const regex = /^(https?\:\/\/)?(www\.youtube\.com|youtu\.?be)\/.+$/;
        return regex.test(url);
    };

    return (
        <form onSubmit={handleSubmit} className="link-input-form">
            <div className="input-wrapper">
                <input
                    type="text"
                    value={link}
                    onChange={(e) => setLink(e.target.value)}
                    placeholder="Enter YouTube video link"
                    className={`link-input ${theme}`}
                />
            </div>
            <button type="submit" className={`link-input-button ${theme}`}>Submit</button>
        </form>
    );
};

export default LinkInput;