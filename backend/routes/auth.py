"""Authentication endpoints."""

from fastapi import APIRouter, HTTPException, Depends
from datetime import datetime
from database.database import HomeNetDatabase
from models.schemas import UserCreate, UserLogin
from auth.helpers import create_access_token, hash_password, verify_token

router = APIRouter(prefix="/auth", tags=["authentication"])
db = HomeNetDatabase()


@router.post("/register")
async def register(user: UserCreate):
    """Register a new user."""
    conn = None
    cursor = None
    try:
        conn = db.get_connection()
        cursor = conn.cursor()
        
        cursor.execute("SELECT id FROM users WHERE username = %s OR email = %s", 
                      (user.username, user.email))
        if cursor.fetchone():
            raise HTTPException(status_code=400, detail="Username or email already exists")
        
        hashed_password = hash_password(user.password)
        cursor.execute("""
            INSERT INTO users (username, email, password_hash, created_at)
            VALUES (%s, %s, %s, %s)
            RETURNING id
        """, (user.username, user.email, hashed_password, datetime.utcnow()))
        
        user_id = cursor.fetchone()[0]
        conn.commit()
        
        access_token = create_access_token(data={"sub": user.username})
        return {"access_token": access_token, "token_type": "bearer", "user_id": user_id}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()


@router.post("/login")
async def login(user: UserLogin):
    """Login an existing user."""
    conn = None
    cursor = None
    try:
        conn = db.get_connection()
        cursor = conn.cursor()
        
        cursor.execute("SELECT id, password_hash FROM users WHERE username = %s", (user.username,))
        result = cursor.fetchone()
        
        if not result or result[1] != hash_password(user.password):
            raise HTTPException(status_code=401, detail="Invalid credentials")
        
        user_id = result[0]
        
        access_token = create_access_token(data={"sub": user.username})
        return {"access_token": access_token, "token_type": "bearer", "user_id": user_id}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()


@router.get("/me")
async def get_current_user(username: str = Depends(verify_token)):
    """Get current authenticated user information."""
    conn = None
    cursor = None
    try:
        conn = db.get_connection()
        cursor = conn.cursor()
        
        cursor.execute("SELECT id, username, email, created_at FROM users WHERE username = %s", (username,))
        result = cursor.fetchone()
        
        if not result:
            raise HTTPException(status_code=404, detail="User not found")
        
        return {
            "id": result[0],
            "username": result[1],
            "email": result[2],
            "created_at": result[3].isoformat()
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

