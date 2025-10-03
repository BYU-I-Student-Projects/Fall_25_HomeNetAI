# HomeNetAI Weather Application

A professional full-stack weather monitoring web application with user authentication, dynamic location management, and comprehensive weather data collection for AI/ML analysis.

## ✨ Features

- **🔐 User Authentication**: Secure registration and login with JWT tokens
- **🌍 Global Location Search**: Search and add any city worldwide using Open-Meteo Geocoding API
- **🌤️ Real-Time Weather**: Current weather conditions and 7-day forecasts
- **📊 Professional Dashboard**: Clean, organized weather display with collapsible forecasts
- **🔄 Automatic Data Collection**: Background scheduler collects weather data every 30 minutes
- **📈 Historical Data**: Comprehensive weather data storage for AI/ML analysis
- **👥 Multi-User Support**: User-isolated data with secure authentication

## Tech Stack

### Backend
- **FastAPI**: Modern Python web framework
- **PostgreSQL**: Robust relational database
- **Open-Meteo API**: Free weather and geocoding data
- **JWT**: Secure authentication

### Frontend
- **React**: Modern UI library
- **TypeScript**: Type-safe JavaScript
- **Vite**: Fast build tool
- **Tailwind CSS**: Utility-first styling
- **Axios**: HTTP client

## Prerequisites

- **Node.js** (v18+): [Download](https://nodejs.org)
- **Python** (v3.8+): [Download](https://python.org)
- **PostgreSQL** (v12+): [Download](https://postgresql.org)

## Quick Start

### 1. Clone & Setup Database

```bash
# Clone repository
git clone <your-repo-url>
cd Fall_25_HomeNetAI

# Create PostgreSQL database
createdb homenet
```

### 2. Backend Setup

```bash
# Install Python dependencies
pip install -r requirements.txt

# Update database connection in backend/database/database.py
# Change line 12 to your PostgreSQL credentials:
# self.connection_string = "postgresql://username:password@localhost/homenet"

# Start backend server
cd backend
python start_backend.py
```

Backend will run at: **http://localhost:8000**
- API Docs: http://localhost:8000/docs
- Interactive API: http://localhost:8000/redoc
- Weather Scheduler: Automatically collects weather data every 30 minutes

### 3. Frontend Setup

```bash
# Install Node.js dependencies
cd frontend
npm install

# Start development server
npm run dev
# OR use the PowerShell script:
.\start.ps1
```

Frontend will run at: **http://localhost:5173**

## 🏗️ Project Structure

```
Fall_25_HomeNetAI/
├── backend/                    # Backend API & Services
│   ├── main.py                 # FastAPI app & API endpoints (332 lines)
│   ├── start_backend.py        # Backend startup script
│   ├── config.py               # Configuration settings
│   ├── database/               # Database Layer
│   │   ├── database.py         # Database manager with connection pooling
│   │   └── schema.sql          # PostgreSQL schema (4 tables)
│   ├── weather/                # Weather Services
│   │   ├── weather_api.py      # Open-Meteo API integration
│   │   └── scheduler.py        # Background weather data collection
│   ├── simulation/             # Simulation Tools
│   │   └── home_sim.py         # Smart home simulator
│   └── models/                 # Data models (ready for expansion)
├── frontend/                   # React Frontend
│   ├── src/
│   │   ├── pages/              # Page components
│   │   │   ├── Dashboard.tsx   # Main weather dashboard
│   │   │   ├── AddLocation.tsx # Location search & add
│   │   │   ├── Login.tsx       # User authentication
│   │   │   └── Register.tsx    # User registration
│   │   ├── services/           # API services
│   │   ├── contexts/           # React contexts (Auth)
│   │   └── App.tsx             # Main app component
│   └── package.json            # Frontend dependencies
├── docs/                       # Documentation
│   └── GroupProjectPlan.md     # Project documentation
├── requirements.txt            # Python dependencies
└── README.md                   # This file
```

## 🔌 API Endpoints

### 🔐 Authentication
- `POST /auth/register` - Register new user with email/password
- `POST /auth/login` - Login user (returns JWT token)
- `GET /auth/me` - Get current user info (requires JWT)

### 📍 Location Management
- `GET /locations/search?query={city}` - Search for locations worldwide
- `GET /locations` - Get user's saved locations
- `POST /locations` - Add new location (auto-fetches weather data)
- `DELETE /locations/{id}` - Delete location and all associated data

### 🌤️ Weather Data
- `GET /weather/{location_id}` - Get comprehensive weather data for location
- `GET /weather/{location_id}/forecast` - Get 7-day forecast
- `GET /weather/{location_id}/history` - Get historical weather data

### 📊 Data Collection
- **Automatic**: Weather data collected every 30 minutes via scheduler
- **Real-time**: Data fetched immediately when location is added
- **Comprehensive**: 9 weather parameters per hour for 7 days

## 🚀 Usage

1. **🔐 Register/Login**: Create an account or sign in with existing credentials
2. **🔍 Search Location**: Click "Add Location" and search for any city worldwide
3. **➕ Add to Dashboard**: Select a city from search results (weather data auto-fetched)
4. **📊 View Weather**: See current weather and 7-day forecast on clean dashboard
5. **🗑️ Manage Locations**: Delete locations you no longer need
6. **📈 Data Collection**: Weather data automatically collected every 30 minutes

## ⚙️ Configuration

### 🗄️ Database Connection

Edit `backend/database/database.py`:
```python
self.connection_string = "postgresql://username:password@localhost:5432/homenet"
```

### 🔧 Environment Variables (Optional)

Create `.env` in backend directory:
```
SECRET_KEY=your-secret-key-here
DATABASE_URL=postgresql://username:password@localhost/homenet
```

### 📊 Database Schema

**4 Professional Tables:**
- `users` - User accounts with secure authentication
- `user_locations` - User's saved locations with GPS coordinates  
- `weather_data` - Hourly weather data (9 parameters per hour)
- `daily_weather` - Daily weather summaries for analysis

**Data Collection:**
- **Real-time**: Immediate weather fetch when location added
- **Scheduled**: Every 30 minutes for all user locations
- **Comprehensive**: 9 weather parameters × 168 hours = 1,512 data points per location per week

## 🔧 Troubleshooting

### 🐍 Backend Issues

**"ModuleNotFoundError"**
```bash
pip install -r requirements.txt
```

**"Database connection failed"**
- Ensure PostgreSQL is running
- Verify database credentials in `backend/database/database.py`
- Check that database `homenet` exists
- Run `python setup_postgresql.py` to create database

**"Weather API timeout"**
- Check internet connection
- Open-Meteo API is free but has rate limits
- Scheduler will retry failed collections

### ⚛️ Frontend Issues

**"npm not recognized"**
- Install Node.js from [nodejs.org](https://nodejs.org)
- Restart terminal after installation

**"Cannot find module"**
```bash
cd frontend
npm install
```

**CORS errors**
- Ensure backend is running on port 8000
- Check frontend is running on port 5173
- Verify API endpoints are accessible

## 📚 Documentation

- **[Group Project Plan](docs/GroupProjectPlan.md)** - Detailed project documentation
- **API Documentation**: Available at `http://localhost:8000/docs` when backend is running
- **Database Schema**: See `backend/database/schema.sql` for table definitions

## 🎯 Key Features Summary

### ✅ **What's Working:**
- **User Authentication**: Secure JWT-based login/registration
- **Location Management**: Global city search and management
- **Weather Data**: Real-time current weather and 7-day forecasts
- **Data Collection**: Automatic 30-minute weather data collection
- **Database**: Professional PostgreSQL schema with 4 tables
- **Frontend**: Clean, responsive React dashboard
- **API**: RESTful endpoints with comprehensive error handling

### 🔄 **Data Flow:**
1. User adds location → Weather data fetched immediately
2. Scheduler runs every 30 minutes → Collects data for all locations
3. Frontend displays real-time weather → From database cache
4. Historical data stored → Ready for AI/ML analysis

### 📊 **Database Stats:**
- **4 Tables**: users, user_locations, weather_data, daily_weather
- **Data Volume**: ~1,500 data points per location per week
- **Collection**: Every 30 minutes automatically
- **Storage**: PostgreSQL with proper indexing and relationships

## 👥 Team

**CSE 310 - Fall 2025 Group Project**

---

**🚀 Ready for AI/ML Integration!**