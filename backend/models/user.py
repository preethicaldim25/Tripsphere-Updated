from pydantic import BaseModel, EmailStr, Field as PydanticField
from typing import Optional
from datetime import datetime
from bson import ObjectId

class UserBase(BaseModel):
    name: str
    email: EmailStr
    username: Optional[str] = None

class UserCreate(UserBase):
    password: str

class UserLogin(BaseModel):
    identifier: str  # Can be email or username
    password: str

class UserResponse(UserBase):
    id: str
    role: str = "user"
    email_verified: bool = False
    location: Optional[str] = None
    tagline: Optional[str] = None
    profile_image: Optional[str] = None
    message: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True
        populate_by_name = True

class UserUpdate(BaseModel):
    name: Optional[str] = None
    location: Optional[str] = None
    tagline: Optional[str] = None
    profile_image: Optional[str] = None

class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse

class OTPVerifyRequest(BaseModel):
    email: EmailStr
    otp: str

class OTPSendRequest(BaseModel):
    email: EmailStr
