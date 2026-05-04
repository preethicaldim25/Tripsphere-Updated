from fastapi import APIRouter, HTTPException, Depends
from typing import Optional, List, Dict
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
    destination_id: Optional[str] = None
    lat: Optional[float] = None
    lng: Optional[float] = None

class ItineraryDay(BaseModel):
    day: int
    date: str
    activities: List[Activity] = []

class TripCreate(BaseModel):
    title: str
    destination_id: Optional[str] = None
    start_location: Optional[str] = None
    stops: List[str] = []
    start_date: str
    end_date: str
    total_budget: float
    budget_breakdown: Optional[Dict[str, float]] = None
    travelers: int = 1
    accommodation: Optional[str] = None
    notes: Optional[str] = None
    itinerary: List[ItineraryDay] = []

class TripUpdate(BaseModel):
    title: Optional[str] = None
    destination_id: Optional[str] = None
    start_location: Optional[str] = None
    stops: Optional[List[str]] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    total_budget: Optional[float] = None
    budget_breakdown: Optional[Dict[str, float]] = None
    notes: Optional[str] = None

class TripResponse(BaseModel):
    id: str
    user_id: Optional[str] = None
    name: Optional[str] = "Untitled Trip"
    destination_id: Optional[str] = None
    destination_details: Optional[Dict] = None
    start_location: Optional[str] = None
    stops: List[str] = []
    stop_details: Optional[List[Dict]] = []
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    budget: Optional[float] = 0.0
    used_budget: float = 0.0
    budget_breakdown: Optional[Dict[str, float]] = None
    travelers: int = 1
    accommodation: Optional[str] = None
    notes: Optional[str] = None
    itinerary: List[ItineraryDay] = []
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

@router.get("", response_model=List[TripResponse])
async def get_trips(current_user_id: str = Depends(get_current_user)):
    collection = get_collection("trips")
    dest_collection = get_collection("destinations")
    expenses_collection = get_collection("expenses")
    
    cursor = collection.find({"user_id": current_user_id}).sort("created_at", -1)
    trips = await cursor.to_list(length=None)
    
    for trip in trips:
        try:
            trip["id"] = str(trip.pop("_id"))
            
            # Ensure required fields have fallbacks
            if "name" not in trip: trip["name"] = trip.get("title", "Untitled Trip")
            if "budget" not in trip: trip["budget"] = trip.get("total_budget", 0.0)
            if "start_date" not in trip: trip["start_date"] = datetime.now().strftime("%Y-%m-%d")
            if "end_date" not in trip: trip["end_date"] = datetime.now().strftime("%Y-%m-%d")
            if "created_at" not in trip: trip["created_at"] = datetime.now()
            if "updated_at" not in trip: trip["updated_at"] = datetime.now()
            
            # 1. Populate Destination
            trip["destination_details"] = None
            dest_id = trip.get("destination_id")
            if dest_id and len(str(dest_id)) == 24:
                try:
                    dest = await dest_collection.find_one({"_id": ObjectId(str(dest_id))})
                    if dest:
                        dest["_id"] = str(dest["_id"])
                        trip["destination_details"] = dest
                except Exception as e:
                    print(f"Error fetching destination {dest_id}: {e}")

            # 2. Used Budget
            trip["used_budget"] = 0.0
            try:
                expenses_cursor = expenses_collection.find({"trip_id": trip["id"]})
                expenses = await expenses_cursor.to_list(length=None)
                trip["used_budget"] = sum(e.get("amount", 0) for e in expenses)
            except Exception as e:
                print(f"Error calculating budget for trip {trip['id']}: {e}")
        except Exception as e:
            print(f"Error processing trip: {e}")
            continue
    
    return trips

@router.post("", response_model=TripResponse)
async def create_trip(
    trip_data: TripCreate,
    current_user_id: str = Depends(get_current_user)
):
    try:
        collection = get_collection("trips")
        
        trip = {
            "user_id": current_user_id,
            "name": trip_data.title,
            "destination_id": trip_data.destination_id,
            "start_location": trip_data.start_location,
            "stops": trip_data.stops or [],
            "start_date": trip_data.start_date,
            "end_date": trip_data.end_date,
            "budget": trip_data.total_budget,
            "budget_breakdown": trip_data.budget_breakdown,
            "travelers": trip_data.travelers,
            "accommodation": trip_data.accommodation,
            "notes": trip_data.notes,
            "itinerary": [day.dict() for day in trip_data.itinerary] if trip_data.itinerary else [],
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
        
        result = await collection.insert_one(trip)
        trip["id"] = str(result.inserted_id)
        trip["used_budget"] = 0.0
        return trip
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{trip_id}", response_model=TripResponse)
async def get_trip(
    trip_id: str,
    current_user_id: str = Depends(get_current_user)
):
    collection = get_collection("trips")
    dest_collection = get_collection("destinations")
    expenses_collection = get_collection("expenses")
    
    try:
        trip = await collection.find_one({
            "_id": ObjectId(trip_id),
            "user_id": current_user_id
        })
    except:
        raise HTTPException(status_code=400, detail="Invalid trip ID")
    
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")
    
    # 1. Populate Destination
    if "destination_id" in trip:
        try:
            dest = await dest_collection.find_one({"_id": ObjectId(trip["destination_id"])})
            if dest:
                dest["_id"] = str(dest["_id"])
                trip["destination_details"] = dest
        except: pass
        
    # 2. Populate Stops
    trip["stop_details"] = []
    if "stops" in trip and trip["stops"]:
        stop_ids = []
        for s in trip["stops"]:
            try: stop_ids.append(ObjectId(s))
            except: pass
            
        if stop_ids:
            stops_cursor = dest_collection.find({"_id": {"$in": stop_ids}})
            stops = await stops_cursor.to_list(length=None)
            for s in stops:
                s["_id"] = str(s["_id"])
                trip["stop_details"].append(s)
                
    # 3. Calculate used_budget
    expenses_cursor = expenses_collection.find({"trip_id": trip_id})
    expenses = await expenses_cursor.to_list(length=None)
    trip["used_budget"] = sum(e.get("amount", 0) for e in expenses)
    
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
    
    if "title" in update_data:
        update_data["name"] = update_data.pop("title")
    if "total_budget" in update_data:
        update_data["budget"] = update_data.pop("total_budget")

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