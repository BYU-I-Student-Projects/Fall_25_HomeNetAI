"""Authentication helper functions."""

import jwt
import hashlib
from datetime import datetime, timedelta
from fastapi import HTTPException, Depends, Header
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import Optional
from config import config

security = HTTPBearer(auto_error=False)  # Don't auto-raise error, we'll handle it
SECRET_KEY = config.SECRET_KEY
ALGORITHM = "HS256"

# Development bypass - set to True to skip authentication
BYPASS_AUTH = False  # Set to False to enable authentication


def create_access_token(data: dict) -> str:
    """Create a JWT access token (valid for 24 hours)."""
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(hours=24)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


def verify_token(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    authorization: Optional[str] = Header(None)
) -> str:
    """Verify and decode JWT token from request."""
    print(f"AUTH: verify_token called", flush=True)
    import sys
    sys.stdout.flush()
    # Development bypass - return a default username
    if BYPASS_AUTH:
        # Check if it's the dev bypass token in the credentials
        if credentials and credentials.credentials == "dev-bypass-token":
            return "dev_user"  # Return a default username for bypass mode
        # Check if it's the dev bypass token in the authorization header
        if authorization and authorization.startswith("Bearer dev-bypass-token"):
            return "dev_user"  # Return a default username for bypass mode
        # If no token provided, still allow access in bypass mode
        if not credentials:
            return "dev_user"
    
    # Normal authentication flow
    if not credentials:
        print(f"AUTH: No credentials provided", flush=True)
        sys.stdout.flush()
        raise HTTPException(status_code=401, detail="Authentication required")
    
    try:
        print(f"AUTH: Decoding token...", flush=True)
        sys.stdout.flush()
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            print(f"AUTH: No username in token", flush=True)
            sys.stdout.flush()
            raise HTTPException(status_code=401, detail="Invalid token")
        print(f"AUTH: Token valid, username: {username}", flush=True)
        sys.stdout.flush()
        return username
    except jwt.PyJWTError as e:
        print(f"AUTH: JWT error: {e}", flush=True)
        sys.stdout.flush()
        # In bypass mode, if token is invalid, still allow access
        if BYPASS_AUTH:
            return "dev_user"
        raise HTTPException(status_code=401, detail="Invalid token")


def hash_password(password: str) -> str:
    """Hash a password using SHA-256."""
    return hashlib.sha256(password.encode()).hexdigest()

