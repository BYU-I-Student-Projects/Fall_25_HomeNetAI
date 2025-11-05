# HomeNetAI Quick Commands

Quick reference for common development tasks.

## 🚀 Start Everything

### Backend
```bash
cd backend
python start_backend.py
```

## 🔧 Setup Commands

### First Time Setup
```bash
# Clone repository
git clone <repo-url>
cd Fall_25_HomeNetAI

# Backend setup
pip install -r requirements.txt
```

### Database Setup
```bash
# Create database
psql -U postgres
CREATE DATABASE homenet;
\q
```

## 🛠️ Development Commands

### Backend
```bash
# Start backend
cd backend
python start_backend.py

# Install new Python package
pip install package-name
pip freeze > requirements.txt
```


## 🔍 Debugging Commands

### Check if Running
```bash
# Backend
curl http://localhost:8000

# Database
psql -U postgres -h localhost -d homenet -c "SELECT 1;"
```

### Kill Processes
```bash
# Kill port 8000 (backend)
netstat -ano | findstr :8000
taskkill /PID <PID> /F
```

## 📊 Database Commands

### Connect to Database
```bash
psql -U postgres -h localhost -d homenet
```

### Useful Queries
```sql
-- See all users
SELECT * FROM users;

-- See all locations
SELECT * FROM user_locations;

-- See weather data
SELECT * FROM weather_data LIMIT 10;

-- See daily weather
SELECT * FROM daily_weather LIMIT 10;
```

## 🚨 Common Fixes

### "Database connection failed"
```bash
# Start PostgreSQL service
# Windows: Services → PostgreSQL → Start
# Check connection: psql -U postgres
```

### "Port already in use"
```bash
# Find and kill process
netstat -ano | findstr :8000
taskkill /PID <PID> /F
```

## 📱 Access URLs

- **Backend API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs
- **Interactive API**: http://localhost:8000/redoc

## 🔄 Daily Workflow

1. **Start Backend**: `cd backend && python start_backend.py`
2. **Code Changes**: Auto-reload enabled
3. **Test API**: http://localhost:8000/docs
