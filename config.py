"""
HomeNetAI Configuration
Minimal configuration for the project
"""

import os
from dotenv import load_dotenv
from pathlib import Path

# Get the directory where this config.py file is located (Fall_25_HomeNetAI)
config_dir = Path(__file__).parent.absolute()

# Load environment variables from .env file in the same directory as config.py
env_path = config_dir / ".env"
if env_path.exists():
    load_dotenv(env_path)
else:
    # Fallback to default dotenv behavior (current working directory)
    load_dotenv()

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
    
    
    # Google Gemini AI Configuration
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    GEMINI_MODEL: str = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")  # Updated to available model
    GEMINI_TEMPERATURE: float = float(os.getenv("GEMINI_TEMPERATURE", "0.7"))

# Global config instance
config = Config()
