"""Pico Pi authentication endpoints for HomeNetAI."""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from database.database import HomeNetDatabase
from auth.helpers import hash_password

router = APIRouter(prefix="/pico", tags=["pico"])
db = HomeNetDatabase()


class PicoLoginRequest(BaseModel):
    """Request model for pico device login"""
    username: str
    password: str


class PicoLoginResponse(BaseModel):
    """Response model for pico device login"""
    user_id: str
    username: str
    success: bool


@router.post("/login", response_model=PicoLoginResponse)
async def pico_login(credentials: PicoLoginRequest):
    """
    Login endpoint for Pico devices (.exe file).
    Validates username/password and returns the user_id from database.
    """
    conn = None
    cursor = None
    try:
        conn = db.get_connection()
        cursor = conn.cursor()
        
        # Get user by username
        cursor.execute(
            "SELECT id, username, password_hash FROM users WHERE username = %s",
            (credentials.username,)
        )
        result = cursor.fetchone()
        
        if not result:
            raise HTTPException(status_code=401, detail="Invalid username or password")
        
        user_id, username, stored_hash = result
        
        # Verify password
        if stored_hash != hash_password(credentials.password):
            raise HTTPException(status_code=401, detail="Invalid username or password")
        
        # Return user_id as string
        return PicoLoginResponse(
            user_id=str(user_id),
            username=username,
            success=True
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()
