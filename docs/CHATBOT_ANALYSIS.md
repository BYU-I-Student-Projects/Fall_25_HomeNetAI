# Chatbot Implementation Analysis

## How the Chatbot Works

### Overview
The chatbot uses **Google Gemini AI** (not OpenAI) to provide intelligent responses about weather data and smart home information. It's context-aware and uses your actual location and weather data.

### Architecture

#### Backend Components

1. **AI Service** (`backend/services/ai_service.py`)
   - Integrates with Google Gemini API
   - Builds context from user's locations, weather, and devices
   - Generates chat responses and insights
   - Handles conversation history

2. **AI Routes** (`backend/routes/ai.py`)
   - `POST /ai/chat` - Send messages to AI
   - `GET /ai/insights` - Get AI-generated insights
   - Requires JWT authentication
   - Gathers user context (locations, weather, devices)

#### Frontend Components

1. **ChatInterface** (`frontend/src/components/ChatInterface.tsx`)
   - Real-time chat UI
   - Message history
   - Loading states
   - Conversation management

2. **AI Insights Page** (`frontend/src/pages/AIInsights.tsx`)
   - Split layout with insights panel and chat
   - Color-coded insights (info, warning, tip, error)
   - Auto-refresh capabilities

### How It Works

1. **User sends message** → Frontend calls `/ai/chat`
2. **Backend gathers context**:
   - User's locations
   - Current weather data
   - 7-day forecast
   - Device information (if available)
3. **AI Service builds prompt** with context
4. **Gemini generates response** using context
5. **Response returned** to user

### Context Building
The AI has access to:
- Your saved locations and coordinates
- Current weather conditions (temperature, humidity, wind, etc.)
- 7-day weather forecast
- Device status (when implemented)

---

## What You Need to Add

### ✅ What You Already Have
- Database structure (users, locations, weather_data)
- Authentication system (JWT)
- Weather API integration
- Frontend React app

### ❌ What's Missing

#### 1. Backend Dependencies
**File:** `requirements.txt`
```python
google-generativeai==0.3.1  # Missing!
python-dotenv==1.0.0         # Missing!
```

#### 2. Configuration
**File:** `config.py`
```python
# Add these to Config class:
GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
GEMINI_MODEL: str = os.getenv("GEMINI_MODEL", "gemini-pro")
GEMINI_TEMPERATURE: float = float(os.getenv("GEMINI_TEMPERATURE", "0.7"))
```

#### 3. Backend Files to Copy
From `CHATBOT/Fall_25_HomeNetAI/backend/`:
- `routes/ai.py` → Copy to your `backend/routes/ai.py`
- `services/ai_service.py` → Copy to your `backend/services/ai_service.py`

#### 4. Backend Router Registration
**File:** `backend/main.py`
```python
from routes import auth, locations, weather, devices, images, ai  # Add 'ai'

# Add this line:
app.include_router(ai.router)
```

#### 5. Frontend Files to Copy
From `CHATBOT/Fall_25_HomeNetAI/frontend/src/`:
- `components/ChatInterface.tsx` → Copy to your `frontend/src/components/`
- `pages/AIInsights.tsx` → Copy to your `frontend/src/pages/` (or update existing)

#### 6. Frontend API Service
**File:** `frontend/src/services/api.ts`
Add AI API methods:
```typescript
export const aiAPI = {
  chat: async (message: string, conversationId?: string) => {
    return apiRequest<{
      response: string;
      conversation_id: string;
      timestamp: string;
    }>('/ai/chat', {
      method: 'POST',
      body: JSON.stringify({ message, conversation_id: conversationId }),
    });
  },

  getInsights: async () => {
    return apiRequest<Array<{
      type: string;
      title: string;
      message: string;
    }>>('/ai/insights');
  },
};
```

#### 7. Environment Variables
Create `.env` file in project root:
```bash
GEMINI_API_KEY=your-actual-gemini-api-key-here
GEMINI_MODEL=gemini-pro
GEMINI_TEMPERATURE=0.7
```

#### 8. Get Gemini API Key
1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with Google account
3. Click "Create API Key"
4. Copy the key to your `.env` file

---

## Database Compatibility

The chatbot expects these database structures:
- ✅ `users` table - You have this
- ✅ `user_locations` table - You have this
- ✅ `weather_data` table - You have this (but column names might differ)
- ✅ `daily_weather` table - You have this (but column names might differ)

**Note:** The chatbot code queries specific column names. You may need to adjust:
- `weather_data` columns: `temperature`, `apparent_temperature`, `humidity`, `precipitation`, `wind_speed`, `wind_direction`, `cloud_cover`, `weather_code`, `timestamp`
- `daily_weather` columns: `date`, `temp_max`, `temp_min`, `precipitation_sum`, `precipitation_probability_max`, `wind_speed_max`

---

## Integration Steps

### Step 1: Install Dependencies
```bash
cd Fall_25_HomeNetAI
pip install google-generativeai python-dotenv
```

### Step 2: Update Config
Add Gemini settings to `config.py`

### Step 3: Copy Backend Files
Copy AI routes and service from chatbot folder

### Step 4: Register Router
Add AI router to `main.py`

### Step 5: Copy Frontend Files
Copy ChatInterface component and update AI Insights page

### Step 6: Update Frontend API
Add AI API methods to `api.ts`

### Step 7: Get API Key
Get Gemini API key and add to `.env`

### Step 8: Test
Start backend and frontend, navigate to AI Insights page

---

## Cost & Limits

### Google Gemini Free Tier
- **60 requests per minute**
- **1,500 requests per day**
- **No credit card required**
- Perfect for development and demos

### Pricing
- Development: **FREE** (within limits)
- Small apps: **FREE** (under 1500 requests/day)

---

## Key Differences from Your Current Setup

1. **Database Column Names**: Chatbot expects specific column names that might differ from your schema
2. **Context Gathering**: Chatbot queries database directly, needs to match your schema
3. **Authentication**: Uses same JWT system (compatible)
4. **Weather Data**: Expects specific structure from database queries

---

## Next Steps

1. ✅ Review this analysis
2. ⬜ Copy backend files (routes/ai.py, services/ai_service.py)
3. ⬜ Update config.py with Gemini settings
4. ⬜ Add dependencies to requirements.txt
5. ⬜ Register AI router in main.py
6. ⬜ Copy frontend ChatInterface component
7. ⬜ Update frontend API service
8. ⬜ Get Gemini API key
9. ⬜ Test integration

---

## Potential Issues

1. **Database Schema Mismatch**: Column names might not match
2. **Missing Context**: If no locations/weather data, chatbot will work but with limited context
3. **API Key**: Without key, chatbot will show "AI service not configured" message
4. **Rate Limits**: Free tier has limits (60/min, 1500/day)

---

**Ready to integrate?** Let me know if you want me to help copy the files and set everything up!

