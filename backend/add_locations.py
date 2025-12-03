"""
Add Locations Script
Adds Phoenix, Arizona; Rexburg, Idaho; and Flagstaff, Arizona to the admin user.
"""

import psycopg2
import sys
import os
from datetime import datetime, timezone

# Add parent directory to path to import config
sys.path.append(os.path.dirname(os.path.dirname(__file__)))
from config import config


def add_locations():
    """Add locations to the admin user."""
    conn = None
    cursor = None
    
    # Location data: name, latitude, longitude
    locations = [
        ("Phoenix, Arizona", 33.4484, -112.0740),
        ("Rexburg, Idaho", 43.8260, -111.7897),
        ("Flagstaff, Arizona", 35.1981, -111.6513),
    ]
    
    try:
        # Connect to database
        conn = psycopg2.connect(config.DATABASE_URL)
        cursor = conn.cursor()
        
        # Get admin user ID
        cursor.execute("SELECT id FROM users WHERE username = %s", ("admin",))
        user_result = cursor.fetchone()
        
        if not user_result:
            print("❌ Admin user not found! Please create the admin user first.")
            return False
        
        user_id = user_result[0]
        print(f"Found admin user (ID: {user_id})")
        print(f"\nAdding {len(locations)} locations...\n")
        
        added_count = 0
        skipped_count = 0
        
        for name, latitude, longitude in locations:
            # Check if location already exists for this user
            cursor.execute("""
                SELECT id FROM user_locations 
                WHERE user_id = %s AND name = %s
            """, (user_id, name))
            
            if cursor.fetchone():
                print(f"  ⚠️  Skipped: {name} (already exists)")
                skipped_count += 1
                continue
            
            # Add the location
            cursor.execute("""
                INSERT INTO user_locations (user_id, name, latitude, longitude, created_at)
                VALUES (%s, %s, %s, %s, %s)
                RETURNING id
            """, (user_id, name, latitude, longitude, datetime.now(timezone.utc)))
            
            location_id = cursor.fetchone()[0]
            print(f"  ✅ Added: {name} (ID: {location_id})")
            print(f"     Coordinates: {latitude}, {longitude}")
            added_count += 1
        
        conn.commit()
        
        print(f"\n✅ Successfully added {added_count} location(s)")
        if skipped_count > 0:
            print(f"   Skipped {skipped_count} location(s) (already exist)")
        
        return True
        
    except psycopg2.OperationalError as e:
        print(f"\n❌ Database connection error: {e}")
        print("Please check:")
        print("  1. PostgreSQL is running")
        print("  2. Database exists: homenet")
        print("  3. Connection string is correct in config.py")
        return False
    except Exception as e:
        print(f"\n❌ Error adding locations: {e}")
        if conn:
            conn.rollback()
        return False
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()


if __name__ == "__main__":
    print("=" * 60)
    print("HomeNetAI - Add Locations")
    print("=" * 60)
    print("\nLocations to add:")
    print("  1. Phoenix, Arizona")
    print("  2. Rexburg, Idaho")
    print("  3. Flagstaff, Arizona")
    print()
    
    success = add_locations()
    
    if success:
        print("\n" + "=" * 60)
        print("Locations setup complete!")
        print("=" * 60)
    else:
        print("\n" + "=" * 60)
        print("Failed to add locations. Please check the errors above.")
        print("=" * 60)
        sys.exit(1)

