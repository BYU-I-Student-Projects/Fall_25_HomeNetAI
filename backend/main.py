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
from routes import auth, locations, weather, devices, images, ai, alerts, analytics, settings

# FastAPI App
app = FastAPI(title="HomeNetAI Weather API", version="1.0.0")

# CORS middleware for frontend access
app.add_middleware(
    CORSMiddleware,
    allow_origins=config.CORS_ORIGINS if config.CORS_ORIGINS else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)

# Include routers
app.include_router(auth.router)
app.include_router(locations.router)
app.include_router(weather.router)
app.include_router(devices.router)
app.include_router(images.router)
app.include_router(ai.router)
app.include_router(alerts.router)
app.include_router(analytics.router)
app.include_router(settings.router)

# Add middleware to log all requests (must be after CORS)
@app.middleware("http")
async def log_requests(request, call_next):
    import time
    start_time = time.time()
    print(f"REQUEST: {request.method} {request.url.path}", flush=True)
    import sys
    sys.stdout.flush()
    try:
        response = await call_next(request)
        process_time = time.time() - start_time
        print(f"RESPONSE: {request.method} {request.url.path} - {response.status_code} - {process_time:.2f}s", flush=True)
        sys.stdout.flush()
        return response
    except Exception as e:
        process_time = time.time() - start_time
        print(f"ERROR: {request.method} {request.url.path} - {str(e)} - {process_time:.2f}s", flush=True)
        import traceback
        traceback.print_exc()
        sys.stdout.flush()
        raise


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

# User data management endpoints
@app.delete("/user/data")
async def clear_user_data(username: str = Depends(verify_token)):
    # Clear all user data (locations, weather data, etc.)
    try:
        conn = db.get_connection()
        cursor = conn.cursor()
        
        # Get user ID
        cursor.execute("SELECT id FROM users WHERE username = %s", (username,))
        user_result = cursor.fetchone()
        if not user_result:
            raise HTTPException(status_code=404, detail="User not found")
        
        user_id = user_result[0]
        
        # Delete all user locations and associated weather data
        cursor.execute("DELETE FROM weather_data WHERE user_id = %s", (user_id,))
        cursor.execute("DELETE FROM daily_weather WHERE user_id = %s", (user_id,))
        cursor.execute("DELETE FROM user_locations WHERE user_id = %s", (user_id,))
        
        conn.commit()
        cursor.close()
        conn.close()
        
        return {"message": "All user data has been cleared successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error clearing user data: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
