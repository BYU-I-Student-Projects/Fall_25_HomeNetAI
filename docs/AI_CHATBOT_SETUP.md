# AI Chatbot Integration Setup Guide

## Overview
The AI chatbot integration uses Google's Gemini API to provide intelligent insights about weather data and smart home information. Gemini offers a generous free tier and excellent performance.

## Features Implemented

### Backend
- ✅ **AI Service** (`backend/services/ai_service.py`)
  - Google Gemini AI integration
  - Context-aware responses using user's weather and location data
  - Automatic insight generation based on weather conditions
  - Weather code interpretation

- ✅ **AI Routes** (`backend/routes/ai.py`)
  - `POST /ai/chat` - Send messages to AI chatbot
  - `GET /ai/insights` - Get AI-generated insights
  - JWT authentication required
  - Conversation context management

### Frontend
- ✅ **Chat Interface** (`frontend/src/components/ChatInterface.tsx`)
  - Real-time chat with AI
  - Message history display
  - Loading states and error handling
  - Clear chat functionality

- ✅ **AI Insights Page** (`frontend/src/pages/AIInsights.tsx`)
  - Split layout with insights panel and chat interface
  - Smart insights with color-coded types (info, warning, tip, error)
  - Quick tips section
  - Refresh insights button

## Setup Instructions

### 1. Install Dependencies

```bash
# Backend - Install OpenAI package
pip install -r requirements.txt
```

### 2. Get Google Gemini API Key

1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy the generated API key

### 3. Configure Environment Variables

Create a `.env` file in the project root (or set environment variables):

```bash
# Required for AI chatbot
GEMINI_API_KEY=your-actual-gemini-api-key-here

# Optional - customize AI behavior
GEMINI_MODEL=gemini-pro            # Main model (gemini-pro or gemini-pro-vision)
GEMINI_TEMPERATURE=0.7             # 0.0-1.0, higher = more creative
```

### 4. Start the Application

```bash
# Backend
cd backend
python start_backend.py

# Frontend (new terminal)
cd frontend
npm run dev
```

### 5. Access AI Features

1. Navigate to `http://localhost:5173`
2. Log in to your account
3. Click "AI Insights" button on the dashboard
4. Start chatting with the AI assistant!

## How It Works

### AI Context
The chatbot has access to:
- Your saved locations and coordinates
- Current weather conditions
- 7-day weather forecast
- Device information (when implemented)

### Example Queries
- "What's the weather like today?"
- "Should I bring an umbrella tomorrow?"
- "What's the temperature trend this week?"
- "Give me energy saving tips"
- "Is it going to rain this weekend?"

### Insights Generation
The system automatically generates insights based on:
- Temperature extremes (hot/cold warnings)
- Precipitation forecasts
- High wind alerts
- Energy saving opportunities

## API Endpoints

### POST /ai/chat
Send a message to the AI chatbot.

**Request:**
```json
{
  "message": "What's the weather like?",
  "conversation_id": "optional-uuid"
}
```

**Response:**
```json
{
  "response": "AI-generated response...",
  "conversation_id": "uuid",
  "timestamp": "2025-12-01T12:00:00"
}
```

### GET /ai/insights
Get AI-generated insights.

**Response:**
```json
[
  {
    "type": "warning",
    "title": "High Temperature Alert",
    "message": "Temperature is 35°C. Stay hydrated!"
  }
]
```

## Cost Considerations
## Cost Considerations

### Google Gemini Pricing (as of 2025)
- **Free Tier**: 60 requests per minute (very generous!)
- **Gemini Pro**: Free for developers
- **Paid Tier**: Available for production use with higher limits

### Usage Limits
- Free tier: 60 requests/minute, 1500 requests/day
- Perfect for development and small-scale deployment
- No credit card required for free tier

**Estimated costs:**
- Development/Testing: **FREE** (within free tier limits)
- Small app (< 1500 requests/day): **FREE**
## Troubleshooting

### \"AI service is not configured\"
- Ensure `GEMINI_API_KEY` is set in environment variables
- Verify the key is valid in [Google AI Studio](https://makersuite.google.com/app/apikey)
- Check that you have API access enabled

### \"Rate limit exceeded\"
- You've exceeded the free tier rate limits (60 requests/minute)
- Wait a minute and try again
- For higher limits, consider upgrading to a paid tier

### Chat not responding
- Check backend logs for errors
- Verify Gemini API is accessible (not blocked by firewall)
- Ensure your Google Cloud project has the Generative AI API enabledked by firewall)
- Ensure you have sufficient OpenAI credits

### No insights showing
- Add at least one location to your account
- Check that weather data has been collected
- Click the refresh button to reload insights

## Future Enhancements

### Planned Features
- [ ] Conversation history storage in database
- [ ] Multi-turn conversation memory
- [ ] Voice input/output support
- [ ] Custom AI personalities
- [ ] Integration with device control
- [ ] Predictive analytics
- [ ] Anomaly detection alerts
- [ ] Scheduled insights reports

### Database Schema (Future)
```sql
CREATE TABLE conversations (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  conversation_id UUID,
  created_at TIMESTAMP
);

CREATE TABLE messages (
  id SERIAL PRIMARY KEY,
  conversation_id UUID,
  role VARCHAR(20),  -- 'user' or 'assistant'
  content TEXT,
  timestamp TIMESTAMP
);
## Security Notes

- Never commit your `.env` file with real API keys
- API keys are sensitive - treat them like passwords
- Use environment variables for production
- Consider rate limiting the chat endpoint
- Monitor Gemini API usage in Google Cloud Console
- Free tier has built-in rate limits to prevent overuse
- Consider rate limiting the chat endpoint
- Monitor OpenAI usage to avoid unexpected costs

## Testing

### Manual Testing
1. Open AI Insights page
2. Send a test message: "Hello"
3. Verify AI responds
4. Check insights panel updates
5. Test with weather-related queries

### Expected Behavior
- Chat responses within 2-5 seconds
- Context-aware responses about your locations
- Insights refresh showing relevant alerts
- Error handling for invalid requests
## Support

For issues or questions:
1. Check Google Cloud status: https://status.cloud.google.com/
2. Review backend logs for errors
3. Verify environment variables are set correctly
4. Check API key is valid in Google AI Studio
5. Ensure Generative AI API is enabled in your Google Cloud projectorrectly
4. Check API key is valid and has credits

---

**Ready to chat with your AI assistant!** 🤖
