"""Check users in the database."""
import psycopg2
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(__file__)))
from config import config

conn = psycopg2.connect(config.DATABASE_URL)
cursor = conn.cursor()

cursor.execute('SELECT id, username, email, password_hash FROM users LIMIT 5')
print('Users in database:')
users = cursor.fetchall()
if not users:
    print('  No users found!')
else:
    for row in users:
        print(f'  ID: {row[0]}, Username: {row[1]}, Email: {row[2]}, Hash: {row[3][:30]}...')

print('\n--- Testing password hash ---')
import hashlib
password = "password"
expected_hash = hashlib.sha256(password.encode()).hexdigest()
print(f"Expected hash for 'password': {expected_hash}")

print('\n--- Checking if admin user matches ---')
cursor.execute('SELECT username, password_hash FROM users WHERE username = %s', ('admin',))
admin = cursor.fetchone()
if admin:
    print(f"Admin user found: {admin[0]}")
    print(f"Stored hash:   {admin[1]}")
    print(f"Expected hash: {expected_hash}")
    print(f"Match: {admin[1] == expected_hash}")
else:
    print("Admin user NOT found in database!")

cursor.close()
conn.close()
