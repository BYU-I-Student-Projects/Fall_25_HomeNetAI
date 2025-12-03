"""Verify locations are associated with admin user."""

import psycopg2
import sys
import os

sys.path.append(os.path.dirname(os.path.dirname(__file__)))
from config import config

conn = psycopg2.connect(config.DATABASE_URL)
cursor = conn.cursor()

cursor.execute("""
    SELECT u.username, ul.id, ul.name, ul.latitude, ul.longitude 
    FROM user_locations ul 
    JOIN users u ON ul.user_id = u.id 
    ORDER BY ul.id
""")

rows = cursor.fetchall()
print("Locations by user:")
print("=" * 60)
for row in rows:
    print(f"  User: {row[0]}")
    print(f"  Location ID: {row[1]}")
    print(f"  Name: {row[2]}")
    print(f"  Coordinates: {row[3]}, {row[4]}")
    print()

cursor.close()
conn.close()

