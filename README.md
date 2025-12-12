# Overview

HomeNetAI is a full-stack smart home dashboard that combines real-time weather monitoring, smart device management, Raspberry Pi Pico IoT integration, and AI insights into a unified platform.

**What HomeNetAI Does:**
- **Monitor Weather** - Track real-time weather data and forecasts for multiple locations
- **Control Smart Devices** - Manage thermostats, lights, sensors, and other smart home devices
- **Connect IoT Hardware** - Integrate Raspberry Pi Pico devices for real sensor data (temperature, humidity, pressure)
- **Get AI Insights** - Chat with an AI assistant powered by Google Gemini that understands your home's data
- **Analyze Trends** - View ML-powered analytics with trend detection and anomaly alerts

## How to Use

### Quick Start

1. **Install Prerequisites**
   - PostgreSQL database
   - Python 3.8+
   - Node.js 18+

2. **Setup Backend**
   ```bash
   cd Fall_25_HomeNetAI
   pip install -r requirements.txt
   cd backend
   python start_backend.py
   ```
   Backend runs at: http://localhost:8000

3. **Setup Frontend**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```
   Frontend runs at: http://localhost:8080

### Raspberry Pi Pico Setup

**Prerequisites:**
- Raspberry Pi Pico W (with WiFi)
- USB cable
- `pico-setup.exe` tool (from `pico-pi/cmd/pico-setup`)

**Step-by-Step Setup:**

1. **Run the Pico Setup Tool**
   ```bash
   cd ./pico-pi/cmd/pico-setup
   ./pico-setup.exe
   ```

2. **Login with Your Credentials**
   - Enter your HomeNetAI username and password
   - The tool authenticates against the cloud Pico API

3. **Connect Your Pico Device**
   - Pico broadcasts an Access Point (AP)
   - Connect to the Pico's WiFi network from your computer
   - The setup tool sends your WiFi credentials and user ID

4. **Automatic Device Registration**
   - Pico receives credentials and restarts
   - Connects to your WiFi network
   - Automatically registers with the Pico API
   - Registers sensor modules (thermostat, weather sensors)
   - Starts sending sensor data every 5 seconds

5. **View Your Pico Devices**
   - Navigate to http://localhost:8080/pico-devices
   - Your registered Pico devices appear automatically

**Using Pico Devices:**
- **Send Commands** - Click "Send Command" to run `BLINK_PICO1` (blinks onboard LED)
- **Change WiFi** - Click "Change WiFi" to update network settings for all devices
- **View Readings** - Click ⚡ to see temperature, humidity, and pressure data

**Pico Architecture:**
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
```

**Cloud Pico API:** https://iot-picopi-module.onrender.com/api/v1

### Features

- **User Authentication** - Register and login with JWT tokens
- **Location Management** - Add and manage weather locations
- **Real-Time Weather** - Current weather and 7-day forecasts
- **Smart Home Devices** - Add and control smart devices
- **Raspberry Pi Pico Integration** - Connect and manage Pico devices
- **Device Commands** - Send commands to Pico devices (blink LED, change WiFi)
- **Sensor Readings** - View real-time temperature, humidity, and pressure data
- **AI Chatbot** - Context-aware AI assistant using Google Gemini
- **ML Analytics** - Trend analysis and anomaly detection with scikit-learn
- **Weather Scheduler** - Automatic weather data collection

### API Endpoints

**Authentication:**
- `POST /auth/register` - Create account
- `POST /auth/login` - Login
- `GET /auth/me` - Get current user

**Locations:**
- `GET /locations/search?query={city}` - Search cities
- `GET /locations` - Get your locations
- `POST /locations` - Add location
- `DELETE /locations/{id}` - Delete location

**Weather:**
- `GET /weather/{location_id}` - Get weather data

**Devices:**
- `GET /devices` - Get your devices
- `POST /devices` - Add device
- `PUT /devices/{id}` - Update device
- `DELETE /devices/{id}` - Delete device

**Pico Devices (via Proxy):**
- `GET /proxy/pico/users/{user_id}/device-modules` - Get all Pico devices
- `POST /proxy/pico/commands` - Send command to Pico device
- `GET /proxy/pico/device-modules/{module_id}/latest` - Get latest sensor reading

**AI & Analytics:**
- `POST /ai/chat` - Chat with AI assistant
- `GET /ai/insights` - Get AI-generated insights
- `GET /analytics/trends/{location_id}` - Get trend analysis
- `GET /analytics/anomalies/{location_id}` - Get anomaly detection

[Software Demo Video](http://youtube.link.goes.here)

# Development Environment

**Tools Used:**
- VS Code - Primary IDE
- Git/GitHub - Version control and collaboration
- PostgreSQL - Relational database
- Postman - API testing

**Backend (Python):**
- FastAPI - Web framework
- Pydantic - Data validation
- google-generativeai - Gemini AI integration
- pandas, numpy, scikit-learn - ML/Analytics
- psycopg2 - PostgreSQL driver
- python-jose - JWT authentication

**Frontend (TypeScript/React):**
- React 18 - UI framework
- Vite - Build tool
- Tailwind CSS - Styling
- shadcn/ui - Component library
- React Router - Navigation

**IoT (Go/MicroPython):**
- Raspberry Pi Pico W
- MicroPython firmware
- Go - Pico setup tool

# Collaborators

| Name | Role | Contributions |
|------|------|---------------|
| Ethan | Developer | AI/ML integration, Analytics, Dashboard charts, Chatbot |
| Nathan Luckock | Developer | Dashboard redesign, Login system, Documentation |
| Ian McMaster | Developer | Repository setup, GitHub project board, License |
| Moroni Motta | Developer | Pico module, Devices page, Dashboard weather |
| Joshua Chapman | Developer | Branch merging, Dev integration |
| Tyler Burdett | Developer | Settings page, Backend routes |

# Useful Websites

* [FastAPI Documentation](https://fastapi.tiangolo.com/)
* [React Documentation](https://react.dev/)
* [Open-Meteo Weather API](https://open-meteo.com/)
* [Google Gemini AI](https://ai.google.dev/)
* [Tailwind CSS](https://tailwindcss.com/)
* [shadcn/ui Components](https://ui.shadcn.com/)
* [Raspberry Pi Pico Documentation](https://www.raspberrypi.com/documentation/microcontrollers/raspberry-pi-pico.html)
* [scikit-learn Documentation](https://scikit-learn.org/)

# Future Work

* Real Sensor Integration - Connect more physical IoT sensors beyond Pico
* Mobile App - React Native version for iOS/Android
* Energy Usage Predictions - ML model for predicting energy consumption
* Multi-user Household - Share devices and locations with family members
* Alert Notifications - Push notifications via ntfy.sh for weather alerts
* Historical Data Export - Download weather/sensor data as CSV
* Voice Control - Integration with Alexa or Google Assistant
* Automated Routines - "If temperature drops below X, turn on heater"
