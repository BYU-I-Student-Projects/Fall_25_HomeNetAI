"""
HomeNetAI Configuration
Minimal configuration for the project
"""

import os

class Config:
    
    # Database (CHANGE THIS TO YOUR OWN CREDENTIALS)
    DATABASE_URL: str = os.getenv("DATABASE_URL", "postgresql://postgres:nathan-7108@localhost/homenet")
    
    # API
    SECRET_KEY: str = os.getenv("SECRET_KEY", "your-secret-key-change-in-production")
    
    # Server
    HOST: str = os.getenv("HOST", "0.0.0.0")
    PORT: int = int(os.getenv("PORT", "8000"))
    
    # CORS
    CORS_ORIGINS: list = [
        "http://localhost:5173",
        "http://localhost:5174",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:5174",
    ]
    
    # Weather Collection
    COLLECTION_INTERVAL_MINUTES: int = int(os.getenv("COLLECTION_INTERVAL_MINUTES", "30"))

# Global config instance
config = Config()