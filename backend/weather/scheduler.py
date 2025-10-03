# Weather Data Scheduler - Collects weather data for all user locations and stores in PostgreSQL

import asyncio
import aiohttp
import sys
import os
from datetime import datetime
from typing import List, Dict, Any

# Add backend to path
sys.path.append(os.path.dirname(os.path.dirname(__file__)))

from database.database import HomeNetDatabase
from weather.weather_api import get_weather_data
from config import config

class WeatherScheduler:
    def __init__(self, db_connection_string: str = None):
        self.db = HomeNetDatabase(db_connection_string)
        self.collection_interval = config.COLLECTION_INTERVAL_MINUTES
        self.running = False
        
    async def collect_weather_for_location(self, session: aiohttp.ClientSession, location: Dict[str, Any]) -> bool:
        # Collect comprehensive weather data for a single location
        try:
            # Get comprehensive weather data from API
            weather_data = get_weather_data(location['latitude'], location['longitude'])
            
            # Store in database with user context
            self.db.insert_weather_data(
                location['name'],
                weather_data,
                location['latitude'],
                location['longitude'],
                location['user_id']
            )
            
            print(f"Collected weather for {location['name']} at {datetime.now().strftime('%H:%M:%S')}")
            return True
            
        except Exception as e:
            print(f"Error collecting weather for {location['name']}: {e}")
            return False
    
    async def collect_all_weather_data(self):
        # Collect weather data for all user locations
        print(f"\nStarting weather data collection at {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        
        try:
            # Get all user locations from database
            conn = self.db.get_connection()
            cursor = conn.cursor()
            
            try:
                cursor.execute("""
                    SELECT DISTINCT ul.name, ul.latitude, ul.longitude, ul.user_id, ul.created_at
                    FROM user_locations ul
                    ORDER BY ul.created_at DESC
                """)
                
                locations = []
                for row in cursor.fetchall():
                    locations.append({
                        'name': row[0],
                        'latitude': float(row[1]),
                        'longitude': float(row[2]),
                        'user_id': row[3]
                    })
            finally:
                cursor.close()
                conn.close()
            
            if not locations:
                print("No user locations found. Skipping collection.")
                return
            
            print(f"Found {len(locations)} locations to collect weather for")
            
            # Collect weather data for all locations in parallel
            async with aiohttp.ClientSession() as session:
                # Create all tasks at once for true parallelism
                tasks = [
                    self.collect_weather_for_location(session, location) 
                    for location in locations
                ]
                
                # Wait for all tasks to complete
                results = await asyncio.gather(*tasks, return_exceptions=True)
                
                successful = sum(1 for result in results if result is True)
                print(f"Successfully collected weather for {successful}/{len(locations)} locations")
                
        except Exception as e:
            print(f"Error in weather collection: {e}")
    
    async def run_scheduler(self):
        # Run the weather data scheduler
        print("Weather Data Scheduler Started")
        print(f"Collection interval: {self.collection_interval} minutes")
        print("Press Ctrl+C to stop")
        
        self.running = True
        
        try:
            while self.running:
                await self.collect_all_weather_data()
                
                # Wait for next collection
                print(f"Next collection in {self.collection_interval} minutes...")
                await asyncio.sleep(self.collection_interval * 60)
                
        except KeyboardInterrupt:
            print("\nScheduler stopped by user")
        except Exception as e:
            print(f"Scheduler error: {e}")
        finally:
            self.running = False
    
    def stop(self):
        # Stop the scheduler
        self.running = False