import React, { useState } from 'react';
import './LinkInput.css';

const LinkInput = ({ onSubmit }) => {
    const [link, setLink] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit(link);
        setLink('');
    };

    return (
        <form onSubmit={handleSubmit} className="link-input-form">
            <input
                type="text"
                value={link}
                onChange={(e) => setLink(e.target.value)}
                placeholder="Enter YouTube video link"
                className="link-input"
            />
            <button type="submit" className="link-input-button">Submit</button>
        </form>
    );
};

export default LinkInput;