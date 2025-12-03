"""Weather data endpoints."""

from fastapi import APIRouter, HTTPException, Depends
from database.database import HomeNetDatabase
from auth.helpers import verify_token
from weather.weather_api import get_weather_data

router = APIRouter(prefix="/weather", tags=["weather"])
db = HomeNetDatabase()


@router.get("/{location_id}")
async def get_weather_for_location(location_id: int, username: str = Depends(verify_token)):
    """Get current weather and forecast for a user's location."""
    try:
        conn = db.get_connection()
        cursor = conn.cursor()
        
        cursor.execute("""
            SELECT ul.name, ul.latitude, ul.longitude
            FROM user_locations ul
            JOIN users u ON ul.user_id = u.id
            WHERE ul.id = %s AND u.username = %s
        """, (location_id, username))
        
        location = cursor.fetchone()
        if not location:
            raise HTTPException(status_code=404, detail="Location not found")
        
        cursor.close()
        conn.close()
        
        weather_data = get_weather_data(location[1], location[2])
        
        return {
            "location": location[0],
            "current_weather": weather_data.get("current_weather", {}),
            "daily_forecast": weather_data.get("daily", {}),
            "hourly_forecast": weather_data.get("hourly", {})
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

