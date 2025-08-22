
import React, { useState } from 'react';
import { FaSmile, FaSadTear, FaFlushed, FaLaugh, FaMeh, FaQuestion, FaAngry, FaSurprise } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import './LinkInput.css';
import { batchAnalyzeVideos, createVideo } from '../../api/videos';


const LinkInput = ({ theme, onSubmit }) => {
    const [link, setLink] = useState('');
    const [batchLinks, setBatchLinks] = useState('');
    const [batchResults, setBatchResults] = useState(null);
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [downloading, setDownloading] = useState(false);
    const [loading, setLoading] = useState(false);
    const [savingStatus, setSavingStatus] = useState('');
    const navigate = useNavigate();

    const handleSubmit = (e) => {
        e.preventDefault();
        if (isValidYouTubeLink(link)) {
            onSubmit(link);
            navigate('/videos', { state: { youtubeLink: link } });
        } else {
            alert('Please enter a valid YouTube link.');
        }
        setLink('');
    };

    const handleBatchAnalyze = async (e) => {
        e.preventDefault();
        const links = batchLinks.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
        if (links.length === 0) {
            alert('Please enter at least one YouTube link.');
            return;
        }
        setLoading(true);
        setSavingStatus('');
        try {
            const res = await batchAnalyzeVideos(links);
            setBatchResults(res.results);
            setSelectedIndex(0);
            // Save each video to backend
            setSavingStatus('Saving analyzed videos...');
            let savedCount = 0;
            for (const result of res.results) {
                if (!result.error && result.youtube_link && result.emotions) {
                    try {
                        await createVideo({
                            youtube_link: result.youtube_link,
                            emotion_data: result.emotions || {},
                            main_emotion: result.dominant_emotion || result.sentiment_label || '',
                            video_title: result.video_title || '',
                            comments_used: result.comments_used || [],
                            total_comments_analyzed: result.total_comments_analyzed || 0
                        });
                        savedCount++;
                    } catch (err) {
                        // Ignore save errors for individual videos
                    }
                }
            }
            setSavingStatus(`Saved ${savedCount} videos to database.`);
        } catch (err) {
            alert('Batch analysis failed.');
            setSavingStatus('');
        }
        setLoading(false);
    };

    const handleDownloadCSV = async () => {
        setDownloading(true);
        const links = batchLinks.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
        try {
            await batchAnalyzeVideos(links, 'csv');
        } catch (err) {
            alert('CSV download failed.');
        }
        setDownloading(false);
    };

    const isValidYouTubeLink = (url) => {
        const regex = /^(https?\:\/\/)?(www\.youtube\.com|youtu\.?be)\/.+$/;
        return regex.test(url);
    };


    // Emotion icon, color, and emoji mapping (for bar chart)
    const emotionMeta = {
        happy: { icon: <FaSmile color="#FFD700" />, color: '#FFD700', emoji: '😊' },
        sad: { icon: <FaSadTear color="#2196F3" />, color: '#2196F3', emoji: '😢' },
        fear: { icon: <FaFlushed color="#9C27B0" />, color: '#9C27B0', emoji: '😨' },
        funny: { icon: <FaLaugh color="#FFA500" />, color: '#FFA500', emoji: '😂' },
        neutral: { icon: <FaMeh color="#808080" />, color: '#808080', emoji: '😐' },
        anger: { icon: <FaAngry color="#E53935" />, color: '#E53935', emoji: '😡' },
        surprise: { icon: <FaSurprise color="#FF9800" />, color: '#FF9800', emoji: '😲' },
        disgust: { icon: <FaQuestion color="#388E3C" />, color: '#388E3C', emoji: '🤢' },
    };

    // Helper to render emotion bar chart
    const renderEmotionBarChart = (result) => {
        // Only show emotions that are present and are numbers
        const emotions = Object.entries(result)
            .filter(([key, value]) => [
                'happy', 'sad', 'fear', 'funny', 'neutral', 'anger', 'surprise', 'disgust'
            ].includes(key) && typeof value === 'number');
        if (emotions.length === 0) return null;
        return (
            <div className="emotion-bar-chart">
                {emotions.map(([key, value]) => {
                    const meta = emotionMeta[key] || { color: '#ccc', emoji: '❓' };
                    return (
                        <div key={key} className="emotion-bar-row">
                            <span className="emotion-bar-label">{meta.emoji} {key}</span>
                            <div className="emotion-bar-outer">
                                <div className="emotion-bar-fill" style={{ width: `${value}%`, background: meta.color }} />
                            </div>
                            <span className="emotion-bar-value">{value}%</span>
                        </div>
                    );
                })}
            </div>
        );
    };

    // Helper to render key stats (title, dominant_emotion, sentiment_label, total_comments_analyzed, etc.)
    const renderKeyStats = (result) => {
        const fields = [
            // { key: 'video_title', label: 'Title' }, // Removed Title from key stats
            { key: 'dominant_emotion', label: 'Dominant Emotion' },
            { key: 'sentiment_label', label: 'Sentiment Label' },
            { key: 'total_comments_analyzed', label: 'Comments Analyzed' },
            { key: 'main_emotion', label: 'Main Emotion' },
        ];
        return (
            <div className="key-stats">
                {fields.map(({ key, label }) => (
                    result[key] ? (
                        <div key={key} className="key-stat-row">
                            <span className="key-stat-label">{label}:</span>
                            <span className="key-stat-value">{result[key]}</span>
                        </div>
                    ) : null
                ))}
            </div>
        );
    };

    // Helper to render comments by emotion if available
    const renderCommentsByEmotion = (result) => {
        if (!result.emotion_comments) return null;
        const emotionKeys = Object.keys(result.emotion_comments).filter(e => Array.isArray(result.emotion_comments[e]) && result.emotion_comments[e].length > 0);
        if (emotionKeys.length === 0) return null;
        return (
            <div className="comments-by-emotion">
                <h5>📝 Comments by Emotion</h5>
                {emotionKeys.map(emotion => (
                    <div key={emotion} className="emotion-comments-section">
                        <h6 className="emotion-header">
                            {emotionMeta[emotion]?.emoji || '❓'} {emotion.charAt(0).toUpperCase() + emotion.slice(1)} ({result.emotion_comments[emotion].length} comments)
                        </h6>
                        <div className="comments-list">
                            {result.emotion_comments[emotion].slice(0, 5).map((comment, idx) => (
                                <div key={idx} className="comment-item">
                                    <div className="comment-text">"{comment.text}"</div>
                                    <div className="comment-meta">
                                        <span className="comment-author">- {comment.author}</span>
                                        <span className="comment-likes">👍 {comment.like_count}</span>
                                    </div>
                                </div>
                            ))}
                            {result.emotion_comments[emotion].length > 5 && (
                                <div className="more-comments">
                                    ... and {result.emotion_comments[emotion].length - 5} more {emotion} comments
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        );
    };

    // Responsive container style
    const containerStyle = { maxWidth: 1100, margin: '0 auto' };

    return (
        <div style={containerStyle}>
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
            <div className="batch-upload-section">
                <textarea
                    value={batchLinks}
                    onChange={e => setBatchLinks(e.target.value)}
                    placeholder="Paste multiple YouTube links, one per line"
                    className={`batch-link-textarea ${theme}`}
                    rows={6}
                />
                <button onClick={handleBatchAnalyze} className={`link-input-button ${theme}`} disabled={loading}>
                    {loading ? 'Analyzing...' : 'Batch Analyze'}
                </button>
                <button onClick={handleDownloadCSV} className={`link-input-button ${theme}`} disabled={downloading}>
                    {downloading ? 'Downloading...' : 'Download CSV'}
                </button>
            </div>
            {savingStatus && <div style={{ marginTop: 10, color: '#007bff', fontWeight: 500 }}>{savingStatus}</div>}
            {batchResults && (
                <div className="batch-results-pretty colourful">
                    <div className="batch-list">
                        <h4>Videos</h4>
                        <ul>
                            {batchResults.map((result, idx) => (
                                <li
                                    key={result.youtube_link || idx}
                                    className={idx === selectedIndex ? 'selected' : ''}
                                    onClick={() => setSelectedIndex(idx)}
                                >
                                    <span className="video-link">{result.youtube_link || 'Unknown'}</span>
                                    {result.error && <span className="error"> (Error)</span>}
                                </li>
                            ))}
                        </ul>
                    </div>
                    <div className="batch-details">
                        <h4>Result Details</h4>
                        {batchResults[selectedIndex] ? (
                            <div className="result-details card">
                                {batchResults[selectedIndex].error ? (
                                    <div className="error">Error: {batchResults[selectedIndex].error}</div>
                                ) : (
                                    <>
                                        {/* Title first */}
                                        {batchResults[selectedIndex].video_title && (
                                            <h3 className="result-title">{batchResults[selectedIndex].video_title}</h3>
                                        )}
                                        {/* Emotion bar chart */}
                                        {renderEmotionBarChart(batchResults[selectedIndex])}
                                        {/* Key stats (dominant emotion, sentiment, etc.) */}
                                        {renderKeyStats({
                                            ...batchResults[selectedIndex],
                                            dominant_emotion: batchResults[selectedIndex].dominant_emotion ? (
                                                <span style={{
                                                    background: emotionMeta[batchResults[selectedIndex].dominant_emotion]?.color || '#eee',
                                                    color: '#fff',
                                                    padding: '2px 10px',
                                                    borderRadius: '12px',
                                                    fontWeight: 'bold',
                                                    marginLeft: 4,
                                                    textTransform: 'uppercase',
                                                    fontSize: '1em',
                                                    letterSpacing: '0.5px',
                                                    boxShadow: '0 1px 4px rgba(0,0,0,0.07)'
                                                }}>
                                                    {batchResults[selectedIndex].dominant_emotion}
                                                </span>
                                            ) : null
                                        })}
                                        {/* Comments by emotion if available */}
                                        {renderCommentsByEmotion(batchResults[selectedIndex])}
                                        {/* Video link (no title) */}
                                        <div style={{ marginTop: 16 }}><b>Video Link:</b> <a href={batchResults[selectedIndex].youtube_link} target="_blank" rel="noopener noreferrer">{batchResults[selectedIndex].youtube_link}</a></div>
                                    </>
                                )}
                            </div>
                        ) : <div>No result selected.</div>}
                    </div>
                </div>
            )}
        </div>
    );
};

export default LinkInput;