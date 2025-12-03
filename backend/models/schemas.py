"""Request and response models for API endpoints."""

from pydantic import BaseModel
from typing import List, Optional


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


class DeviceCreate(BaseModel):
    """Request model for creating a device"""
    name: str
    type: str  # 'thermostat', 'light', 'plug', 'lock', 'blind', 'camera'
    status: str = "off"  # 'on' or 'off'
    room: Optional[str] = None
    value: Optional[float] = None
    color: Optional[str] = None
    locked: Optional[bool] = None
    position: Optional[int] = None  # For blinds (0-100)


class DeviceUpdate(BaseModel):
    """Request model for updating a device"""
    name: Optional[str] = None
    status: Optional[str] = None
    room: Optional[str] = None
    value: Optional[float] = None
    color: Optional[str] = None
    locked: Optional[bool] = None
    position: Optional[int] = None


class DeviceResponse(BaseModel):
    """Response model for device data"""
    id: int
    name: str
    type: str
    status: str
    room: Optional[str] = None
    value: Optional[float] = None
    color: Optional[str] = None
    locked: Optional[bool] = None
    position: Optional[int] = None
    created_at: str
    updated_at: str
