"""
AI Routes for HomeNetAI
Handles chatbot and AI insights endpoints
"""

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import List, Optional, Dict
from datetime import datetime, timezone
import sys
import os
import uuid
import asyncio

# Add parent directory to path for imports
backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
parent_dir = os.path.dirname(backend_dir)
sys.path.insert(0, parent_dir)

from services.ai_service import ai_service
from auth.helpers import verify_token
from database.database import HomeNetDatabase

# Create router
router = APIRouter(prefix="/ai", tags=["AI"])
db = HomeNetDatabase()

# Test endpoint
@router.get("/test")
async def test_endpoint():
    return {"status": "ok", "message": "AI routes are working"}

# Pydantic Models
class ChatMessage(BaseModel):
    message: str
    conversation_id: Optional[str] = None

class ChatResponse(BaseModel):
    response: str
    conversation_id: str
    timestamp: str

class InsightResponse(BaseModel):
    type: str
    title: str
    message: str

# Helper function to get user_id from username
def get_user_id_from_username(username: str) -> int:
    """Get user_id from username by querying database"""
    conn = None
    cursor = None
    try:
        conn = db.get_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT id FROM users WHERE username = %s", (username,))
        result = cursor.fetchone()
        if not result:
            raise HTTPException(status_code=404, detail="User not found")
        return result[0]
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()

# Routes
@router.post("/chat", response_model=ChatResponse)
async def chat(chat_message: ChatMessage, username: str = Depends(verify_token)):
    """
    Send a message to the AI chatbot and get a response with full context
    """
    print(f"CHAT: {username} - {chat_message.message[:50]}...", flush=True)
    
    try:
        # Get user_id from username
        user_id = get_user_id_from_username(username)
        
        # Get user's context (locations, weather, devices) - runs in thread
        context = await _get_user_context(user_id)
        
        # Get conversation history if conversation_id provided
        conversation_history = None
        if chat_message.conversation_id:
            conversation_history = await _get_conversation_history(
                chat_message.conversation_id, 
                user_id
            )
        
        # Generate AI response with full context
        ai_response = await ai_service.generate_chat_response(
            user_message=chat_message.message,
            context=context,
            conversation_history=conversation_history
        )
        
        # Generate or use existing conversation ID
        conversation_id = chat_message.conversation_id or _generate_conversation_id()
        
        return ChatResponse(
            response=ai_response,
            conversation_id=conversation_id,
            timestamp=datetime.now(timezone.utc).isoformat()
        )
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"CHAT ERROR: {e}", flush=True)
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Failed to generate AI response: {str(e)}")

@router.get("/insights", response_model=List[InsightResponse])
async def get_insights(username: str = Depends(verify_token)):
    """Get AI-generated insights based on user's weather and home data"""
    try:
        # Get user_id from username
        user_id = get_user_id_from_username(username)
        
        # Get user's context
        context = await _get_user_context(user_id)
        
        # Generate insights
        insights = await ai_service.generate_insights(context)
        
        return insights
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error in insights endpoint: {e}")
        raise HTTPException(status_code=500, detail="Failed to generate insights")

# Helper functions - all database operations run in threads to avoid blocking
async def _get_user_context(user_id: int) -> Dict:
    """
    Gather user's context including locations, weather, and devices
    All database queries run in threads to avoid blocking
    """
    def _get_context_sync():
        """Synchronous function that runs in thread"""
        conn = None
        cursor = None
        context = {}
        
        try:
            conn = db.get_connection()
            cursor = conn.cursor()
            
            # Get user's locations
            cursor.execute("""
                SELECT id, name, latitude, longitude 
                FROM user_locations 
                WHERE user_id = %s
            """, (user_id,))
            
            locations = []
            for row in cursor.fetchall():
                locations.append({
                    "id": row[0],
                    "name": row[1],
                    "latitude": float(row[2]),
                    "longitude": float(row[3])
                })
            context["locations"] = locations
            
            # Get current weather for first location
            if locations and len(locations) > 0:
                location_id = locations[0]["id"]
                
                # Get latest weather data
                cursor.execute("""
                    SELECT temperature, apparent_temperature, humidity, 
                           precipitation, wind_speed, wind_direction, 
                           cloud_cover, weather_code, timestamp
                    FROM weather_data
                    WHERE location_id = %s
                    ORDER BY timestamp DESC
                    LIMIT 1
                """, (location_id,))
                
                weather_row = cursor.fetchone()
                if weather_row:
                    context["current_weather"] = {
                        "temperature": float(weather_row[0]) if weather_row[0] is not None else None,
                        "apparent_temperature": float(weather_row[1]) if weather_row[1] is not None else None,
                        "humidity": float(weather_row[2]) if weather_row[2] is not None else None,
                        "precipitation": float(weather_row[3]) if weather_row[3] is not None else None,
                        "wind_speed": float(weather_row[4]) if weather_row[4] is not None else None,
                        "wind_direction": float(weather_row[5]) if weather_row[5] is not None else None,
                        "cloud_cover": float(weather_row[6]) if weather_row[6] is not None else None,
                        "weather_code": int(weather_row[7]) if weather_row[7] is not None else None,
                        "timestamp": weather_row[8].isoformat() if weather_row[8] else None
                    }
                
                # Get forecast
                cursor.execute("""
                    SELECT date, temp_max, temp_min, precipitation_sum,
                           precipitation_probability_max, wind_speed_max
                    FROM daily_weather
                    WHERE location_id = %s AND date >= CURRENT_DATE
                    ORDER BY date
                    LIMIT 7
                """, (location_id,))
                
                forecast = []
                for row in cursor.fetchall():
                    forecast.append({
                        "date": row[0].isoformat() if row[0] else None,
                        "temp_max": float(row[1]) if row[1] is not None else None,
                        "temp_min": float(row[2]) if row[2] is not None else None,
                        "precipitation_sum": float(row[3]) if row[3] is not None else None,
                        "precipitation_probability_max": float(row[4]) if row[4] is not None else None,
                        "wind_speed_max": float(row[5]) if row[5] is not None else None
                    })
                context["forecast"] = forecast
            
            # Get devices
            cursor.execute("""
                SELECT id, name, type, status, room, value
                FROM devices
                WHERE user_id = %s
            """, (user_id,))
            
            devices = []
            for row in cursor.fetchall():
                devices.append({
                    "id": row[0],
                    "name": row[1],
                    "type": row[2],
                    "status": row[3],
                    "room": row[4],
                    "value": float(row[5]) if row[5] is not None else None
                })
            context["devices"] = devices
            
            return context
            
        except Exception as e:
            print(f"Error getting user context: {e}", flush=True)
            return {}
        finally:
            if cursor:
                cursor.close()
            if conn:
                conn.close()
    
    # Run database queries in thread to avoid blocking
    loop = asyncio.get_event_loop()
    return await loop.run_in_executor(None, _get_context_sync)

async def _get_conversation_history(conversation_id: str, user_id: int) -> List[Dict]:
    """
    Retrieve conversation history from database
    For now returns empty list - can be implemented later
    """
    # TODO: Implement database storage for conversations
    return []

def _generate_conversation_id() -> str:
    """Generate a unique conversation ID"""
    return str(uuid.uuid4())
