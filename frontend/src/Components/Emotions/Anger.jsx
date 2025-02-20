import React from "react";

const Anger = () => {
    // Anger-related YouTube videos
    const videos = [
        { id: 1, title: "Why We Get Angry", url: "https://www.youtube.com/watch?v=moQ1aBW4TSo", thumbnail: "https://img.youtube.com/vi/moQ1aBW4TSo/0.jpg" },
        { id: 2, title: "The Science of Anger", url: "https://www.youtube.com/watch?v=boGz5eU8M4g", thumbnail: "https://img.youtube.com/vi/boGz5eU8M4g/0.jpg" },
        { id: 3, title: "How to Control Anger Before It Controls You", url: "https://www.youtube.com/watch?v=5IR0nJj0C4k", thumbnail: "https://img.youtube.com/vi/5IR0nJj0C4k/0.jpg" },
        { id: 4, title: "Healthy Ways to Express Anger", url: "https://www.youtube.com/watch?v=p-JW_0x42i8", thumbnail: "https://img.youtube.com/vi/p-JW_0x42i8/0.jpg" },
        { id: 5, title: "Understanding and Managing Anger", url: "https://www.youtube.com/watch?v=4-Ic9bS-LGM", thumbnail: "https://img.youtube.com/vi/4-Ic9bS-LGM/0.jpg" },
        { id: 6, title: "What Happens to Your Brain When You Get Angry?", url: "https://www.youtube.com/watch?v=biONiclkbXg", thumbnail: "https://img.youtube.com/vi/biONiclkbXg/0.jpg" },
        { id: 7, title: "Dealing with Anger in a Healthy Way", url: "https://www.youtube.com/watch?v=MF70V2LWl-0", thumbnail: "https://img.youtube.com/vi/MF70V2LWl-0/0.jpg" },
        { id: 8, title: "How to Stop Overreacting and Control Anger", url: "https://www.youtube.com/watch?v=CdF4Oz9R1jo", thumbnail: "https://img.youtube.com/vi/CdF4Oz9R1jo/0.jpg" },
        { id: 9, title: "The Psychology of Anger: How to Handle It", url: "https://www.youtube.com/watch?v=DFzLpyW-FzU", thumbnail: "https://img.youtube.com/vi/DFzLpyW-FzU/0.jpg" },
        { id: 10, title: "How to Stay Calm in Stressful Situations", url: "https://www.youtube.com/watch?v=lPZ9aVzbzM0", thumbnail: "https://img.youtube.com/vi/lPZ9aVzbzM0/0.jpg" }
    ];

    return (
        <div className="emotion-page">
            <h1>Anger</h1>
            <p>This page contains details about anger.</p>

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
                    background-color: #ffebee; /* Light red for anger theme */
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
                    background: #f44336; /* Deep red */
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
                    color: #fff; /* White text for contrast */
                }
            `}</style>
        </div>
    );
};

export default Anger;
