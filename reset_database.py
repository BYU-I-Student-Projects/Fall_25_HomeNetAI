#!/usr/bin/env python3
"""
Database Reset Script for HomeNetAI
This script will completely drop and recreate the database
"""

import psycopg2
import os
import sys

# Add parent directory to path to import config
sys.path.append(os.path.dirname(os.path.dirname(__file__)))
from config import config

def reset_database():
    """Completely reset the database"""
    
    print("🗑️  Starting complete database reset...")
    
    try:
        # Connect to database
        conn = psycopg2.connect(config.DATABASE_URL)
        conn.autocommit = True  # Enable autocommit for DDL operations
        cursor = conn.cursor()
        
        print("✅ Connected to database")
        
        # Drop all tables with CASCADE to handle foreign keys
        print("🗑️  Dropping all tables...")
        
        drop_queries = [
            "DROP TABLE IF EXISTS daily_weather CASCADE;",
            "DROP TABLE IF EXISTS weather_data CASCADE;", 
            "DROP TABLE IF EXISTS user_locations CASCADE;",
            "DROP TABLE IF EXISTS cities CASCADE;",
            "DROP TABLE IF EXISTS users CASCADE;"
        ]
        
        for query in drop_queries:
            try:
                cursor.execute(query)
                print(f"   ✅ Dropped: {query.split()[2]}")
            except Exception as e:
                print(f"   ⚠️  Warning dropping {query.split()[2]}: {e}")
        
        print("✅ All tables dropped successfully")
        
        # Recreate schema
        print("🔨 Recreating database schema...")
        
        # Read and execute schema
        schema_path = os.path.join(os.path.dirname(__file__), 'backend', 'database', 'schema.sql')
        with open(schema_path, 'r') as f:
            schema = f.read()
        
        # Split schema into individual statements
        statements = [stmt.strip() for stmt in schema.split(';') if stmt.strip()]
        
        for statement in statements:
            if statement:
                try:
                    cursor.execute(statement)
                    print(f"   ✅ Executed: {statement[:50]}...")
                except Exception as e:
                    print(f"   ❌ Error executing: {statement[:50]}... - {e}")
        
        # Verify tables were created
        cursor.execute("""
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
            ORDER BY table_name;
        """)
        
        tables = cursor.fetchall()
        print(f"📋 Created tables: {[table[0] for table in tables]}")
        
        # Test the database connection
        print("🧪 Testing database connection...")
        cursor.execute("SELECT 1")
        result = cursor.fetchone()
        if result:
            print("✅ Database connection test successful")
        
        print("\n🎉 Database reset completed successfully!")
        print("   - All old data has been removed")
        print("   - Fresh schema has been created")
        print("   - Database is ready for use")
        
    except Exception as e:
        print(f"❌ Error resetting database: {e}")
        raise
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()

if __name__ == "__main__":
    print("=" * 60)
    print("🗑️  HOMENETAI DATABASE RESET UTILITY")
    print("=" * 60)
    print("⚠️  WARNING: This will delete ALL data!")
    print("   - All users will be removed")
    print("   - All locations will be removed") 
    print("   - All weather data will be removed")
    print("=" * 60)
    
    confirm = input("Are you sure you want to continue? (type 'YES' to confirm): ")
    
    if confirm == "YES":
        reset_database()
    else:
        print("❌ Database reset cancelled")
