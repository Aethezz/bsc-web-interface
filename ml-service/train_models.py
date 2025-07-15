"""
Model Training Script - Your Exact Sentiment Analysis Pipeline
This script implements your exact training process from the notebook
"""

import pandas as pd
import numpy as np
from collections import Counter
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, accuracy_score
from sklearn.utils.class_weight import compute_class_weight
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.ensemble import RandomForestClassifier
from xgboost import XGBClassifier
from imblearn.pipeline import Pipeline
from imblearn.over_sampling import SMOTE
from imblearn.under_sampling import RandomUnderSampler
import joblib
import os
import warnings
warnings.filterwarnings("ignore", category=UserWarning)

def train_and_save_models():
    """
    Train your models using your exact training pipeline from the notebook
    """
    
    # STAGE 1: Comment Sentiment Classification Model (XGBoost)
    print("Loading dataset for comment sentiment classification...")
    print("=" * 60)
    
    try:
        # Load your actual comment dataset
        dataset = pd.read_csv('data/allcomments_labled.csv')
        print(f"✓ Loaded {len(dataset)} comments from allcomments_labled.csv")
        
        # Your exact data preparation
        X = dataset['text']
        y = dataset['sentiment']
        
        print(f"✓ Features: {len(X)} text comments")
        print(f"✓ Labels: {len(y)} sentiment labels")
        print(f"Sentiment distribution:\n{y.value_counts().sort_index()}")
        
    except Exception as e:
        print(f"❌ Error loading data: {e}")
        print("Please ensure allcomments_labled.csv is in the data/ directory")
        return None, None, None
    
    # Your exact TF-IDF setup
    print("\nCreating TF-IDF vectorizer...")
    vectorizer = TfidfVectorizer(max_features=30000, max_df=0.7, min_df=5, ngram_range=(1, 3))
    X_tfidf = vectorizer.fit_transform(X)
    print(f"✓ TF-IDF matrix shape: {X_tfidf.shape}")
    
    # Your exact train-test split
    X_train, X_test, y_train, y_test = train_test_split(X_tfidf, y, test_size=0.2, random_state=42)
    print(f"✓ Training set: {X_train.shape[0]} samples")
    print(f"✓ Test set: {X_test.shape[0]} samples")
    
    # Your exact class balancing pipeline
    print("\nApplying class balancing (SMOTE + RandomUnderSampler)...")
    undersample = RandomUnderSampler(sampling_strategy='majority', random_state=42)
    oversample = SMOTE(sampling_strategy='not majority', random_state=42)
    pipeline = Pipeline(steps=[('o', oversample), ('u', undersample)])
    
    X_train_balanced, y_train_balanced = pipeline.fit_resample(X_train, y_train)
    print(f"✓ Balanced training set: {X_train_balanced.shape[0]} samples")
    
    # Your exact class weights calculation
    class_weights = compute_class_weight(class_weight='balanced', classes=np.unique(y_train_balanced), y=y_train_balanced)
    class_weights_dict = dict(zip(np.unique(y_train_balanced), class_weights))
    print(f"✓ Class weights: {class_weights_dict}")
    
    # Your exact XGBoost model training
    print("\nTraining XGBoost model...")
    xgb_model = XGBClassifier(scale_pos_weight=class_weights_dict, random_state=42)
    xgb_model.fit(X_train_balanced, y_train_balanced)
    
    # Your exact evaluation
    y_pred = xgb_model.predict(X_test)
    print("\nXGBoost Classification Report:")
    print(classification_report(y_test, y_pred))
    accuracy = accuracy_score(y_test, y_pred)
    print(f"XGBoost Accuracy: {accuracy:.4f}")
    
    # STAGE 2: Final Sentiment Aggregation Model (Random Forest)
    print("\n" + "=" * 60)
    print("Training Random Forest aggregation model...")
    
    try:
        # Load your aggregation training data
        df = pd.read_csv('data/trainingimproved.csv')
        print(f"✓ Loaded {len(df)} samples from trainingimproved.csv")
        
        # Your exact feature preparation
        X_rf = df[['Count_0', 'Count_1', 'Count_2', 'Count_3', 'Count_4']]
        y_rf = df['Actual Sentiment']
        
        print(f"✓ RF Features shape: {X_rf.shape}")
        print(f"✓ RF Labels: {len(y_rf)} final sentiments")
        print(f"Final sentiment distribution:\n{y_rf.value_counts().sort_index()}")
        
        # Your exact RF train-test split
        X_rf_train, X_rf_test, y_rf_train, y_rf_test = train_test_split(X_rf, y_rf, test_size=0.2, random_state=42)
        
        # Your exact Random Forest model
        rf_model = RandomForestClassifier(random_state=42, class_weight='balanced')
        rf_model.fit(X_rf_train, y_rf_train)
        
        # Evaluate RF model
        y_rf_pred = rf_model.predict(X_rf_test)
        rf_accuracy = accuracy_score(y_rf_test, y_rf_pred)
        print(f"\nRandom Forest Classification Report:")
        print(classification_report(y_rf_test, y_rf_pred))
        print(f"Random Forest Accuracy: {rf_accuracy:.4f}")
        
    except Exception as e:
        print(f"❌ Error loading RF training data: {e}")
        print("Please ensure trainingimproved.csv is in the data/ directory")
        return None, None, None
    
    # Save all models
    print("\n" + "=" * 60)
    print("Saving models...")
    success = save_models(vectorizer, xgb_model, rf_model)
    
    if success:
        print("✅ Training completed successfully!")
        print("Your models are now ready for the ML service.")
        return vectorizer, xgb_model, rf_model
    else:
        print("❌ Failed to save models")
        return None, None, None

def save_models(vectorizer, xgb_model, rf_model, model_dir="models"):
    """
    Save trained models to files
    """
    try:
        # Create models directory
        os.makedirs(model_dir, exist_ok=True)
        
        # Save models
        joblib.dump(vectorizer, os.path.join(model_dir, "tfidf_vectorizer.joblib"))
        joblib.dump(xgb_model, os.path.join(model_dir, "xgb_model.joblib"))
        joblib.dump(rf_model, os.path.join(model_dir, "rf_model.joblib"))
        
        print(f"✓ Models saved successfully to {model_dir}/")
        print("  - tfidf_vectorizer.joblib")
        print("  - xgb_model.joblib") 
        print("  - rf_model.joblib")
        
        return True
        
    except Exception as e:
        print(f"❌ Error saving models: {str(e)}")
        return False

def load_and_test_models(model_dir="models"):
    """
    Load saved models and test them
    """
    try:
        # Load models
        vectorizer = joblib.load(os.path.join(model_dir, "tfidf_vectorizer.joblib"))
        xgb_model = joblib.load(os.path.join(model_dir, "xgb_model.joblib"))
        rf_model = joblib.load(os.path.join(model_dir, "rf_model.joblib"))
        
        print("✓ Models loaded successfully!")
        
        # Test with sample text
        test_text = "This is a great video, very funny!"
        text_tfidf = vectorizer.transform([test_text])
        prediction = xgb_model.predict(text_tfidf)[0]
        
        sentiment_mapping = {0: "neutral", 1: "happy", 2: "funny", 3: "fear", 4: "sad"}
        predicted_label = sentiment_mapping.get(prediction, "unknown")
        
        print(f"✓ Test prediction for '{test_text}': {prediction} ({predicted_label})")
        
        # Test RF model
        test_counts = [5, 10, 2, 1, 3]  # sample count array
        rf_prediction = rf_model.predict([test_counts])[0]
        rf_label = sentiment_mapping.get(rf_prediction, "unknown")
        print(f"✓ RF prediction for counts {test_counts}: {rf_prediction} ({rf_label})")
        
        return vectorizer, xgb_model, rf_model
        
    except Exception as e:
        print(f"❌ Error loading models: {str(e)}")
        return None, None, None
