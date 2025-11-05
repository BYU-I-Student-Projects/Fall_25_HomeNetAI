# HomeNetAI Frontend

React frontend connected to HomeNetAI backend API.

## ✅ What's Already Done

1. **API Service** (`src/services/api.ts`) - Clean backend integration
2. **Login Page** - Connected to real API
3. **Register Page** - Connected to real API  
4. **ProtectedRoute** - Uses auth token
5. **DashboardLayout** - Uses authAPI for logout
6. **CORS Configuration** - Backend allows frontend origin
7. **Config Files** - package.json, vite.config.ts, tsconfig.json ready

## 📋 Next Steps

### 1. Copy Frontend Files

Copy all files from `front/home-net-dash` to `Fall_25_HomeNetAI/frontend`:

**Using PowerShell (as Administrator):**
```powershell
cd C:\Users\natha\Fall_25_HomeNetAI-1\Fall_25_HomeNetAI
Copy-Item -Path "..\front\home-net-dash\*" -Destination "frontend" -Recurse -Force
```

**Or manually:**
- Copy entire `front/home-net-dash` folder contents
- Paste into `Fall_25_HomeNetAI/frontend`

### 2. Install Dependencies

```bash
cd Fall_25_HomeNetAI/frontend
npm install
```

### 3. Start Development

**Terminal 1 - Backend:**
```bash
cd Fall_25_HomeNetAI/backend
python start_backend.py
```

**Terminal 2 - Frontend:**
```bash
cd Fall_25_HomeNetAI/frontend
npm run dev
```

## 🔗 API Connection

- **Backend URL**: http://localhost:8000
- **Frontend URL**: http://localhost:8080
- **API Service**: `src/services/api.ts`

## 📁 Project Structure

```
frontend/
├── src/
│   ├── services/
│   │   └── api.ts          # ✅ API service (already created)
│   ├── pages/
│   │   ├── Login.tsx       # ✅ Updated to use API
│   │   ├── Register.tsx    # ✅ Updated to use API
│   │   └── ...            # Copy from front/home-net-dash
│   ├── components/
│   │   ├── ProtectedRoute.tsx  # ✅ Updated
│   │   ├── DashboardLayout.tsx  # ✅ Updated
│   │   └── ...            # Copy from front/home-net-dash
│   ├── lib/
│   │   └── storage.ts     # ✅ Updated
│   ├── App.tsx            # ✅ Updated
│   └── main.tsx           # ✅ Created
├── package.json           # ✅ Created
├── vite.config.ts         # ✅ Created
├── tsconfig.json          # ✅ Created
└── index.html             # ✅ Created
```

## ✨ Features Ready

- ✅ Authentication (Login/Register)
- ✅ Protected Routes
- ✅ API Service
- ✅ Error Handling
- ✅ Auto-logout on 401

## 🚀 After Copying Files

1. Test login/register functionality
2. Update other pages (Dashboard, Locations) to use real API
3. Connect location management to API
4. Connect weather data to API
