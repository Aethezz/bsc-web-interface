"""
Setup Script for ML Service Integration
This script helps you set up the ML service with your trained models
"""

import os
import sys
import subprocess

def install_requirements():
    """Install Python requirements for the ML service"""
    print("Installing Python requirements...")
    try:
        subprocess.check_call([sys.executable, "-m", "pip", "install", "-r", "requirements.txt"])
        print("✅ Requirements installed successfully!")
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ Error installing requirements: {e}")
        return False

def check_models():
    """Check if trained models exist"""
    model_dir = "models"
    required_models = [
        "tfidf_vectorizer.joblib",
        "xgb_model.joblib", 
        "rf_model.joblib"
    ]
    
    if not os.path.exists(model_dir):
        print(f"📁 Creating {model_dir} directory...")
        os.makedirs(model_dir, exist_ok=True)
    
    missing_models = []
    for model in required_models:
        model_path = os.path.join(model_dir, model)
        if not os.path.exists(model_path):
            missing_models.append(model)
        else:
            print(f"✅ Found: {model}")
    
    if missing_models:
        print(f"❌ Missing models: {missing_models}")
        print("🔧 Run 'python train_models.py' to create demo models")
        print("📝 Or update train_models.py with your actual training code")
        return False
    else:
        print("✅ All required models found!")
        return True

def check_api_key():
    """Check if YouTube API key is configured"""
    api_key = os.getenv('YOUTUBE_API_KEY')
    if not api_key or api_key == 'YOUR_YOUTUBE_API_KEY_HERE':
        print("❌ YouTube API key not configured")
        print("🔧 Please update the .env file with your YouTube Data API key")
        return False
    else:
        print("✅ YouTube API key configured")
        return True

def test_imports():
    """Test if all required packages can be imported"""
    print("Testing package imports...")
    
    required_packages = [
        ('flask', 'Flask'),
        ('pandas', 'pandas'),
        ('numpy', 'numpy'),
        ('sklearn', 'scikit-learn'),
        ('xgboost', 'xgboost'),
        ('joblib', 'joblib'),
        ('googleapiclient', 'google-api-python-client'),
        ('cv2', 'opencv-python'),
        ('yt_dlp', 'yt-dlp')
    ]
    
    failed_imports = []
    
    for package, pip_name in required_packages:
        try:
            __import__(package)
            print(f"✅ {package}")
        except ImportError:
            print(f"❌ {package} (install with: pip install {pip_name})")
            failed_imports.append(pip_name)
    
    if failed_imports:
        print(f"\\n🔧 Install missing packages: pip install {' '.join(failed_imports)}")
        return False
    else:
        print("✅ All packages can be imported!")
        return True

def main():
    """Main setup function"""
    print("🚀 ML Service Setup")
    print("=" * 50)
    
    # Change to ML service directory
    if not os.path.exists('app.py'):
        ml_service_dir = 'ml-service'
        if os.path.exists(ml_service_dir):
            os.chdir(ml_service_dir)
            print(f"📁 Changed to {ml_service_dir} directory")
        else:
            print("❌ ML service directory not found")
            return
    
    # Check environment file
    if not os.path.exists('.env'):
        print("❌ .env file not found")
        print("🔧 Please create a .env file with your configuration")
        return
    
    # Load environment variables
    try:
        from dotenv import load_dotenv
        load_dotenv()
    except ImportError:
        print("📦 Installing python-dotenv...")
        subprocess.check_call([sys.executable, "-m", "pip", "install", "python-dotenv"])
        from dotenv import load_dotenv
        load_dotenv()
    
    # Run checks
    checks = [
        ("Dependencies", test_imports),
        ("Models", check_models), 
        ("API Key", check_api_key)
    ]
    
    all_passed = True
    
    for check_name, check_func in checks:
        print(f"\\n🔍 Checking {check_name}...")
        if not check_func():
            all_passed = False
    
    print("\\n" + "=" * 50)
    
    if all_passed:
        print("🎉 Setup complete! You can now start the ML service:")
        print("   python app.py")
        print("\\n🌐 The service will run on: http://localhost:5002")
        print("\\n📚 API Endpoints:")
        print("   GET  /health - Health check")
        print("   POST /analyze - Full video analysis") 
        print("   POST /analyze-realtime - Real-time emotions")
        
        print("\\n🔧 Usage Examples:")
        print("   Full analysis: POST /analyze {'youtube_url': '...', 'method': 'comments'}")
        print("   Real-time: POST /analyze-realtime {'youtube_url': '...', 'current_time': 30}")
        
    else:
        print("❌ Setup incomplete. Please fix the issues above.")
        
    print("\\n📝 Next Steps:")
    print("1. Make sure your backend is configured to use the ML service")
    print("2. Update your frontend to use the new analysis methods")
    print("3. Test the integration with a YouTube video")

if __name__ == "__main__":
    main()
