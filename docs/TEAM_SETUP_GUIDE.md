# HomeNetAI Team Setup Guide

Complete setup instructions for team members to run the HomeNetAI weather application.

## 📋 Prerequisites

### Required Software:
- **Python** (3.8 or higher) - [Download here](https://python.org/downloads/)
- **PostgreSQL** - [Download here](https://postgresql.org/download/)
- **Git** - [Download here](https://git-scm.com/downloads)

### Verify Installation:
```bash
python --version  # Should show Python 3.8+
psql --version    # Should show PostgreSQL version
git --version     # Should show Git version
```

## 🚀 Quick Setup (5 Steps)

### Step 1: Clone the Repository
```bash
git clone <your-repo-url>
cd Fall_25_HomeNetAI
```

### Step 2: Setup Backend
```bash
# Install Python dependencies
pip install -r requirements.txt

# Setup PostgreSQL database
# 1. Open pgAdmin or command line
# 2. Create database named 'homenet'
# 3. Create user 'postgres' with password 'nathan-7108'
#    (or update config.py with your credentials)
```

### Step 3: Start Backend
```bash
# From project root
cd backend
python start_backend.py
```

## 🔧 Detailed Setup Instructions

### Backend Setup

#### 1. Python Environment
```bash
# Create virtual environment (recommended)
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# Mac/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

#### 2. Database Setup

**Option A: Using pgAdmin (GUI)**
1. Open pgAdmin
2. Right-click "Servers" → "Create" → "Server"
3. Name: `HomeNetAI`
4. Host: `localhost`
5. Port: `5432`
6. Username: `postgres`
7. Password: `nathan-7108`
8. Right-click "Databases" → "Create" → "Database"
9. Name: `homenet`

**Option B: Using Command Line**
```bash
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE homenet;

# Create user (if needed)
CREATE USER postgres WITH PASSWORD 'nathan-7108';
GRANT ALL PRIVILEGES ON DATABASE homenet TO postgres;

# Exit
\q
```

#### 3. Configure Database Connection
Edit `config.py` if your database credentials are different:
```python
DATABASE_URL: str = os.getenv("DATABASE_URL", "postgresql://postgres:YOUR_PASSWORD@localhost/homenet")
```

#### 4. Start Backend
```bash
cd backend
python start_backend.py
```

**Expected Output:**
```
HomeNetAI Backend + Weather Scheduler
==================================================
Starting Weather Data Scheduler...
Will collect weather data every 30 minutes
Data stored in PostgreSQL for AI/ML analysis
Starting FastAPI Backend Server...
Backend available at: http://localhost:8000
API Documentation: http://localhost:8000/docs
Interactive API: http://localhost:8000/redoc
--------------------------------------------------
```

## 🌐 Access the Application

### Backend (API)
- **URL**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs
- **Interactive API**: http://localhost:8000/redoc

## 🔍 Troubleshooting

### Common Issues


#### 2. Database Connection Error
**Problem**: PostgreSQL not running or wrong credentials
**Solution**:
```bash
# Start PostgreSQL service
# Windows: Services → PostgreSQL → Start
# Mac: brew services start postgresql
# Linux: sudo systemctl start postgresql

# Check connection
psql -U postgres -h localhost -d homenet
```

#### 3. Port Already in Use
**Problem**: Port 8000 already in use
**Solution**:
```bash
# Kill process using port
# Windows:
netstat -ano | findstr :8000
taskkill /PID <PID> /F

# Mac/Linux:
lsof -ti:8000 | xargs kill -9
```

#### 4. Python Module Not Found
**Problem**: Dependencies not installed
**Solution**:
```bash
# Make sure you're in the right directory
cd Fall_25_HomeNetAI

# Install requirements
pip install -r requirements.txt

# If using virtual environment, activate it first
venv\Scripts\activate  # Windows
source venv/bin/activate  # Mac/Linux
```


## 📁 Project Structure

```
Fall_25_HomeNetAI/
├── backend/                 # Python FastAPI backend
│   ├── database/           # Database management
│   ├── weather/            # Weather API and scheduler
│   ├── main.py            # FastAPI application
│   └── start_backend.py   # Backend startup script
├── docs/                  # Documentation
├── config.py              # Configuration
└── requirements.txt       # Python dependencies
```

## 🚀 Development Workflow

### Daily Development
1. **Start Backend**: `cd backend && python start_backend.py`
2. **Access API**: http://localhost:8000/docs

### Making Changes
- **Backend**: Changes auto-reload (uvicorn reload=True)
- **Database**: Changes require backend restart

### Testing
- **API**: Visit http://localhost:8000/docs
- **Database**: Use pgAdmin or psql

## 📞 Getting Help

### If You're Stuck:
1. **Check this guide** for common solutions
2. **Check terminal output** for error messages
3. **Verify all prerequisites** are installed
4. **Ask team members** for help

### Useful Commands:
```bash
# Check if backend is running
curl http://localhost:8000

# Check database connection
psql -U postgres -h localhost -d homenet -c "SELECT 1;"
```

## ✅ Success Checklist

- [ ] Python installed and working
- [ ] PostgreSQL installed and running
- [ ] Database 'homenet' created
- [ ] Backend starts without errors
- [ ] Can access http://localhost:8000/docs
- [ ] Can test API endpoints

## 🎯 Next Steps

Once everything is running:
1. **Test the API** at http://localhost:8000/docs
2. **Register** a new account using the API
3. **Add locations** using the API endpoints
4. **View weather data** using the weather endpoints

Welcome to the HomeNetAI team! 🎉
