from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from typing import Optional
from bson import ObjectId

from auth import get_current_user
from database import get_collection
from models.user import UserResponse

router = APIRouter()

class UpdateUserRequest(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    location: Optional[str] = None
    tagline: Optional[str] = None
    profile_image: Optional[str] = None

@router.get("/me", response_model=UserResponse)
async def get_profile(
    current_user_id: str = Depends(get_current_user)
):
    users_collection = get_collection("users")
    user = await users_collection.find_one({"_id": ObjectId(current_user_id)})
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    
    return {
        "id": str(user["_id"]),
        "name": user["name"],
        "email": user["email"],
        "role": user.get("role", "user"),
        "email_verified": user.get("email_verified", False),
        "location": user.get("location"),
        "tagline": user.get("tagline"),
        "profile_image": user.get("profile_image"),
        "created_at": user.get("created_at"),
        "updated_at": user.get("updated_at")
    }

@router.put("/me", response_model=UserResponse)
async def update_profile(
    update: UpdateUserRequest,
    current_user_id: str = Depends(get_current_user)
):
    users_collection = get_collection("users")
    
    update_data = {k: v for k, v in update.dict(exclude_unset=True).items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No data provided")
        
    result = await users_collection.update_one(
        {"_id": ObjectId(current_user_id)},
        {"$set": update_data}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
        
    user = await users_collection.find_one({"_id": ObjectId(current_user_id)})
    return {
        "id": str(user["_id"]),
        "name": user["name"],
        "email": user["email"],
        "role": user.get("role", "user"),
        "email_verified": user.get("email_verified", False),
        "location": user.get("location"),
        "tagline": user.get("tagline"),
        "profile_image": user.get("profile_image"),
        "created_at": user.get("created_at"),
        "updated_at": user.get("updated_at")
    }
