"""
AI Routes for HomeNetAI
Handles chatbot and AI insights endpoints
"""

from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from pydantic import BaseModel
from typing import List, Optional, Dict
from datetime import datetime
import jwt

from services.ai_service import ai_service
from config import config

# Create router
router = APIRouter(prefix="/ai", tags=["AI"])

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


# Routes
@router.post("/chat", response_model=ChatResponse)
async def chat(chat_message: ChatMessage, current_user: dict = Depends(get_current_user)):
    """
    Send a message to the AI chatbot and get a response
    
    - **message**: User's message to the AI
    - **conversation_id**: Optional conversation ID for context
    
    Returns AI-generated response with conversation context
    """
    try:
        # Get user's context (locations, weather, devices)
        context = await _get_user_context(current_user["user_id"])
        
        # Get conversation history if conversation_id provided
        conversation_history = None
        if chat_message.conversation_id:
            conversation_history = await _get_conversation_history(
                chat_message.conversation_id, 
                current_user["user_id"]
            )
        
        # Generate AI response
        ai_response = await ai_service.generate_chat_response(
            user_message=chat_message.message,
            context=context,
            conversation_history=conversation_history
        )
        
        # Generate or use existing conversation ID
        conversation_id = chat_message.conversation_id or _generate_conversation_id()
        
        # Store message and response in database (future enhancement)
        # await _store_conversation_message(...)
        
        return ChatResponse(
            response=ai_response,
            conversation_id=conversation_id,
            timestamp=datetime.utcnow().isoformat()
        )
        
    except Exception as e:
        print(f"Error in chat endpoint: {e}")
        raise HTTPException(status_code=500, detail="Failed to generate AI response")


@router.get("/insights", response_model=List[InsightResponse])
async def get_insights(current_user: dict = Depends(get_current_user)):
    """
    Get AI-generated insights based on user's weather and home data
    
    Returns a list of insights with actionable recommendations
    """
    try:
        # Get user's context
        context = await _get_user_context(current_user["user_id"])
        
        # Generate insights
        insights = await ai_service.generate_insights(context)
        
        return insights
        
    except Exception as e:
        print(f"Error in insights endpoint: {e}")
        raise HTTPException(status_code=500, detail="Failed to generate insights")


# Helper functions
async def _get_user_context(user_id: int) -> Dict:
    """
    Gather user's context including locations, weather, and devices
    
    Args:
        user_id: User ID
        
    Returns:
        Dictionary with user's data context
    """
    from database.database import HomeNetDatabase
    
    db = HomeNetDatabase()
    context = {}
    
    try:
        # Get user's locations
        locations_query = """
            SELECT id, name, latitude, longitude 
            FROM user_locations 
            WHERE user_id = %s
        """
        locations = db.execute_query(locations_query, (user_id,))
        context["locations"] = locations or []
        
        # Get current weather for first location
        if locations and len(locations) > 0:
            location_id = locations[0]["id"]
            
            # Get latest weather data
            weather_query = """
                SELECT temperature, apparent_temperature, humidity, 
                       precipitation, wind_speed, wind_direction, 
                       cloud_cover, weather_code, timestamp
                FROM weather_data
                WHERE location_id = %s
                ORDER BY timestamp DESC
                LIMIT 1
            """
            weather_data = db.execute_query(weather_query, (location_id,))
            if weather_data and len(weather_data) > 0:
                context["current_weather"] = weather_data[0]
            
            # Get forecast
            forecast_query = """
                SELECT date, temp_max, temp_min, precipitation_sum,
                       precipitation_probability_max, wind_speed_max
                FROM daily_weather
                WHERE location_id = %s AND date >= CURRENT_DATE
                ORDER BY date
                LIMIT 7
            """
            forecast_data = db.execute_query(forecast_query, (location_id,))
            context["forecast"] = forecast_data or []
        
        # Get devices (when device management is implemented)
        # devices_query = "SELECT * FROM devices WHERE user_id = %s"
        # context["devices"] = db.execute_query(devices_query, (user_id,))
        
    except Exception as e:
        print(f"Error getting user context: {e}")
    
    return context


async def _get_conversation_history(conversation_id: str, user_id: int) -> List[Dict]:
    """
    Retrieve conversation history from database
    
    Args:
        conversation_id: Conversation ID
        user_id: User ID for security
        
    Returns:
        List of previous messages in the conversation
    """
    # TODO: Implement database storage for conversations
    # For now, return empty list
    return []


def _generate_conversation_id() -> str:
    """Generate a unique conversation ID"""
    import uuid
    return str(uuid.uuid4())
