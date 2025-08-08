import pandas as pd
import numpy as np
from collections import Counter
from googleapiclient.discovery import build
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.ensemble import RandomForestClassifier
from xgboost import XGBClassifier
import joblib
import os
import time
import ssl
from typing import Dict, List, Tuple
import warnings
warnings.filterwarnings("ignore", category=UserWarning)

class YouTubeCommentAnalyzer:
    def __init__(self, api_key: str, model_dir: str = "models"):
        """
        Initialize the YouTube comment analyzer
        
        Args:
            api_key: YouTube Data API key
            model_dir: Directory containing saved models
        """
        self.api_key = api_key
        self.model_dir = model_dir
        self.youtube = build('youtube', 'v3', developerKey=api_key)
        
        # Initialize models (will be loaded)
        self.vectorizer = None
        self.xgb_model = None
        self.rf_model = None
        
        # Load models if they exist
        self.load_models()
        
        # Sentiment mapping
        self.sentiment_mapping = {
            0: "neutral",
            1: "happy",
            2: "funny", 
            3: "fear",
            4: "sad"
        }
    
    def load_models(self):
        """Load trained models from saved files"""
        try:
            vectorizer_path = os.path.join(self.model_dir, "tfidf_vectorizer.joblib")
            xgb_path = os.path.join(self.model_dir, "xgb_model.joblib")
            rf_path = os.path.join(self.model_dir, "rf_model.joblib")
            
            if os.path.exists(vectorizer_path):
                self.vectorizer = joblib.load(vectorizer_path)
                print("TF-IDF vectorizer loaded successfully")
            
            if os.path.exists(xgb_path):
                self.xgb_model = joblib.load(xgb_path)
                print("XGBoost model loaded successfully")
            
            if os.path.exists(rf_path):
                self.rf_model = joblib.load(rf_path)
                print("Random Forest model loaded successfully")
                
        except Exception as e:
            print(f"Error loading models: {str(e)}")
            print("Models will need to be retrained or saved properly")
    
    def save_models(self, vectorizer, xgb_model, rf_model):
        """Save trained models to files"""
        try:
            os.makedirs(self.model_dir, exist_ok=True)
            
            joblib.dump(vectorizer, os.path.join(self.model_dir, "tfidf_vectorizer.joblib"))
            joblib.dump(xgb_model, os.path.join(self.model_dir, "xgb_model.joblib"))
            joblib.dump(rf_model, os.path.join(self.model_dir, "rf_model.joblib"))
            
            self.vectorizer = vectorizer
            self.xgb_model = xgb_model
            self.rf_model = rf_model
            
            print("Models saved successfully")
            
        except Exception as e:
            print(f"Error saving models: {str(e)}")
    
    def fetch_all_comments(self, video_id: str, max_results: int = 100) -> List[Dict]:
        """
        Fetch all comments for a YouTube video (will be sorted later by predict function)
        
        Args:
            video_id: YouTube video ID
            max_results: Maximum number of comments per request
            
        Returns:
            List of ALL comment dictionaries (unsorted, for sorting by predict function)
        """
        print(f"[ANALYZER] 📝 Fetching all comments for video ID: {video_id}")
        comments = []
        next_page_token = None
        pages_fetched = 0
        max_pages = 10  # Fetch more pages to get better selection

        # Fetch all available comments (let predict function sort and limit)
        while pages_fetched < max_pages:
            try:
                print(f"[ANALYZER] 📄 Fetching page {pages_fetched + 1} of comments...")
                response = self.youtube.commentThreads().list(
                    part='snippet',
                    videoId=video_id,
                    pageToken=next_page_token,
                    maxResults=max_results,
                    textFormat='plainText'
                ).execute()
                
                # Process this page's comments
                page_comments = []
                for item in response['items']:
                    comment = item['snippet']['topLevelComment']['snippet']
                    page_comments.append({
                        'author': comment['authorDisplayName'],
                        'text': comment['textDisplay'],
                        'like_count': comment['likeCount'],
                        'published_at': comment['publishedAt'],
                        'video_id_verified': video_id  # Store video ID for verification
                    })
                
                comments.extend(page_comments)
                print(f"[ANALYZER] ✅ Page {pages_fetched + 1}: Found {len(page_comments)} comments for video {video_id} (total: {len(comments)})")
                
                next_page_token = response.get('nextPageToken')
                if not next_page_token:
                    break
                    
                pages_fetched += 1

            except Exception as e:
                print(f"[ANALYZER] ❌ Error fetching comments for video {video_id}: {e}")
                print(f"[ANALYZER] 🚫 Returning empty list to prevent cross-contamination with other videos")
                return []

        print(f"[ANALYZER] 🎯 Completed: Fetched {len(comments)} total comments for video {video_id}")
        
        # Final safety check - ensure all comments are tagged with correct video ID
        verified_comments = [c for c in comments if c.get('video_id_verified') == video_id]
        if len(verified_comments) != len(comments):
            print(f"[ANALYZER] 🚨 CRITICAL: Video ID mismatch detected! Expected {video_id}, found {len(comments) - len(verified_comments)} mismatched comments")
            print(f"[ANALYZER] 🚫 Returning only verified comments to prevent wrong video analysis")
        
        # Return ALL comments (sorting and limiting happens in predict function)
        return verified_comments
    
    def get_video_title(self, video_id: str) -> str:
        """Get YouTube video title with better error handling"""
        try:
            print(f"[ANALYZER] 🔍 Fetching title for video ID: {video_id}")
            request = self.youtube.videos().list(part="snippet", id=video_id)
            response = request.execute()
            
            if response.get("items") and len(response["items"]) > 0:
                title = response["items"][0]["snippet"]["title"]
                print(f"[ANALYZER] ✅ Video title retrieved: {title}")
                return title
            else:
                print(f"[ANALYZER] ⚠️ No video found for ID: {video_id}")
                return f"Video Not Found (ID: {video_id})"
        except Exception as e:
            print(f"[ANALYZER] ❌ Error getting video title: {e}")
            return f"Title Unavailable ({str(e)[:50]})"
    
    def predict_final_sentiment(self, video_id: str = None, comments: List[Dict] = None) -> Tuple[int, Dict[str, int], Dict[str, List]]:
        """
        Single function to predict sentiment using your exact approach
        
        Args:
            video_id: YouTube video ID (if fetching comments from YouTube)
            comments: List of comment dictionaries (if comments already available)
            
        Returns:
            Tuple of (predicted_sentiment, emotion_distribution, emotion_comments)
        """
        try:
            # If video_id provided, fetch comments from YouTube
            if video_id and not comments:
                print(f"[ANALYZER] 🎯 Starting sentiment prediction for video {video_id}")
                comments = self.fetch_all_comments(video_id)
            
            # If comments provided directly, use them
            elif comments and not video_id:
                print(f"[ANALYZER] 🎯 Starting sentiment prediction using provided comments")
                video_id = "provided_comments"
            
            if not comments:
                print(f"[ANALYZER] ❌ No comments available")
                return 0, self._get_default_emotions(), {}
            
            comments_df = pd.DataFrame(comments)
            sorted_comments = comments_df.sort_values(by='like_count', ascending=False)  # sorts comments by like value
            valid_predictions = []
            
            print(f"[ANALYZER] 📊 Processing {len(comments)} comments sorted by like count...")
            
            # Track comments by emotion for detailed breakdown
            emotion_comments = {
                "neutral": [],
                "happy": [],
                "funny": [],
                "fear": [],
                "sad": []
            }
            
            for index, row in sorted_comments.iterrows():
                if len(valid_predictions) == 30:  # only take top 30
                    break
                
                text = row['text']  # extract text
                text_tfidf = self.vectorizer.transform([text])  # TF-IDF
                prediction = self.xgb_model.predict(text_tfidf)[0]  # predict each comment
                
                # Debug: Print each comment's prediction
                print(f"[ANALYZER] 📝 Comment {len(valid_predictions)+1}: '{text[:50]}...' -> Prediction: {prediction} ({self.sentiment_mapping.get(prediction, 'unknown')})")
                
                if 0 <= prediction <= 4:
                    valid_predictions.append(int(prediction))
                    
                    # Store comment with its emotion classification
                    emotion_label = self.sentiment_mapping.get(prediction, "neutral")
                    comment_info = {
                        "text": text[:100] + "..." if len(text) > 100 else text,  # Truncate long comments
                        "like_count": row['like_count'],
                        "author": row.get('author', 'Unknown'),
                        "prediction": int(prediction)
                    }
                    emotion_comments[emotion_label].append(comment_info)
                    
                    # Debug: Show what's being stored
                    print(f"[ANALYZER] 💾 Stored in '{emotion_label}' category: {comment_info['text'][:30]}... (likes: {comment_info['like_count']})")
                else:
                    print(f"[ANALYZER] ❌ Invalid prediction {prediction} for comment, skipping")
            
            if not valid_predictions:
                return 0, self._get_default_emotions(), {}
            
            # Count predictions and use RF model (your exact approach)
            prediction_counts = Counter(valid_predictions)
            counts = [prediction_counts.get(i, 0) for i in range(0, 5)]  # count each and add to array
            
            # Debug: Show the counts before RF prediction
            print(f"[ANALYZER] 🔢 Individual predictions: {valid_predictions}")
            print(f"[ANALYZER] 📊 Prediction counts: {dict(prediction_counts)}")
            print(f"[ANALYZER] 🎯 Counts array for RF model: {counts}")
            print(f"[ANALYZER] 💭 Breakdown:")
            for i, count in enumerate(counts):
                emotion = self.sentiment_mapping.get(i, f"unknown_{i}")
                print(f"[ANALYZER]    {emotion}: {count} comments")
            
            # Show emotion_comments summary
            print(f"[ANALYZER] 📝 Comments by emotion summary:")
            for emotion, comment_list in emotion_comments.items():
                print(f"[ANALYZER]    {emotion}: {len(comment_list)} comments")
            
            predicted_sentiment = self.rf_model.predict([counts])[0]  # Final Predicted based on array
            
            # Debug: Show final RF prediction
            print(f"[ANALYZER] 🤖 Random Forest final prediction: {predicted_sentiment} ({self.sentiment_mapping.get(predicted_sentiment, 'unknown')})")
            
            # Convert to emotion distribution
            emotion_distribution = self._convert_to_emotions(prediction_counts, len(valid_predictions))
            
            print(f"[ANALYZER] ✅ Analysis complete: {len(valid_predictions)} top comments analyzed, prediction: {predicted_sentiment}")
            
            return int(predicted_sentiment), emotion_distribution, emotion_comments
            
        except Exception as e:
            print(f"Error predicting final sentiment: {e}")
            return 0, self._get_default_emotions(), {}
    
    def _convert_to_emotions(self, sentiment_counts: Counter, total_comments: int) -> Dict[str, int]:
        """
        Convert sentiment counts to emotion percentages (5 ML emotions only)
        
        Args:
            sentiment_counts: Counter of sentiment predictions
            total_comments: Total number of comments analyzed
            
        Returns:
            Dictionary with emotion percentages for 5 ML emotions
        """
        if total_comments == 0:
            return self._get_default_emotions()
        
        # Map sentiments to the 5 ML emotions only
        emotion_counts = {
            "neutral": sentiment_counts.get(0, 0),  # neutral
            "happy": sentiment_counts.get(1, 0),    # happy
            "funny": sentiment_counts.get(2, 0),    # funny  
            "fear": sentiment_counts.get(3, 0),     # fear
            "sad": sentiment_counts.get(4, 0),      # sad
        }
        
        # Convert to percentages
        emotion_percentages = {}
        for emotion, count in emotion_counts.items():
            emotion_percentages[emotion] = round((count / total_comments) * 100, 2)
        
        return emotion_percentages
    
    def _convert_predictions_to_emotions(self, predictions):
        """Convert sentiment predictions to emotion percentages (5 ML emotions only)"""
        # Count each sentiment label
        counts = [predictions.count(i) for i in range(5)]
        total = len(predictions)
        
        if total == 0:
            return self._get_default_emotions()
        
        # Convert counts to percentages and map to 5 ML emotions
        # Sentiment mapping: 0=neutral, 1=happy, 2=funny, 3=fear, 4=sad
        emotions = {
            "neutral": round((counts[0] / total) * 100, 2),
            "happy": round((counts[1] / total) * 100, 2),    
            "funny": round((counts[2] / total) * 100, 2),   
            "fear": round((counts[3] / total) * 100, 2),
            "sad": round((counts[4] / total) * 100, 2)
        }
        
        return emotions
    
    def _get_default_emotions(self):
        """Get default emotion distribution for 5 ML emotions"""
        return {
            "neutral": 20, 
            "happy": 30, 
            "funny": 15, 
            "fear": 15, 
            "sad": 20
        }
    
    def analyze_video_comments(self, video_url: str) -> Dict:
        """
        Analyze a YouTube video's comments for emotions
        
        Args:
            video_url: Full YouTube video URL
            
        Returns:
            Dictionary with analysis results including comments used
        """
        try:
            # Extract video ID from URL
            if "v=" in video_url:
                video_id = video_url.split("v=")[1].split("&")[0]
            elif "youtu.be/" in video_url:
                video_id = video_url.split("youtu.be/")[1].split("?")[0]
            else:
                raise ValueError("Invalid YouTube URL format")

            print(f"[ANALYZER] 🎬 Analyzing video ID: {video_id} from URL: {video_url}")

            # Get video title with better error handling
            title = self.get_video_title(video_id)
            print(f"[ANALYZER] 📹 Video title: {title}")
            
            # Fetch comments and use your exact prediction approach
            comments = self.fetch_all_comments(video_id, max_results=100)
            
            if not comments:
                return {
                    "error": f"Failed to fetch comments for video {video_id}",
                    "video_id": video_id,
                    "video_title": title,
                    "emotions": self._get_default_emotions(),
                    "dominant_emotion": "neutral",
                    "comments_used": [],
                    "total_comments_analyzed": 0
                }
            
            # Predict sentiment using your exact approach (sorts by likes, takes top 30)
            predicted_sentiment, emotion_distribution, emotion_comments = self.predict_final_sentiment(video_id=video_id, comments=comments)
            sentiment_label = self.sentiment_mapping.get(predicted_sentiment, "unknown")
            
            # Get comment texts for display (show top 20 from the prediction results)
            comments_df = pd.DataFrame(comments)
            sorted_comments = comments_df.sort_values(by='like_count', ascending=False)
            comment_texts = [row['text'] for index, row in sorted_comments.head(20).iterrows()]
            
            print(f"[ANALYZER] 💬 Successfully analyzed video {video_id} using top 30 most-liked comments")
            
            # Get dominant emotion
            dominant_emotion = max(emotion_distribution.items(), key=lambda x: x[1])[0]
            
            return {
                "video_id": video_id,
                "video_title": title,
                "predicted_sentiment": predicted_sentiment,
                "sentiment_label": sentiment_label,
                "dominant_emotion": dominant_emotion,
                "emotions": emotion_distribution,
                "emotion_comments": emotion_comments,  # New: comments by emotion
                "comments_used": comment_texts,  # Show top 20 comments for display
                "total_comments_analyzed": 30,  # Always 30 from your prediction method
                "analysis_method": "youtube_comments"
            }
            
        except Exception as e:
            print(f"[ANALYZER] ❌ Error analyzing video comments: {e}")
            return {
                "error": str(e),
                "emotions": self._get_default_emotions(),
                "dominant_emotion": "neutral",
                "analysis_method": "fallback"
            }
    
    def analyze_comments_list(self, comments_list: List[str], video_title: str = "Test Video") -> Dict:
        """
        Analyze a list of comments for emotions (for testing without YouTube API)
        
        Args:
            comments_list: List of comment strings
            video_title: Title for the video
            
        Returns:
            Dictionary with analysis results
        """
        try:
            if not comments_list:
                return {"error": "No comments provided"}
            
            if not self.vectorizer or not self.xgb_model or not self.rf_model:
                return {"error": "Models not loaded properly"}
            
            print(f"Analyzing {len(comments_list)} comments...")
            
            # Convert string list to comment dictionary format
            comments = []
            for i, comment_text in enumerate(comments_list):
                if comment_text and comment_text.strip():
                    comments.append({
                        'text': comment_text,
                        'like_count': 1,  # Default like count for test comments
                        'author': f'TestUser{i}',
                        'published_at': '2024-01-01',
                        'video_id_verified': 'test'
                    })
            
            if not comments:
                return {"error": "No valid comments provided"}
            
            # Use the single prediction function
            predicted_sentiment, emotion_distribution, emotion_comments = self.predict_final_sentiment(comments=comments)
            
            # Find the actual dominant emotion from the emotions dictionary
            dominant_emotion = max(emotion_distribution.items(), key=lambda x: x[1])[0]
            
            print(f"Processed {len(comments)} valid comments")
            print(f"Final sentiment: {predicted_sentiment} ({dominant_emotion})")
            
            return {
                "emotions": emotion_distribution,
                "emotion_comments": emotion_comments,  # New: comments by emotion
                "dominant_emotion": dominant_emotion,
                "sentiment_label": self.sentiment_mapping.get(predicted_sentiment, "unknown"),
                "video_title": video_title,
                "comment_count": len(comments),
                "prediction_counts": "calculated_internally"
            }
            
        except Exception as e:
            print(f"Error in comment analysis: {e}")
            return {"error": str(e)}

    def _youtube_api_call_with_retry(self, api_call_func, max_retries=3, delay=1):
        """
        Execute YouTube API call with retry mechanism for SSL errors
        
        Args:
            api_call_func: Function that makes the API call
            max_retries: Maximum number of retries
            delay: Delay between retries in seconds
            
        Returns:
            API response or None if all retries failed
        """
        for attempt in range(max_retries):
            try:
                print(f"[ANALYZER] 🔄 API call attempt {attempt + 1}/{max_retries}")
                response = api_call_func()
                print(f"[ANALYZER] ✅ API call successful on attempt {attempt + 1}")
                return response
                
            except ssl.SSLError as e:
                print(f"[ANALYZER] 🚨 SSL Error on attempt {attempt + 1}: {e}")
                if attempt < max_retries - 1:
                    print(f"[ANALYZER] 🔄 Retrying in {delay} seconds...")
                    time.sleep(delay)
                    delay *= 2  # Exponential backoff
                else:
                    print(f"[ANALYZER] ❌ All SSL retry attempts failed")
                    return None
                    
            except Exception as e:
                print(f"[ANALYZER] ❌ Non-SSL error on attempt {attempt + 1}: {e}")
                if "SSL" in str(e):
                    if attempt < max_retries - 1:
                        print(f"[ANALYZER] 🔄 SSL-related error, retrying in {delay} seconds...")
                        time.sleep(delay)
                        delay *= 2
                    else:
                        print(f"[ANALYZER] ❌ All SSL retry attempts failed")
                        return None
                else:
                    # Non-SSL error, don't retry
                    return None
        
        return None

# Helper function for easy integration
def analyze_youtube_comments(video_url: str, api_key: str) -> Dict:
    """
    Simple function to analyze YouTube video comments
    
    Args:
        video_url: YouTube video URL
        api_key: YouTube Data API key
        
    Returns:
        Analysis results dictionary
    """
    analyzer = YouTubeCommentAnalyzer(api_key)
    return analyzer.analyze_video_comments(video_url)
