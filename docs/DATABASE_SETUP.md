# Database Setup Guide

## Prerequisites

1. **PostgreSQL** installed and running
2. **Python** with `psycopg2-binary` installed

## Quick Setup

### 1. Create Database

```bash
# Create PostgreSQL database
createdb homenet
```

Or using psql:
```sql
CREATE DATABASE homenet;
```

### 2. Configure Connection

Edit `config.py` with your database credentials:

```python
DATABASE_URL = "postgresql://username:password@localhost/homenet"
```

### 3. Verify Setup

Run the database setup check:

```bash
cd backend/database
python setup.py
```

This will:
- Check database connection
- Verify tables exist
- Show any errors with troubleshooting tips

### 4. Initialize Database

The database is automatically initialized when you start the backend:

```bash
cd backend
python start_backend.py
```

Or manually:

```python
from database.database import HomeNetDatabase
db = HomeNetDatabase()
```

## Database Schema

The database includes these tables:

- **users** - User accounts
- **user_locations** - Locations saved by users
- **weather_data** - Hourly weather data
- **daily_weather** - Daily weather summaries

All tables are created automatically with proper indexes and foreign keys.

## Troubleshooting

### Connection Error

**Error:** `psycopg2.OperationalError: connection refused`

**Solutions:**
1. Check PostgreSQL is running: `pg_isready`
2. Verify database exists: `psql -l`
3. Check connection string in `config.py`

### Database Doesn't Exist

**Error:** `database "homenet" does not exist`

**Solution:**
```bash
createdb homenet
```

### Permission Error

**Error:** `permission denied`

**Solutions:**
1. Check PostgreSQL user has permissions
2. Verify password in connection string
3. Try creating database with: `createdb -U postgres homenet`

### Schema Already Exists

The schema uses `IF NOT EXISTS`, so it's safe to run multiple times. Existing data won't be affected.

## Manual Schema Creation

If you need to manually create the schema:

```bash
psql -U postgres -d homenet -f backend/database/schema.sql
```

## Testing Database

Test the database connection:

```python
from database.database import HomeNetDatabase

try:
    db = HomeNetDatabase()
    print("Database connection successful!")
except Exception as e:
    print(f"Error: {e}")
```

