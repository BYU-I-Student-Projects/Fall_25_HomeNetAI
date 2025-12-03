"""
Script to add sample devices to the database for testing/demo purposes.
Run this script to populate the database with sample smart home devices.
"""

import sys
import os

# Add parent directory to path
backend_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.dirname(backend_dir)
sys.path.insert(0, parent_dir)

from database.database import HomeNetDatabase
from datetime import datetime, timezone

def add_sample_devices():
    """Add sample devices for the first user in the database."""
    db = HomeNetDatabase()
    conn = None
    cursor = None
    
    try:
        conn = db.get_connection()
        cursor = conn.cursor()
        
        # Get the first user (or admin user)
        cursor.execute("SELECT id FROM users ORDER BY id LIMIT 1")
        user_result = cursor.fetchone()
        
        if not user_result:
            print("No users found in database. Please create a user first.")
            return
        
        user_id = user_result[0]
        print(f"Adding devices for user_id: {user_id}")
        
        # Sample devices - thermostat values are in Celsius (will be converted to F on display)
        sample_devices = [
            # Living Room
            {
                "name": "Living Room Thermostat",
                "type": "thermostat",
                "status": "on",
                "room": "Living Room",
                "value": 21.0,  # 70°F in Celsius
                "color": None,
                "locked": None,
                "position": None,
            },
            {
                "name": "Living Room Light",
                "type": "light",
                "status": "on",
                "room": "Living Room",
                "value": None,
                "color": "#FFA500",
                "locked": None,
                "position": None,
            },
            {
                "name": "TV Smart Plug",
                "type": "plug",
                "status": "on",
                "room": "Living Room",
                "value": None,
                "color": None,
                "locked": None,
                "position": None,
            },
            # Bedroom
            {
                "name": "Bedroom Thermostat",
                "type": "thermostat",
                "status": "on",
                "room": "Bedroom",
                "value": 20.0,  # 68°F in Celsius
                "color": None,
                "locked": None,
                "position": None,
            },
            {
                "name": "Bedroom Light",
                "type": "light",
                "status": "off",
                "room": "Bedroom",
                "value": None,
                "color": "#FFD700",
                "locked": None,
                "position": None,
            },
            {
                "name": "Front Door Lock",
                "type": "lock",
                "status": "on",
                "room": "Bedroom",
                "value": None,
                "color": None,
                "locked": True,
                "position": None,
            },
            # Kitchen
            {
                "name": "Kitchen Light",
                "type": "light",
                "status": "on",
                "room": "Kitchen",
                "value": None,
                "color": "#FFFFFF",
                "locked": None,
                "position": None,
            },
            {
                "name": "Coffee Maker Plug",
                "type": "plug",
                "status": "off",
                "room": "Kitchen",
                "value": None,
                "color": None,
                "locked": None,
                "position": None,
            },
            {
                "name": "Kitchen Window Blinds",
                "type": "blind",
                "status": "on",
                "room": "Kitchen",
                "value": None,
                "color": None,
                "locked": None,
                "position": 75,  # 75% open
            },
            # Other
            {
                "name": "Front Door Camera",
                "type": "camera",
                "status": "on",
                "room": "Front Door",
                "value": None,
                "color": None,
                "locked": None,
                "position": None,
            },
        ]
        
        now = datetime.now(timezone.utc)
        added_count = 0
        
        for device in sample_devices:
            try:
                cursor.execute("""
                    INSERT INTO devices (user_id, name, type, status, room, value, color, locked, position, created_at, updated_at)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                """, (
                    user_id,
                    device["name"],
                    device["type"],
                    device["status"],
                    device["room"],
                    device["value"],
                    device["color"],
                    device["locked"],
                    device["position"],
                    now,
                    now
                ))
                added_count += 1
                print(f"✓ Added: {device['name']} ({device['type']}) in {device['room']}")
            except Exception as e:
                print(f"✗ Failed to add {device['name']}: {str(e)}")
        
        conn.commit()
        print(f"\nSuccessfully added {added_count} devices!")
        
    except Exception as e:
        print(f"Error: {str(e)}")
        if conn:
            conn.rollback()
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()

if __name__ == "__main__":
    add_sample_devices()

