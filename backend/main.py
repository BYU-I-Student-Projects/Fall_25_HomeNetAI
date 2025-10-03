from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
import jwt
from datetime import datetime, timedelta
import hashlib

from database.database import HomeNetDatabase
from weather.weather_api import get_weather_data, search_location
from config import config

# Initialize FastAPI app
app = FastAPI(title="HomeNetAI Weather API", version="1.0.0")

# CORS middleware for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=config.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Security
security = HTTPBearer()
SECRET_KEY = config.SECRET_KEY
ALGORITHM = "HS256"

# Database
db = HomeNetDatabase()

# Pydantic Models
class UserCreate(BaseModel):
    username: str
    email: str
    password: str

class UserLogin(BaseModel):
    username: str
    password: str

class LocationCreate(BaseModel):
    name: str
    latitude: float
    longitude: float


# Authentication functions
def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.now() + timedelta(hours=24)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def verify_token(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise HTTPException(status_code=401, detail="Invalid token")
        return username
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()

# API Endpoints


# Authentication endpoints
@app.post("/auth/register")
async def register(user: UserCreate):
    # Register a new user
    try:
        # Check if user already exists
        conn = db.get_connection()
        cursor = conn.cursor()
        
        cursor.execute("SELECT id FROM users WHERE username = %s OR email = %s", 
                      (user.username, user.email))
        if cursor.fetchone():
            raise HTTPException(status_code=400, detail="Username or email already exists")
        
        # Create user
        hashed_password = hash_password(user.password)
        cursor.execute("""
            INSERT INTO users (username, email, password_hash, created_at)
            VALUES (%s, %s, %s, %s)
            RETURNING id
        """, (user.username, user.email, hashed_password, datetime.now()))
        
        user_id = cursor.fetchone()[0]
        conn.commit()
        cursor.close()
        conn.close()
        
        # Create token
        access_token = create_access_token(data={"sub": user.username})
        return {"access_token": access_token, "token_type": "bearer", "user_id": user_id}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/auth/login")
async def login(user: UserLogin):
    # Login user
    try:
        conn = db.get_connection()
        cursor = conn.cursor()
        
        cursor.execute("SELECT id, password_hash FROM users WHERE username = %s", (user.username,))
        result = cursor.fetchone()
        
        if not result or result[1] != hash_password(user.password):
            raise HTTPException(status_code=401, detail="Invalid credentials")
        
        user_id = result[0]
        cursor.close()
        conn.close()
        
        # Create token
        access_token = create_access_token(data={"sub": user.username})
        return {"access_token": access_token, "token_type": "bearer", "user_id": user_id}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/auth/me")
async def get_current_user(username: str = Depends(verify_token)):
    # Get current user info
    try:
        conn = db.get_connection()
        cursor = conn.cursor()
        
        cursor.execute("SELECT id, username, email, created_at FROM users WHERE username = %s", (username,))
        result = cursor.fetchone()
        
        if not result:
            raise HTTPException(status_code=404, detail="User not found")
        
        cursor.close()
        conn.close()
        
        return {
            "id": result[0],
            "username": result[1],
            "email": result[2],
            "created_at": result[3].isoformat()
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Location search endpoint
@app.get("/locations/search")
async def search_locations(query: str):
    # Search for locations using geocoding API
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

# User locations endpoints
@app.get("/locations")
async def get_user_locations(username: str = Depends(verify_token)):
    # Get user's saved locations
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

@app.post("/locations")
async def add_user_location(location: LocationCreate, username: str = Depends(verify_token)):
    # Add a new location for the user
    try:
        conn = db.get_connection()
        cursor = conn.cursor()
        
        # Get user ID
        cursor.execute("SELECT id FROM users WHERE username = %s", (username,))
        user_result = cursor.fetchone()
        if not user_result:
            raise HTTPException(status_code=404, detail="User not found")
        
        user_id = user_result[0]
        
        # Add location
        cursor.execute("""
            INSERT INTO user_locations (user_id, name, latitude, longitude, created_at)
            VALUES (%s, %s, %s, %s, %s)
            RETURNING id
        """, (user_id, location.name, location.latitude, location.longitude, datetime.now()))
        
        location_id = cursor.fetchone()[0]
        conn.commit()
        
        # Immediately fetch and store weather data for this location
        try:
            weather_data = get_weather_data(location.latitude, location.longitude)
            db.insert_weather_data(
                location.name,
                weather_data,
                location.latitude,
                location.longitude,
                user_id
            )
            print(f"✅ Stored weather data for {location.name}")
        except Exception as weather_error:
            print(f"⚠️  Weather data collection failed for {location.name}: {weather_error}")
            # Don't fail the location creation if weather fails
        
        cursor.close()
        conn.close()
        
        return {"id": location_id, "message": "Location added successfully with weather data"}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/locations/{location_id}")
async def delete_user_location(location_id: int, username: str = Depends(verify_token)):
    # Delete a user's location
    try:
        conn = db.get_connection()
        cursor = conn.cursor()
        
        # Verify ownership and delete
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
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Weather endpoints
@app.get("/weather/{location_id}")
async def get_weather_for_location(location_id: int, username: str = Depends(verify_token)):
    # Get current weather for a user's location
    try:
        conn = db.get_connection()
        cursor = conn.cursor()
        
        # Get location details
        cursor.execute("""
            SELECT ul.name, ul.latitude, ul.longitude
            FROM user_locations ul
            JOIN users u ON ul.user_id = u.id
            WHERE ul.id = %s AND u.username = %s
        """, (location_id, username))
        
        location = cursor.fetchone()
        if not location:
            raise HTTPException(status_code=404, detail="Location not found")
        
        cursor.close()
        conn.close()
        
        # Get weather data using coordinates
        weather_data = get_weather_data(location[1], location[2])
        
        return {
            "location": location[0],
            "current_weather": weather_data.get("current_weather", {}),
            "daily_forecast": weather_data.get("daily", {})
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
