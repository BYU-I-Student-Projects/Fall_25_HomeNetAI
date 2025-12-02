"""
Alerts API Routes - Smart weather alerts and recommendations
"""
from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from typing import List, Dict, Any
import jwt
from services.alerts_service import AlertsService
from config import config

router = APIRouter(prefix="/alerts", tags=["alerts"])

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

@router.get("")
async def get_alerts(
    location_id: int = None,
    current_user: dict = Depends(get_current_user)
) -> Dict[str, Any]:
    """
    Get all active alerts and recommendations for a location
    
    Query Parameters:
    - location_id: Optional location ID to filter alerts
    
    Returns alerts categorized by type and severity:
    - critical: Immediate attention required
    - warning: Important weather events
    - info: General weather information
    - recommendation: Helpful suggestions
    """
    try:
        user_id = current_user.get("user_id")
        
        if not location_id:
            raise HTTPException(status_code=400, detail="location_id query parameter is required")
        
        alerts_service = AlertsService()
        alerts = alerts_service.get_active_alerts(location_id, user_id)
        
        return {
            "success": True,
            "location_id": location_id,
            "timestamp": alerts[0]["timestamp"] if alerts else None,
            "alert_count": len(alerts),
            "alerts": alerts
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching alerts: {str(e)}")


@router.get("/{location_id}/summary")
async def get_alert_summary(
    location_id: int,
    current_user: dict = Depends(get_current_user)
) -> Dict[str, Any]:
    """
    Get summary of active alerts grouped by type and severity
    
    Provides overview of all alerts without full details
    """
    try:
        user_id = current_user.get("user_id")
        alerts_service = AlertsService()
        summary = alerts_service.get_alert_summary(location_id, user_id)
        
        return {
            "success": True,
            "location_id": location_id,
            **summary
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching alert summary: {str(e)}")


@router.get("/{location_id}/critical")
async def get_critical_alerts(
    location_id: int,
    current_user: dict = Depends(get_current_user)
) -> Dict[str, Any]:
    """
    Get only critical and warning level alerts
    
    Useful for displaying high-priority alerts on dashboard
    """
    try:
        user_id = current_user.get("user_id")
        alerts_service = AlertsService()
        all_alerts = alerts_service.get_active_alerts(location_id, user_id)
        
        # Filter for critical and warning only
        critical_alerts = [
            alert for alert in all_alerts 
            if alert['severity'] in ['critical', 'warning']
        ]
        
        return {
            "success": True,
            "location_id": location_id,
            "alert_count": len(critical_alerts),
            "alerts": critical_alerts
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching critical alerts: {str(e)}")


@router.post("/generate/{location_id}")
async def generate_alerts(
    location_id: int,
    current_user: dict = Depends(get_current_user)
) -> Dict[str, Any]:
    """
    Manually trigger alert generation for a location
    
    Useful for refreshing alerts on-demand
    """
    try:
        user_id = current_user.get("user_id")
        alerts_service = AlertsService()
        alerts = alerts_service.get_active_alerts(location_id, user_id)
        
        return {
            "success": True,
            "message": "Alerts generated successfully",
            "location_id": location_id,
            "alert_count": len(alerts),
            "alerts": alerts
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating alerts: {str(e)}")


@router.patch("/{alert_id}/read")
async def mark_alert_as_read(
    alert_id: int,
    current_user: dict = Depends(get_current_user)
) -> Dict[str, Any]:
    """
    Mark an alert as read (for future database-persisted alerts)
    
    Currently returns success as alerts are generated dynamically
    """
    try:
        # Note: Since alerts are currently generated dynamically,
        # this endpoint is prepared for future database persistence
        return {
            "success": True,
            "message": f"Alert {alert_id} marked as read",
            "alert_id": alert_id
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error marking alert as read: {str(e)}")


@router.delete("/{alert_id}")
async def delete_alert(
    alert_id: int,
    current_user: dict = Depends(get_current_user)
) -> Dict[str, Any]:
    """
    Delete/dismiss an alert (for future database-persisted alerts)
    
    Currently returns success as alerts are generated dynamically
    """
    try:
        # Note: Since alerts are currently generated dynamically,
        # this endpoint is prepared for future database persistence
        return {
            "success": True,
            "message": f"Alert {alert_id} deleted",
            "alert_id": alert_id
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error deleting alert: {str(e)}")
