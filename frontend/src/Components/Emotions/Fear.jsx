import React from "react";

const Fear = () => {
    console.log("Fear page is being rendered"); // Debugging log

    // Dummy YouTube videos related to fear
    const videos = [
        { id: 1, title: "Understanding Fear", url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ", thumbnail: "https://img.youtube.com/vi/dQw4w9WgXcQ/0.jpg" },
        { id: 2, title: "Overcoming Fear", url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ", thumbnail: "https://img.youtube.com/vi/dQw4w9WgXcQ/0.jpg" },
        { id: 3, title: "Managing Fear in Stressful Situations", url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ", thumbnail: "https://img.youtube.com/vi/dQw4w9WgXcQ/0.jpg" }
    ];

    return (
        <div className="emotion-page">
            <h1>Fear</h1>
            <p>This page contains details about fear.</p>

            {/* Video List */}
            <div className="video-list">
                {videos.map((video) => (
                    <div key={video.id} className="video-card">
                        <a href={video.url} target="_blank" rel="noopener noreferrer">
                            <img src={video.thumbnail} alt={video.title} className="video-thumbnail" />
                            <h3>{video.title}</h3>
                        </a>
                    </div>
                ))}
            </div>

            {/* Styles */}
            <style>{`
                .emotion-page {
                    text-align: center;
                    padding: 20px;
                }
                .video-list {
                    display: flex;
                    justify-content: center;
                    flex-wrap: wrap;
                    gap: 20px;
                    margin-top: 20px;
                }
                .video-card {
                    width: 250px;
                    background: #ffeb3b;
                    padding: 10px;
                    border-radius: 8px;
                    text-align: center;
                    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
                    transition: transform 0.2s;
                }
                .video-card:hover {
                    transform: scale(1.05);
                }
                .video-thumbnail {
                    width: 100%;
                    border-radius: 5px;
                }
                .video-card h3 {
                    font-size: 16px;
                    margin-top: 8px;
                    color: #333;
                }
            `}</style>
        </div>
    );
};

export default Fear;
