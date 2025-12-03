# HomeNetAI - Smart Home Weather Dashboard

A full-stack smart home dashboard with weather monitoring, device management, and AI insights.

## What You Need First

Before you start, you need:
1. **PostgreSQL** - Database (see [Database Setup Guide](docs/DATABASE_SETUP.md))
2. **Python** 3.8+ - For the backend
3. **Node.js** 18+ - For the frontend

## Quick Start

### Step 1: Install PostgreSQL and Create Database

**Follow the complete guide:** [Database Setup Guide](docs/DATABASE_SETUP.md)

Quick version:
1. Install PostgreSQL from https://www.postgresql.org/download/
2. Create a database named `homenet`
3. Update your password in `config.py`

### Step 2: Install Backend Dependencies

### Setup
```bash
# Navigate to project folder
cd Fall_25_HomeNetAI

# Install Python packages
pip install -r requirements.txt
```

### Step 3: Configure Database

1. Open `config.py`
2. Change this line with your PostgreSQL password:
   ```python
   DATABASE_URL: str = os.getenv("DATABASE_URL", "postgresql://postgres:YOUR_PASSWORD@localhost/homenet")
   ```

### Step 4: Start Backend

```bash
cd backend
python start_backend.py

Backend will run at: **http://localhost:8000**
- API Docs: http://localhost:8000/docs

### Step 5: Start Frontend

Open a **new terminal window**:

```bash
cd frontend
npm install
npm run dev
```

Frontend will run at: **http://localhost:8080**

## Features

- ✅ **User Authentication** - Register and login
- ✅ **Location Management** - Add and manage weather locations
- ✅ **Real-Time Weather** - Current weather and forecasts
- ✅ **Smart Home Devices** - Add and control smart devices
- ✅ **Weather Scheduler** - Automatic weather data collection

## Project Structure

```
Fall_25_HomeNetAI/
├── backend/              # Python FastAPI backend
│   ├── main.py          # Main API server
│   ├── start_backend.py # Start script
│   ├── routes/          # API endpoints
│   ├── database/        # Database setup
│   └── weather/         # Weather API integration
├── frontend/            # React TypeScript frontend
│   ├── src/
│   │   ├── pages/       # Page components
│   │   ├── components/ # UI components
│   │   └── services/    # API services
│   └── package.json
├── docs/                # Documentation
└── config.py           # Configuration file
```

## API Endpoints

### Authentication
- `POST /auth/register` - Create account
- `POST /auth/login` - Login
- `GET /auth/me` - Get current user

### Locations
- `GET /locations/search?query={city}` - Search cities
- `GET /locations` - Get your locations
- `POST /locations` - Add location
- `DELETE /locations/{id}` - Delete location

### Weather
- `GET /weather/{location_id}` - Get weather data

### Devices
- `GET /devices` - Get your devices
- `POST /devices` - Add device
- `PUT /devices/{id}` - Update device
- `DELETE /devices/{id}` - Delete device

## Troubleshooting

### Backend won't start
- Check PostgreSQL is running
- Verify database `homenet` exists
- Check password in `config.py` is correct
- See [Database Setup Guide](docs/DATABASE_SETUP.md) for details

### Frontend won't start
- Run `npm install` in the frontend folder
- Make sure Node.js is installed

### "Cannot connect to backend"
- Make sure backend is running (Step 4)
- Check backend is at http://localhost:8000

## Documentation

- **[Database Setup Guide](docs/DATABASE_SETUP.md)** - Complete step-by-step database setup
- **[Quick Commands](docs/QUICK_COMMANDS.md)** - Common commands reference
- **[Next Steps](docs/NEXT_STEPS.md)** - What to work on next
- **[Project Plan](docs/GroupProjectPlan.md)** - Project overview

## Team

CSE 310 - Fall 2025 Group Project

---

**Need help?** Check the [Database Setup Guide](docs/DATABASE_SETUP.md) for detailed step-by-step instructions.
