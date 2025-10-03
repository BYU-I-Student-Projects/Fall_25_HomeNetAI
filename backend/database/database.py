import psycopg2
import os
from datetime import datetime
from typing import List, Dict, Any
import sys

# Add parent directory to path to import config
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(__file__))))
from config import config

class HomeNetDatabase:
    # Simple PostgreSQL database manager for HomeNetAI project
    
    def __init__(self, connection_string: str = None):
        if connection_string is None:
            self.connection_string = config.DATABASE_URL
        else:
            self.connection_string = connection_string
        self.init_database()
    
    def init_database(self):
        # Initialize database with schema
        conn = None
        cursor = None
        try:
            conn = psycopg2.connect(self.connection_string)
            cursor = conn.cursor()
            
            # Read and execute schema
            schema_path = os.path.join(os.path.dirname(__file__), 'schema.sql')
            with open(schema_path, 'r') as f:
                schema = f.read()
            
            cursor.execute(schema)
            conn.commit()
            print(f"Database initialized: {self.connection_string}")
        except Exception as e:
            print(f"Database initialization failed: {e}")
            raise
        finally:
            if cursor:
                cursor.close()
            if conn:
                conn.close()
    
    def insert_weather_data(self, location_name: str, weather_data: Dict[str, Any], latitude: float, longitude: float, user_id: int):
        # Insert weather data for a user location
        conn = None
        cursor = None
        try:
            conn = psycopg2.connect(self.connection_string)
            cursor = conn.cursor()
            
            # Get or create user location
            location_id = self._get_or_create_location(cursor, location_name, latitude, longitude, user_id)
            
            # Insert current weather
            if 'current_weather' in weather_data:
                current = weather_data['current_weather']
                cursor.execute('''
                    INSERT INTO weather_data 
                    (location_id, timestamp, temperature, wind_speed, wind_direction, weather_code)
                    VALUES (%s, %s, %s, %s, %s, %s)
                ''', (
                    location_id,
                    current['time'],
                    current['temperature'],
                    current['windspeed'],
                    current['winddirection'],
                    current['weathercode']
                ))
            
            # Insert hourly data if available (simplified for core weather data)
            if 'hourly' in weather_data:
                hourly = weather_data['hourly']
                for i in range(len(hourly['time'])):
                    cursor.execute('''
                        INSERT INTO weather_data 
                        (location_id, timestamp, temperature, apparent_temperature, humidity, precipitation, 
                         precipitation_probability, wind_speed, wind_direction, cloud_cover, uv_index)
                        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                    ''', (
                        location_id,
                        hourly['time'][i],
                        hourly.get('temperature_2m', [None])[i] if i < len(hourly.get('temperature_2m', [])) else None,
                        hourly.get('apparent_temperature', [None])[i] if i < len(hourly.get('apparent_temperature', [])) else None,
                        hourly.get('relative_humidity_2m', [None])[i] if i < len(hourly.get('relative_humidity_2m', [])) else None,
                        hourly.get('precipitation', [None])[i] if i < len(hourly.get('precipitation', [])) else None,
                        hourly.get('precipitation_probability', [None])[i] if i < len(hourly.get('precipitation_probability', [])) else None,
                        hourly.get('wind_speed_10m', [None])[i] if i < len(hourly.get('wind_speed_10m', [])) else None,
                        hourly.get('wind_direction_10m', [None])[i] if i < len(hourly.get('wind_direction_10m', [])) else None,
                        hourly.get('cloud_cover', [None])[i] if i < len(hourly.get('cloud_cover', [])) else None,
                        hourly.get('uv_index', [None])[i] if i < len(hourly.get('uv_index', [])) else None
                    ))
            
            # Insert daily forecasts
            if 'daily' in weather_data:
                daily = weather_data['daily']
                for i in range(len(daily['time'])):
                    cursor.execute('''
                        INSERT INTO daily_weather
                        (location_id, date, temp_max, temp_min, precipitation_sum, 
                         precipitation_probability_max, wind_speed_max, uv_index_max)
                        VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                    ON CONFLICT (location_id, date) DO UPDATE SET
                    temp_max = EXCLUDED.temp_max,
                    temp_min = EXCLUDED.temp_min,
                    precipitation_sum = EXCLUDED.precipitation_sum,
                    precipitation_probability_max = EXCLUDED.precipitation_probability_max,
                    wind_speed_max = EXCLUDED.wind_speed_max,
                    uv_index_max = EXCLUDED.uv_index_max
                ''', (
                    location_id,
                    daily['time'][i],
                    daily['temperature_2m_max'][i],
                    daily['temperature_2m_min'][i],
                    daily['precipitation_sum'][i],
                    daily['precipitation_probability_max'][i],
                    daily['wind_speed_10m_max'][i],
                    daily['uv_index_max'][i]
                ))
            
            conn.commit()
        except Exception as e:
            if conn:
                conn.rollback()
            print(f"Error inserting weather data: {e}")
            raise
        finally:
            if cursor:
                cursor.close()
            if conn:
                conn.close()
    
    def _get_or_create_location(self, cursor, location_name: str, latitude: float, longitude: float, user_id: int) -> int:
        # Get user location ID or create if doesn't exist
        cursor.execute('''
            SELECT id FROM user_locations 
            WHERE name = %s AND user_id = %s
        ''', (location_name, user_id))
        result = cursor.fetchone()
        
        if result:
            return result[0]
        else:
            # Create new user location
            cursor.execute('''
                INSERT INTO user_locations (name, latitude, longitude, user_id)
                VALUES (%s, %s, %s, %s)
                RETURNING id
            ''', (location_name, latitude, longitude, user_id))
            return cursor.fetchone()[0]
    
    def get_connection(self):
        # Simple connection getter for main.py
        return psycopg2.connect(self.connection_string)

# Example usage
if __name__ == "__main__":
    db = HomeNetDatabase()
    print("Database ready!")
