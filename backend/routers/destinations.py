from fastapi import APIRouter, HTTPException, Query, Depends
from typing import Optional, List
import httpx
import os
import re
from math import sin, cos, sqrt, atan2, radians
from bson import ObjectId
from database import get_collection
from auth import get_current_user

router = APIRouter(prefix="/destinations", tags=["Destinations"])
places_router = APIRouter(prefix="/places", tags=["Places"])

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
        query["$or"] = [
            {"category": category},
            {"category": category.title()},
            {"category": category.lower()},
            {"category": category.upper()}
        ]
    if district:
        query["district"] = district
    
    if search:
        cursor = collection.find(
            {"$text": {"$search": search}},
            {"score": {"$meta": "textScore"}}
        ).sort([("score", {"$meta": "textScore"})])
    else:
        cursor = collection.find(query)
    
    total = await collection.count_documents(query)
    destinations = await cursor.skip(offset).limit(limit).to_list(length=limit)
    
    for dest in destinations:
        dest["_id"] = str(dest["_id"])
    
    return {
        "total": total,
        "offset": offset,
        "limit": limit,
        "destinations": destinations
    }

@places_router.get("/")
async def get_places(
    category: Optional[str] = None,
    search: Optional[str] = Query(None, min_length=2),
):
    return await get_destinations(category=category, search=search)

@router.get("/recommendations")
async def get_smart_recommendations(
    user_lat: float = Query(...),
    user_lng: float = Query(...),
    max_budget: Optional[float] = Query(None),
    max_time_hours: Optional[float] = Query(None),
):
    """Smart Travel Recommendation Engine with Relaxed Filtering"""
    print(f"DEBUG: Recommendation request - Budget: {max_budget}, Time: {max_time_hours}")
    collection = get_collection("destinations")
    
    # Fetch all destinations to allow for near-match filtering manually
    cursor = collection.find({})
    destinations = await cursor.to_list(length=100)
    print(f"DEBUG: Total candidates from DB: {len(destinations)}")
    
    GOOGLE_API_KEY = os.getenv("GOOGLE_MAPS_API_KEY")
    recommendations = []
    
    # Buffers for relaxed filtering
    BUDGET_BUFFER = 1000
    TIME_BUFFER = 1 # hour
    
    async with httpx.AsyncClient() as client:
        for dest in destinations:
            if "coordinates" not in dest: continue
            
            dest_lat = dest["coordinates"]["lat"]
            dest_lng = dest["coordinates"]["lng"]
            
            duration_minutes = 0
            distance_km = 0
            duration_text = ""
            
            if GOOGLE_API_KEY:
                try:
                    url = f"https://maps.googleapis.com/maps/api/distancematrix/json?origins={user_lat},{user_lng}&destinations={dest_lat},{dest_lng}&departure_time=now&key={GOOGLE_API_KEY}"
                    resp = await client.get(url)
                    data = resp.json()
                    
                    if data["status"] == "OK":
                        element = data["rows"][0]["elements"][0]
                        if element["status"] == "OK":
                            duration_minutes = element["duration_in_traffic"]["value"] / 60
                            distance_km = element["distance"]["value"] / 1000
                            duration_text = element["duration_in_traffic"]["text"]
                except:
                    pass
            
            if duration_minutes == 0:
                R = 6371.0
                phi1, phi2 = radians(user_lat), radians(dest_lat)
                dphi = radians(dest_lat - user_lat)
                dlambda = radians(dest_lng - user_lng)
                a = sin(dphi/2)**2 + cos(phi1)*cos(phi2)*sin(dlambda/2)**2
                distance_km = R * 2 * atan2(sqrt(a), sqrt(1-a))
                duration_minutes = (distance_km / 45) * 60 
                h = int(duration_minutes // 60)
                m = int(duration_minutes % 60)
                duration_text = f"{h}h {m}m" if h > 0 else f"{m}m"

            is_exact_match = True
            near_match_tags = []
            
            # --- Relaxed Budget Check ---
            cost = dest.get("avg_cost_per_person", 2000)
            if max_budget:
                if cost > max_budget + BUDGET_BUFFER:
                    continue # Skip if way over budget
                if cost > max_budget:
                    is_exact_match = False
                    near_match_tags.append("Slightly over budget")
            
            # --- Relaxed Time Check ---
            actual_time_hours = duration_minutes / 60
            if max_time_hours:
                if actual_time_hours > max_time_hours + TIME_BUFFER:
                    continue # Skip if way too far
                if actual_time_hours > max_time_hours:
                    is_exact_match = False
                    near_match_tags.append("Longer travel time")
                
            rating = dest.get("rating", 4.0)
            crowd = dest.get("crowd_level", "medium")
            crowd_score = {"low": 1.0, "medium": 0.7, "high": 0.4}.get(crowd, 0.5)
            
            # AI Scoring (Penalty for non-exact matches)
            match_penalty = 1.0 if is_exact_match else 0.7
            
            score = ((rating / 5.0 * 30) + \
                    (max(0, 1 - (duration_minutes / 300)) * 30) + \
                    (max(0, 1 - (cost / 5000)) * 20) + \
                    (crowd_score * 20)) * match_penalty
            
            tags = []
            if cost < 2000: tags.append("Budget Friendly")
            if duration_minutes < 120: tags.append("Fastest Route")
            if rating > 4.6: tags.append("Trending")
            if crowd == "low": tags.append("Less Crowded")
            if score > 80: tags.append("Best Value")
            
            # Add near match tags to the main tags list
            tags.extend(near_match_tags)
            
            final_dest = dest.copy()
            final_dest["id"] = str(final_dest.pop("_id"))
            final_dest["real_time_duration"] = duration_text
            final_dest["duration_minutes"] = int(duration_minutes)
            final_dest["distance_km"] = round(distance_km, 1)
            final_dest["ai_score"] = round(score, 1)
            final_dest["smart_tags"] = tags
            final_dest["is_exact_match"] = is_exact_match
            
            recommendations.append(final_dest)

    # Sort by AI Score
    recommendations.sort(key=lambda x: x["ai_score"], reverse=True)
    
    has_exact = any(r["is_exact_match"] for r in recommendations)
    print(f"DEBUG: Returning {len(recommendations)} recommendations. Has exact matches: {has_exact}")
    
    return {
        "success": True, 
        "count": len(recommendations), 
        "results": recommendations,
        "has_exact_matches": has_exact
    }

@router.get("/explore-data")
async def get_explore_data():
    collection = get_collection("destinations")
    categories = ["Temples", "Hills", "Beaches", "Culture", "Food", "Nature"]
    ai_picks = await collection.find({"$or": [{"is_featured": True}, {"is_hidden_gem": True}]}).limit(6).to_list(length=6)
    low_crowd = await collection.find({"is_featured": True}).skip(2).limit(6).to_list(length=6)
    weekend_trips = await collection.find({"category": {"$in": ["Hill Station", "Coastal", "Waterfalls"]}}).limit(6).to_list(length=6)
    festivals = [
        {"id": "1", "name": "Pongal", "month": "January", "image": "https://images.unsplash.com/photo-1590074211438-6623668383e7", "tag": "Upcoming"},
        {"id": "2", "name": "Chithirai Festival", "month": "April", "image": "https://images.unsplash.com/photo-1582510003544-4d00b7f74220", "tag": "Upcoming"},
        {"id": "3", "name": "Mahamaham", "month": "February", "image": "https://images.unsplash.com/photo-1621503141380-6927a4e64fdd", "tag": "Upcoming"}
    ]
    def format_dest(dest, force_crowd=None):
        dest["id"] = str(dest.pop("_id"))
        import random
        dest["crowdLevel"] = force_crowd or random.choice(["low", "medium", "high"])
        dest["trafficLevel"] = random.choice(["low", "medium", "moderate"])
        dest["weatherHint"] = random.choice(["☀️ 28°C", "☁️ 24°C", "🌤️ 26°C", "🌧️ 22°C"])
        dest["bestTimeToVisit"] = random.choice(["Early Morning (6 AM)", "Late Afternoon (4 PM)", "Weekdays Only"])
        return dest
    return {
        "aiPicks": [format_dest(p) for p in ai_picks],
        "lowCrowd": [format_dest(p, force_crowd="low") for p in low_crowd],
        "weekendTrips": [format_dest(p) for p in weekend_trips],
        "categories": categories,
        "festivals": festivals
    }

@router.get("/route-plan")
async def get_route_plan(start: str = Query(...), end: str = Query(...)):
    collection = get_collection("destinations")
    start_dest = await collection.find_one({"name": re.compile(start, re.I)})
    end_dest = await collection.find_one({"name": re.compile(end, re.I)})
    query = {"$or": [{"name": re.compile(start, re.I)}, {"name": re.compile(end, re.I)}, {"district": re.compile(start, re.I)}, {"district": re.compile(end, re.I)}]}
    if start_dest and end_dest and "coordinates" in start_dest and "coordinates" in end_dest:
        s_lat, s_lng = start_dest["coordinates"]["lat"], start_dest["coordinates"]["lng"]
        e_lat, e_lng = end_dest["coordinates"]["lat"], end_dest["coordinates"]["lng"]
        min_lat, max_lat = min(s_lat, e_lat) - 0.5, max(s_lat, e_lat) + 0.5
        min_lng, max_lng = min(s_lng, e_lng) - 0.5, max(s_lng, e_lng) + 0.5
        query["$or"].append({"coordinates.lat": {"$gte": min_lat, "$lte": max_lat}, "coordinates.lng": {"$gte": min_lng, "$lte": max_lng}})
    cursor = collection.find(query)
    destinations = await cursor.to_list(length=20)
    for dest in destinations: dest["id"] = str(dest.pop("_id"))
    return {"start": start, "end": end, "stops": destinations, "distance": "Variable", "duration": "Variable"}

@router.get("/featured")
async def get_featured_destinations(limit: int = 6):
    collection = get_collection("destinations")
    cursor = collection.find({"is_featured": True}).limit(limit)
    destinations = await cursor.to_list(length=limit)
    for dest in destinations: dest["_id"] = str(dest["_id"])
    return destinations

@router.get("/categories")
async def get_categories():
    collection = get_collection("destinations")
    pipeline = [{"$group": {"_id": "$category", "count": {"$sum": 1}}}, {"$sort": {"_id": 1}}]
    cursor = collection.aggregate(pipeline)
    categories = await cursor.to_list(length=None)
    return [{"name": cat["_id"], "count": cat["count"]} for cat in categories]

@router.get("/name/{name}")
async def get_destination_by_name(name: str):
    collection = get_collection("destinations")
    dest = await collection.find_one({"name": re.compile(f"^{re.escape(name)}$", re.I)})
    if not dest: dest = await collection.find_one({"name": re.compile(re.escape(name), re.I)})
    if not dest: raise HTTPException(status_code=404, detail="Destination not found")
    dest["id"] = str(dest.pop("_id"))
    return dest

@router.get("/{destination_id}")
async def get_destination(destination_id: str):
    collection = get_collection("destinations")
    clean_id = destination_id.strip()
    try:
        dest = await collection.find_one({"_id": ObjectId(clean_id)})
        if dest:
            dest["id"] = str(dest.pop("_id"))
            return dest
    except: pass
    
    # Try exact name match or exact slug match (case insensitive, whitespace stripped)
    dest = await collection.find_one({
        "$or": [
            {"name": re.compile(f"^{re.escape(clean_id)}$", re.I)},
            {"slug": clean_id.lower()}
        ]
    })
    
    # If not found, try a partial match (e.g. "Tiruchirappalli" vs "Trichy")
    if not dest:
        dest = await collection.find_one({"name": re.compile(re.escape(clean_id), re.I)})
        
    if not dest: 
        raise HTTPException(status_code=404, detail="Destination not found")
    
    dest["id"] = str(dest.pop("_id"))
    return dest

@router.get("/{destination_id}/weather")
async def get_destination_weather(destination_id: str):
    return {"destination_id": destination_id, "weather": {"temperature": 28, "condition": "Sunny", "humidity": 65, "wind_speed": 12}}