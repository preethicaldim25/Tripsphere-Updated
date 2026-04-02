from fastapi import APIRouter, HTTPException, Depends
from typing import Optional, List
from datetime import datetime
from bson import ObjectId
from database import get_collection
from auth import get_current_user
from pydantic import BaseModel, Field

router = APIRouter(prefix="/trips", tags=["Trips"])

class Activity(BaseModel):
    id: str
    time: str
    title: str
    description: Optional[str] = None
    location: Optional[str] = None
    cost: Optional[float] = 0.0
    category: str = "sightseeing"

class ItineraryDay(BaseModel):
    day: int
    date: str
    activities: List[Activity] = []

class TripCreate(BaseModel):
    name: str
    destination: str
    start_date: str
    end_date: str
    budget: float
    travelers: int = 1
    accommodation: Optional[str] = None
    notes: Optional[str] = None
    itinerary: List[ItineraryDay] = []

class TripUpdate(BaseModel):
    name: Optional[str] = None
    destination: Optional[str] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    budget: Optional[float] = None
    notes: Optional[str] = None

class TripResponse(BaseModel):
    id: str
    user_id: str
    name: str
    destination: str
    start_date: str
    end_date: str
    budget: float
    travelers: int = 1
    accommodation: Optional[str] = None
    notes: Optional[str] = None
    itinerary: List[ItineraryDay] = []
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

@router.get("/", response_model=List[TripResponse])
async def get_trips(current_user_id: str = Depends(get_current_user)):
    collection = get_collection("trips")
    cursor = collection.find({"user_id": current_user_id}).sort("created_at", -1)
    trips = await cursor.to_list(length=None)
    
    for trip in trips:
        trip["id"] = str(trip.pop("_id"))
    
    return trips

@router.post("/", response_model=TripResponse)
async def create_trip(
    trip_data: TripCreate,
    current_user_id: str = Depends(get_current_user)
):
    print(f"📥 Incoming trip data: {trip_data}")
    print(f"👤 Current user ID: {current_user_id}")
    
    try:
        collection = get_collection("trips")
        
        trip = {
            "user_id": current_user_id,
            "name": trip_data.name,
            "destination": trip_data.destination,
            "start_date": trip_data.start_date,
            "end_date": trip_data.end_date,
            "budget": trip_data.budget,
            "travelers": trip_data.travelers,
            "accommodation": trip_data.accommodation,
            "notes": trip_data.notes,
            "itinerary": [day.dict() for day in trip_data.itinerary] if trip_data.itinerary else [],
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
        
        print(f"💾 Saving trip to database...")
        result = await collection.insert_one(trip)
        
        if not result.inserted_id:
            print("❌ Failed to insert trip into database")
            raise HTTPException(status_code=500, detail="Failed to save trip to database")
            
        trip["id"] = str(result.inserted_id)
        print(f"✅ Trip created successfully with ID: {trip['id']}")
        
        return trip
    except Exception as e:
        print(f"❌ Error in create_trip: {str(e)}")
        import traceback
        traceback.print_exc()
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(
            status_code=500, 
            detail=f"Server error during trip creation: {str(e)}"
        )

@router.get("/{trip_id}", response_model=TripResponse)
async def get_trip(
    trip_id: str,
    current_user_id: str = Depends(get_current_user)
):
    collection = get_collection("trips")
    
    try:
        trip = await collection.find_one({
            "_id": ObjectId(trip_id),
            "user_id": current_user_id
        })
    except:
        raise HTTPException(status_code=400, detail="Invalid trip ID")
    
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")
    
    trip["id"] = str(trip.pop("_id"))
    return trip

@router.put("/{trip_id}", response_model=dict)
async def update_trip(
    trip_id: str,
    trip_data: TripUpdate,
    current_user_id: str = Depends(get_current_user)
):
    collection = get_collection("trips")
    
    update_data = {k: v for k, v in trip_data.dict().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="No data to update")
    
    update_data["updated_at"] = datetime.utcnow()
    
    try:
        result = await collection.update_one(
            {"_id": ObjectId(trip_id), "user_id": current_user_id},
            {"$set": update_data}
        )
    except:
        raise HTTPException(status_code=400, detail="Invalid trip ID")
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Trip not found")
    
    return {"message": "Trip updated successfully"}

@router.delete("/{trip_id}", response_model=dict)
async def delete_trip(
    trip_id: str,
    current_user_id: str = Depends(get_current_user)
):
    collection = get_collection("trips")
    
    try:
        result = await collection.delete_one({
            "_id": ObjectId(trip_id),
            "user_id": current_user_id
        })
    except:
        raise HTTPException(status_code=400, detail="Invalid trip ID")
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Trip not found")
    
    return {"message": "Trip deleted successfully"}

# --- Itinerary Endpoints ---

@router.get("/{trip_id}/itinerary", response_model=List[ItineraryDay])
async def get_itinerary(
    trip_id: str,
    current_user_id: str = Depends(get_current_user)
):
    collection = get_collection("trips")
    trip = await collection.find_one({"_id": ObjectId(trip_id), "user_id": current_user_id})
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")
    
    return trip.get("itinerary", [])

@router.post("/{trip_id}/itinerary", response_model=dict)
async def update_itinerary(
    trip_id: str,
    itinerary: List[ItineraryDay],
    current_user_id: str = Depends(get_current_user)
):
    collection = get_collection("trips")
    
    # Pre-process itinerary data
    itinerary_data = [day.dict() for day in itinerary]
    
    result = await collection.update_one(
        {"_id": ObjectId(trip_id), "user_id": current_user_id},
        {"$set": {"itinerary": itinerary_data, "updated_at": datetime.utcnow()}}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Trip not found")
        
    return {"message": "Itinerary updated successfully"}