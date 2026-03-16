from fastapi import APIRouter, HTTPException, status, Depends
from pydantic import BaseModel
from datetime import datetime, timedelta
from typing import Optional
import jwt
from bson import ObjectId
import os
from dotenv import load_dotenv

load_dotenv()

# Models
class UserCreate(BaseModel):
    name: str
    email: str
    password: str

class UserLogin(BaseModel):
    email: str
    password: str

class UserResponse(BaseModel):
    id: str
    name: str
    email: str
    role: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse

# Simple password functions (in production, use proper hashing)
def hash_password(password: str) -> str:
    return password  # Simple for testing - use bcrypt in production!

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return plain_password == hashed_password  # Simple for testing

# JWT functions
SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key-for-development")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

# Database connection (simplified for testing)
from database import get_collection

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/register", response_model=TokenResponse)
async def register(user_data: UserCreate):
    print(f"📝 Register attempt: {user_data.email}")
    users_collection = get_collection("users")
    
    # Check if user exists
    existing_user = await users_collection.find_one({"email": user_data.email})
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Create user
    user = {
        "name": user_data.name,
        "email": user_data.email,
        "password": hash_password(user_data.password),  # Hash password
        "role": "user",
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    }
    
    result = await users_collection.insert_one(user)
    print(f"✅ User registered with id: {result.inserted_id}")
    
    # Create token
    token = create_access_token({
        "id": str(result.inserted_id),
        "email": user_data.email,
        "role": "user"
    })
    
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": str(result.inserted_id),
            "name": user_data.name,
            "email": user_data.email,
            "role": "user"
        }
    }

@router.post("/login", response_model=TokenResponse)
async def login(user_data: UserLogin):
    print(f"🔑 Login attempt: {user_data.email}")
    users_collection = get_collection("users")
    
    # Find user
    user = await users_collection.find_one({"email": user_data.email})
    if not user:
        print(f"❌ User not found: {user_data.email}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
    
    # Verify password
    if not verify_password(user_data.password, user["password"]):
        print(f"❌ Invalid password for: {user_data.email}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
    
    print(f"✅ Login successful: {user_data.email}")
    
    # Create token
    token = create_access_token({
        "id": str(user["_id"]),
        "email": user["email"],
        "role": user.get("role", "user")
    })
    
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": str(user["_id"]),
            "name": user["name"],
            "email": user["email"],
            "role": user.get("role", "user")
        }
    }

@router.get("/me", response_model=UserResponse)
async def get_current_user_info(token: str):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("id")
        
        users_collection = get_collection("users")
        user = await users_collection.find_one({"_id": ObjectId(user_id)})
        
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        return {
            "id": str(user["_id"]),
            "name": user["name"],
            "email": user["email"],
            "role": user.get("role", "user")
        }
    except jwt.PyJWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token"
        )