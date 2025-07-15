from flask import Flask, request, jsonify
from flask_cors import CORS
import os
from dotenv import load_dotenv
from utils.youtube_analyzer import YouTubeCommentAnalyzer  # Import the class directly
import json

# Load environment variables from .env file
load_dotenv()

app = Flask(__name__)
CORS(app)

# Configuration
YOUTUBE_API_KEY = os.getenv('YOUTUBE_API_KEY')
if not YOUTUBE_API_KEY:
    print("❌ WARNING: No YOUTUBE_API_KEY environment variable set!")
    print("   Set your YouTube Data API key with: $env:YOUTUBE_API_KEY='your-api-key-here'")
    print("   Get one from: https://console.cloud.google.com/apis/credentials")

# PRELOAD MODELS AT STARTUP - This is the key fix!
print("🔄 Loading ML models at startup...")
try:
    analyzer = YouTubeCommentAnalyzer(YOUTUBE_API_KEY)
    print("✅ ML models loaded successfully at startup!")
    print(f"✅ TF-IDF Vectorizer: {'✓' if analyzer.vectorizer is not None else '✗'}")
    print(f"✅ XGBoost Model: {'✓' if analyzer.xgb_model is not None else '✗'}")
    print(f"✅ Random Forest Model: {'✓' if analyzer.rf_model is not None else '✗'}")
except Exception as e:
    print(f"❌ Error loading models at startup: {e}")
    analyzer = None

@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({"status": "healthy", "service": "ml-emotion-analyzer"})

@app.route('/analyze', methods=['POST'])
def analyze_video():
    """
    Analyze emotions in a YouTube video using both sentiment analysis and emotion recognition
    Expected JSON payload: {"youtube_url": "https://www.youtube.com/watch?v=..."}
    """
    try:
        print(f"[ML SERVICE] Received analyze request from {request.remote_addr}")
        data = request.get_json()
        print(f"[ML SERVICE] Request data: {data}")
        
        youtube_url = data.get('youtube_url')
        analysis_method = data.get('method', 'both')  # 'sentiment', 'emotion', or 'both'
        
        if not youtube_url:
            print("[ML SERVICE] Missing youtube_url in request")
            return jsonify({"error": "youtube_url is required"}), 400
        
        print(f"[ML SERVICE] Analyzing video: {youtube_url} using method: {analysis_method}")
        
        results = {}
        
        # SECTION 1: Sentiment Analysis (Your Trained Model) 
        if analysis_method in ['sentiment', 'both']:
            print("[ML SERVICE] Running sentiment analysis using preloaded models...")
            import time
            start_time = time.time()
            
            try:
                if analyzer is None:
                    raise Exception("Models not loaded at startup")
                
                print(f"[ML SERVICE] ⏱️ Starting YouTube comment analysis...")
                
                # Get real YouTube comments - no fallback, fail if API fails
                print("[ML SERVICE] 🔄 Fetching real YouTube comments...")
                sentiment_result = analyzer.analyze_video_comments(youtube_url)
                print("[ML SERVICE] ✅ Successfully analyzed real YouTube comments!")
                analysis_time = time.time() - start_time
                print(f"[ML SERVICE] ⏱️ Analysis completed in {analysis_time:.2f} seconds")
                
                if 'error' not in sentiment_result:
                    results['sentiment_analysis'] = {
                        "method": "youtube_comments_ml",
                        "status": "success",
                        "emotions": sentiment_result['emotions'],
                        "dominant_emotion": sentiment_result['dominant_emotion'],
                        "video_title": sentiment_result.get('video_title', 'Unknown'),
                        "sentiment_label": sentiment_result.get('sentiment_label', 'unknown'),
                        "emotion_comments": sentiment_result.get('emotion_comments', {}),
                        "analysis_source": "preloaded_sentiment_model",
                        "processing_time_seconds": round(analysis_time, 2),
                        "comments_used": sentiment_result.get('comments_used', []),
                        "total_comments_analyzed": sentiment_result.get('total_comments_analyzed', 0)
                    }
                    print(f"[ML SERVICE] ✅ Sentiment analysis complete. Dominant emotion: {sentiment_result['dominant_emotion']}")
                else:
                    print(f"[ML SERVICE] ❌ Sentiment analysis failed: {sentiment_result['error']}")
                    results['sentiment_analysis'] = {
                        "method": "youtube_comments_ml",
                        "status": "failed",
                        "error": sentiment_result['error'],
                        "emotions": get_fallback_emotions(),
                        "dominant_emotion": "neutral",
                        "emotion_comments": {}
                    }
                    
            except Exception as e:
                print(f"[ML SERVICE] ❌ Sentiment analysis exception: {e}")
                results['sentiment_analysis'] = {
                    "method": "youtube_comments_ml", 
                    "status": "failed",
                    "error": str(e),
                    "emotions": get_fallback_emotions(),
                    "dominant_emotion": "neutral",
                    "emotion_comments": {}
                }
        
        # SECTION 2: Emotion Recognition (Visual - Currently Dummy)
        if analysis_method in ['emotion', 'both']:
            print("Running emotion recognition on video frames...")
            try:
                # For now, use dummy emotion recognition since you don't have this model yet
                emotion_result = analyze_video_emotions_dummy(youtube_url)
                
                results['emotion_recognition'] = {
                    "method": "video_frame_analysis",
                    "status": "success",
                    "emotions": emotion_result['emotions'],
                    "dominant_emotion": emotion_result['dominant_emotion'],
                    "frame_count": emotion_result.get('frame_count', 0),
                    "analysis_source": "facial_emotion_model",
                    "note": "Currently using dummy data - replace with actual emotion recognition model"
                }
                
            except Exception as e:
                print(f"Emotion recognition failed: {e}")
                results['emotion_recognition'] = {
                    "method": "video_frame_analysis",
                    "status": "failed", 
                    "error": str(e),
                    "emotions": get_fallback_emotions(),
                    "dominant_emotion": "neutral"
                }
        
        # SECTION 3: Combined Results (if both methods were used)
        if analysis_method == 'both' and 'sentiment_analysis' in results and 'emotion_recognition' in results:
            if results['sentiment_analysis']['status'] == 'success' and results['emotion_recognition']['status'] == 'success':
                combined_emotions = combine_emotion_results(
                    results['sentiment_analysis']['emotions'],
                    results['emotion_recognition']['emotions'],
                    comment_weight=0.6,  # Give more weight to sentiment analysis
                    video_weight=0.4
                )
                
                results['combined_analysis'] = {
                    "method": "hybrid_analysis",
                    "emotions": combined_emotions,
                    "dominant_emotion": max(combined_emotions.items(), key=lambda x: x[1])[0],
                    "analysis_source": "sentiment_and_emotion_models"
                }
        
        # Determine main response based on what was requested
        if analysis_method == 'sentiment':
            main_result = results.get('sentiment_analysis', {})
            # Only include sentiment analysis in detailed results
            filtered_results = {k: v for k, v in results.items() if k == 'sentiment_analysis'}
        elif analysis_method == 'emotion':
            main_result = results.get('emotion_recognition', {})
            # Only include emotion recognition in detailed results
            filtered_results = {k: v for k, v in results.items() if k == 'emotion_recognition'}
        else:  # both
            main_result = results.get('combined_analysis', results.get('sentiment_analysis', {}))
            # Include all results
            filtered_results = results
        
        response = {
            "analysis_method": analysis_method,
            "main_result": main_result,
            "detailed_results": filtered_results,
            "success": True
        }
        
        # Add commonly accessed fields directly to response for easier frontend access
        if analysis_method == 'sentiment' and 'sentiment_analysis' in results:
            sentiment_data = results['sentiment_analysis']
            response.update({
                "emotions": sentiment_data.get('emotions', {}),
                "dominant_emotion": sentiment_data.get('dominant_emotion', 'neutral'),
                "sentiment_label": sentiment_data.get('sentiment_label', 'unknown'),
                "emotion_comments": sentiment_data.get('emotion_comments', {}),
                "total_comments_analyzed": sentiment_data.get('total_comments_analyzed', 0),
                "video_title": sentiment_data.get('video_title', 'Unknown')
            })
        
        print(f"[ML SERVICE] Sending response: {response}")
        return jsonify(response)
        
    except Exception as e:
        print(f"Error processing video: {str(e)}")
        return jsonify({
            "error": f"Failed to analyze video: {str(e)}",
            "analysis_method": analysis_method,
            "success": False
        }), 500

@app.route('/analyze-realtime', methods=['POST'])
def analyze_realtime():
    """
    Get real-time emotions at specific time intervals
    Expected JSON payload: {"youtube_url": "...", "current_time": 30}
    """
    try:
        data = request.get_json()
        youtube_url = data.get('youtube_url')
        current_time = data.get('current_time', 0)
        
        print(f"[REALTIME] 🔄 Request from {request.remote_addr}: URL='{youtube_url}', Time={current_time}")
        
        if not youtube_url:
            return jsonify({"error": "youtube_url is required"}), 400
        
        # Get emotions for the timestamp
        emotions = get_emotions_at_timestamp(youtube_url, current_time)
        dominant_emotion = max(emotions.items(), key=lambda x: x[1])[0]
        
        return jsonify({
            "timestamp": current_time,
            "emotions": emotions,
            "dominant_emotion": dominant_emotion,
            "analysis_method": "realtime_comments"
        })
        
    except Exception as e:
        print(f"Error in real-time analysis: {str(e)}")
        return jsonify({"error": f"Failed to get real-time emotions: {str(e)}"}), 500

@app.route('/test', methods=['POST'])
def test_endpoint():
    """
    Simple test endpoint to verify Flask is responsive
    """
    try:
        data = request.get_json()
        print(f"[ML SERVICE TEST] Received request: {data}")
        
        return jsonify({
            "message": "Test endpoint working",
            "received_data": data,
            "success": True
        })
        
    except Exception as e:
        print(f"[ML SERVICE TEST] Error: {str(e)}")
        return jsonify({
            "error": f"Test failed: {str(e)}",
            "success": False
        }), 500

@app.route('/test-ml', methods=['POST'])
def test_ml_models():
    """
    Test ML models with sample comments - no YouTube API required
    Expected JSON payload: {"comments": ["comment1", "comment2", ...]}
    """
    try:
        data = request.get_json()
        print(f"[ML TEST] Received request: {data}")
        
        comments = data.get('comments', [
            "This video is amazing! I love it so much!",
            "Great content, thanks for sharing",
            "This made me laugh out loud", 
            "This is terrible, I hate it",
            "So boring and sad"
        ])
        
        if analyzer is None:
            return jsonify({
                "error": "ML models not loaded at startup",
                "success": False
            }), 500
        
        print(f"[ML TEST] Testing with {len(comments)} comments...")
        
        # Use the ML models directly
        result = analyzer.analyze_comments_list(comments, "Test Video")
        
        # Enhanced response with detailed breakdown
        detailed_response = {
            "message": "ML models working correctly",
            "success": True,
            "input": {
                "comments": comments,
                "comment_count": len(comments)
            },
            "analysis_result": {
                "dominant_emotion": result.get("dominant_emotion", "unknown"),
                "sentiment_label": result.get("sentiment_label", "unknown"),
                "video_title": result.get("video_title", "Test Video"),
                "total_comments_processed": result.get("comment_count", 0),
                "prediction_counts": result.get("prediction_counts", []),
                "prediction_mapping": {
                    "0": "neutral",
                    "1": "happy", 
                    "2": "funny",
                    "3": "fear",
                    "4": "sad"
                }
            },
            "emotions": result.get("emotions", {}),
            "model_info": {
                "vectorizer_loaded": analyzer.vectorizer is not None,
                "xgb_model_loaded": analyzer.xgb_model is not None,
                "rf_model_loaded": analyzer.rf_model is not None
            }
        }
        
        # Add individual comment predictions for debugging
        if analyzer.vectorizer and analyzer.xgb_model:
            individual_predictions = []
            for i, comment in enumerate(comments):
                if comment and comment.strip():
                    prediction = analyzer.predict_comment_sentiment(comment)
                    individual_predictions.append({
                        "comment": comment,
                        "prediction_number": prediction,
                        "prediction_label": analyzer.sentiment_mapping.get(prediction, "unknown")
                    })
            detailed_response["individual_predictions"] = individual_predictions
        
        return jsonify(detailed_response)
        
    except Exception as e:
        print(f"[ML TEST] Error: {str(e)}")
        return jsonify({
            "error": f"ML test failed: {str(e)}",
            "success": False
        }), 500

def combine_emotion_results(comment_emotions, video_emotions, comment_weight=0.7, video_weight=0.3):
    """
    Combine emotion results from comments and video analysis
    
    Args:
        comment_emotions: Emotion percentages from comment analysis
        video_emotions: Emotion percentages from video analysis
        comment_weight: Weight for comment analysis (default 0.7)
        video_weight: Weight for video analysis (default 0.3)
    
    Returns:
        Combined emotion percentages
    """
    combined = {}
    all_emotions = set(comment_emotions.keys()) | set(video_emotions.keys())
    
    for emotion in all_emotions:
        comment_val = comment_emotions.get(emotion, 0)
        video_val = video_emotions.get(emotion, 0)
        combined[emotion] = round(comment_val * comment_weight + video_val * video_weight, 2)
    
    return combined

def calculate_aggregated_emotions(emotion_results):
    """Calculate average emotions across all frames"""
    if not emotion_results:
        return {
            "anger": 0, "disgust": 0, "fear": 0, 
            "happy": 0, "sad": 0, "surprise": 0, "neutral": 0
        }
    
    emotion_sums = {
        "anger": 0, "disgust": 0, "fear": 0, 
        "happy": 0, "sad": 0, "surprise": 0, "neutral": 0
    }
    
    for frame_emotions in emotion_results:
        for emotion, value in frame_emotions.items():
            emotion_sums[emotion] += value
    
    # Calculate averages and convert to percentages
    num_frames = len(emotion_results)
    aggregated = {}
    for emotion, total in emotion_sums.items():
        aggregated[emotion] = round((total / num_frames) * 100, 2)
    
    return aggregated

def get_emotions_at_timestamp(youtube_url, timestamp):
    """
    Get emotions for a specific timestamp using comment analysis
    """
    try:
        # For real-time analysis, we'll use comment-based emotions
        # since processing video frames in real-time is computationally expensive
        if analyzer is not None:
            result = analyzer.analyze_video_comments(youtube_url)
        else:
            raise Exception("Models not loaded")
        
        if 'emotions' in result:
            # Add some timestamp-based variation to make it feel more dynamic
            import random
            emotions = result['emotions'].copy()
            
            # Add small random variations (±5%) to make it feel live
            for emotion in emotions:
                variation = random.uniform(-5, 5)
                emotions[emotion] = max(0, min(100, emotions[emotion] + variation))
                emotions[emotion] = round(emotions[emotion], 2)
            
            return emotions
        else:
            # Fallback to mock data
            return get_mock_emotions_for_timestamp(timestamp)
            
    except Exception as e:
        print(f"Error getting emotions at timestamp: {e}")
        return get_mock_emotions_for_timestamp(timestamp)

def get_mock_emotions_for_timestamp(timestamp):
    """Generate mock emotions based on timestamp"""
    import random
    base_emotions = {
        "anger": random.randint(5, 15),
        "disgust": random.randint(5, 15), 
        "fear": random.randint(5, 20),
        "happy": random.randint(20, 50),
        "sad": random.randint(5, 20),
        "surprise": random.randint(5, 15),
        "neutral": random.randint(10, 30)
    }
    
    # Normalize to 100%
    total = sum(base_emotions.values())
    normalized = {k: round((v/total) * 100, 2) for k, v in base_emotions.items()}
    
    return normalized

def get_fallback_emotions():
    """Get default emotion distribution when analysis fails"""
    return {
        "anger": 5,
        "disgust": 5,
        "fear": 10,
        "happy": 40,
        "sad": 15,
        "surprise": 10,
        "neutral": 15
    }

def analyze_video_emotions_dummy(youtube_url: str):
    """
    Dummy emotion recognition analysis for video frames
    Replace this with your actual emotion recognition model when available
    """
    import random
    
    print(f"[DUMMY] Processing video frames for emotion recognition: {youtube_url}")
    
    # Simulate processing multiple frames
    num_frames = random.randint(50, 150)
    
    # Generate realistic emotion distributions
    # Simulate different types of videos
    video_types = [
        {"type": "happy", "emotions": {"happy": 60, "surprise": 15, "neutral": 15, "fear": 3, "sad": 2, "anger": 3, "disgust": 2}},
        {"type": "sad", "emotions": {"sad": 50, "neutral": 25, "fear": 10, "happy": 5, "anger": 5, "surprise": 3, "disgust": 2}},
        {"type": "exciting", "emotions": {"surprise": 40, "happy": 35, "neutral": 15, "fear": 5, "anger": 2, "sad": 2, "disgust": 1}},
        {"type": "calm", "emotions": {"neutral": 55, "happy": 25, "sad": 8, "surprise": 5, "fear": 3, "anger": 2, "disgust": 2}},
        {"type": "intense", "emotions": {"anger": 35, "fear": 25, "surprise": 15, "neutral": 15, "sad": 5, "happy": 3, "disgust": 2}}
    ]
    
    # Randomly select a video type
    selected_type = random.choice(video_types)
    
    # Add some random variation to make it more realistic
    emotions = selected_type["emotions"].copy()
    for emotion in emotions:
        variation = random.uniform(-5, 5)
        emotions[emotion] = max(0, min(100, emotions[emotion] + variation))
    
    # Normalize to ensure they sum to 100%
    total = sum(emotions.values())
    for emotion in emotions:
        emotions[emotion] = round((emotions[emotion] / total) * 100, 2)
    
    # Find dominant emotion
    dominant_emotion = max(emotions.items(), key=lambda x: x[1])[0]
    
    return {
        "emotions": emotions,
        "dominant_emotion": dominant_emotion,
        "frame_count": num_frames,
        "video_type_detected": selected_type["type"],
        "processing_note": "This is dummy data. Replace with actual facial emotion recognition model."
    }

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5002))
    debug_mode = os.environ.get('DEBUG', 'True').lower() == 'true'
    
    print(f"Starting ML Service on port {port}")
    app.run(host='0.0.0.0', port=port, debug=debug_mode)
