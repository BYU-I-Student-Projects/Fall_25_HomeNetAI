"""
Weather API Module
Provides functions to fetch weather data from Open-Meteo API
"""

import requests
from typing import Dict, Any, Optional

def get_weather_data(latitude: float, longitude: float) -> Dict[str, Any]:
    """Get weather data for coordinates"""
    # Validate coordinates
    if not (-90 <= latitude <= 90):
        raise ValueError(f"Invalid latitude: {latitude}. Must be between -90 and 90")
    if not (-180 <= longitude <= 180):
        raise ValueError(f"Invalid longitude: {longitude}. Must be between -180 and 180")
    
    params = {
        "latitude": latitude,
        "longitude": longitude,
        "hourly": "temperature_2m,apparent_temperature,relative_humidity_2m,precipitation,rain,snowfall,precipitation_probability,wind_speed_10m,wind_gusts_10m,wind_direction_10m,cloud_cover,visibility,uv_index,weathercode",
        "daily": "temperature_2m_max,temperature_2m_min,precipitation_sum,rain_sum,snowfall_sum,precipitation_probability_max,wind_speed_10m_max,wind_gusts_10m_max,uv_index_max",
        "current_weather": True,
        "timezone": "auto",
        "forecast_days": 7,
        "temperature_unit": "fahrenheit",
        "windspeed_unit": "mph",
        "precipitation_unit": "inch"
    }
    
    try:
        response = requests.get(
            "https://api.open-meteo.com/v1/forecast", 
            params=params,
            timeout=30  # 30 second timeout
        )
        response.raise_for_status()
        return response.json()
    except requests.exceptions.Timeout:
        raise requests.RequestException("Weather API request timed out")
    except requests.exceptions.RequestException as e:
        raise requests.RequestException(f"Weather API request failed: {e}")


def search_location(query: str) -> Dict[str, Any]:
    """Search for locations by name"""
    if not query or not query.strip():
        raise ValueError("Search query cannot be empty")
    
    params = {
        "name": query.strip(),
        "count": 10,
        "language": "en",
        "format": "json"
    }
    
    try:
        response = requests.get(
            "https://geocoding-api.open-meteo.com/v1/search", 
            params=params,
            timeout=30  # 30 second timeout
        )
        response.raise_for_status()
        return response.json()
    except requests.exceptions.Timeout:
        raise requests.RequestException("Geocoding API request timed out")
    except requests.exceptions.RequestException as e:
        raise requests.RequestException(f"Geocoding API request failed: {e}")
