# 🚀 Quick Setup Guide for Teammates

## ⚡ **5-Minute Setup** (Get Running Fast!)

### **Step 1: Prerequisites** (2 minutes)
- **Node.js**: Download from [nodejs.org](https://nodejs.org) (LTS version)
- **Python**: Download from [python.org](https://python.org) (3.8+)
- **PostgreSQL**: Download from [postgresql.org](https://postgresql.org) (12+)

### **Step 2: Clone & Setup** (3 minutes)
```bash
# 1. Clone the repository
git clone <your-repo-url>
cd Fall_25_HomeNetAI

# 2. Setup database
createdb homenet

# 3. Install backend dependencies
pip install -r requirements.txt

# 4. Install frontend dependencies
cd frontend
npm install
cd ..
```

---

## 🎯 **Start the Application**

### **Terminal 1: Backend**
```bash
cd Fall_25_HomeNetAI/backend
python start_backend.py
```
**✅ Backend running at:** http://localhost:8000

### **Terminal 2: Frontend**
```bash
cd Fall_25_HomeNetAI/frontend
npm run dev
```
**✅ Frontend running at:** http://localhost:5173

---

## 👤 **Register Your Account**

### **1. Open the App**
- Go to: http://localhost:5173
- Click **"Create Account"** or **"Register"**

### **2. Fill Registration Form**
- **Username**: Your preferred username
- **Email**: Your email address
- **Password**: Choose a secure password
- Click **"Create Account"**

### **3. Login**
- Use your username and password
- You'll be redirected to the dashboard

---

## 🌍 **Add Your First Location**

### **1. Add Location**
- Click **"Add Location"** button
- Search for your city (e.g., "New York", "London", "Tokyo")
- Click **"Add"** next to your city

### **2. View Weather**
- Your location will appear on the dashboard
- Weather data loads automatically
- Click on the location card for detailed forecast

---

## ✅ **Verification Checklist**

### **Backend Working:**
- [ ] Terminal shows "Database initialized"
- [ ] No error messages in backend terminal
- [ ] API docs accessible: http://localhost:8000/docs

### **Frontend Working:**
- [ ] App loads at http://localhost:5173
- [ ] Can register new account
- [ ] Can login with your account
- [ ] Can add locations
- [ ] Weather data displays

### **Database Working:**
- [ ] PostgreSQL is running
- [ ] Database `homenet` exists
- [ ] No connection errors in backend

---

## 🔧 **Quick Troubleshooting**

### **"ModuleNotFoundError"**
```bash
pip install -r requirements.txt
```

### **"Database connection failed"**
- Make sure PostgreSQL is running
- Check if database `homenet` exists: `createdb homenet`

### **"npm not recognized"**
- Install Node.js from [nodejs.org](https://nodejs.org)
- Restart your terminal

### **"Port already in use"**
```bash
# Kill processes on ports 8000 and 5173
netstat -an | findstr :8000
netstat -an | findstr :5173
```

---

## 🎉 **You're Ready!**

### **What You Can Do:**
- ✅ **Register & Login**: Create your account
- ✅ **Add Locations**: Search and add cities worldwide
- ✅ **View Weather**: Real-time current weather and forecasts
- ✅ **Dashboard**: Overview of all your locations
- ✅ **Smart Home**: Control mock smart devices
- ✅ **AI Insights**: Get personalized recommendations

### **Next Steps:**
1. **Explore the app** - Try all the features
2. **Add multiple locations** - Test different cities
3. **Check the database** - See your data being stored
4. **Read the docs** - Check out the full documentation

---

## 📚 **Additional Resources**

- **Full Setup Guide**: [docs/TEAM_SETUP_GUIDE.md](docs/TEAM_SETUP_GUIDE.md)
- **API Documentation**: [docs/API_DOCUMENTATION.md](docs/API_DOCUMENTATION.md)
- **Database Overview**: [docs/DATABASE_OVERVIEW.md](docs/DATABASE_OVERVIEW.md)

---

## 🆘 **Need Help?**

### **Common Issues:**
1. **Backend won't start** → Check PostgreSQL is running
2. **Frontend won't load** → Check Node.js is installed
3. **Can't register** → Check backend is running
4. **No weather data** → Check database connection

### **Get Support:**
- Check the terminal output for error messages
- Look at the browser console (F12) for JavaScript errors
- Ask the team lead for help with setup issues

---

**🎯 Goal: Get from zero to registered user in under 5 minutes!**
