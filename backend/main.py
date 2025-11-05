"""
HomeNetAI FastAPI Backend
Main REST API for user authentication, location management, and weather data.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from config import config
from routes import auth, locations, weather

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


@app.get("/")
async def root():
    """Root endpoint - API health check"""
    return {"message": "HomeNetAI Weather API"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
