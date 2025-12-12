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

## Raspberry Pi Pico Setup

### Prerequisites
- Raspberry Pi Pico W (with WiFi)
- USB cable
- `pico-setup.exe` tool (from TeamProject/iot-device/cmd/pico-setup)

### Step-by-Step Pico Setup

1. **Run the Pico Setup Tool**
   ```bash
   # Navigate to pico-setup directory
   cd ./pico-pi/cmd/pico-setup
   
   # Run the executable
   ./pico-setup.exe
   ```

2. **Login with Your Credentials**
   - Enter your HomeNetAI username
   - Enter your password
   - The tool will authenticate against the cloud Pico API

3. **Connect Your Pico Device**
   - Pico will broadcast an Access Point (AP)
   - Connect to the Pico's WiFi network from your computer
   - The setup tool will send:
     - Your WiFi credentials (SSID and password)
     - Your user ID

4. **Automatic Device Registration**
   - Pico receives credentials and restarts
   - Connects to your WiFi network
   - Automatically registers itself with the Pico API
   - Registers its sensor modules (thermostat, weather sensors)
   - Starts sending sensor data every 5 seconds

5. **View Your Pico Devices**
   - Go to http://localhost:8080/pico-devices
   - Your registered Pico devices will appear automatically
   - Each device shows:
     - Device name and ID
     - Creation and last update timestamps
     - Send Command button
     - Get Last Reading button (⚡)
     - WiFi Change button (at the top)

### Using Pico Devices on the Dashboard

**Send Commands:**
- Click "Send Command" on any device
- Available commands:
  - `BLINK_PICO1` - Blink the onboard LED (configurable repetitions and timing)
  - Custom commands can be added

**Change WiFi Settings:**
- Click "Change WiFi" button at the top
- Enter new SSID and password
- Command is sent to all Pico devices
- Devices will restart and connect to the new network

**View Sensor Readings:**
- Click the ⚡ (lightning) button on any device
- Latest sensor data displays below the device card:
  - Temperature (°F)
  - Humidity (%)
  - Pressure (hPa)
  - Last reading timestamp

### Pico Device Architecture

```
User → pico-setup.exe → Login (Cloud Pico API)
                      ↓
       Pico Device ← WiFi Credentials + User ID
                      ↓
       Connect to WiFi → Register Device (Cloud API)
                      ↓
       Register Modules → Start Sending Data
                      ↓
Dashboard ← Fetch Devices by user_id ← Cloud Pico API
       ↓
Send Commands / View Readings
```

**Cloud Pico API:** https://iot-picopi-module.onrender.com/api/v1

## Features

- ✅ **User Authentication** - Register and login
- ✅ **Location Management** - Add and manage weather locations
- ✅ **Real-Time Weather** - Current weather and forecasts
- ✅ **Smart Home Devices** - Add and control smart devices
- ✅ **Raspberry Pi Pico Integration** - Connect and manage Pico devices
- ✅ **Device Commands** - Send commands to Pico devices (blink LED, change WiFi)
- ✅ **Sensor Readings** - View real-time temperature, humidity, and pressure data
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

### Pico Devices (via Proxy)
- `GET /proxy/pico/users/{user_id}/device-modules` - Get all Pico devices
- `POST /proxy/pico/commands` - Send command to Pico device
- `GET /proxy/pico/device-modules/{module_id}/latest` - Get latest sensor reading

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
