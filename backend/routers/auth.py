import random
import re
from datetime import datetime, timedelta
from fastapi import APIRouter, HTTPException, status, Depends
from pydantic import BaseModel, EmailStr
from typing import Optional, List
from bson import ObjectId
from pymongo.errors import DuplicateKeyError

# Internal imports
from auth import (
    hash_password,
    verify_password,
    create_access_token,
    get_current_user
)
from database import get_collection
from models.user import (
    UserCreate,
    UserLogin,
    UserResponse,
    TokenResponse,
    UserUpdate,
    OTPSendRequest,
    OTPVerifyRequest
)
from utils.email import send_otp_email

router = APIRouter(prefix="/auth", tags=["Authentication"])

# OTP cooldown: 60 seconds between resend requests
OTP_RESEND_COOLDOWN_SECONDS = 60

# --- Helper Functions ---
def generate_otp():
    return str(random.randint(100000, 999999))

# --- Endpoints ---

@router.post("/register", response_model=TokenResponse)
async def register(user_data: UserCreate):
    """Register a new user and send verification OTP"""
    # 1. Normalize email and data
    clean_email = user_data.email.strip().lower()
    clean_password = user_data.password.strip()
    clean_name = user_data.name.strip()
    clean_username = user_data.username.strip().lower() if user_data.username else None

    # Backend Password Validation
    if len(clean_password) < 8:
        raise HTTPException(status_code=400, detail="Password must be at least 8 characters")
    
    if not re.search(r"[A-Z]", clean_password):
        raise HTTPException(status_code=400, detail="Password must contain an uppercase letter")
    if not re.search(r"[a-z]", clean_password):
        raise HTTPException(status_code=400, detail="Password must contain a lowercase letter")
    if not re.search(r"\d", clean_password):
        raise HTTPException(status_code=400, detail="Password must contain a number")
    if not re.search(r"[!@#$%^&*(),.?\":{}|<>]", clean_password):
        raise HTTPException(status_code=400, detail="Password must contain a special character")

    print(f"[AUTH] Registering user: {clean_email}")

    try:
        users_collection = get_collection("users")
    except Exception as db_err:
        print(f"[AUTH] DB Connection Error: {db_err}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Database connection failed"
        )

    # 2. Check if user already exists
    existing_user = await users_collection.find_one({"email": clean_email})
    if existing_user:
        if existing_user.get("email_verified"):
            print(f"[AUTH] Email already registered and verified: {clean_email}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="This email is already registered. Please login."
            )
        else:
            # User exists but not verified - Resend OTP logic
            print(f"[AUTH] User exists but not verified. Attempting OTP resend: {clean_email}")
            
            # Enforce 60-second cooldown even for re-registration attempts
            last_resend = existing_user.get("otp_resend_at")
            if last_resend:
                elapsed = (datetime.utcnow() - last_resend).total_seconds()
                if elapsed < OTP_RESEND_COOLDOWN_SECONDS:
                    remaining = int(OTP_RESEND_COOLDOWN_SECONDS - elapsed)
                    raise HTTPException(
                        status_code=429,
                        detail=f"Please wait {remaining} seconds before requesting another OTP"
                    )

            otp = generate_otp()
            otp_expiry = datetime.utcnow() + timedelta(minutes=5)
            
            # TRY SENDING EMAIL FIRST
            try:
                await send_otp_email(clean_email, otp)
            except Exception as e:
                print(f"SMTP ERROR: {str(e)}")
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail=f"Unable to send OTP email. SMTP Error: {str(e)}"
                )

            # ONLY AFTER SUCCESSFUL EMAIL, update DB
            await users_collection.update_one(
                {"email": clean_email},
                {"$set": {
                    "otp": otp, 
                    "otp_expiry": otp_expiry, 
                    "otp_resend_at": datetime.utcnow(),
                    "updated_at": datetime.utcnow()
                }}
            )
            
            user_id = str(existing_user["_id"])
            token = create_access_token(data={"id": user_id, "email": clean_email})

            return {
                "access_token": token,
                "token_type": "bearer",
                "user": {
                    "id": user_id,
                    "name": existing_user["name"],
                    "email": clean_email,
                    "username": existing_user.get("username"),
                    "role": existing_user.get("role", "user"),
                    "email_verified": False,
                    "message": "Verification pending. OTP resent successfully."
                }
            }

    # 3. Check if username is already taken
    if clean_username:
        existing_username = await users_collection.find_one({"username": clean_username})
        if existing_username:
            raise HTTPException(status_code=400, detail="Username already taken")

    # 4. Prepare User Data
    otp = generate_otp()
    otp_expiry = datetime.utcnow() + timedelta(minutes=5)

    # TRY SENDING EMAIL FIRST
    try:
        await send_otp_email(clean_email, otp)
    except Exception as e:
        print(f"SMTP ERROR: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Unable to send OTP email. SMTP Error: {str(e)}"
        )

    # 5. Prepare User Data for DB
    new_user = {
        "name": clean_name,
        "email": clean_email,
        "username": clean_username,
        "password": hash_password(clean_password),
        "role": "user",
        "email_verified": False,
        "otp": otp,
        "otp_expiry": otp_expiry,
        "otp_resend_at": datetime.utcnow(),
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    }

    # 6. Insert into DB
    try:
        result = await users_collection.insert_one(new_user)
        user_id = str(result.inserted_id)
        print(f"[AUTH] User created with ID: {user_id}")
    except DuplicateKeyError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email or username already registered"
        )

    # 7. Generate JWT
    token = create_access_token(data={"id": user_id, "email": clean_email})

    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": user_id,
            "name": clean_name,
            "email": clean_email,
            "username": clean_username,
            "role": "user",
            "email_verified": False
        }
    }


@router.post("/login", response_model=TokenResponse)
async def login(user_data: UserLogin):
    """Login an existing user. Blocks unverified new users."""
    identifier = user_data.identifier.strip().lower()
    clean_password = user_data.password.strip()

    print(f"[AUTH] Login attempt: {identifier}")
    users_collection = get_collection("users")

    # Find user by email OR username
    user = await users_collection.find_one({
        "$or": [
            {"email": identifier},
            {"username": identifier}
        ]
    })
    
    if not user:
        print(f"[AUTH] User not found: {identifier}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )

    # Verify password
    if not verify_password(clean_password, user["password"]):
        print(f"[AUTH] Password mismatch for: {identifier}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )

    # Check email verification
    email_verified = user.get("email_verified")
    if email_verified is False:
        print(f"[AUTH] Login blocked: Email not verified for {identifier}")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Please verify your email before login."
        )

    print(f"[AUTH] Login successful: {identifier}")
    user_id = str(user["_id"])
    email = user["email"]

    # Generate token
    token = create_access_token(data={"id": user_id, "email": email})

    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": user_id,
            "name": user["name"],
            "email": user["email"],
            "username": user.get("username"),
            "role": user.get("role", "user"),
            "email_verified": True,
            "location": user.get("location"),
            "tagline": user.get("tagline"),
            "profile_image": user.get("profile_image")
        }
    }


@router.post("/send-otp")
async def send_otp(request: OTPSendRequest):
    """Generate and send a new OTP to the user's email (initial send)"""
    email = request.email.strip().lower()
    users_collection = get_collection("users")

    user = await users_collection.find_one({"email": email})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if user.get("email_verified"):
        return {"message": "Email already verified"}

    otp = generate_otp()
    otp_expiry = datetime.utcnow() + timedelta(minutes=5)

    # TRY SENDING EMAIL FIRST
    try:
        await send_otp_email(email, otp)
    except Exception as e:
        print(f"SMTP ERROR: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Unable to send OTP email. SMTP Error: {str(e)}"
        )

    # ONLY AFTER SUCCESSFUL EMAIL, update DB
    await users_collection.update_one(
        {"email": email},
        {"$set": {"otp": otp, "otp_expiry": otp_expiry, "otp_resend_at": datetime.utcnow()}}
    )

    return {"message": "OTP sent successfully"}


@router.post("/resend-otp")
async def resend_otp(request: OTPSendRequest):
    """Resend OTP with 60-second cooldown to prevent spam"""
    email = request.email.strip().lower()
    users_collection = get_collection("users")

    user = await users_collection.find_one({"email": email})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if user.get("email_verified"):
        return {"message": "Email already verified"}

    # Enforce 60-second cooldown between resend requests
    last_resend = user.get("otp_resend_at")
    if last_resend:
        elapsed = (datetime.utcnow() - last_resend).total_seconds()
        if elapsed < OTP_RESEND_COOLDOWN_SECONDS:
            remaining = int(OTP_RESEND_COOLDOWN_SECONDS - elapsed)
            raise HTTPException(
                status_code=429,
                detail=f"Please wait {remaining} seconds before requesting another OTP"
            )

    otp = generate_otp()
    otp_expiry = datetime.utcnow() + timedelta(minutes=5)

    # TRY SENDING EMAIL FIRST
    try:
        await send_otp_email(email, otp)
    except Exception as e:
        print(f"SMTP ERROR: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Unable to send OTP email. SMTP Error: {str(e)}"
        )

    # ONLY AFTER SUCCESSFUL EMAIL, update DB
    await users_collection.update_one(
        {"email": email},
        {"$set": {"otp": otp, "otp_expiry": otp_expiry, "otp_resend_at": datetime.utcnow()}}
    )

    print(f"[AUTH] OTP resent to {email}")
    return {"message": "OTP resent successfully"}


@router.post("/verify-otp")
async def verify_otp(request: OTPVerifyRequest):
    """Verify the provided OTP and mark email as verified. Returns auth token."""
    email = request.email.strip().lower()
    otp = request.otp.strip()

    users_collection = get_collection("users")
    user = await users_collection.find_one({"email": email})

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Already verified — just return success message
    if user.get("email_verified"):
        return {
            "message": "Registration successful. Please login.",
            "user": {
                "id": str(user["_id"]),
                "name": user["name"],
                "email": user["email"],
                "username": user.get("username"),
                "role": user.get("role", "user"),
                "email_verified": True
            }
        }

    stored_otp = user.get("otp")
    otp_expiry = user.get("otp_expiry")

    if not stored_otp or not otp_expiry:
        raise HTTPException(status_code=400, detail="No OTP found. Please request a new one.")

    if datetime.utcnow() > otp_expiry:
        raise HTTPException(status_code=400, detail="OTP expired. Please request a new one.")

    if stored_otp != otp:
        raise HTTPException(status_code=400, detail="Invalid OTP code. Please try again.")

    # Mark as verified and clear OTP fields
    await users_collection.update_one(
        {"email": email},
        {
            "$set": {"email_verified": True, "updated_at": datetime.utcnow()},
            "$unset": {"otp": "", "otp_expiry": "", "otp_resend_at": ""}
        }
    )

    print(f"[AUTH] Email verified successfully for {email}")

    return {
        "message": "Registration successful. Please login.",
        "user": {
            "id": str(user["_id"]),
            "name": user["name"],
            "email": user["email"],
            "username": user.get("username"),
            "role": user.get("role", "user"),
            "email_verified": True
        }
    }


@router.get("/me", response_model=UserResponse)
async def get_me(user_id: str = Depends(get_current_user)):
    """Get current user profile"""
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
        "role": user.get("role", "user"),
        "email_verified": user.get("email_verified", False),
        "location": user.get("location"),
        "tagline": user.get("tagline"),
        "profile_image": user.get("profile_image")
    }


@router.put("/me", response_model=UserResponse)
async def update_me(
    update_data: UserUpdate,
    user_id: str = Depends(get_current_user)
):
    """Update current user profile"""
    users_collection = get_collection("users")

    # Filter out None values
    updates = {k: v for k, v in update_data.dict().items() if v is not None}
    if not updates:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No fields provided for update"
        )

    updates["updated_at"] = datetime.utcnow()

    result = await users_collection.update_one(
        {"_id": ObjectId(user_id)},
        {"$set": updates}
    )

    if result.matched_count == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    updated_user = await users_collection.find_one({"_id": ObjectId(user_id)})
    return {
        "id": str(updated_user["_id"]),
        "name": updated_user["name"],
        "email": updated_user["email"],
        "role": updated_user.get("role", "user"),
        "email_verified": updated_user.get("email_verified", False),
        "location": updated_user.get("location"),
        "tagline": updated_user.get("tagline"),
        "profile_image": updated_user.get("profile_image")
    }
