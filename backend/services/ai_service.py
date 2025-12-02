"""
AI Service for HomeNetAI
Integrates with Google Gemini API to provide intelligent insights about weather and home data
"""

import google.generativeai as genai
from typing import Dict, List, Optional
from datetime import datetime
import json
from config import config


class AIService:
    """Service for AI-powered chat and insights"""
    
    def __init__(self):
        """Initialize Gemini client with API key"""
        if config.GEMINI_API_KEY:
            genai.configure(api_key=config.GEMINI_API_KEY)
            self.model = genai.GenerativeModel(config.GEMINI_MODEL)
        else:
            print("Warning: GEMINI_API_KEY not set. AI features will be disabled.")
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
        try:
            if not self.model:
                return "AI service is not configured. Please add your Gemini API key to the configuration."
            
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
            
            # Generate response
            response = chat.send_message(full_message)
            
            return response.text.strip()
            
        except Exception as e:
            error_msg = str(e).lower()
            if "api key" in error_msg or "authentication" in error_msg:
                return "AI service is not configured. Please add your Gemini API key to the configuration."
            elif "quota" in error_msg or "rate" in error_msg:
                return "AI service is temporarily unavailable due to rate limits. Please try again later."
            else:
                print(f"Gemini API error: {e}")
                return "I'm having trouble connecting to the AI service. Please try again later."
    
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
                status = "On" if device.get("is_on") else "Off"
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
                
                # Temperature insights
                temp = weather.get("temperature", 0)
                if temp > 30:
                    insights.append({
                        "type": "warning",
                        "title": "High Temperature Alert",
                        "message": f"Temperature is {temp}°C. Consider staying hydrated and using cooling systems."
                    })
                elif temp < 0:
                    insights.append({
                        "type": "warning",
                        "title": "Freezing Temperature Alert",
                        "message": f"Temperature is {temp}°C. Protect pipes and ensure heating is adequate."
                    })
                
                # Weather condition insights
                weather_code = weather.get("weather_code", 0)
                if weather_code >= 61:  # Rain or worse
                    insights.append({
                        "type": "info",
                        "title": "Rain Expected",
                        "message": "Don't forget your umbrella! Rain is in the forecast."
                    })
                
                # Wind insights
                wind_speed = weather.get("wind_speed", 0)
                if wind_speed > 50:
                    insights.append({
                        "type": "warning",
                        "title": "High Wind Alert",
                        "message": f"Wind speed is {wind_speed} km/h. Secure outdoor items and be cautious."
                    })
            
            # Energy saving opportunities
            if context.get("forecast"):
                forecast = context["forecast"]
                if len(forecast) > 0:
                    tomorrow = forecast[0]
                    temp_max = tomorrow.get("temp_max", 20)
                    
                    if temp_max > 25:
                        insights.append({
                            "type": "tip",
                            "title": "Energy Saving Tip",
                            "message": "Tomorrow will be warm. Consider pre-cooling your home during off-peak hours."
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
