# ML Service Integration Guide

This guide shows you how to integrate your trained YouTube comment sentiment analysis model with your video emotion analysis web application.

## Architecture Overview

```
Frontend (React) → Backend (Node.js) → ML Service (Python Flask)
                                    ↓
                            YouTube Comments API + Your Trained Models
```

## Your Current Model Integration

Your trained model pipeline:
1. **Stage 1**: XGBoost model for individual comment sentiment classification (0-4 scale)
2. **Stage 2**: Random Forest model for final video sentiment aggregation
3. **YouTube API**: Fetches top comments based on like count

## Setup Instructions

### 1. Install Dependencies

```bash
cd ml-service
pip install -r requirements.txt
```

### 2. Save Your Trained Models

Update `train_models.py` with your actual training code:

```python
# Replace the demo code in train_models.py with your actual training code:

# STAGE 1: Your comment sentiment model
dataset = pd.read_csv('allcomments_labled.csv')
X = dataset['text']
y = dataset['sentiment']

vectorizer = TfidfVectorizer(max_features=30000, max_df=0.7, min_df=5, ngram_range=(1, 3))
X_tfidf = vectorizer.fit_transform(X)
# ... your XGB training code ...

# STAGE 2: Your aggregation model  
df = pd.read_csv('trainingimproved.csv')
X = df[['Count_0', 'Count_1', 'Count_2', 'Count_3', 'Count_4']]
y = df['Actual Sentiment']
# ... your Random Forest training code ...

# Save models
save_models(vectorizer, xgb_model, rf_model)
```

Then run:
```bash
python train_models.py
```

### 3. Configure API Key

Update `.env` file with your YouTube Data API key:
```
YOUTUBE_API_KEY=your_actual_api_key_here
```

### 4. Test the Setup

```bash
python setup.py
```

### 5. Start the ML Service

```bash
python app.py
```

The service will run on `http://localhost:5002`

## API Endpoints

### Full Video Analysis
```
POST /analyze
{
  "youtube_url": "https://www.youtube.com/watch?v=VIDEO_ID",
  "method": "comments"  // or "video" or "both"
}
```

Response:
```json
{
  "emotions": {
    "anger": 5,
    "disgust": 3,
    "fear": 10,
    "happy": 65,
    "sad": 7,
    "surprise": 5,
    "neutral": 5
  },
  "dominant_emotion": "happy",
  "analysis_method": "youtube_comments",
  "video_title": "Video Title",
  "sentiment_label": "funny"
}
```

### Real-time Analysis
```
POST /analyze-realtime
{
  "youtube_url": "https://www.youtube.com/watch?v=VIDEO_ID",
  "current_time": 30
}
```

## Integration with Your Frontend

Your `Videos.jsx` component has been updated to use the ML service. Key changes:

1. **Analysis Mode Selection**: Choose between 'live' (mock) or 'full' (ML-powered)
2. **ML Integration**: Calls `/analyze` endpoint for full video analysis
3. **Fallback Handling**: Falls back to mock data if ML service fails

### Frontend Usage

```javascript
// Full analysis using your trained model
const result = await analyzeVideoML(youtubeLink);

// Real-time emotions (uses comment analysis with variations)
const emotions = await getRealtimeEmotions(youtubeLink, currentTime);
```

## Model Integration Details

### Comment Analysis Pipeline

1. **Fetch Comments**: Uses YouTube Data API to get top comments by likes
2. **Individual Sentiment**: Your XGBoost model classifies each comment (0-4)
3. **Aggregation**: Your Random Forest model predicts final video sentiment
4. **Emotion Mapping**: Converts sentiment labels to emotion percentages

### Sentiment to Emotion Mapping

```python
sentiment_mapping = {
    0: "neutral",
    1: "happy", 
    2: "funny" → "happy",
    3: "fear",
    4: "sad"
}
```

### Analysis Methods

1. **Comments Only** (`method: "comments"`): Uses your trained models
2. **Video Frames** (`method: "video"`): Visual emotion detection (basic)
3. **Combined** (`method: "both"`): Weighted combination (70% comments, 30% video)

## Backend Integration

Your Node.js backend now includes:

- `/api/videos/analyze` - Full ML analysis
- `/api/videos/realtime-emotions` - Real-time emotions
- Automatic fallback if ML service is unavailable

## Testing Your Integration

1. **Start all services**:
   ```bash
   # Terminal 1: ML Service
   cd ml-service && python app.py
   
   # Terminal 2: Backend  
   cd backend && npm run dev
   
   # Terminal 3: Frontend
   cd frontend && npm run dev
   ```

2. **Test with a YouTube video**:
   - Open your web app
   - Enter a YouTube URL
   - Select "Full Analysis" mode
   - Watch your trained model analyze the video!

## Troubleshooting

### Common Issues

1. **ML Service not starting**: Check if all dependencies are installed
2. **API key errors**: Verify your YouTube Data API key
3. **Model loading errors**: Ensure models are saved in `models/` directory
4. **Analysis fails**: Check video has comments enabled

### Logs to Check

- ML Service: Console output when running `python app.py`
- Backend: Check for connection errors to ML service
- Frontend: Browser console for API call failures

## Performance Notes

- **Comment Analysis**: Fast (~2-5 seconds)
- **Video Frame Analysis**: Slower (~30-60 seconds for short videos)
- **Combined Analysis**: Medium (~10-20 seconds)

For production, consider:
- Caching analysis results
- Async processing for long videos
- Rate limiting for API calls

## Your Model Benefits

✅ **Real trained data**: Uses your actual comment sentiment model  
✅ **YouTube API integration**: Fetches real comments  
✅ **Proven accuracy**: Your model achieved 67.6% accuracy  
✅ **Scalable**: Can handle multiple video requests  
✅ **Fallback ready**: Graceful degradation if service fails  

This integration brings your trained ML model directly into your web application, providing real emotion analysis based on YouTube comments!
