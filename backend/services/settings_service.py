"""
Settings Service - User preferences management
"""
from datetime import datetime
from typing import Dict, Any, Optional
from database.database import HomeNetDatabase

class SettingsService:
    def __init__(self):
        self.db = HomeNetDatabase()
    
    def get_user_preferences(self, user_id: int) -> Dict[str, Any]:
        """Get user preferences, create default if doesn't exist"""
        query = """
            SELECT unit_system, theme, alerts_enabled, temperature_alerts,
                   precipitation_alerts, wind_alerts, anomaly_alerts,
                   email_notifications, updated_at
            FROM user_preferences
            WHERE user_id = %s
        """
        
        result = self.db.execute_query(query, (user_id,))
        
        if result:
            prefs = result[0]
            return {
                'user_id': user_id,
                'unit_system': prefs[0],
                'theme': prefs[1],
                'alerts_enabled': prefs[2],
                'temperature_alerts': prefs[3],
                'precipitation_alerts': prefs[4],
                'wind_alerts': prefs[5],
                'anomaly_alerts': prefs[6],
                'email_notifications': prefs[7],
                'updated_at': prefs[8].isoformat() if prefs[8] else None
            }
        else:
            # Create default preferences
            return self.create_default_preferences(user_id)
    
    def create_default_preferences(self, user_id: int) -> Dict[str, Any]:
        """Create default preferences for new user"""
        query = """
            INSERT INTO user_preferences (
                user_id, unit_system, theme, alerts_enabled,
                temperature_alerts, precipitation_alerts, wind_alerts,
                anomaly_alerts, email_notifications
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
            ON CONFLICT (user_id) DO NOTHING
            RETURNING unit_system, theme, alerts_enabled, temperature_alerts,
                      precipitation_alerts, wind_alerts, anomaly_alerts,
                      email_notifications, updated_at
        """
        
        result = self.db.execute_query(query, (
            user_id, 'imperial', 'light', True, True, True, True, True, False
        ))
        
        if result:
            prefs = result[0]
            return {
                'user_id': user_id,
                'unit_system': prefs[0],
                'theme': prefs[1],
                'alerts_enabled': prefs[2],
                'temperature_alerts': prefs[3],
                'precipitation_alerts': prefs[4],
                'wind_alerts': prefs[5],
                'anomaly_alerts': prefs[6],
                'email_notifications': prefs[7],
                'updated_at': prefs[8].isoformat() if prefs[8] else None
            }
        else:
            # Return defaults if insert failed (conflict)
            return {
                'user_id': user_id,
                'unit_system': 'imperial',
                'theme': 'light',
                'alerts_enabled': True,
                'temperature_alerts': True,
                'precipitation_alerts': True,
                'wind_alerts': True,
                'anomaly_alerts': True,
                'email_notifications': False,
                'updated_at': datetime.now().isoformat()
            }
    
    def update_user_preferences(self, user_id: int, preferences: Dict[str, Any]) -> Dict[str, Any]:
        """Update user preferences"""
        # Ensure preferences exist first
        self.get_user_preferences(user_id)
        
        # Build update query dynamically based on provided fields
        allowed_fields = {
            'unit_system', 'theme', 'alerts_enabled', 'temperature_alerts',
            'precipitation_alerts', 'wind_alerts', 'anomaly_alerts', 'email_notifications'
        }
        
        updates = []
        values = []
        
        for field, value in preferences.items():
            if field in allowed_fields:
                updates.append(f"{field} = %s")
                values.append(value)
        
        if not updates:
            return self.get_user_preferences(user_id)
        
        # Add updated_at
        updates.append("updated_at = CURRENT_TIMESTAMP")
        values.append(user_id)
        
        query = f"""
            UPDATE user_preferences
            SET {', '.join(updates)}
            WHERE user_id = %s
            RETURNING unit_system, theme, alerts_enabled, temperature_alerts,
                      precipitation_alerts, wind_alerts, anomaly_alerts,
                      email_notifications, updated_at
        """
        
        result = self.db.execute_query(query, tuple(values))
        
        if result:
            prefs = result[0]
            return {
                'user_id': user_id,
                'unit_system': prefs[0],
                'theme': prefs[1],
                'alerts_enabled': prefs[2],
                'temperature_alerts': prefs[3],
                'precipitation_alerts': prefs[4],
                'wind_alerts': prefs[5],
                'anomaly_alerts': prefs[6],
                'email_notifications': prefs[7],
                'updated_at': prefs[8].isoformat() if prefs[8] else None
            }
        
        return self.get_user_preferences(user_id)
    
    def delete_user_data(self, user_id: int) -> bool:
        """Delete all user data (for account deletion)"""
        try:
            # Delete user (cascade will delete locations, weather data, preferences)
            query = "DELETE FROM users WHERE id = %s"
            self.db.execute_query(query, (user_id,))
            return True
        except Exception as e:
            print(f"Error deleting user data: {e}")
            return False
    
    def update_password(self, user_id: int, new_password_hash: str) -> bool:
        """Update user password"""
        try:
            query = "UPDATE users SET password_hash = %s WHERE id = %s"
            self.db.execute_query(query, (new_password_hash, user_id))
            return True
        except Exception as e:
            print(f"Error updating password: {e}")
            return False

# Global service instance
settings_service = SettingsService()
