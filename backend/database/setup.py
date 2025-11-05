"""
Database Setup Script
Helps verify and set up the database correctly.
"""

import psycopg2
import sys
import os

# Add parent directory to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(__file__))))
from config import config


def check_database():
    """Check if database connection is working."""
    try:
        conn = psycopg2.connect(config.DATABASE_URL)
        cursor = conn.cursor()
        
        # Check if tables exist
        cursor.execute("""
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
            ORDER BY table_name
        """)
        
        tables = cursor.fetchall()
        
        print("Database connection: SUCCESS")
        print(f"Database: {config.DATABASE_URL.split('/')[-1]}")
        print(f"\nTables found: {len(tables)}")
        
        if tables:
            for table in tables:
                print(f"  - {table[0]}")
        else:
            print("  No tables found. Database may need initialization.")
        
        cursor.close()
        conn.close()
        return True
        
    except psycopg2.OperationalError as e:
        print("Database connection: FAILED")
        print(f"Error: {e}")
        print("\nTroubleshooting:")
        print("1. Check if PostgreSQL is running")
        print("2. Verify database exists:")
        print(f"   createdb {config.DATABASE_URL.split('/')[-1]}")
        print("3. Check connection string in config.py:")
        print(f"   {config.DATABASE_URL}")
        return False
    except Exception as e:
        print(f"Unexpected error: {e}")
        return False


if __name__ == "__main__":
    print("HomeNetAI Database Setup Check")
    print("=" * 50)
    check_database()

