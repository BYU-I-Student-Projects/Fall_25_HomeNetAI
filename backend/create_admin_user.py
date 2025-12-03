"""
Create Admin User Script
Creates an admin user in the database.
"""

import psycopg2
import sys
import os
import hashlib
from datetime import datetime, timezone

# Add parent directory to path to import config
sys.path.append(os.path.dirname(os.path.dirname(__file__)))
from config import config


def hash_password(password: str) -> str:
    """Hash a password using SHA-256."""
    return hashlib.sha256(password.encode()).hexdigest()


def create_admin_user():
    """Create an admin user in the database."""
    conn = None
    cursor = None
    
    try:
        # Connect to database
        conn = psycopg2.connect(config.DATABASE_URL)
        cursor = conn.cursor()
        
        username = "admin"
        email = "admin@homenet.ai"
        password = "password"
        
        print(f"Creating admin user...")
        print(f"  Username: {username}")
        print(f"  Email: {email}")
        print(f"  Password: {password}")
        
        # Check if user already exists
        cursor.execute("SELECT id FROM users WHERE username = %s OR email = %s", (username, email))
        existing_user = cursor.fetchone()
        
        if existing_user:
            print(f"\n⚠️  User '{username}' or email '{email}' already exists!")
            response = input("Do you want to update the password? (yes/no): ")
            if response.lower() in ['yes', 'y']:
                hashed_password = hash_password(password)
                cursor.execute("""
                    UPDATE users 
                    SET password_hash = %s 
                    WHERE username = %s
                """, (hashed_password, username))
                conn.commit()
                print(f"✅ Password updated for user '{username}'")
            else:
                print("Operation cancelled.")
            return
        
        # Create the user
        hashed_password = hash_password(password)
        cursor.execute("""
            INSERT INTO users (username, email, password_hash, created_at)
            VALUES (%s, %s, %s, %s)
            RETURNING id
        """, (username, email, hashed_password, datetime.now(timezone.utc)))
        
        user_id = cursor.fetchone()[0]
        conn.commit()
        
        print(f"\n✅ Admin user created successfully!")
        print(f"   User ID: {user_id}")
        print(f"   Username: {username}")
        print(f"   Email: {email}")
        
    except psycopg2.OperationalError as e:
        print(f"\n❌ Database connection error: {e}")
        print("Please check:")
        print("  1. PostgreSQL is running")
        print("  2. Database exists: homenet")
        print("  3. Connection string is correct in config.py")
        return False
    except Exception as e:
        print(f"\n❌ Error creating admin user: {e}")
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
    print("HomeNetAI - Create Admin User")
    print("=" * 60)
    print()
    
    success = create_admin_user()
    
    if success:
        print("\n" + "=" * 60)
        print("Admin user setup complete!")
        print("=" * 60)
    else:
        print("\n" + "=" * 60)
        print("Failed to create admin user. Please check the errors above.")
        print("=" * 60)
        sys.exit(1)

