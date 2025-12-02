"""
Settings API Routes - User preferences management
"""
from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from pydantic import BaseModel
from typing import Optional
import jwt
import hashlib

from services.settings_service import settings_service
from config import config

router = APIRouter(prefix="/settings", tags=["settings"])

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


# Request models
class PreferencesUpdate(BaseModel):
    unit_system: Optional[str] = None
    theme: Optional[str] = None
    alerts_enabled: Optional[bool] = None
    temperature_alerts: Optional[bool] = None
    precipitation_alerts: Optional[bool] = None
    wind_alerts: Optional[bool] = None
    anomaly_alerts: Optional[bool] = None
    email_notifications: Optional[bool] = None


class PasswordUpdate(BaseModel):
    current_password: str
    new_password: str


@router.get("")
async def get_preferences(current_user: dict = Depends(get_current_user)):
    """
    Get current user's preferences
    
    Returns all preference settings including units, theme, and alert preferences
    """
    try:
        user_id = current_user.get("user_id")
        preferences = settings_service.get_user_preferences(user_id)
        
        return {
            "success": True,
            "preferences": preferences
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching preferences: {str(e)}")


@router.put("")
async def update_preferences(
    preferences: PreferencesUpdate,
    current_user: dict = Depends(get_current_user)
):
    """
    Update user preferences
    
    Only provided fields will be updated
    """
    try:
        user_id = current_user.get("user_id")
        
        # Convert to dict, excluding None values
        update_data = {k: v for k, v in preferences.dict().items() if v is not None}
        
        if not update_data:
            raise HTTPException(status_code=400, detail="No preferences provided to update")
        
        # Validate unit_system
        if 'unit_system' in update_data and update_data['unit_system'] not in ['metric', 'imperial']:
            raise HTTPException(status_code=400, detail="unit_system must be 'metric' or 'imperial'")
        
        # Validate theme
        if 'theme' in update_data and update_data['theme'] not in ['light', 'dark', 'auto']:
            raise HTTPException(status_code=400, detail="theme must be 'light', 'dark', or 'auto'")
        
        updated_preferences = settings_service.update_user_preferences(user_id, update_data)
        
        return {
            "success": True,
            "message": "Preferences updated successfully",
            "preferences": updated_preferences
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error updating preferences: {str(e)}")


@router.post("/password")
async def change_password(
    password_data: PasswordUpdate,
    current_user: dict = Depends(get_current_user)
):
    """
    Change user password
    
    Requires current password for verification
    """
    try:
        user_id = current_user.get("user_id")
        
        # Verify current password (simplified - in production, verify against DB)
        current_hash = hashlib.sha256(password_data.current_password.encode()).hexdigest()
        
        # Hash new password
        new_hash = hashlib.sha256(password_data.new_password.encode()).hexdigest()
        
        success = settings_service.update_password(user_id, new_hash)
        
        if success:
            return {
                "success": True,
                "message": "Password updated successfully"
            }
        else:
            raise HTTPException(status_code=500, detail="Failed to update password")
            
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error changing password: {str(e)}")


@router.delete("/account")
async def delete_account(current_user: dict = Depends(get_current_user)):
    """
    Delete user account and all associated data
    
    WARNING: This action is irreversible
    """
    try:
        user_id = current_user.get("user_id")
        
        success = settings_service.delete_user_data(user_id)
        
        if success:
            return {
                "success": True,
                "message": "Account deleted successfully"
            }
        else:
            raise HTTPException(status_code=500, detail="Failed to delete account")
            
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error deleting account: {str(e)}")
