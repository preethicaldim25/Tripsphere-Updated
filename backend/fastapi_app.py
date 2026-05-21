from fastapi import FastAPI, Depends, HTTPException, Query, status, Header, APIRouter
from fastapi.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime
from bson import ObjectId
import jwt
import os
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="Tripsphere API")

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# MongoDB connection
MONGO_URI = os.getenv("MONGO_URI")
client = AsyncIOMotorClient(MONGO_URI)
db = client.get_database("tripsphere")
trips_collection = db.get_collection("trips")

JWT_SECRET = os.getenv("JWT_SECRET", "supersecretkey")

# Pydantic models
class ItineraryItem(BaseModel):
    day: int
    description: str

class TripBase(BaseModel):
    title: str
    destination_name: str
    destination_image: str
    location: str
    start_date: str
    end_date: str
    total_budget: float
    used_budget: float = 0.0
    status: str = "upcoming"
    members: List[str] = []
    itinerary: List[ItineraryItem] = []

class TripCreate(TripBase):
    pass

class TripUpdate(BaseModel):
    title: Optional[str]
    destination_name: Optional[str]
    destination_image: Optional[str]
    location: Optional[str]
    start_date: Optional[str]
    end_date: Optional[str]
    total_budget: Optional[float]
    used_budget: Optional[float]
    status: Optional[str]
    members: Optional[List[str]]
    itinerary: Optional[List[ItineraryItem]]

# Helper functions
async def get_current_user(authorization: str = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Not authorized, no token")
    
    token = authorization.split(" ")[1]
    try:
        decoded = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
        return decoded["id"]
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

def format_trip(trip):
    if not trip:
        return None
    trip["_id"] = str(trip["_id"])
    return trip

def format_response(success: bool, message: str, data: any = None):
    return {
        "success": success,
        "message": message,
        "data": data
    }

# Create Router for trips
trips_router = APIRouter(prefix="/trips")

@trips_router.post("", status_code=status.HTTP_201_CREATED)
async def create_trip(trip: TripCreate, user_id: str = Depends(get_current_user)):
    new_trip = trip.dict()
    new_trip["user_id"] = user_id
    new_trip["created_at"] = datetime.utcnow()
    
    # Auto status update
    try:
        today = datetime.utcnow()
        start = datetime.fromisoformat(trip.start_date.replace('Z', '+00:00'))
        end = datetime.fromisoformat(trip.end_date.replace('Z', '+00:00'))
        
        if today > end:
            new_trip["status"] = "completed"
        elif start <= today <= end:
            new_trip["status"] = "ongoing"
    except Exception as e:
        print(f"Date parsing error: {e}")
    
    result = await trips_collection.insert_one(new_trip)
    created_trip = await trips_collection.find_one({"_id": result.inserted_id})
    return format_response(True, "Trip created successfully", format_trip(created_trip))

@trips_router.get("")
async def get_trips(
    status: Optional[str] = None, 
    user_id: str = Depends(get_current_user),
    page: int = 1,
    limit: int = 20
):
    query = {"user_id": user_id}
    if status:
        query["status"] = status
    
    skip = (page - 1) * limit
    cursor = trips_collection.find(query).sort("start_date", 1).skip(skip).limit(limit)
    trips = await cursor.to_list(length=limit)
    
    # Auto update status on fetch
    today = datetime.utcnow()
    formatted_trips = []
    for t in trips:
        updated_status = t["status"]
        if t["status"] != "saved":
            try:
                start = datetime.fromisoformat(t["start_date"].replace('Z', '+00:00'))
                end = datetime.fromisoformat(t["end_date"].replace('Z', '+00:00'))
                
                if today > end:
                    updated_status = "completed"
                elif start <= today <= end:
                    updated_status = "ongoing"
                else:
                    updated_status = "upcoming"
                
                if updated_status != t["status"]:
                    await trips_collection.update_one({"_id": t["_id"]}, {"$set": {"status": updated_status}})
                    t["status"] = updated_status
            except Exception as e:
                print(f"Date parsing error for trip {t['_id']}: {e}")
        
        formatted_trips.append(format_trip(t))

    return format_response(True, "Trips fetched successfully", formatted_trips)

@trips_router.get("/{trip_id}")
async def get_trip(trip_id: str, user_id: str = Depends(get_current_user)):
    if not ObjectId.is_valid(trip_id):
        raise HTTPException(status_code=400, detail="Invalid trip ID")
    
    trip = await trips_collection.find_one({"_id": ObjectId(trip_id), "user_id": user_id})
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")
    
    return format_response(True, "Trip fetched successfully", format_trip(trip))

@trips_router.put("/{trip_id}")
async def update_trip(trip_id: str, trip_update: TripUpdate, user_id: str = Depends(get_current_user)):
    if not ObjectId.is_valid(trip_id):
        raise HTTPException(status_code=400, detail="Invalid trip ID")
    
    update_data = {k: v for k, v in trip_update.dict().items() if v is not None}
    
    if "used_budget" in update_data and "total_budget" in update_data:
        if update_data["used_budget"] > update_data["total_budget"]:
            raise HTTPException(status_code=400, detail="Used budget cannot exceed total budget")

    result = await trips_collection.update_one(
        {"_id": ObjectId(trip_id), "user_id": user_id},
        {"$set": update_data}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Trip not found")
        
    updated_trip = await trips_collection.find_one({"_id": ObjectId(trip_id)})
    return format_response(True, "Trip updated successfully", format_trip(updated_trip))

@trips_router.delete("/{trip_id}")
async def delete_trip(trip_id: str, user_id: str = Depends(get_current_user)):
    if not ObjectId.is_valid(trip_id):
        raise HTTPException(status_code=400, detail="Invalid trip ID")
        
    result = await trips_collection.delete_one({"_id": ObjectId(trip_id), "user_id": user_id})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Trip not found")
        
    return format_response(True, "Trip deleted successfully")

# Include Router with prefix
app.include_router(trips_router, prefix="/api")

# Also include the AI router and direct road-trip-intelligence route in fastapi_app.py to avoid 404s
from routers import ai
app.include_router(ai.router, prefix="/api")

@app.post("/api/road-trip-intelligence")
async def get_road_trip_intelligence_alias(request: ai.RoadTripRequest, current_user_id: str = Depends(get_current_user)):
    return await ai.get_road_trip_intelligence(request, current_user_id)


if __name__ == "__main__":
    import uvicorn
    import os
    from dotenv import load_dotenv
    load_dotenv()
    port = int(os.getenv("PORT", 8000))
    print(f"\n🚀 Backend running on:")
    print(f"   - Local:    http://localhost:{port}")
    print(f"   - Network:  http://0.0.0.0:{port}\n")
    print("   Note: In your browser, use http://localhost:8000/")
    uvicorn.run(app, host="0.0.0.0", port=port)
