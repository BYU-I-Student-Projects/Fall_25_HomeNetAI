"""
Seed Weather Data Script
Populates the weather_data table with sample historical data for analytics
"""

import psycopg2
import sys
import os
from datetime import datetime, timedelta, timezone
import random

# Add parent directory to path
sys.path.append(os.path.dirname(os.path.dirname(__file__)))
from config import config


def seed_weather_data():
    """Seed weather data for all user locations"""
    conn = None
    cursor = None
    
    try:
        conn = psycopg2.connect(config.DATABASE_URL)
        cursor = conn.cursor()
        
        # Get all user locations
        cursor.execute("SELECT id, name, latitude, longitude FROM user_locations")
        locations = cursor.fetchall()
        
        if not locations:
            print("No locations found. Please add a location first.")
            return False
        
        print(f"Found {len(locations)} location(s)")
        
        # Generate 30 days of sample data for each location
        days = 30
        for loc_id, name, lat, lon in locations:
            lat = float(lat)  # Convert from Decimal
            lon = float(lon)
            print(f"\nSeeding data for: {name} (ID: {loc_id})")
            
            # Check if data already exists
            cursor.execute(
                "SELECT COUNT(*) FROM weather_data WHERE location_id = %s",
                (loc_id,)
            )
            existing = cursor.fetchone()[0]
            
            if existing > 0:
                print(f"  Already has {existing} records, skipping...")
                continue
            
            # Generate sample data based on location latitude
            # Higher latitudes = colder temperatures
            base_temp = 40 - (abs(lat - 40) * 0.5)  # Base temperature adjusted by latitude
            
            records_added = 0
            for day in range(days):
                timestamp = datetime.now(timezone.utc) - timedelta(days=days - day)
                
                # Add some hourly readings (every 6 hours)
                for hour in [0, 6, 12, 18]:
                    ts = timestamp.replace(hour=hour, minute=0, second=0, microsecond=0)
                    
                    # Generate realistic-ish weather data
                    temp = base_temp + random.uniform(-15, 20) + (5 if hour in [12, 18] else -5)
                    apparent_temp = temp - random.uniform(0, 5)
                    humidity = random.uniform(30, 80)
                    precip = random.uniform(0, 0.2) if random.random() < 0.3 else 0
                    wind_speed = random.uniform(0, 20)
                    uv_index = random.uniform(0, 8) if hour in [12, 18] else 0
                    
                    cursor.execute("""
                        INSERT INTO weather_data 
                        (location_id, timestamp, temperature, apparent_temperature, 
                         humidity, precipitation, wind_speed, uv_index)
                        VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                        ON CONFLICT DO NOTHING
                    """, (loc_id, ts, temp, apparent_temp, humidity, precip, wind_speed, uv_index))
                    
                    records_added += 1
            
            print(f"  Added {records_added} weather records")
        
        conn.commit()
        print("\n✅ Weather data seeding complete!")
        return True
        
    except Exception as e:
        print(f"❌ Error: {e}")
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
    print("HomeNetAI - Seed Weather Data for Analytics")
    print("=" * 60)
    print()
    
    seed_weather_data()
