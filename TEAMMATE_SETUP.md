# Team Setup Guide

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
cd backend && python start_backend.py

# 5. Start frontend (new terminal)
cd frontend && npm run dev
```

### Access
- **Frontend**: http://localhost:5173
- **Backend**: http://localhost:8000

## Register & Use

1. **Open**: http://localhost:5173
2. **Register**: Click "Create Account"
3. **Login**: Use your credentials
4. **Add Location**: Search and add cities
5. **View Weather**: Real-time data displays

## Troubleshooting

- **Backend won't start**: Check PostgreSQL is running
- **Frontend won't load**: Check Node.js is installed
- **Can't register**: Check backend is running
- **No weather data**: Check database connection
