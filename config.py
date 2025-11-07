"""
HomeNetAI Configuration
Minimal configuration for the project
"""

import os

class Config:
    
    # Database
    DATABASE_URL: str = os.getenv("DATABASE_URL", "postgresql://postgres:nathan-7108@localhost/homenet")
    
    # API
    SECRET_KEY: str = os.getenv("SECRET_KEY", "your-secret-key-change-in-production")
    
    # Server
    HOST: str = os.getenv("HOST", "127.0.0.1")  # Use 127.0.0.1 for Windows compatibility
    PORT: int = int(os.getenv("PORT", "8000"))
    
    # CORS - Allowed origins for API access
    # Allow all localhost ports for development
    CORS_ORIGINS: list = ["*"]  # Allow all origins in development
    
    # Weather Collection
    COLLECTION_INTERVAL_MINUTES: int = int(os.getenv("COLLECTION_INTERVAL_MINUTES", "30"))

# Global config instance
config = Config()
