from fastapi import APIRouter, HTTPException, status, Depends
from pydantic import BaseModel
from datetime import datetime, timedelta
from typing import Optional
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

# Using functions from auth module for hashing and token generation
from auth import SECRET_KEY, ALGORITHM, ACCESS_TOKEN_EXPIRE_MINUTES, hash_password, verify_password, get_current_user
from jose import jwt

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
    clean_email = user_data.email.strip().lower()
    clean_password = user_data.password.strip()
    clean_name = user_data.name.strip()
    
    print(f"[AUTH] Register attempt: '{clean_email}'")
    users_collection = get_collection("users")
    
    # Check if user exists (case-insensitive)
    existing_user = await users_collection.find_one({"email": {"$regex": f"^{clean_email}$", "$options": "i"}})
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Create user
    user = {
        "name": clean_name,
        "email": clean_email,
        "password": hash_password(clean_password),  # Hash password
        "role": "user",
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    }
    
    result = await users_collection.insert_one(user)
    print(f"[AUTH] User registered with id: {result.inserted_id}")
    
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
    try:
        clean_email = user_data.email.strip().lower()
        clean_password = user_data.password.strip()
        
        print(f"[AUTH] Login attempt: '{clean_email}' (len: {len(clean_email)})")
        users_collection = get_collection("users")
        
        # Find user
        user = await users_collection.find_one({"email": clean_email})
        if not user:
            # Fallback: try case-insensitive search in case old users aren't lowercase
            user = await users_collection.find_one({"email": {"$regex": f"^{clean_email}$", "$options": "i"}})
            
        if not user:
            print(f"[AUTH] User not found in DB: '{clean_email}'")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password"
            )
        
        # Verify password
        print(f"[AUTH] Found user in DB with email: '{user['email']}'. Checking password...")
        is_valid_pwd = verify_password(clean_password, user.get("password", "")) if user.get("password") else False
        print(f"[AUTH] Password verification result: {is_valid_pwd}")
        
        if not is_valid_pwd:
            print(f"[AUTH] Invalid password for: '{clean_email}'")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password"
            )
        
        print(f"[AUTH] Login successful: {user['email']}")
        
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
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        error_trace = traceback.format_exc()
        print(f"[AUTH] CRASH IN LOGIN: {str(e)}")
        print(f"[AUTH] TRACE: {error_trace}")
        
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Backend Error: {str(e)}"
        )

@router.get("/me", response_model=UserResponse)
async def get_current_user_info(token: str):
    from jose import JWTError
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
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token"
        )

@router.post("/save-place")
async def save_place(place_data: dict, current_user_id: str = Depends(get_current_user)):
    """Save a place to user's favorites"""
    users_collection = get_collection("users")
    place_id = place_data.get("placeId")
    if not place_id:
        raise HTTPException(status_code=400, detail="placeId is required")
    
    # Update user document to include the saved place
    await users_collection.update_one(
        {"_id": ObjectId(current_user_id)},
        {"$addToSet": {"saved_places": place_id}}
    )
    
    return {"message": "Place saved successfully", "placeId": place_id}

@router.delete("/save-place/{place_id}")
async def unsave_place(place_id: str, current_user_id: str = Depends(get_current_user)):
    """Remove a place from user's favorites"""
    users_collection = get_collection("users")
    
    await users_collection.update_one(
        {"_id": ObjectId(current_user_id)},
        {"$pull": {"saved_places": place_id}}
    )
    
    return {"message": "Place removed from favorites"}

@router.get("/saved-places")
async def get_saved_places(current_user_id: str = Depends(get_current_user)):
    """Get all saved places for the current user"""
    users_collection = get_collection("users")
    user = await users_collection.find_one({"_id": ObjectId(current_user_id)})
    
    saved_ids = user.get("saved_places", [])
    
    destinations_collection = get_collection("destinations")
    # Convert IDs to ObjectId
    object_ids = []
    for sid in saved_ids:
        try:
            object_ids.append(ObjectId(sid))
        except:
            pass
            
    saved_places = await destinations_collection.find({"_id": {"$in": object_ids}}).to_list(length=None)
    
    for place in saved_places:
        place["id"] = str(place.pop("_id"))
        
    return saved_places