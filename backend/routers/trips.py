from fastapi import APIRouter, HTTPException, Depends
from typing import Optional, List
from datetime import datetime
from bson import ObjectId
from database import get_collection
from auth import get_current_user
from pydantic import BaseModel

router = APIRouter(prefix="/trips", tags=["Trips"])

class TripCreate(BaseModel):
    name: str
    destination: str
    start_date: str
    end_date: str
    budget: float
    notes: Optional[str] = None

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
    notes: Optional[str] = None
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
    collection = get_collection("trips")
    
    trip = {
        "user_id": current_user_id,
        "name": trip_data.name,
        "destination": trip_data.destination,
        "start_date": trip_data.start_date,
        "end_date": trip_data.end_date,
        "budget": trip_data.budget,
        "notes": trip_data.notes,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    }
    
    result = await collection.insert_one(trip)
    trip["id"] = str(result.inserted_id)
    
    return trip

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