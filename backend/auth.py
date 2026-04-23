# backend/auth.py
import os
import re
from datetime import datetime, timedelta
from typing import Optional

from dotenv import load_dotenv
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt
from passlib.context import CryptContext

from models import User

# Load environment variables (CIA: Confidentiality — secrets from .env)
load_dotenv()

SECRET_KEY = os.getenv("JWT_SECRET_KEY", "fallback-secret-change-me")
ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("JWT_EXPIRE_MINUTES", "60"))

# --- Password Hashing (bcrypt) ---
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

security = HTTPBearer()


def hash_password(password: str) -> str:
    """Hash a password using bcrypt."""
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against its bcrypt hash."""
    return pwd_context.verify(plain_password, hashed_password)


# --- Password Strength Validation ---
def validate_password_strength(password: str) -> dict:
    """
    Validate password strength with detailed feedback.
    Returns a dict with 'valid' (bool), 'score' (0-6), 'errors' (list).
    """
    errors = []
    score = 0

    if len(password) >= 8:
        score += 1
    else:
        errors.append("Password must be at least 8 characters long")

    if len(password) >= 12:
        score += 1

    if re.search(r"[A-Z]", password):
        score += 1
    else:
        errors.append("Password must contain at least one uppercase letter")

    if re.search(r"[a-z]", password):
        score += 1
    else:
        errors.append("Password must contain at least one lowercase letter")

    if re.search(r"\d", password):
        score += 1
    else:
        errors.append("Password must contain at least one digit")

    if re.search(r"[!@#$%^&*()_+\-=\[\]{};':\"\\|,.<>\/?`~]", password):
        score += 1
    else:
        errors.append("Password must contain at least one special character (!@#$%^&*...)")

    valid = len(errors) == 0 and len(password) >= 8

    return {
        "valid": valid,
        "score": score,
        "errors": errors,
    }


# --- JWT Token Management ---
def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Create a JWT access token."""
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


def decode_access_token(token: str) -> Optional[str]:
    """Decode a JWT token and return the username."""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            return None
        return username
    except JWTError:
        return None


async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> User:
    """Dependency to get the current authenticated user from JWT token."""
    token = credentials.credentials
    username = decode_access_token(token)

    if username is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user = await User.find_one(User.username == username)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
        )

    return user
