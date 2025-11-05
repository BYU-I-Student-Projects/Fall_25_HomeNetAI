# HomeNetAI Weather API

A RESTful weather monitoring API with user authentication, dynamic location management, and real-time weather data.

## Features

- **User Authentication**: Secure registration and login with JWT tokens
- **Global Location Search**: Search and add any city worldwide via API
- **Real-Time Weather**: Current weather and 7-day forecasts via API endpoints
- **RESTful API**: Complete API for weather data and location management
- **Weather Scheduler**: Automatic weather data collection every 30 minutes

## Tech Stack

### Backend
- **FastAPI**: Modern Python web framework
- **PostgreSQL**: Robust relational database
- **Open-Meteo API**: Free weather and geocoding data
- **JWT**: Secure authentication

## Prerequisites

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

### 2. Install Dependencies

```bash
# Install Python dependencies
pip install -r requirements.txt

# Install frontend dependencies
cd frontend
npm install
cd ..
```

### 3. Start Everything

**Simple way - Use the start script:**
```bash
python start.py
```

This will start both backend and frontend automatically!

**Manual way:**
```bash
# Terminal 1 - Backend
cd backend
python start_backend.py

# Terminal 2 - Frontend
cd frontend
npm run dev
```

### 4. Access the Application

- **Frontend**: http://localhost:8080
- **Backend API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs
- **Interactive API**: http://localhost:8000/redoc

## Project Structure

```
Fall_25_HomeNetAI/
├── backend/
│   ├── main.py                 # FastAPI app & API endpoints
│   ├── start_backend.py        # Backend startup script
│   ├── database/
│   │   ├── database.py         # Database manager
│   │   └── schema.sql          # Database schema
│   └── weather/
│       └── weather_api.py      # Weather API integration
├── docs/
│   └── GroupProjectPlan.md     # Project documentation
├── requirements.txt            # Python dependencies
└── README.md                   # This file
```

## API Endpoints

### Authentication
- `POST /auth/register` - Register new user
- `POST /auth/login` - Login user
- `GET /auth/me` - Get current user info

### Locations
- `GET /locations/search?query={city}` - Search for locations
- `GET /locations` - Get user's saved locations
- `POST /locations` - Add new location
- `DELETE /locations/{id}` - Delete location

### Weather
- `GET /weather/{location_id}` - Get weather data for location

## Usage

1. **Register/Login**: Use the API endpoints to create an account or sign in
2. **Search Location**: Use `/locations/search` endpoint to search for cities
3. **Add Location**: Use `/locations` POST endpoint to add a location
4. **Get Weather**: Use `/weather/{location_id}` endpoint to get weather data
5. **Manage Locations**: Use `/locations/{id}` DELETE endpoint to remove locations

## Configuration

### Database Connection

Edit `backend/database/database.py`:
```python
self.connection_string = "postgresql://username:password@localhost:5432/homenet"
```

### Environment Variables (Optional)

Create `.env` in backend directory:
```
SECRET_KEY=your-secret-key-here
DATABASE_URL=postgresql://username:password@localhost/homenet
```

## Troubleshooting

### Backend Issues

**"ModuleNotFoundError"**
```bash
pip install -r requirements.txt
```

**"Database connection failed"**
- Ensure PostgreSQL is running
- Verify database credentials
- Check that database `homenet` exists

## Documentation

- [Setup Guide](docs/SETUP_GUIDE.md) - Detailed setup instructions
- [Team Setup](docs/TEAM_SETUP.md) - Quick start for team members
- [Project Status](docs/PROJECT_STATUS.md) - Current project state
- [Group Project Plan](docs/GroupProjectPlan.md) - Project planning docs

## Contributing

1. Create a feature branch
2. Make your changes
3. Test thoroughly
4. Submit a pull request

## License

See [LICENSE](LICENSE) file for details.

## 📚 Documentation

- **[Team Setup Guide](docs/TEAM_SETUP_GUIDE.md)** - Complete setup instructions for team members
- **[Quick Commands](docs/QUICK_COMMANDS.md)** - Quick reference for common tasks
- **[Project Plan](docs/GroupProjectPlan.md)** - Detailed project documentation

## Team

CSE 310 - Fall 2025 Group Project

---

**Happy Coding!**