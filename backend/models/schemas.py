"""Request and response models for API endpoints."""

from pydantic import BaseModel
from typing import List


class UserCreate(BaseModel):
    """Request model for user registration"""
    username: str
    email: str
    password: str


class UserLogin(BaseModel):
    """Request model for user login"""
    username: str
    password: str


class LocationCreate(BaseModel):
    """Request model for adding a location"""
    name: str
    latitude: float
    longitude: float


class LocationResponse(BaseModel):
    """Response model for location data"""
    id: int
    name: str
    latitude: float
    longitude: float
    created_at: str


class WeatherResponse(BaseModel):
    """Response model for weather data"""
    location: str
    current_weather: dict
    daily_forecast: List[dict]

