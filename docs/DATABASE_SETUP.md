# Complete Backend Setup Guide - Step by Step

This guide will walk you through setting up the entire backend from scratch.

## Step 1: Install PostgreSQL

### Windows:
1. Go to https://www.postgresql.org/download/windows/
2. Click "Download the installer"
3. Run the installer
4. **Important:** Remember the password you set for the `postgres` user
5. Keep all default settings (port 5432, etc.)
6. Click "Finish" when done

### Mac:
1. Go to https://www.postgresql.org/download/macosx/
2. Download and install PostgreSQL
3. Remember the password you set for the `postgres` user

## Step 2: Install pgAdmin (Optional but Recommended)

pgAdmin is a visual tool to manage your database.

### Windows/Mac:
1. Go to https://www.pgadmin.org/download/
2. Download and install pgAdmin
3. Open pgAdmin
4. You'll see a server called "PostgreSQL" - click it
5. Enter the password you set during PostgreSQL installation

## Step 3: Create the Database

### Option A: Using pgAdmin (Easiest)
1. Open pgAdmin
2. Right-click on "Databases" in the left sidebar
3. Click "Create" → "Database"
4. Name it: `homenet`
5. Click "Save"

### Option B: Using Command Line
1. Open Command Prompt (Windows) or Terminal (Mac/Linux)
2. Type:
   ```bash
   createdb homenet
   ```
3. If that doesn't work, try:
   ```bash
   psql -U postgres
   ```
4. Enter your postgres password
5. Then type:
   ```sql
   CREATE DATABASE homenet;
   ```
6. Type `\q` to exit

## Step 4 Install Python Dependencies

1. Open Command Prompt (Windows) or Terminal (Mac/Linux)
2. Navigate to your project folder:
   ```bash
   cd Fall_25_HomeNetAI
   ```
3. Install all required packages:
   ```bash
   pip install -r requirements.txt
   ```

If you get an error, try:
```bash
python -m pip install -r requirements.txt
```

## Step 5: Configure Database Connection

1. Open the file `config.py` in your project root
2. Find this line:
   ```python
   DATABASE_URL: str = os.getenv("DATABASE_URL", "postgresql://postgres:nathan-7108@localhost/homenet")
   ```
3. Replace it with your PostgreSQL password:
   ```python
   DATABASE_URL: str = os.getenv("DATABASE_URL", "postgresql://postgres:YOUR_PASSWORD@localhost/homenet")
   ```
   Replace `YOUR_PASSWORD` with the password you set during PostgreSQL installation.

**Example:**
If your password is `mypassword123`, it should look like:
```python
DATABASE_URL: str = os.getenv("DATABASE_URL", "postgresql://postgres:mypassword123@localhost/homenet")
```

## Step 7: Start the Backend

1. Open Command Prompt or Terminal
2. Navigate to the backend folder:
   ```bash
   cd Fall_25_HomeNetAI/backend
   ```
3. Start the backend:
   ```bash
   python start_backend.py
   ```

You should see:
```
HomeNetAI Backend + Weather Scheduler
==================================================
Starting FastAPI Backend Server...
Backend available at: http://localhost:8000
API Documentation: http://localhost:8000/docs
```

## Step 8: Verify It's Working

1. Open your web browser
2. Go to: http://localhost:8000
3. You should see: `{"message":"HomeNetAI Weather API","status":"running"}`
4. Go to: http://localhost:8000/docs
5. You should see the API documentation page

## Troubleshooting

### "Database connection failed"
- Make sure PostgreSQL is running
- Check that you created the `homenet` database
- Verify your password in `config.py` is correct

### "ModuleNotFoundError"
- Run: `pip install -r requirements.txt`
- Make sure you're in the project root folder

### "Port 8000 already in use"
- Another program is using port 8000
- Close other programs or change the port in `config.py`

### "Cannot connect to backend"
- Make sure the backend is running (Step 7)
- Check that you see "Application startup complete" in the terminal

## What Happens When You Start the Backend?

1. The database tables are created automatically
2. The API server starts on port 8000
3. The weather scheduler starts collecting data every 30 minutes

You don't need to do anything else - it's all automatic!

## Next Steps

Once your backend is running:
1. Start the frontend (see frontend README)
2. Register a user account
3. Add locations
4. View weather data

---

**That's it!** Your backend is now set up and running. 🎉
