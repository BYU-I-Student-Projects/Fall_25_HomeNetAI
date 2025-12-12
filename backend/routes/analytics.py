"""
Analytics Routes for HomeNetAI
API endpoints for weather analytics, trends, and forecasting
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from typing import Optional
import jwt

from services.analytics_service import analytics_service
from config import config

# Create router
router = APIRouter(prefix="/analytics", tags=["Analytics"])

# Security
security = HTTPBearer()


# Authentication dependency
def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> dict:
    """Verify JWT token and return current user"""
    try:
        token = credentials.credentials
        payload = jwt.decode(token, config.SECRET_KEY, algorithms=["HS256"])
        user_id = payload.get("user_id")
        username = payload.get("sub") or payload.get("username")
        
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token: missing user_id")
        
        return {"user_id": user_id, "username": username}
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token has expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")
    except Exception as e:
        print(f"Authentication error: {e}")
        raise HTTPException(status_code=401, detail="Authentication failed")


@router.get("/historical/{location_id}")
async def get_historical_data(
    location_id: int,
    days: int = Query(30, ge=1, le=365, description="Number of days of historical data"),
    current_user: dict = Depends(get_current_user)
):
    """
    Get historical weather data for a location
    
    - **location_id**: ID of the user's location
    - **days**: Number of days to retrieve (1-365, default 30)
    """
    try:
        data = analytics_service.get_historical_data(location_id, days)
        return data
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving historical data: {str(e)}")


@router.get("/trends/{location_id}")
async def get_trends(
    location_id: int,
    metric: str = Query("temperature", description="Metric to analyze (temperature, humidity, precipitation, wind_speed, uv_index)"),
    days: int = Query(30, ge=7, le=90, description="Number of days to analyze"),
    current_user: dict = Depends(get_current_user)
):
    """
    Analyze trends in weather data
    
    - **location_id**: ID of the user's location
    - **metric**: Weather metric to analyze
    - **days**: Number of days to analyze (7-90, default 30)
    """
    try:
        trends = analytics_service.get_trends(location_id, metric, days)
        return trends
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error analyzing trends: {str(e)}")


@router.get("/forecast/{location_id}")
async def get_forecast(
    location_id: int,
    hours: int = Query(24, ge=1, le=168, description="Number of hours to forecast"),
    current_user: dict = Depends(get_current_user)
):
    """
    Get weather forecast for a location
    
    - **location_id**: ID of the user's location
    - **hours**: Number of hours to forecast (1-168, default 24)
    """
    try:
        forecast = analytics_service.get_forecast(location_id, hours)
        return forecast
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating forecast: {str(e)}")


@router.get("/anomalies/{location_id}")
async def get_anomalies(
    location_id: int,
    days: int = Query(30, ge=7, le=90, description="Number of days to analyze"),
    current_user: dict = Depends(get_current_user)
):
    """
    Detect anomalies in weather data
    
    - **location_id**: ID of the user's location
    - **days**: Number of days to analyze (7-90, default 30)
    """
    try:
        anomalies = analytics_service.get_anomalies(location_id, days)
        return anomalies
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error detecting anomalies: {str(e)}")


@router.get("/summary/{location_id}")
async def get_summary(
    location_id: int,
    days: int = Query(30, ge=7, le=365, description="Number of days to summarize"),
    current_user: dict = Depends(get_current_user)
):
    """
    Get comprehensive summary statistics for a location
    
    - **location_id**: ID of the user's location
    - **days**: Number of days to summarize (7-365, default 30)
    """
    try:
        summary = analytics_service.get_summary_statistics(location_id, days)
        return summary
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating summary: {str(e)}")
