# 🔌 HomeNetAI API Documentation

## 🌐 Base URL
```
http://localhost:8000
```

## 📋 Authentication

All endpoints (except auth) require JWT token in Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

---

## 🔐 Authentication Endpoints

### **POST** `/auth/register`
Register a new user account.

**Request Body:**
```json
{
  "username": "johndoe",
  "email": "john@example.com", 
  "password": "securepassword123"
}
```

**Response:**
```json
{
  "message": "User registered successfully",
  "user_id": 1
}
```

**Status Codes:**
- `201` - User created successfully
- `400` - Invalid input data
- `409` - Username/email already exists

---

### **POST** `/auth/login`
Login user and get JWT token.

**Request Body:**
```json
{
  "username": "johndoe",
  "password": "securepassword123"
}
```

**Response:**
```json
{
  "access_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
  "token_type": "bearer",
  "user_id": 1,
  "username": "johndoe"
}
```

**Status Codes:**
- `200` - Login successful
- `401` - Invalid credentials
- `400` - Missing username/password

---

### **GET** `/auth/me`
Get current user information.

**Headers:**
```
Authorization: Bearer <jwt-token>
```

**Response:**
```json
{
  "user_id": 1,
  "username": "johndoe",
  "email": "john@example.com",
  "created_at": "2025-01-27T10:30:00Z"
}
```

**Status Codes:**
- `200` - User info retrieved
- `401` - Invalid/expired token

---

## 📍 Location Management Endpoints

### **GET** `/locations/search`
Search for locations worldwide.

**Query Parameters:**
- `query` (string, required) - City name to search for

**Example:**
```
GET /locations/search?query=New York
```

**Response:**
```json
[
  {
    "name": "New York, United States",
    "latitude": 40.7128,
    "longitude": -74.0060,
    "country": "United States",
    "admin1": "New York"
  },
  {
    "name": "New York Mills, United States", 
    "latitude": 43.1053,
    "longitude": -75.2917,
    "country": "United States",
    "admin1": "New York"
  }
]
```

**Status Codes:**
- `200` - Search results returned
- `400` - Missing query parameter
- `500` - Geocoding API error

---

### **GET** `/locations`
Get user's saved locations.

**Headers:**
```
Authorization: Bearer <jwt-token>
```

**Response:**
```json
[
  {
    "id": 1,
    "name": "New York, NY",
    "latitude": 40.7128,
    "longitude": -74.0060,
    "created_at": "2025-01-27T10:30:00Z"
  },
  {
    "id": 2,
    "name": "Los Angeles, CA", 
    "latitude": 34.0522,
    "longitude": -118.2437,
    "created_at": "2025-01-27T11:15:00Z"
  }
]
```

**Status Codes:**
- `200` - Locations retrieved
- `401` - Invalid token

---

### **POST** `/locations`
Add a new location for the user.

**Headers:**
```
Authorization: Bearer <jwt-token>
```

**Request Body:**
```json
{
  "name": "New York, NY",
  "latitude": 40.7128,
  "longitude": -74.0060
}
```

**Response:**
```json
{
  "id": 1,
  "message": "Location added successfully with weather data"
}
```

**Status Codes:**
- `201` - Location created successfully
- `400` - Invalid coordinates or missing data
- `401` - Invalid token
- `500` - Database or weather API error

**Note:** Weather data is automatically fetched and stored when location is added.

---

### **DELETE** `/locations/{location_id}`
Delete a user's location and all associated weather data.

**Headers:**
```
Authorization: Bearer <jwt-token>
```

**Path Parameters:**
- `location_id` (integer) - ID of location to delete

**Response:**
```json
{
  "message": "Location deleted successfully"
}
```

**Status Codes:**
- `200` - Location deleted successfully
- `404` - Location not found
- `401` - Invalid token
- `403` - Location belongs to different user

---

## 🌤️ Weather Data Endpoints

### **GET** `/weather/{location_id}`
Get comprehensive weather data for a location.

**Headers:**
```
Authorization: Bearer <jwt-token>
```

**Path Parameters:**
- `location_id` (integer) - ID of location

**Response:**
```json
{
  "location": {
    "id": 1,
    "name": "New York, NY",
    "latitude": 40.7128,
    "longitude": -74.0060
  },
  "current_weather": {
    "temperature": 15.2,
    "apparent_temperature": 13.8,
    "humidity": 65,
    "precipitation": 0.0,
    "precipitation_probability": 20,
    "wind_speed": 12.5,
    "wind_direction": 180,
    "cloud_cover": 45,
    "uv_index": 3.2,
    "weather_code": 1,
    "timestamp": "2025-01-27T15:30:00Z"
  },
  "hourly_forecast": [
    {
      "timestamp": "2025-01-27T16:00:00Z",
      "temperature": 16.1,
      "apparent_temperature": 14.5,
      "humidity": 62,
      "precipitation": 0.0,
      "precipitation_probability": 15,
      "wind_speed": 11.8,
      "wind_direction": 175,
      "cloud_cover": 40,
      "uv_index": 2.8,
      "weather_code": 1
    }
  ],
  "daily_forecast": [
    {
      "date": "2025-01-27",
      "temp_max": 18.5,
      "temp_min": 12.3,
      "precipitation_sum": 0.0,
      "precipitation_probability_max": 25,
      "wind_speed_max": 15.2,
      "uv_index_max": 4.1
    }
  ]
}
```

**Status Codes:**
- `200` - Weather data retrieved
- `404` - Location not found
- `401` - Invalid token
- `403` - Location belongs to different user

---

### **GET** `/weather/{location_id}/forecast`
Get 7-day weather forecast for a location.

**Headers:**
```
Authorization: Bearer <jwt-token>
```

**Path Parameters:**
- `location_id` (integer) - ID of location

**Response:**
```json
{
  "location": {
    "id": 1,
    "name": "New York, NY"
  },
  "forecast": [
    {
      "date": "2025-01-27",
      "temp_max": 18.5,
      "temp_min": 12.3,
      "precipitation_sum": 0.0,
      "precipitation_probability_max": 25,
      "wind_speed_max": 15.2,
      "uv_index_max": 4.1
    },
    {
      "date": "2025-01-28", 
      "temp_max": 16.8,
      "temp_min": 10.1,
      "precipitation_sum": 2.5,
      "precipitation_probability_max": 80,
      "wind_speed_max": 18.7,
      "uv_index_max": 2.3
    }
  ]
}
```

**Status Codes:**
- `200` - Forecast retrieved
- `404` - Location not found
- `401` - Invalid token

---

### **GET** `/weather/{location_id}/history`
Get historical weather data for a location.

**Headers:**
```
Authorization: Bearer <jwt-token>
```

**Path Parameters:**
- `location_id` (integer) - ID of location

**Query Parameters:**
- `days` (integer, optional) - Number of days to retrieve (default: 7, max: 30)

**Example:**
```
GET /weather/1/history?days=14
```

**Response:**
```json
{
  "location": {
    "id": 1,
    "name": "New York, NY"
  },
  "history": [
    {
      "date": "2025-01-26",
      "temp_max": 17.2,
      "temp_min": 11.8,
      "precipitation_sum": 1.2,
      "precipitation_probability_max": 60,
      "wind_speed_max": 14.3,
      "uv_index_max": 3.8
    }
  ]
}
```

**Status Codes:**
- `200` - History retrieved
- `404` - Location not found
- `401` - Invalid token
- `400` - Invalid days parameter

---

## 📊 Data Collection Endpoints

### **POST** `/admin/collect-weather`
Manually trigger weather data collection for all locations.

**Headers:**
```
Authorization: Bearer <jwt-token>
```

**Response:**
```json
{
  "message": "Weather data collection started",
  "locations_processed": 5,
  "successful": 4,
  "failed": 1
}
```

**Status Codes:**
- `200` - Collection started
- `401` - Invalid token
- `500` - Collection failed

---

## 🔧 Error Responses

### **Standard Error Format:**
```json
{
  "detail": "Error message description",
  "status_code": 400
}
```

### **Common Error Codes:**
- `400` - Bad Request (invalid data)
- `401` - Unauthorized (invalid/missing token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found (resource doesn't exist)
- `409` - Conflict (duplicate data)
- `422` - Validation Error (invalid input format)
- `500` - Internal Server Error

---

## 🚀 Rate Limiting

### **Current Limits:**
- **Authentication**: 10 requests per minute per IP
- **Weather API**: 1000 requests per day (Open-Meteo limit)
- **Location Search**: 100 requests per minute per user

### **Rate Limit Headers:**
```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1640995200
```

---

## 📝 Example Usage

### **Complete Workflow:**

1. **Register User:**
```bash
curl -X POST http://localhost:8000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"johndoe","email":"john@example.com","password":"password123"}'
```

2. **Login:**
```bash
curl -X POST http://localhost:8000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"johndoe","password":"password123"}'
```

3. **Search Location:**
```bash
curl "http://localhost:8000/locations/search?query=New York" \
  -H "Authorization: Bearer <your-token>"
```

4. **Add Location:**
```bash
curl -X POST http://localhost:8000/locations \
  -H "Authorization: Bearer <your-token>" \
  -H "Content-Type: application/json" \
  -d '{"name":"New York, NY","latitude":40.7128,"longitude":-74.0060}'
```

5. **Get Weather:**
```bash
curl "http://localhost:8000/weather/1" \
  -H "Authorization: Bearer <your-token>"
```

---

## 🔍 Interactive API Documentation

When the backend is running, visit:
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

These provide interactive documentation where you can test endpoints directly in your browser.

---

**🚀 Your API is fully documented and ready for frontend integration!**
