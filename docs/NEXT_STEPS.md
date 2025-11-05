# Next Steps for Team Development

## Current Status ✅

### Completed Features
- ✅ **Backend API**: Authentication, locations, weather endpoints
- ✅ **Database**: PostgreSQL schema with all tables and indexes
- ✅ **Frontend UI**: React app with routing and basic pages
- ✅ **Weather Integration**: Real-time weather data from Open-Meteo API
- ✅ **Code Organization**: Clean structure with routes, models, auth modules
- ✅ **API Integration**: Frontend connected to backend

## Priority 1: Core Features (Sprint 2)

### 1. Smart Home Device Management
**Status**: Frontend UI exists, backend API needed

**Tasks:**
- [ ] Create backend API endpoints for devices:
  - `GET /devices` - Get user's devices
  - `POST /devices` - Add new device
  - `PUT /devices/{id}` - Update device (status, value)
  - `DELETE /devices/{id}` - Remove device
- [ ] Add `devices` table to database schema
- [ ] Connect frontend `SmartHome.tsx` to backend API
- [ ] Store device state in database (not just localStorage)

**Files to create/modify:**
- `backend/database/schema.sql` - Add devices table
- `backend/routes/devices.py` - Device endpoints
- `backend/models/schemas.py` - Device models
- `frontend/src/services/api.ts` - Device API calls

**Estimated Time**: 2-3 days

---

### 2. Smart Home Sensor Simulation
**Status**: `homedata_sim/home_sim.py` exists but not integrated

**Tasks:**
- [ ] Integrate sensor simulation with scheduler
- [ ] Store simulated sensor readings in database
- [ ] Create `readings` table for time-series sensor data
- [ ] Run simulation every hour (alongside weather collection)
- [ ] Connect simulation to device management

**Files to modify:**
- `backend/database/schema.sql` - Add readings table
- `backend/weather/scheduler.py` - Add sensor simulation
- `backend/homedata_sim/home_sim.py` - Integrate with database

**Estimated Time**: 1-2 days

---

### 3. Historical Data Access
**Status**: Database stores data, but no API endpoints

**Tasks:**
- [ ] Create `GET /data/historical` endpoint
  - Filter by date range
  - Filter by location/device
  - Return time-series data
- [ ] Add pagination for large datasets
- [ ] Create frontend components to display historical charts

**Files to create:**
- `backend/routes/data.py` - Historical data endpoints
- `frontend/src/pages/Analytics.tsx` - Implement charts

**Estimated Time**: 2-3 days

---

## Priority 2: AI/ML Features (Sprint 3)

### 4. AI Chatbot Integration
**Status**: Frontend placeholder exists

**Tasks:**
- [ ] Set up GPT API integration (OpenAI or similar)
- [ ] Create `POST /ai/chat` endpoint
- [ ] Implement context from user's data (devices, weather, locations)
- [ ] Build chat UI in `AIInsights.tsx`
- [ ] Add conversation history storage

**Files to create:**
- `backend/routes/ai.py` - AI endpoints
- `backend/services/ai_service.py` - GPT API integration
- `frontend/src/components/ChatInterface.tsx` - Chat UI

**Estimated Time**: 3-4 days

---

### 5. Predictive Models
**Status**: Required for MVP

**Tasks:**
- [ ] **Energy Usage Prediction**:
  - Train model on historical energy data
  - Predict based on time, day, temperature
  - Create `POST /ai/predict/energy` endpoint
- [ ] **Anomaly Detection**:
  - Detect temperature spikes
  - Detect unexpected energy usage
  - Create `GET /ai/anomalies` endpoint
- [ ] Set up training pipeline from database
- [ ] Display predictions in frontend

**Files to create:**
- `backend/services/ml_models.py` - ML models
- `backend/services/anomaly_detector.py` - Anomaly detection
- `backend/routes/ai.py` - Add prediction endpoints

**Estimated Time**: 4-5 days

---

## Priority 3: Notification System (Sprint 3)

### 6. Notification System
**Status**: Not started

**Tasks:**
- [ ] Set up ntfy.sh integration
- [ ] Create `notifications` table in database
- [ ] Implement notification triggers:
  - Motion detected when user away
  - Energy spikes
  - Severe weather alerts
- [ ] Add user notification preferences
- [ ] Create notification log in database

**Files to create:**
- `backend/database/schema.sql` - Add notifications table
- `backend/services/notifications.py` - ntfy.sh integration
- `backend/routes/notifications.py` - Notification endpoints
- `frontend/src/pages/Settings.tsx` - Notification preferences

**Estimated Time**: 2-3 days

---

## Priority 4: Analytics & Insights (Sprint 4)

### 7. Analytics Dashboard
**Status**: Frontend placeholder exists

**Tasks:**
- [ ] Create charts for:
  - Energy usage over time
  - Temperature trends
  - Weather patterns
  - Device activity
- [ ] Add date range filters
- [ ] Implement data aggregation
- [ ] Create export functionality

**Files to modify:**
- `frontend/src/pages/Analytics.tsx` - Implement charts
- `frontend/src/components/Charts.tsx` - Chart components
- `backend/routes/data.py` - Add aggregation endpoints

**Estimated Time**: 3-4 days

---

### 8. AI Insights Page
**Status**: Frontend placeholder exists

**Tasks:**
- [ ] Display AI-generated insights:
  - Energy saving recommendations
  - Weather-based alerts
  - Device usage patterns
  - Anomaly alerts
- [ ] Create insight generation service
- [ ] Update insights in real-time

**Files to modify:**
- `frontend/src/pages/AIInsights.tsx` - Implement insights
- `backend/services/insights.py` - Insight generation

**Estimated Time**: 2-3 days

---

## Priority 5: Testing & Quality (Ongoing)

### 9. Testing
**Tasks:**
- [ ] Write unit tests for backend endpoints
- [ ] Write integration tests for API
- [ ] Test database operations
- [ ] Test frontend components
- [ ] Test error handling

**Files to create:**
- `backend/tests/` - Test files
- `frontend/src/__tests__/` - Frontend tests

**Estimated Time**: Ongoing

---

### 10. Error Handling & Validation
**Tasks:**
- [ ] Add input validation to all endpoints
- [ ] Improve error messages
- [ ] Add logging
- [ ] Handle API failures gracefully
- [ ] Add retry logic for external APIs

**Estimated Time**: 1-2 days

---

## Priority 6: Security & Performance

### 11. Security Improvements
**Tasks:**
- [ ] Use bcrypt instead of SHA-256 for passwords
- [ ] Add rate limiting
- [ ] Add input sanitization
- [ ] Add environment variable validation
- [ ] Add API key rotation

**Estimated Time**: 2-3 days

---

### 12. Performance Optimization
**Tasks:**
- [ ] Add database connection pooling
- [ ] Optimize database queries
- [ ] Add caching for weather data
- [ ] Optimize frontend bundle size
- [ ] Add pagination everywhere

**Estimated Time**: 2-3 days

---

## Recommended Team Workflow

### Week 1-2: Core Features
- **Person 1**: Smart Home Device Management (backend)
- **Person 2**: Smart Home Device Management (frontend)
- **Person 3**: Sensor Simulation Integration
- **Person 4**: Historical Data API

### Week 3-4: AI/ML Features
- **Person 1**: Chatbot Integration
- **Person 2**: Predictive Models (Energy)
- **Person 3**: Anomaly Detection
- **Person 4**: Frontend AI Integration

### Week 5: Notifications & Polish
- **Person 1**: Notification System
- **Person 2**: Analytics Dashboard
- **Person 3**: AI Insights Page
- **Person 4**: Testing & Bug Fixes

---

## Quick Start for Each Feature

### Setting Up a New Feature

1. **Create Database Tables** (if needed):
   ```sql
   -- Add to backend/database/schema.sql
   CREATE TABLE IF NOT EXISTS devices (
       id SERIAL PRIMARY KEY,
       user_id INTEGER NOT NULL,
       name VARCHAR(255) NOT NULL,
       type VARCHAR(50) NOT NULL,
       ...
       FOREIGN KEY (user_id) REFERENCES users (id)
   );
   ```

2. **Create Backend Route**:
   ```python
   # backend/routes/devices.py
   from fastapi import APIRouter
   router = APIRouter(prefix="/devices", tags=["devices"])
   
   @router.get("")
   async def get_devices(...):
       ...
   ```

3. **Add to Main App**:
   ```python
   # backend/main.py
   from routes import devices
   app.include_router(devices.router)
   ```

4. **Create Frontend API**:
   ```typescript
   // frontend/src/services/api.ts
   export const deviceAPI = {
     getDevices: async () => { ... },
     addDevice: async (device) => { ... },
   };
   ```

5. **Update Frontend Page**:
   ```typescript
   // frontend/src/pages/SmartHome.tsx
   const devices = await deviceAPI.getDevices();
   ```

---

## Resources

- **Database Setup**: `docs/DATABASE_SETUP.md`
- **API Documentation**: `http://localhost:8000/docs` (when backend is running)
- **Project Plan**: `docs/GroupProjectPlan.md`

---

## Questions to Resolve

1. **Device Management**: Real devices or continue with simulation?
2. **AI API**: Which service? (OpenAI, Anthropic, local model?)
3. **Notifications**: User preferences storage?
4. **Deployment**: Where to deploy? (Heroku, AWS, local?)

---

## Next Immediate Steps

1. **Today**: Set up database and verify everything works
2. **This Week**: Start Smart Home Device Management (highest priority)
3. **Next Week**: Begin AI/ML feature planning and research

