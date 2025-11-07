"""
HomeNetAI FastAPI Backend
Main REST API for user authentication, location management, and weather data.
"""

import os
import sys

# Add parent directory to path for config import
backend_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.dirname(backend_dir)
sys.path.insert(0, parent_dir)

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from config import config
from routes import auth, locations, weather, devices

# FastAPI App
app = FastAPI(title="HomeNetAI Weather API", version="1.0.0")

# CORS middleware for frontend access
app.add_middleware(
    CORSMiddleware,
    allow_origins=config.CORS_ORIGINS if config.CORS_ORIGINS else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router)
app.include_router(locations.router)
app.include_router(weather.router)
app.include_router(devices.router)


@app.get("/")
async def root():
    """Root endpoint - API health check"""
    try:
        return {"message": "HomeNetAI Weather API", "status": "running"}
    except Exception as e:
        return {"error": str(e), "status": "error"}


@app.get("/health")
async def health():
    """Health check endpoint"""
    return {"status": "healthy", "message": "Backend is running"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
