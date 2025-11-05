"""
Database Manager for HomeNetAI
Handles all PostgreSQL database operations.
"""

import psycopg2
from psycopg2 import sql
import os
from datetime import datetime
from typing import List, Dict, Any
import sys

sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(__file__))))
from config import config


class HomeNetDatabase:
    """PostgreSQL database manager for HomeNetAI project."""
    
    def __init__(self, connection_string: str = None):
        """Initialize database connection."""
        if connection_string is None:
            self.connection_string = config.DATABASE_URL
        else:
            self.connection_string = connection_string
        self.init_database()
    
    # Database Initialization
    def init_database(self):
        """Initialize database with schema from schema.sql file."""
        conn = None
        cursor = None
        try:
            conn = psycopg2.connect(self.connection_string)
            cursor = conn.cursor()
            
            schema_path = os.path.join(os.path.dirname(__file__), 'schema.sql')
            with open(schema_path, 'r') as f:
                schema = f.read()
            
            # Execute schema - PostgreSQL allows multiple statements
            cursor.execute(schema)
            conn.commit()
            print(f"Database initialized successfully: {self.connection_string.split('@')[1] if '@' in self.connection_string else 'database'}")
        except psycopg2.OperationalError as e:
            print(f"Database connection error: {e}")
            print(f"Please check:")
            print(f"  1. PostgreSQL is running")
            print(f"  2. Database exists: {self._get_db_name()}")
            print(f"  3. Connection string is correct in config.py")
            raise
        except psycopg2.Error as e:
            print(f"Database initialization error: {e}")
            if conn:
                conn.rollback()
            raise
        except FileNotFoundError:
            print(f"Schema file not found: {schema_path}")
            raise
        except Exception as e:
            print(f"Database initialization failed: {e}")
            if conn:
                conn.rollback()
            raise
        finally:
            if cursor:
                cursor.close()
            if conn:
                conn.close()
    
    def _get_db_name(self):
        """Extract database name from connection string."""
        try:
            # Format: postgresql://user:password@host:port/database
            parts = self.connection_string.split('/')
            return parts[-1] if parts else "unknown"
        except:
            return "unknown"
    
    # Connection Management
    def get_connection(self):
        """Get a new database connection."""
        try:
            return psycopg2.connect(self.connection_string)
        except psycopg2.OperationalError as e:
            print(f"Failed to connect to database: {e}")
            raise
    
    # Location Management
    def _get_or_create_location(self, cursor, location_name: str, latitude: float, 
                                longitude: float, user_id: int) -> int:
        """Get existing location ID or create a new one if it doesn't exist."""
        cursor.execute('''
            SELECT id FROM user_locations 
            WHERE name = %s AND user_id = %s
        ''', (location_name, user_id))
        result = cursor.fetchone()
        
        if result:
            return result[0]
        else:
            cursor.execute('''
                INSERT INTO user_locations (name, latitude, longitude, user_id)
                VALUES (%s, %s, %s, %s)
                RETURNING id
            ''', (location_name, latitude, longitude, user_id))
            return cursor.fetchone()[0]
    
    # Weather Data Insertion
    def insert_weather_data(self, location_name: str, weather_data: Dict[str, Any], 
                           latitude: float, longitude: float, user_id: int):
        """Insert weather data for a user location."""
        conn = None
        cursor = None
        try:
            conn = psycopg2.connect(self.connection_string)
            cursor = conn.cursor()
            
            location_id = self._get_or_create_location(
                cursor, location_name, latitude, longitude, user_id
            )
            
            if 'current_weather' in weather_data:
                self._insert_current_weather(cursor, location_id, weather_data['current_weather'])
            
            if 'hourly' in weather_data:
                self._insert_hourly_weather(cursor, location_id, weather_data['hourly'])
            
            if 'daily' in weather_data:
                self._insert_daily_weather(cursor, location_id, weather_data['daily'])
            
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
    
    def _insert_current_weather(self, cursor, location_id: int, current_weather: Dict[str, Any]):
        """Insert current weather conditions."""
        cursor.execute('''
            INSERT INTO weather_data 
            (location_id, timestamp, temperature, wind_speed, wind_direction, weather_code)
            VALUES (%s, %s, %s, %s, %s, %s)
        ''', (
            location_id,
            current_weather['time'],
            current_weather['temperature'],
            current_weather['windspeed'],
            current_weather['winddirection'],
            current_weather['weathercode']
        ))
    
    def _insert_hourly_weather(self, cursor, location_id: int, hourly_data: Dict[str, Any]):
        """Insert hourly weather forecast data (up to 24 hours)."""
        num_hours = len(hourly_data.get('time', []))
        
        for i in range(num_hours):
            cursor.execute('''
                INSERT INTO weather_data 
                (location_id, timestamp, temperature, apparent_temperature, humidity, 
                 precipitation, precipitation_probability, wind_speed, wind_direction, 
                 cloud_cover, uv_index)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            ''', (
                location_id,
                hourly_data['time'][i],
                hourly_data.get('temperature_2m', [None])[i] if i < len(hourly_data.get('temperature_2m', [])) else None,
                hourly_data.get('apparent_temperature', [None])[i] if i < len(hourly_data.get('apparent_temperature', [])) else None,
                hourly_data.get('relative_humidity_2m', [None])[i] if i < len(hourly_data.get('relative_humidity_2m', [])) else None,
                hourly_data.get('precipitation', [None])[i] if i < len(hourly_data.get('precipitation', [])) else None,
                hourly_data.get('precipitation_probability', [None])[i] if i < len(hourly_data.get('precipitation_probability', [])) else None,
                hourly_data.get('wind_speed_10m', [None])[i] if i < len(hourly_data.get('wind_speed_10m', [])) else None,
                hourly_data.get('wind_direction_10m', [None])[i] if i < len(hourly_data.get('wind_direction_10m', [])) else None,
                hourly_data.get('cloud_cover', [None])[i] if i < len(hourly_data.get('cloud_cover', [])) else None,
                hourly_data.get('uv_index', [None])[i] if i < len(hourly_data.get('uv_index', [])) else None
            ))
    
    def _insert_daily_weather(self, cursor, location_id: int, daily_data: Dict[str, Any]):
        """Insert daily weather forecast data (7-day forecast)."""
        num_days = len(daily_data.get('time', []))
        
        for i in range(num_days):
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
                daily_data['time'][i],
                daily_data['temperature_2m_max'][i],
                daily_data['temperature_2m_min'][i],
                daily_data['precipitation_sum'][i],
                daily_data['precipitation_probability_max'][i],
                daily_data['wind_speed_10m_max'][i],
                daily_data['uv_index_max'][i]
            ))
    
    # Weather Data Retrieval
    def get_weather_data(self, location_id: int, days: int = 7) -> List[Dict]:
        """Get recent weather data for a location."""
        conn = None
        cursor = None
        try:
            conn = psycopg2.connect(self.connection_string)
            cursor = conn.cursor()
            
            cursor.execute('''
                SELECT w.*, ul.name as location_name
                FROM weather_data w
                JOIN user_locations ul ON w.location_id = ul.id
                WHERE ul.id = %s
                ORDER BY w.timestamp DESC
                LIMIT %s
            ''', (location_id, days * 24))
            
            columns = [desc[0] for desc in cursor.description]
            results = [dict(zip(columns, row)) for row in cursor.fetchall()]
            return results
        finally:
            if cursor:
                cursor.close()
            if conn:
                conn.close()
    
    def get_daily_forecast(self, location_id: int) -> List[Dict]:
        """Get 7-day forecast for a location."""
        conn = None
        cursor = None
        try:
            conn = psycopg2.connect(self.connection_string)
            cursor = conn.cursor()
            
            cursor.execute('''
                SELECT d.*, ul.name as location_name
                FROM daily_weather d
                JOIN user_locations ul ON d.location_id = ul.id
                WHERE ul.id = %s
                ORDER BY d.date ASC
            ''', (location_id,))
            
            columns = [desc[0] for desc in cursor.description]
            results = [dict(zip(columns, row)) for row in cursor.fetchall()]
            return results
        finally:
            if cursor:
                cursor.close()
            if conn:
                conn.close()
