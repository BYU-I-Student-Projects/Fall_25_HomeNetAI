"""
Clear Database Script
Clears all data from the HomeNetAI database tables.
"""

import psycopg2
import sys
import os

# Add parent directory to path to import config
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(__file__))))
from config import config


def clear_database():
    """Clear all data from all tables in the database."""
    conn = None
    cursor = None
    
    try:
        # Connect to database
        conn = psycopg2.connect(config.DATABASE_URL)
        cursor = conn.cursor()
        
        print("Connected to database. Clearing all tables...")
        
        # Use TRUNCATE CASCADE on parent tables - this will automatically
        # clear all dependent tables due to foreign key constraints
        # Clear user_locations first (which will clear weather_data and daily_weather)
        # Then clear users (which will clear devices and user_locations)
        print("\nClearing tables:")
        
        # Clear user_locations first (parent of weather_data and daily_weather)
        try:
            cursor.execute("TRUNCATE TABLE user_locations CASCADE")
            print("  ✓ Cleared user_locations (and weather_data, daily_weather)")
        except Exception as e:
            if "does not exist" not in str(e):
                print(f"  ⚠ Warning: user_locations - {e}")
        
        # Clear users (parent of user_locations and devices)
        try:
            cursor.execute("TRUNCATE TABLE users CASCADE")
            print("  ✓ Cleared users (and devices, user_locations)")
        except Exception as e:
            if "does not exist" not in str(e):
                print(f"  ⚠ Warning: users - {e}")
        
        # Clear devices separately (in case it wasn't cleared by CASCADE)
        try:
            cursor.execute("TRUNCATE TABLE devices")
            print("  ✓ Cleared devices")
        except Exception as e:
            if "does not exist" not in str(e):
                pass  # Already cleared by CASCADE
        
        # Commit the changes
        conn.commit()
        print("\n✅ Database cleared successfully!")
        print("All tables are now empty and ready for fresh data.")
        
    except psycopg2.OperationalError as e:
        print(f"\n❌ Database connection error: {e}")
        print("Please check:")
        print("  1. PostgreSQL is running")
        print("  2. Database exists: homenet")
        print("  3. Connection string is correct in config.py")
        return False
    except Exception as e:
        print(f"\n❌ Error clearing database: {e}")
        if conn:
            conn.rollback()
        return False
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()
    
    return True


if __name__ == "__main__":
    print("=" * 60)
    print("HomeNetAI Database Clear Script")
    print("=" * 60)
    print("\n⚠️  WARNING: This will delete ALL data from the database!")
    print("   Tables to be cleared:")
    print("   - users")
    print("   - user_locations")
    print("   - weather_data")
    print("   - daily_weather")
    print("   - devices")
    print()
    
    response = input("Are you sure you want to continue? (yes/no): ")
    
    if response.lower() in ['yes', 'y']:
        success = clear_database()
        if success:
            print("\n" + "=" * 60)
            print("Database cleared successfully!")
            print("=" * 60)
        else:
            print("\n" + "=" * 60)
            print("Failed to clear database. Please check the errors above.")
            print("=" * 60)
            sys.exit(1)
    else:
        print("\nOperation cancelled.")
        sys.exit(0)

