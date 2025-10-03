#!/usr/bin/env python3
# HomeNetAI Backend Startup Script - Starts the FastAPI backend server and weather data scheduler

import uvicorn
import os
import sys
import asyncio
import threading
from weather.scheduler import WeatherScheduler
from config import config

# Add the backend directory to Python path
backend_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, backend_dir)

def start_weather_scheduler():
    # Start the weather data scheduler in a separate thread
    print("Starting Weather Data Scheduler...")
    print(f"Will collect weather data every {config.COLLECTION_INTERVAL_MINUTES} minutes")
    print("Data stored in PostgreSQL for AI/ML analysis")
    
    scheduler = WeatherScheduler()
    asyncio.run(scheduler.run_scheduler())

def start_backend_server():
    # Start the FastAPI backend server
    print("Starting FastAPI Backend Server...")
    print("Backend available at: http://localhost:8000")
    print("API Documentation: http://localhost:8000/docs")
    print("Interactive API: http://localhost:8000/redoc")
    print("-" * 50)
    
    uvicorn.run(
        "main:app",
        host=config.HOST,
        port=config.PORT,
        reload=True,  # Auto-reload on code changes
        log_level="info"
    )

if __name__ == "__main__":
    print("HomeNetAI Backend + Weather Scheduler")
    print("=" * 50)
    
    # Start weather scheduler in background thread
    scheduler_thread = threading.Thread(target=start_weather_scheduler, daemon=True)
    scheduler_thread.start()
    
    # Start the main backend server (this will block)
    start_backend_server()
