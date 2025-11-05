"""Location management endpoints."""

from fastapi import APIRouter, HTTPException, Depends
from datetime import datetime
from database.database import HomeNetDatabase
from models.schemas import LocationCreate
from auth.helpers import verify_token
from weather.weather_api import search_location

router = APIRouter(prefix="/locations", tags=["locations"])
db = HomeNetDatabase()


@router.get("/search")
async def search_locations(query: str):
    """Search for locations using geocoding API."""
    try:
        data = search_location(query)
        results = []
        
        for result in data.get("results", []):
            results.append({
                "name": result.get("name", ""),
                "country": result.get("country", ""),
                "admin1": result.get("admin1", ""),
                "latitude": result.get("latitude", 0),
                "longitude": result.get("longitude", 0),
                "display_name": f"{result.get('name', '')}, {result.get('admin1', '')}, {result.get('country', '')}"
            })
        
        return {"results": results}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("")
async def get_user_locations(username: str = Depends(verify_token)):
    """Get all locations saved by the authenticated user."""
    conn = None
    cursor = None
    try:
        conn = db.get_connection()
        cursor = conn.cursor()
        
        cursor.execute("""
            SELECT ul.id, ul.name, ul.latitude, ul.longitude, ul.created_at
            FROM user_locations ul
            JOIN users u ON ul.user_id = u.id
            WHERE u.username = %s
            ORDER BY ul.created_at DESC
        """, (username,))
        
        locations = []
        for row in cursor.fetchall():
            locations.append({
                "id": row[0],
                "name": row[1],
                "latitude": float(row[2]),
                "longitude": float(row[3]),
                "created_at": row[4].isoformat()
            })
        
        return {"locations": locations}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()


@router.post("")
async def add_user_location(location: LocationCreate, username: str = Depends(verify_token)):
    """Add a new location for the authenticated user."""
    try:
        conn = db.get_connection()
        cursor = conn.cursor()
        
        cursor.execute("SELECT id FROM users WHERE username = %s", (username,))
        user_result = cursor.fetchone()
        if not user_result:
            raise HTTPException(status_code=404, detail="User not found")
        
        user_id = user_result[0]
        
        cursor.execute("""
            INSERT INTO user_locations (user_id, name, latitude, longitude, created_at)
            VALUES (%s, %s, %s, %s, %s)
            RETURNING id
        """, (user_id, location.name, location.latitude, location.longitude, datetime.utcnow()))
        
        location_id = cursor.fetchone()[0]
        conn.commit()
        cursor.close()
        conn.close()
        
        return {"id": location_id, "message": "Location added successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/{location_id}")
async def delete_user_location(location_id: int, username: str = Depends(verify_token)):
    """Delete a location owned by the authenticated user."""
    try:
        conn = db.get_connection()
        cursor = conn.cursor()
        
        cursor.execute("""
            DELETE FROM user_locations 
            WHERE id = %s AND user_id = (
                SELECT id FROM users WHERE username = %s
            )
        """, (location_id, username))
        
        if cursor.rowcount == 0:
            raise HTTPException(status_code=404, detail="Location not found or not owned by user")
        
        conn.commit()
        cursor.close()
        conn.close()
        
        return {"message": "Location deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

