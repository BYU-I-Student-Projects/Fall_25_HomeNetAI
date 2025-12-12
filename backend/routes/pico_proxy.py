"""
Proxy routes for Pico API
Forwards requests to cloud Pico API to avoid CORS issues
"""

from fastapi import APIRouter, HTTPException, Depends
from auth.helpers import verify_token
import httpx
from typing import Dict, Any

router = APIRouter(prefix="/proxy/pico", tags=["pico-proxy"])

PICO_API_BASE = "https://iot-picopi-module.onrender.com/api/v1"

@router.get("/users/{user_id}/device-modules")
async def get_user_devices(user_id: str, username: str = Depends(verify_token)):
    """Proxy: Get all device modules for a user"""
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.get(
                f"{PICO_API_BASE}/users/{user_id}/device-modules",
                headers={"Content-Type": "application/json"}
            )
            response.raise_for_status()
            return response.json()
    except httpx.HTTPError as e:
        raise HTTPException(status_code=500, detail=f"Pico API error: {str(e)}")


@router.post("/commands")
async def send_command(command_data: Dict[str, Any], username: str = Depends(verify_token)):
    """Proxy: Send command to a device"""
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                f"{PICO_API_BASE}/commands",
                json=command_data,
                headers={"Content-Type": "application/json"}
            )
            response.raise_for_status()
            return response.json()
    except httpx.HTTPError as e:
        raise HTTPException(status_code=500, detail=f"Pico API error: {str(e)}")


@router.get("/devices/{device_id}/data")
async def get_device_data(device_id: str, limit: int = 1, username: str = Depends(verify_token)):
    """Proxy: Get device data (last reading)"""
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.get(
                f"{PICO_API_BASE}/devices/{device_id}/data",
                params={"limit": limit},
                headers={"Content-Type": "application/json"}
            )
            response.raise_for_status()
            return response.json()
    except httpx.HTTPError as e:
        raise HTTPException(status_code=500, detail=f"Pico API error: {str(e)}")


@router.get("/device-modules/{module_id}/latest")
async def get_latest_reading(module_id: str, username: str = Depends(verify_token)):
    """Proxy: Get latest reading for a device module"""
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.get(
                f"{PICO_API_BASE}/device-modules/{module_id}/latest",
                headers={"Content-Type": "application/json"}
            )
            response.raise_for_status()
            return response.json()
    except httpx.HTTPError as e:
        raise HTTPException(status_code=500, detail=f"Pico API error: {str(e)}")
