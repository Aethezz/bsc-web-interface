# BSC Web Interface

A full-stack web application for YouTube video emotion analysis using machine learning.

## Project Structure

```
bsc-web-interface/
├── backend/          # Node.js/Express backend
├── frontend/         # React frontend  
├── ml-service/       # Python ML service
├── package.json      # Root dependencies
└── README.md
```

## Quick Setup

### Prerequisites
- Node.js (v16 or higher)
- Python (3.8 or higher)
- MongoDB
- YouTube Data API key

### Installation

1. **Clone and setup all dependencies:**
   ```bash
   git clone <your-repo>
   cd bsc-web-interface
   npm run setup
   ```

2. **Environment Configuration:**
   ```bash
   # Copy environment templates
   cp .env.example .env
   cp ml-service/.env.example ml-service/.env
   
   # Edit .env files with your actual values
   ```

3. **Start all services:**
   ```bash
   # Terminal 1: Backend
   npm run dev
   
   # Terminal 2: Frontend  
   npm run frontend
   
   # Terminal 3: ML Service
   npm run ml-service
   ```

## Environment Variables

### Backend (.env)
- `MONGO_URI`: MongoDB connection string
- `PORT`: Backend server port (default: 5000)

### ML Service (ml-service/.env)
- `YOUTUBE_API_KEY`: Your YouTube Data API key
- `ML_SERVICE_PORT`: ML service port (default: 5002)

## API Endpoints

### Backend (http://localhost:5000)
- `GET /api/videos` - Get all videos
- `POST /api/videos` - Create new video analysis

### ML Service (http://localhost:5002)
- `GET /health` - Health check
- `POST /analyze` - Full video analysis
- `POST /analyze-realtime` - Real-time emotion analysis

## Development

### Backend Development
```bash
cd backend
npm run dev  # Uses nodemon for auto-reload
```

### Frontend Development
```bash
cd frontend
npm run dev  # Vite dev server with hot reload
```

### ML Service Development
```bash
cd ml-service
python app.py  # Flask development server
```

## Troubleshooting

1. **Missing Models Error:**
   ```bash
   cd ml-service
   python train_models.py  # Create demo models
   ```

2. **MongoDB Connection Issues:**
   - Ensure MongoDB is running
   - Check MONGO_URI in .env file

3. **YouTube API Issues:**
   - Verify API key in ml-service/.env
   - Check API quota limits

## Contributing

1. Fork the repository
2. Create feature branch
3. Make changes
4. Test thoroughly
5. Submit pull request