"""Device management endpoints."""

from fastapi import APIRouter, HTTPException, Depends
from datetime import datetime
from typing import List, Optional
from database.database import HomeNetDatabase
from models.schemas import DeviceCreate, DeviceUpdate, DeviceResponse
from auth.helpers import verify_token

router = APIRouter(prefix="/devices", tags=["devices"])
db = HomeNetDatabase()


@router.get("", response_model=List[DeviceResponse])
async def get_user_devices(username: str = Depends(verify_token)):
    """Get all devices owned by the authenticated user."""
    conn = None
    cursor = None
    try:
        conn = db.get_connection()
        cursor = conn.cursor()
        
        cursor.execute("""
            SELECT d.id, d.name, d.type, d.status, d.room, d.value, 
                   d.color, d.locked, d.position, d.created_at, d.updated_at
            FROM devices d
            JOIN users u ON d.user_id = u.id
            WHERE u.username = %s
            ORDER BY d.created_at DESC
        """, (username,))
        
        devices = []
        for row in cursor.fetchall():
            devices.append({
                "id": row[0],
                "name": row[1],
                "type": row[2],
                "status": row[3],
                "room": row[4] if row[4] else None,
                "value": float(row[5]) if row[5] is not None else None,
                "color": row[6] if row[6] else None,
                "locked": row[7] if row[7] is not None else None,
                "position": row[8] if row[8] is not None else None,
                "created_at": row[9].isoformat(),
                "updated_at": row[10].isoformat()
            })
        
        return devices
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()


@router.get("/{device_id}", response_model=DeviceResponse)
async def get_device(device_id: int, username: str = Depends(verify_token)):
    """Get a specific device by ID."""
    conn = None
    cursor = None
    try:
        conn = db.get_connection()
        cursor = conn.cursor()
        
        cursor.execute("""
            SELECT d.id, d.name, d.type, d.status, d.room, d.value, 
                   d.color, d.locked, d.position, d.created_at, d.updated_at
            FROM devices d
            JOIN users u ON d.user_id = u.id
            WHERE d.id = %s AND u.username = %s
        """, (device_id, username))
        
        row = cursor.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Device not found or not owned by user")
        
        return {
            "id": row[0],
            "name": row[1],
            "type": row[2],
            "status": row[3],
            "room": row[4] if row[4] else None,
            "value": float(row[5]) if row[5] is not None else None,
            "color": row[6] if row[6] else None,
            "locked": row[7] if row[7] is not None else None,
            "position": row[8] if row[8] is not None else None,
            "created_at": row[9].isoformat(),
            "updated_at": row[10].isoformat()
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()


@router.post("", response_model=DeviceResponse)
async def create_device(device: DeviceCreate, username: str = Depends(verify_token)):
    """Create a new device for the authenticated user."""
    conn = None
    cursor = None
    try:
        conn = db.get_connection()
        cursor = conn.cursor()
        
        # Validate device type
        valid_types = ['thermostat', 'light', 'plug', 'lock', 'blind', 'camera']
        if device.type not in valid_types:
            raise HTTPException(status_code=400, detail=f"Invalid device type. Must be one of: {valid_types}")
        
        # Validate status
        if device.status not in ['on', 'off']:
            raise HTTPException(status_code=400, detail="Status must be 'on' or 'off'")
        
        # Get user ID
        cursor.execute("SELECT id FROM users WHERE username = %s", (username,))
        user_result = cursor.fetchone()
        if not user_result:
            raise HTTPException(status_code=404, detail="User not found")
        
        user_id = user_result[0]
        now = datetime.utcnow()
        
        # Insert device
        cursor.execute("""
            INSERT INTO devices (user_id, name, type, status, room, value, color, locked, position, created_at, updated_at)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            RETURNING id
        """, (
            user_id, device.name, device.type, device.status, 
            device.room or None, device.value, device.color, device.locked, 
            device.position, now, now
        ))
        
        device_id = cursor.fetchone()[0]
        conn.commit()
        
        # Fetch the created device
        cursor.execute("""
            SELECT id, name, type, status, room, value, color, locked, position, created_at, updated_at
            FROM devices WHERE id = %s
        """, (device_id,))
        
        row = cursor.fetchone()
        cursor.close()
        conn.close()
        
        return {
            "id": row[0],
            "name": row[1],
            "type": row[2],
            "status": row[3],
            "room": row[4] if row[4] else None,
            "value": float(row[5]) if row[5] is not None else None,
            "color": row[6] if row[6] else None,
            "locked": row[7] if row[7] is not None else None,
            "position": row[8] if row[8] is not None else None,
            "created_at": row[9].isoformat(),
            "updated_at": row[10].isoformat()
        }
        
    except HTTPException:
        raise
    except Exception as e:
        if conn:
            conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()


@router.put("/{device_id}", response_model=DeviceResponse)
async def update_device(device_id: int, device_update: DeviceUpdate, username: str = Depends(verify_token)):
    """Update a device owned by the authenticated user."""
    conn = None
    cursor = None
    try:
        conn = db.get_connection()
        cursor = conn.cursor()
        
        # Check if device exists and belongs to user
        cursor.execute("""
            SELECT d.id FROM devices d
            JOIN users u ON d.user_id = u.id
            WHERE d.id = %s AND u.username = %s
        """, (device_id, username))
        
        if not cursor.fetchone():
            raise HTTPException(status_code=404, detail="Device not found or not owned by user")
        
        # Build update query dynamically based on provided fields
        update_fields = []
        update_values = []
        
        if device_update.name is not None:
            update_fields.append("name = %s")
            update_values.append(device_update.name)
        
        if device_update.status is not None:
            if device_update.status not in ['on', 'off']:
                raise HTTPException(status_code=400, detail="Status must be 'on' or 'off'")
            update_fields.append("status = %s")
            update_values.append(device_update.status)
        
        if device_update.room is not None:
            update_fields.append("room = %s")
            update_values.append(device_update.room)
        
        if device_update.value is not None:
            update_fields.append("value = %s")
            update_values.append(device_update.value)
        
        if device_update.color is not None:
            update_fields.append("color = %s")
            update_values.append(device_update.color)
        
        if device_update.locked is not None:
            update_fields.append("locked = %s")
            update_values.append(device_update.locked)
        
        if device_update.position is not None:
            if device_update.position < 0 or device_update.position > 100:
                raise HTTPException(status_code=400, detail="Position must be between 0 and 100")
            update_fields.append("position = %s")
            update_values.append(device_update.position)
        
        if not update_fields:
            raise HTTPException(status_code=400, detail="No fields to update")
        
        # Always update updated_at
        update_fields.append("updated_at = %s")
        update_values.append(datetime.utcnow())
        
        # Add device_id for WHERE clause
        update_values.append(device_id)
        
        # Execute update
        update_query = f"""
            UPDATE devices 
            SET {', '.join(update_fields)}
            WHERE id = %s
        """
        
        cursor.execute(update_query, update_values)
        conn.commit()
        
        # Fetch updated device
        cursor.execute("""
            SELECT id, name, type, status, room, value, color, locked, position, created_at, updated_at
            FROM devices WHERE id = %s
        """, (device_id,))
        
        row = cursor.fetchone()
        cursor.close()
        conn.close()
        
        return {
            "id": row[0],
            "name": row[1],
            "type": row[2],
            "status": row[3],
            "room": row[4] if row[4] else None,
            "value": float(row[5]) if row[5] is not None else None,
            "color": row[6] if row[6] else None,
            "locked": row[7] if row[7] is not None else None,
            "position": row[8] if row[8] is not None else None,
            "created_at": row[9].isoformat(),
            "updated_at": row[10].isoformat()
        }
        
    except HTTPException:
        raise
    except Exception as e:
        if conn:
            conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()


@router.delete("/{device_id}")
async def delete_device(device_id: int, username: str = Depends(verify_token)):
    """Delete a device owned by the authenticated user."""
    conn = None
    cursor = None
    try:
        conn = db.get_connection()
        cursor = conn.cursor()
        
        cursor.execute("""
            DELETE FROM devices 
            WHERE id = %s AND user_id = (
                SELECT id FROM users WHERE username = %s
            )
        """, (device_id, username))
        
        if cursor.rowcount == 0:
            raise HTTPException(status_code=404, detail="Device not found or not owned by user")
        
        conn.commit()
        cursor.close()
        conn.close()
        
        return {"message": "Device deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        if conn:
            conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()

