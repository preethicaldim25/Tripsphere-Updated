from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import List, Optional
from auth import get_current_user
from database import get_collection
from datetime import datetime, timedelta
import random

router = APIRouter(prefix="/ai", tags=["AI Features"])

class AIPlanRequest(BaseModel):
    name: str
    destination: str
    startDate: str
    endDate: str
    budget: float
    budgetType: str
    travelers: int
    pace: str
    notes: Optional[str] = ""

@router.post("/ai-trip-plan")
async def generate_ai_trip_plan(request: AIPlanRequest, current_user_id: str = Depends(get_current_user)):
    """Generate a smart AI trip plan based on destination and preferences"""
    
    dest_collection = get_collection("destinations")
    destination_data = await dest_collection.find_one({"name": {"$regex": request.destination, "$options": "i"}})
    
    if not destination_data:
        # Fallback if specific destination not found in DB
        attractions = [
            {"name": f"Top Sight in {request.destination}", "type": "Sightseeing", "lat": 11.0, "lng": 78.0},
            {"name": "Local Market", "type": "Shopping", "lat": 11.1, "lng": 78.1},
            {"name": "Heritage Walk", "type": "Culture", "lat": 11.2, "lng": 78.2}
        ]
        food_places = [{"name": "Authentic Restaurant", "cuisine": "Local", "rating": 4.5}]
    else:
        attractions = destination_data.get("attractions", [])
        food_places = destination_data.get("food", [])

    # Calculate days
    start_dt = datetime.fromisoformat(request.startDate.replace('Z', '+00:00'))
    end_dt = datetime.fromisoformat(request.endDate.replace('Z', '+00:00'))
    days_count = (end_dt - start_dt).days + 1
    
    # Determine activities per day based on pace
    acts_per_day = 2 if request.pace == 'relaxed' else (4 if request.pace == 'packed' else 3)
    
    itinerary = []
    all_activities = attractions + food_places
    
    for i in range(days_count):
        current_date = (start_dt + timedelta(days=i)).strftime("%Y-%m-%d")
        day_activities = []
        
        # Morning Activity
        if attractions:
            attr = random.choice(attractions)
            day_activities.append({
                "id": f"act_{i}_1",
                "time": "09:00",
                "title": attr["name"],
                "description": f"Explore the beautiful {attr['name']}",
                "location": request.destination,
                "lat": attr.get("lat"),
                "lng": attr.get("lng"),
                "cost": request.budget * 0.05 / days_count,
                "category": "sightseeing"
            })
            
        # Lunch
        if food_places:
            food = random.choice(food_places)
            day_activities.append({
                "id": f"act_{i}_2",
                "time": "13:00",
                "title": f"Lunch at {food['name']}",
                "description": f"Enjoy {food['cuisine']} cuisine",
                "location": request.destination,
                "lat": food.get("lat"),
                "lng": food.get("lng"),
                "cost": request.budget * 0.1 / days_count,
                "category": "food"
            })
            
        # Afternoon/Evening
        if acts_per_day >= 3 and len(attractions) > 1:
            attr = random.choice([a for a in attractions if a["name"] != day_activities[0]["title"]])
            day_activities.append({
                "id": f"act_{i}_3",
                "time": "16:00",
                "title": attr["name"],
                "description": "Afternoon sightseeing",
                "location": request.destination,
                "lat": attr.get("lat"),
                "lng": attr.get("lng"),
                "cost": request.budget * 0.05 / days_count,
                "category": "sightseeing"
            })

        itinerary.append({
            "day": i + 1,
            "date": current_date,
            "activities": day_activities
        })

    # Budget Distribution
    budget_dist = {
        "sightseeing": request.budget * 0.2,
        "food": request.budget * 0.3,
        "travel": request.budget * 0.2,
        "accommodation": request.budget * 0.3
    }
    
    return {
        "name": request.name,
        "destination": request.destination,
        "start_date": request.startDate,
        "end_date": request.endDate,
        "budget": request.budget,
        "travelers": request.travelers,
        "itinerary": itinerary,
        "budget_distribution": budget_dist,
        "notes": f"AI generated plan for {request.destination}. Pace: {request.pace}."
    }
