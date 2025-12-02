"""
Alerts API Routes - Smart weather alerts and recommendations
"""
from fastapi import APIRouter, Depends, HTTPException
from typing import List, Dict, Any
from services.alerts_service import AlertsService
from config import verify_jwt_token

router = APIRouter(prefix="/alerts", tags=["alerts"])

@router.get("/{location_id}")
async def get_alerts(
    location_id: int,
    payload: dict = Depends(verify_jwt_token)
) -> Dict[str, Any]:
    """
    Get all active alerts and recommendations for a location
    
    Returns alerts categorized by type and severity:
    - critical: Immediate attention required
    - warning: Important weather events
    - info: General weather information
    - recommendation: Helpful suggestions
    """
    try:
        user_id = payload.get("user_id")
        alerts_service = AlertsService()
        alerts = alerts_service.get_active_alerts(location_id, user_id)
        
        return {
            "success": True,
            "location_id": location_id,
            "timestamp": alerts[0]["timestamp"] if alerts else None,
            "alert_count": len(alerts),
            "alerts": alerts
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching alerts: {str(e)}")


@router.get("/{location_id}/summary")
async def get_alert_summary(
    location_id: int,
    payload: dict = Depends(verify_jwt_token)
) -> Dict[str, Any]:
    """
    Get summary of active alerts grouped by type and severity
    
    Provides overview of all alerts without full details
    """
    try:
        user_id = payload.get("user_id")
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
    payload: dict = Depends(verify_jwt_token)
) -> Dict[str, Any]:
    """
    Get only critical and warning level alerts
    
    Useful for displaying high-priority alerts on dashboard
    """
    try:
        user_id = payload.get("user_id")
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
