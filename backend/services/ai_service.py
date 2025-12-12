"""
AI Service for HomeNetAI
Integrates with Google Gemini API to provide intelligent insights about weather and home data
"""

import google.generativeai as genai
from typing import Dict, List, Optional
from datetime import datetime
import json
import sys
import os

# Add parent directory to path for config import
backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
parent_dir = os.path.dirname(backend_dir)
sys.path.insert(0, parent_dir)

from config import config


class AIService:
    """Service for AI-powered chat and insights"""
    
    def __init__(self):
        """Initialize Gemini client with API key"""
        self.api_key_configured = bool(config.GEMINI_API_KEY and config.GEMINI_API_KEY.strip())
        if self.api_key_configured:
            try:
                genai.configure(api_key=config.GEMINI_API_KEY)
                self.model = genai.GenerativeModel(config.GEMINI_MODEL)
                print(f"✓ Gemini AI service initialized successfully with model: {config.GEMINI_MODEL}")
                print(f"  API Key: {config.GEMINI_API_KEY[:20]}... (length: {len(config.GEMINI_API_KEY)})")
            except Exception as e:
                print(f"❌ Warning: Failed to initialize Gemini AI: {e}")
                print(f"  Model: {config.GEMINI_MODEL}")
                print(f"  API Key exists: {bool(config.GEMINI_API_KEY)}")
                import traceback
                traceback.print_exc()
                self.model = None
        else:
            print("Warning: GEMINI_API_KEY not set. AI chat features will be disabled.")
            print("  Insights will still work (they don't require the API key)")
            self.model = None
    
    async def generate_chat_response(
        self, 
        user_message: str, 
        context: Optional[Dict] = None,
        conversation_history: Optional[List[Dict]] = None
    ) -> str:
        """
        Generate AI chat response with context about user's weather and home data
        
        Args:
            user_message: The user's message
            context: Optional context about user's locations, weather, devices
            conversation_history: Previous messages in the conversation
            
        Returns:
            AI-generated response string
        """
        if not self.model:
            return "AI service is not configured. Please add your Gemini API key to the configuration."
        
        try:
            # Build system prompt with context
            system_prompt = self._build_system_prompt(context)
            
            # Build conversation history for Gemini
            chat_history = []
            if conversation_history:
                for msg in conversation_history[-10:]:  # Last 10 messages for context
                    role = msg.get("role", "user")
                    content = msg.get("content", "")
                    # Gemini uses 'user' and 'model' roles
                    gemini_role = "model" if role == "assistant" else "user"
                    chat_history.append({"role": gemini_role, "parts": [content]})
            
            # Start chat with history
            chat = self.model.start_chat(history=chat_history)
            
            # Combine system prompt with user message
            full_message = f"{system_prompt}\n\nUser: {user_message}"
            
            # Run Gemini API call in thread to avoid blocking
            import asyncio
            def call_gemini():
                return chat.send_message(full_message).text.strip()
            
            if hasattr(asyncio, 'to_thread'):
                response = await asyncio.to_thread(call_gemini)
            else:
                loop = asyncio.get_event_loop()
                response = await loop.run_in_executor(None, call_gemini)
            
            return response
            
        except Exception as e:
            error_msg = str(e).lower()
            print(f"AI ERROR: {e}", flush=True)
            
            if "api key" in error_msg or "authentication" in error_msg or "invalid" in error_msg:
                return "AI service authentication failed. Please check that your Gemini API key is valid."
            elif "quota" in error_msg or "rate" in error_msg or "429" in str(e):
                return "AI service is temporarily unavailable due to rate limits. Please try again in a minute."
            else:
                return f"I'm having trouble connecting to the AI service. Error: {str(e)[:100]}"
    
    def _build_system_prompt(self, context: Optional[Dict] = None) -> str:
        """
        Build system prompt with user context
        
        Args:
            context: User's weather locations, devices, and recent data
            
        Returns:
            Formatted system prompt string
        """
        base_prompt = """You are HomeNetAI Assistant, an intelligent AI helper for a smart home and weather monitoring system.

Your role is to:
- Provide insights about weather patterns and forecasts
- Help users understand their home's energy usage and device status
- Suggest optimizations for energy efficiency
- Alert users to important weather conditions
- Answer questions about their locations and devices
- Be friendly, helpful, and concise

Always provide accurate information based on the user's data when available."""

        if not context:
            return base_prompt
        
        # Add user's locations context
        if context.get("locations"):
            locations_text = "\n\nUser's Monitored Locations:\n"
            for loc in context["locations"]:
                locations_text += f"- {loc.get('name', 'Unknown')}: {loc.get('latitude', 'N/A')}°, {loc.get('longitude', 'N/A')}°\n"
            base_prompt += locations_text
        
        # Add current weather context
        if context.get("current_weather"):
            weather = context["current_weather"]
            weather_text = f"\n\nCurrent Weather Data:\n"
            weather_text += f"- Temperature: {weather.get('temperature', 'N/A')}°C\n"
            weather_text += f"- Conditions: {self._weather_code_to_text(weather.get('weather_code'))}\n"
            weather_text += f"- Humidity: {weather.get('humidity', 'N/A')}%\n"
            weather_text += f"- Wind Speed: {weather.get('wind_speed', 'N/A')} km/h\n"
            base_prompt += weather_text
        
        # Add forecast context
        if context.get("forecast"):
            forecast_text = "\n\nUpcoming Forecast:\n"
            for day in context["forecast"][:3]:  # Next 3 days
                forecast_text += f"- {day.get('date', 'N/A')}: {day.get('temp_max', 'N/A')}°C max, {day.get('temp_min', 'N/A')}°C min\n"
            base_prompt += forecast_text
        
        # Add devices context (if implemented)
        if context.get("devices"):
            devices_text = "\n\nConnected Devices:\n"
            for device in context["devices"]:
                status = "On" if device.get("status") == "on" else "Off"
                devices_text += f"- {device.get('name', 'Unknown')} ({device.get('type', 'Unknown')}): {status}\n"
            base_prompt += devices_text
        
        return base_prompt
    
    def _weather_code_to_text(self, code: Optional[int]) -> str:
        """Convert WMO weather code to human-readable text"""
        if code is None:
            return "Unknown"
        
        weather_codes = {
            0: "Clear sky",
            1: "Mainly clear",
            2: "Partly cloudy",
            3: "Overcast",
            45: "Foggy",
            48: "Depositing rime fog",
            51: "Light drizzle",
            53: "Moderate drizzle",
            55: "Dense drizzle",
            61: "Slight rain",
            63: "Moderate rain",
            65: "Heavy rain",
            71: "Slight snow",
            73: "Moderate snow",
            75: "Heavy snow",
            77: "Snow grains",
            80: "Slight rain showers",
            81: "Moderate rain showers",
            82: "Violent rain showers",
            85: "Slight snow showers",
            86: "Heavy snow showers",
            95: "Thunderstorm",
            96: "Thunderstorm with slight hail",
            99: "Thunderstorm with heavy hail"
        }
        
        return weather_codes.get(code, f"Weather code {code}")
    
    async def generate_insights(self, context: Dict) -> List[Dict[str, str]]:
        """
        Generate AI insights based on user's data
        
        Args:
            context: User's locations, weather, and device data
            
        Returns:
            List of insight objects with type, title, and message
        """
        insights = []
        
        try:
            # Generate weather-based insights
            if context.get("current_weather"):
                weather = context["current_weather"]
                
                # Temperature insights (data is in Fahrenheit)
                temp = weather.get("temperature", 0)
                if temp is not None:
                    if temp > 95:  # ~35°C - Hot weather alert
                        insights.append({
                            "type": "warning",
                            "title": "High Temperature Alert",
                            "message": f"Temperature is {temp:.0f}°F. Consider staying hydrated and using cooling systems."
                        })
                    elif temp < 32:  # 0°C - Freezing
                        insights.append({
                            "type": "warning",
                            "title": "Freezing Temperature Alert",
                            "message": f"Temperature is {temp:.0f}°F. Protect pipes and ensure heating is adequate."
                        })
                    elif temp < 50:  # ~10°C - Cold weather
                        insights.append({
                            "type": "info",
                            "title": "Cold Weather",
                            "message": f"Temperature is {temp:.0f}°F. Dress warmly if going outside."
                        })
                
                # Weather condition insights
                weather_code = weather.get("weather_code", 0)
                if weather_code is not None and weather_code >= 61:  # Rain or worse
                    insights.append({
                        "type": "info",
                        "title": "Rain Expected",
                        "message": "Don't forget your umbrella! Rain is in the forecast."
                    })
                
                # Wind insights (data is in mph)
                wind_speed = weather.get("wind_speed", 0)
                if wind_speed is not None and wind_speed > 30:  # ~50 km/h
                    insights.append({
                        "type": "warning",
                        "title": "High Wind Alert",
                        "message": f"Wind speed is {wind_speed:.0f} mph. Secure outdoor items and be cautious."
                    })
            
            # Energy saving opportunities (temp_max is in Fahrenheit)
            if context.get("forecast"):
                forecast = context["forecast"]
                if len(forecast) > 0:
                    tomorrow = forecast[0]
                    temp_max = tomorrow.get("temp_max")
                    
                    if temp_max is not None and temp_max > 80:  # ~27°C - warm day
                        insights.append({
                            "type": "tip",
                            "title": "Energy Saving Tip",
                            "message": f"Tomorrow will be warm ({temp_max:.0f}°F). Consider pre-cooling your home during off-peak hours."
                        })
                    elif temp_max is not None and temp_max < 40:  # ~4°C - cold day
                        insights.append({
                            "type": "tip", 
                            "title": "Heating Tip",
                            "message": f"Tomorrow will be cold ({temp_max:.0f}°F). Consider programming your thermostat to save energy."
                        })
            
            # Add a general insight if no specific insights
            if not insights:
                insights.append({
                    "type": "info",
                    "title": "All Systems Normal",
                    "message": "Your home and weather conditions are looking good!"
                })
            
        except Exception as e:
            print(f"Error generating insights: {e}")
            insights.append({
                "type": "error",
                "title": "Insights Unavailable",
                "message": "Unable to generate insights at this time."
            })
        
        return insights


# Global instance
ai_service = AIService()

