from fastapi import APIRouter, HTTPException, Query, Depends
from typing import Optional
from database import get_collection
from auth import get_current_user  # Changed this line

router = APIRouter(prefix="/destinations", tags=["Destinations"])

@router.get("/")
async def get_destinations(
    category: Optional[str] = None,
    district: Optional[str] = None,
    search: Optional[str] = Query(None, min_length=2),
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0)
):
    """Get destinations with filtering and search"""
    collection = get_collection("destinations")
    query = {}
    
    if category:
        query["category"] = category
    if district:
        query["district"] = district
    
    # Text search if provided
    if search:
        cursor = collection.find(
            {"$text": {"$search": search}},
            {"score": {"$meta": "textScore"}}
        ).sort([("score", {"$meta": "textScore"})])
    else:
        cursor = collection.find(query)
    
    total = await collection.count_documents(query)
    destinations = await cursor.skip(offset).limit(limit).to_list(length=limit)
    
    # Convert ObjectId to string
    for dest in destinations:
        dest["_id"] = str(dest["_id"])
    
    return {
        "total": total,
        "offset": offset,
        "limit": limit,
        "destinations": destinations
    }

@router.get("/featured")
async def get_featured_destinations(limit: int = 6):
    """Get featured destinations"""
    collection = get_collection("destinations")
    cursor = collection.find({"is_featured": True}).limit(limit)
    destinations = await cursor.to_list(length=limit)
    
    for dest in destinations:
        dest["_id"] = str(dest["_id"])
    
    return destinations

@router.get("/categories")
async def get_categories():
    """Get all destination categories with counts"""
    collection = get_collection("destinations")
    pipeline = [
        {"$group": {"_id": "$category", "count": {"$sum": 1}}},
        {"$sort": {"_id": 1}}
    ]
    
    cursor = collection.aggregate(pipeline)
    categories = await cursor.to_list(length=None)
    
    return [{"name": cat["_id"], "count": cat["count"]} for cat in categories]

@router.get("/{destination_id}")
async def get_destination(destination_id: str):
    """Get a single destination by ID"""
    collection = get_collection("destinations")
    from bson import ObjectId
    
    try:
        dest = await collection.find_one({"_id": ObjectId(destination_id)})
    except:
        raise HTTPException(status_code=400, detail="Invalid destination ID")
    
    if not dest:
        raise HTTPException(status_code=404, detail="Destination not found")
    
    dest["_id"] = str(dest["_id"])
    return dest

@router.get("/{destination_id}/weather")
async def get_destination_weather(destination_id: str):
    """Get weather info for a destination"""
    # This would typically call a weather API
    # For now, return mock data
    return {
        "destination_id": destination_id,
        "weather": {
            "temperature": 28,
            "condition": "Sunny",
            "humidity": 65,
            "wind_speed": 12
        }
    }