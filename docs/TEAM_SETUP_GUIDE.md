# 👥 Team Setup Guide

## 🚀 Quick Start (5 Minutes)

### **Prerequisites**
- **Node.js** (v18+): [Download](https://nodejs.org)
- **Python** (v3.8+): [Download](https://python.org)  
- **PostgreSQL** (v12+): [Download](https://postgresql.org)

---

## 📋 Step-by-Step Setup

### **1. Clone Repository**
```bash
git clone <your-repo-url>
cd Fall_25_HomeNetAI
```

### **2. Database Setup**
```bash
# Create PostgreSQL database
createdb homenet

# OR use the setup script
python setup_postgresql.py
```

### **3. Backend Setup**
```bash
# Install Python dependencies
pip install -r requirements.txt

# Update database connection (if needed)
# Edit backend/database/database.py line 12:
# self.connection_string = "postgresql://username:password@localhost:5432/homenet"

# Start backend
cd backend
python start_backend.py
```

**Backend runs at:** http://localhost:8000
- **API Docs:** http://localhost:8000/docs
- **Weather Scheduler:** Automatically collects data every 30 minutes

### **4. Frontend Setup**
```bash
# Install Node.js dependencies
cd frontend
npm install

# Start development server
npm run dev
# OR use PowerShell script:
.\start.ps1
```

**Frontend runs at:** http://localhost:5173

---

## ✅ **Verification Checklist**

### **Backend Working:**
- [ ] Backend starts without errors
- [ ] API docs accessible at http://localhost:8000/docs
- [ ] Database connection successful
- [ ] Weather scheduler running (check terminal output)

### **Frontend Working:**
- [ ] Frontend loads at http://localhost:5173
- [ ] No console errors
- [ ] Can register/login
- [ ] Can search and add locations
- [ ] Weather data displays correctly

### **Database Working:**
- [ ] PostgreSQL running
- [ ] Database `homenet` exists
- [ ] Tables created (users, user_locations, weather_data, daily_weather)
- [ ] Can insert/query data

---

## 🔧 **Common Issues & Solutions**

### **🐍 Python Issues**

**"ModuleNotFoundError"**
```bash
pip install -r requirements.txt
```

**"Database connection failed"**
- Check PostgreSQL is running
- Verify credentials in `backend/database/database.py`
- Ensure database `homenet` exists

### **⚛️ Node.js Issues**

**"npm not recognized"**
- Install Node.js from [nodejs.org](https://nodejs.org)
- Restart terminal after installation

**"Cannot find module"**
```bash
cd frontend
npm install
```

### **🗄️ Database Issues**

**"Database does not exist"**
```bash
createdb homenet
```

**"Permission denied"**
- Check PostgreSQL user permissions
- Update connection string with correct credentials

---

## 📊 **Project Status**

### **✅ What's Working:**
- **User Authentication**: Register/login with JWT tokens
- **Location Management**: Global city search and management  
- **Weather Data**: Real-time current weather and 7-day forecasts
- **Data Collection**: Automatic 30-minute weather data collection
- **Database**: Professional PostgreSQL schema with 4 tables
- **Frontend**: Clean, responsive React dashboard
- **API**: RESTful endpoints with comprehensive error handling

### **🔄 Data Flow:**
1. User adds location → Weather data fetched immediately
2. Scheduler runs every 30 minutes → Collects data for all locations
3. Frontend displays real-time weather → From database cache
4. Historical data stored → Ready for AI/ML analysis

### **📈 Database Stats:**
- **4 Tables**: users, user_locations, weather_data, daily_weather
- **Data Volume**: ~1,500 data points per location per week
- **Collection**: Every 30 minutes automatically
- **Storage**: PostgreSQL with proper indexing and relationships

---

## 🎯 **Development Workflow**

### **Daily Development:**
1. **Start Backend**: `cd backend && python start_backend.py`
2. **Start Frontend**: `cd frontend && npm run dev`
3. **Test Features**: Register → Add Location → View Weather
4. **Check Database**: Verify data is being collected

### **Code Changes:**
1. **Backend Changes**: Restart backend server
2. **Frontend Changes**: Hot reload (automatic)
3. **Database Changes**: Restart backend to apply schema changes

### **Testing:**
- **API Testing**: Use http://localhost:8000/docs
- **Frontend Testing**: Manual testing in browser
- **Database Testing**: Check data in pgAdmin or psql

---

## 📚 **Documentation**

- **Main README**: [README.md](../README.md)
- **API Documentation**: [API_DOCUMENTATION.md](API_DOCUMENTATION.md)
- **Database Overview**: [DATABASE_OVERVIEW.md](DATABASE_OVERVIEW.md)
- **Project Plan**: [GroupProjectPlan.md](GroupProjectPlan.md)

---

## 🆘 **Getting Help**

### **Check These First:**
1. **Terminal Output**: Look for error messages
2. **Browser Console**: Check for JavaScript errors
3. **Database Status**: Ensure PostgreSQL is running
4. **Port Conflicts**: Make sure ports 8000 and 5173 are free

### **Common Commands:**
```bash
# Check if ports are in use
netstat -an | findstr :8000
netstat -an | findstr :5173

# Check PostgreSQL status
pg_ctl status

# View database tables
psql homenet -c "\dt"
```

### **Team Support:**
- **GitHub Issues**: Create issues for bugs/features
- **Code Reviews**: Submit pull requests for changes
- **Documentation**: Update docs when making changes

---

## 🚀 **Ready to Code!**

Your development environment is now set up and ready for:
- **Feature Development**: Add new weather features
- **UI Improvements**: Enhance the frontend
- **Database Optimization**: Improve queries and performance
- **AI/ML Integration**: Use collected data for analysis

**Happy Coding!** 🎉