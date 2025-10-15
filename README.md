# HomeNetAI

A smart home weather dashboard with real-time weather data and location management.

## Quick Start

### Prerequisites
- Node.js (v18+)
- Python (v3.8+)
- PostgreSQL (v12+)

### Setup
```bash
# 1. Clone repository
git clone <your-repo-url>
cd Fall_25_HomeNetAI

# 2. Create database
createdb homenet

# 3. Install dependencies
pip install -r requirements.txt
cd frontend && npm install && cd ..

# 4. Start backend
cd backend
python start_backend.py

# 5. Start frontend (new terminal)
cd frontend
npm run dev
```

### Access
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8000

## Features
- User registration and authentication
- Global location search and management
- Real-time weather data and forecasts
- Smart home device simulation
- AI-powered insights

## Usage
1. Register an account
2. Add locations by searching cities
3. View real-time weather data
4. Explore smart home features
5. Get AI insights and recommendations