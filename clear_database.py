#!/usr/bin/env python3
"""
Database Clear Script for HomeNetAI
This script will completely clear all data and recreate the database schema
"""

import psycopg2
import os
import sys

# Add parent directory to path to import config
sys.path.append(os.path.dirname(os.path.dirname(__file__)))
from config import config

def clear_database():
    """Clear all data and recreate database schema"""
    
    print("🗑️  Starting database clear process...")
    
    try:
        # Connect to database
        conn = psycopg2.connect(config.DATABASE_URL)
        cursor = conn.cursor()
        
        print("✅ Connected to database")
        
        # Drop all tables in correct order (respecting foreign keys)
        print("🗑️  Dropping all tables...")
        
        drop_queries = [
            "DROP TABLE IF EXISTS daily_weather CASCADE;",
            "DROP TABLE IF EXISTS weather_data CASCADE;", 
            "DROP TABLE IF EXISTS user_locations CASCADE;",
            "DROP TABLE IF EXISTS cities CASCADE;",
            "DROP TABLE IF EXISTS users CASCADE;"
        ]
        
        for query in drop_queries:
            cursor.execute(query)
            print(f"   Dropped: {query.split()[2]}")
        
        # Commit the drops
        conn.commit()
        print("✅ All tables dropped successfully")
        
        # Recreate schema
        print("🔨 Recreating database schema...")
        
        # Read and execute schema
        schema_path = os.path.join(os.path.dirname(__file__), 'backend', 'database', 'schema.sql')
        with open(schema_path, 'r') as f:
            schema = f.read()
        
        cursor.execute(schema)
        conn.commit()
        print("✅ Database schema recreated successfully")
        
        # Verify tables were created
        cursor.execute("""
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
            ORDER BY table_name;
        """)
        
        tables = cursor.fetchall()
        print(f"📋 Created tables: {[table[0] for table in tables]}")
        
        print("\n🎉 Database cleared and recreated successfully!")
        print("   - All data has been removed")
        print("   - Fresh schema has been created")
        print("   - Ready for new data collection")
        
    except Exception as e:
        print(f"❌ Error clearing database: {e}")
        if conn:
            conn.rollback()
        raise
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()

if __name__ == "__main__":
    print("=" * 60)
    print("🗑️  HOMENETAI DATABASE CLEAR UTILITY")
    print("=" * 60)
    print("⚠️  WARNING: This will delete ALL data!")
    print("   - All users will be removed")
    print("   - All locations will be removed") 
    print("   - All weather data will be removed")
    print("=" * 60)
    
    confirm = input("Are you sure you want to continue? (type 'YES' to confirm): ")
    
    if confirm == "YES":
        clear_database()
    else:
        print("❌ Database clear cancelled")
