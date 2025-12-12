# HomeNetAI

A smart home dashboard that combines real-time weather monitoring, intelligent device management, and AI-powered insights. HomeNetAI provides users with weather data for multiple locations, smart home device control, and personalized recommendations through a web interface.

## Overview

HomeNetAI is a web application designed to centralize smart home management and weather monitoring in one seamless platform. Users can register accounts, add multiple geographic locations to track weather conditions, manage smart home devices, and receive AI-generated insights based on their data.

### Key Features

- **Multi-Location Weather Tracking**: Search and add any city worldwide with real-time weather updates and 7-day forecasts
- **User Authentication**: Secure registration and login system with JWT token-based authentication
- **Smart Device Management**: Add, configure, and control various smart home devices (lights, thermostats, sensors)
- **AI-Powered Insights**: Integration with Google Gemini AI for personalized weather and device recommendations
- **Interactive Dashboard**: Clean, modern interface with weather cards, device controls, and data visualizations
- **Automated Data Collection**: Background scheduler that collects weather data every 30 minutes for historical analysis
- **Image Management**: Upload and store device images for better visual organization
- **Responsive Design**: Mobile-friendly interface built with Tailwind CSS and Radix UI components

### How to Use

1. **Register an Account**: Create your account on the registration page with username, email, and password
2. **Add Locations**: Search for cities worldwide and add them to track weather conditions
3. **Manage Devices**: Add your smart home devices (thermostats, lights, sensors) with custom configurations
4. **View Dashboard**: Monitor all your locations and devices from a centralized dashboard
5. **Explore AI Insights**: Get personalized recommendations based on weather patterns and device usage
6. **Check Weather Details**: View detailed forecasts, temperature trends, and weather alerts


## Development Environment

### Tools & Technologies

**Backend Development**
- **FastAPI** - Modern Python web framework for building REST APIs
- **PostgreSQL** - Robust relational database for data persistence
- **Uvicorn** - Lightning-fast ASGI server for running the FastAPI application
- **DBeaver/pgAdmin** - Database management and visualization tools

**Frontend Development**
- **Vite** - Next-generation frontend build tool for fast development
- **React Developer Tools** - Browser extension for debugging React components
- **VS Code** - Primary code editor with extensions for Python, TypeScript, and React

**Version Control & Collaboration**
- **Git** - Distributed version control system
- **GitHub** - Code hosting and collaboration platform
- **GitHub Actions** - CI/CD automation (planned for future deployment)

### Programming Languages & Libraries

**Backend (Python 3.8+)**
- `fastapi` (0.104.1) - Web framework and API routing
- `uvicorn` (0.24.0) - ASGI server implementation
- `psycopg2-binary` (2.9.10) - PostgreSQL database adapter
- `python-jose` (3.3.0) - JWT token creation and verification
- `pyJWT` (2.10.1) - JSON Web Token implementation
- `google-generativeai` (0.3.1+) - Google Gemini AI integration
- `requests` (2.32.5) - HTTP library for external API calls
- `aiohttp` (3.9.1) - Async HTTP client/server framework
- `python-dotenv` (1.0.0) - Environment variable management

**Frontend (TypeScript + React 18)**
- `react` (18.3.1) - UI library for building component-based interfaces
- `react-router-dom` (6.30.1) - Client-side routing
- `axios` - HTTP client for API communication (via api.ts service layer)
- `@tanstack/react-query` (5.83.0) - Server state management and caching
- `@radix-ui/*` - Accessible UI component primitives (30+ components)
- `tailwindcss` - Utility-first CSS framework
- `lucide-react` (0.462.0) - Icon library with 1000+ icons
- `recharts` (2.15.4) - Composable charting library for data visualization
- `react-hook-form` (7.61.1) - Form validation and management
- `date-fns` (3.6.0) - Date utility library
- `sonner` (1.7.4) - Toast notification system

**External APIs**
- **Open-Meteo API** - Free weather data and geocoding services
- **Google Gemini API** - AI model for generating insights and recommendations

## Quick Start

### Prerequisites
- PostgreSQL 12+
- Python 3.8+
- Node.js 18+

### Installation

```bash
# Clone repository
git clone https://github.com/BYU-I-Student-Projects/Fall_25_HomeNetAI.git
cd Fall_25_HomeNetAI

# Create PostgreSQL database
createdb homenet

# Install Python dependencies
pip install -r requirements.txt

# Install frontend dependencies
cd frontend
npm install
cd ..

# Configure database (edit config.py with your PostgreSQL password)
# DATABASE_URL: str = "postgresql://postgres:YOUR_PASSWORD@localhost/homenet"

# Start backend
cd backend
python start_backend.py

# Start frontend (in new terminal)
cd frontend
npm run dev
```

Access the application at `http://localhost:5173` (frontend) and `http://localhost:8000` (backend API).

## Project Structure

```
Fall_25_HomeNetAI/
├── backend/
│   ├── main.py              # FastAPI application and route registration
│   ├── start_backend.py     # Backend startup script
│   ├── config.py            # Configuration and environment variables
│   ├── routes/              # API endpoint modules
│   │   ├── auth.py          # Authentication endpoints
│   │   ├── locations.py     # Location management
│   │   ├── weather.py       # Weather data endpoints
│   │   ├── devices.py       # Smart device CRUD operations
│   │   ├── images.py        # Image upload and retrieval
│   │   └── ai.py            # AI insights generation
│   ├── database/
│   │   ├── database.py      # Database connection and queries
│   │   └── schema.sql       # PostgreSQL schema definitions
│   └── weather/
│       ├── weather_api.py   # Open-Meteo API integration
│       └── scheduler.py     # Background weather data collection
├── frontend/
│   ├── src/
│   │   ├── App.tsx          # Root component and routing
│   │   ├── main.tsx         # Application entry point
│   │   ├── pages/           # Page components
│   │   │   ├── Login.tsx
│   │   │   ├── Register.tsx
│   │   │   ├── Dashboard.tsx
│   │   │   ├── Locations.tsx
│   │   │   ├── AddLocation.tsx
│   │   │   └── SmartHome.tsx
│   │   ├── components/      # Reusable UI components
│   │   │   └── ui/          # Radix UI component wrappers
│   │   ├── services/
│   │   │   └── api.ts       # Axios API client
│   │   └── contexts/
│   │       └── AuthContext.tsx  # Authentication state management
│   ├── package.json
│   └── vite.config.ts
├── docs/                    # Project documentation
└── requirements.txt         # Python dependencies
```

## Collaborators

- Ethan
- Josh
- Moroni
- Nathan
- Tyler Burdett

## Useful Websites

- [FastAPI Documentation](https://fastapi.tiangolo.com/) - Comprehensive guide for building APIs with FastAPI
- [React Documentation](https://react.dev/) - Official React documentation and tutorials
- [Tailwind CSS](https://tailwindcss.com/docs) - Utility-first CSS framework documentation
- [PostgreSQL Tutorial](https://www.postgresql.org/docs/) - Official PostgreSQL documentation
- [Open-Meteo API](https://open-meteo.com/en/docs) - Free weather API documentation
- [Radix UI](https://www.radix-ui.com/) - Accessible component library documentation
- [Vite Guide](https://vitejs.dev/guide/) - Vite build tool documentation
- [Google AI Studio](https://ai.google.dev/) - Google Gemini API documentation and playground
- [JWT.io](https://jwt.io/) - JSON Web Token introduction and debugger
- [TypeScript Handbook](https://www.typescriptlang.org/docs/) - TypeScript language reference

## Future Work

**Core Features**
- Add real-time weather alerts and push notifications for severe weather conditions
- Implement device automation rules (e.g., "turn on lights when sunset" or "adjust thermostat based on weather")
- Create historical weather data analytics with trend visualization and predictions
- Develop mobile applications for iOS and Android using React Native

**AI Enhancements**
- Expand AI insights to provide energy-saving recommendations based on device usage patterns
- Implement natural language chat interface for controlling devices via voice/text commands
- Add predictive maintenance alerts for devices based on usage data

**Smart Home Integration**
- Integrate with popular smart home platforms (Google Home, Amazon Alexa, Apple HomeKit)
- Add support for Raspberry Pi Pico W for DIY device integration
- Implement device grouping and scene management (e.g., "Movie Mode", "Away Mode")
- Add support for more device types (security cameras, door locks, garage doors)

**User Experience**
- Implement dark mode theme toggle throughout the application
- Add customizable dashboard layouts with drag-and-drop widgets
- Create shareable weather reports and device status summaries
- Implement user preferences for temperature units (Celsius/Fahrenheit) and measurement systems

**Technical Improvements**
- Add comprehensive unit and integration testing (pytest for backend, Jest for frontend)
- Implement CI/CD pipeline with GitHub Actions for automated testing and deployment
- Add Docker containerization for easier deployment and development setup
- Implement real-time updates using WebSockets for live device status changes
- Optimize database queries with indexing and caching strategies
- Add API rate limiting and enhanced security measures
- Implement data backup and recovery mechanisms
