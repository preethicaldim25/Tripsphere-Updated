from fastapi import APIRouter, HTTPException, Depends, status
from typing import List, Optional
from datetime import datetime
from bson import ObjectId
from database import get_collection
from auth import get_current_user
from models.trip import TripCreate, TripResponse

router = APIRouter(prefix="/trips", tags=["Trips"])

@router.get("/", response_model=List[TripResponse])
async def list_all_trips_debug(
    current_user_id: str = Depends(get_current_user)
):
    """
    Debug endpoint to list trips (Phase 3 logic)
    Redirects to my-trips behavior for convenience
    """
    return await get_my_trips(current_user_id)

@router.post("/", response_model=TripResponse, status_code=status.HTTP_201_CREATED)
async def create_trip(
    trip_data: TripCreate,
    current_user_id: str = Depends(get_current_user)
):
    """
    Create a new trip (Phase 2)
    - Protected route
    - Current user becomes creator
    - Store in MongoDB
    """
    try:
        trips_collection = get_collection("trips")
        
        # Prepare trip document
        new_trip = trip_data.dict()
        new_trip["created_by"] = current_user_id
        new_trip["created_at"] = datetime.utcnow()
        new_trip["updated_at"] = datetime.utcnow()
        
        # Ensure creator is in members if not already there
        if current_user_id not in new_trip["members"]:
            new_trip["members"].append(current_user_id)
        
        # Insert into MongoDB
        result = await trips_collection.insert_one(new_trip)
        
        # Add ID for response
        new_trip["id"] = str(result.inserted_id)
        
        return new_trip
        
    except Exception as e:
        print(f"[TRIPS] Error creating trip: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create trip: {str(e)}"
        )

@router.get("/my-trips", response_model=List[TripResponse])
async def get_my_trips(
    current_user_id: str = Depends(get_current_user)
):
    """
    Get all trips for logged-in user (Phase 3)
    - Created by user OR user is a member
    - Sort latest first
    """
    try:
        trips_collection = get_collection("trips")
        
        # Query: created_by matches current user OR user is in members array
        query = {
            "$or": [
                {"created_by": current_user_id},
                {"members": current_user_id}
            ]
        }
        
        # Find trips and sort by created_at descending (latest first)
        cursor = trips_collection.find(query).sort("created_at", -1)
        trips = await cursor.to_list(length=100)
        
        # Convert _id to id for response model
        for trip in trips:
            trip["id"] = str(trip["_id"])
            
        return trips
        
    except Exception as e:
        print(f"[TRIPS] Error fetching trips: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch trips"
        )

@router.get("/{trip_id}", response_model=TripResponse)
async def get_trip_by_id(
    trip_id: str,
    current_user_id: str = Depends(get_current_user)
):
    """
    Fetch a single trip by its ID
    - Verify user is creator or member
    """
    try:
        trips_collection = get_collection("trips")
        
        # Validate ObjectId
        if not ObjectId.is_valid(trip_id):
            raise HTTPException(status_code=400, detail="Invalid Trip ID format")
            
        # Find trip and ensure access
        trip = await trips_collection.find_one({
            "_id": ObjectId(trip_id),
            "$or": [
                {"created_by": current_user_id},
                {"members": current_user_id}
            ]
        })
        
        if not trip:
            raise HTTPException(status_code=404, detail="Trip not found or access denied")
            
        trip["id"] = str(trip["_id"])
        return trip
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"[TRIPS] Error fetching trip {trip_id}: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch trip details")

@router.put("/{trip_id}", response_model=TripResponse)
async def update_trip(
    trip_id: str,
    update_data: dict,
    current_user_id: str = Depends(get_current_user)
):
    """
    Update trip details (e.g., budget, name)
    """
    try:
        trips_collection = get_collection("trips")
        
        if not ObjectId.is_valid(trip_id):
            raise HTTPException(status_code=400, detail="Invalid Trip ID")
            
        # Update timestamp
        update_data["updated_at"] = datetime.utcnow()
        
        # Perform update
        result = await trips_collection.find_one_and_update(
            {"_id": ObjectId(trip_id), "created_by": current_user_id},
            {"$set": update_data},
            return_document=True
        )
        
        if not result:
            raise HTTPException(status_code=404, detail="Trip not found or not authorized to update")
            
        result["id"] = str(result["_id"])
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"[TRIPS] Error updating trip {trip_id}: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to update trip")

@router.delete("/{trip_id}")
async def delete_trip(
    trip_id: str,
    current_user_id: str = Depends(get_current_user)
):
    """
    Delete a trip
    - Only creator can delete
    - Validate ObjectId
    """
    try:
        trips_collection = get_collection("trips")
        
        # 1. Validate ObjectId
        if not ObjectId.is_valid(trip_id):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, 
                detail="Invalid trip ID format"
            )
            
        # 2. MongoDB delete logic: Delete only if created_by matches current user
        # (This ensures 403-like behavior if they try to delete someone else's trip)
        result = await trips_collection.delete_one({
            "_id": ObjectId(trip_id),
            "created_by": current_user_id
        })
        
        # 3. Handle not found or unauthorized
        if result.deleted_count == 0:
            # Check if it exists at all to differentiate between 404 and 403
            exists = await trips_collection.find_one({"_id": ObjectId(trip_id)})
            if not exists:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND, 
                    detail="Trip not found"
                )
            else:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN, 
                    detail="You are not authorized to delete this trip"
                )
        
        return {
            "success": True,
            "message": "Trip deleted successfully"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"[TRIPS] Error deleting trip {trip_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete trip"
        )
