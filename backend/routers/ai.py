from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from auth import get_current_user
from database import get_collection
from datetime import datetime, timedelta
import random
import math

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
    accommodation: Optional[str] = ""
    stops: Optional[List[str]] = []
    notes: Optional[str] = ""

def generate_accommodations(destination: str, travelers: int, is_luxury: bool, is_budget: bool, is_family: bool, is_solo: bool, style: str):
    from utils.destination_intel import get_locality_recommendation, get_destination_metadata

    rec = get_locality_recommendation(destination, travelers, is_luxury, is_budget, is_family, is_solo, style)
    
    # Generate 2 realistic stay names inside the recommended area
    locality = rec["locality_name"]
    price_val = rec["price_range"]
    style_val = rec["style"]
    
    # Custom stay generators to sound extremely premium and local
    if "srirangam" in locality.lower():
        stays = [
            {
                "name": "Srirangam Temple Heritage Homestay",
                "type": style_val,
                "price": "₹2,200/night",
                "area": locality,
                "distance": "0.3 km from Ranganathar Temple",
                "convenience": rec["convenience"],
                "attractions": rec["attractions"],
                "safety": rec["safety"],
                "badge": "Temple Heritage",
                "why": f"Located right inside the scenic temple ring of {locality}. Best suited for peaceful couple/family strolls.",
                "desc": "Traditional open-courtyard home offering organic pure vegetarian meals and authentic filter coffee."
            },
            {
                "name": "Sri Renga Pilgrim Inn",
                "type": "Comfort Guest House",
                "price": "₹1,800/night",
                "area": locality,
                "distance": "0.7 km from Srirangam Gopuram",
                "convenience": rec["convenience"],
                "attractions": rec["attractions"],
                "safety": rec["safety"],
                "badge": "Highly Rated",
                "why": "Provides quick walking access to key spiritual zones while keeping your transit extremely low budget.",
                "desc": "Air-conditioned secure rooms, child-safe lawns, and traditional hospitality from a local family."
            }
        ]
    elif "cantonment" in locality.lower():
        stays = [
            {
                "name": "Cantonment Residency",
                "type": style_val,
                "price": "₹1,200/night",
                "area": locality,
                "distance": "0.4 km from Trichy Railway Junction",
                "convenience": rec["convenience"],
                "attractions": rec["attractions"],
                "safety": rec["safety"],
                "badge": "Transit Pick",
                "why": "Walking distance from Trichy junction and bus stand. Ensures simpler local transport and highly affordable rates.",
                "desc": "Modern rooms with fast Wi-Fi, clean lockers, and easy pedestrian access to lively food streets."
            },
            {
                "name": "Rockfort Plaza Lodge",
                "type": "Budget City Lodge",
                "price": "₹950/night",
                "area": locality,
                "distance": "0.8 km from main bus stand",
                "convenience": rec["convenience"],
                "attractions": rec["attractions"],
                "safety": rec["safety"],
                "badge": "Best Value",
                "why": "Outstanding budget room for solo explorers desiring rapid access to shopping streets and transport routes.",
                "desc": "Simple, highly clean rooms featuring local filter coffee and 24-hour reception assistance."
            }
        ]
    elif "collectorate" in locality.lower():
        stays = [
            {
                "name": "The Grand Kaveri Hotel",
                "type": style_val,
                "price": "₹7,500/night",
                "area": locality,
                "distance": "4.5 km from Airport",
                "convenience": rec["convenience"],
                "attractions": rec["attractions"],
                "safety": rec["safety"],
                "badge": "Premium Elite",
                "why": "Situated inside Trichy's high-end upscale residential circle. Ideal for high luxury and quick airport transit.",
                "desc": "Luxury suites with panoramic river views, high-end private spa treatments, and premium multi-cuisine dining."
            },
            {
                "name": "Sangam Hotel Trichy",
                "type": "Premium Business Stay",
                "price": "₹5,800/night",
                "area": locality,
                "distance": "1.2 km from main area",
                "convenience": rec["convenience"],
                "attractions": rec["attractions"],
                "safety": rec["safety"],
                "badge": "Lush Gardens",
                "why": "Matches your comfort requirements with premium garden pools, bar facilities, and isolated secure compound walls.",
                "desc": "Spacious premium rooms, beautifully manicured pool lawns, and professional multi-lingual travel desks."
            }
        ]
    elif "doddabetta" in locality.lower():
        stays = [
            {
                "name": "Nilgiri Meadows Resort",
                "type": style_val,
                "price": "₹5,200/night",
                "area": locality,
                "distance": "2.5 km from Doddabetta Peak",
                "convenience": rec["convenience"],
                "attractions": rec["attractions"],
                "safety": rec["safety"],
                "badge": "Mountain View",
                "why": "Surrounded by gorgeous tea estates with secure fenced yards, making it child-safe and peaceful.",
                "desc": "Cozy brick cottages featuring premium log fireplaces, garden valley viewpoints, and custom local treks."
            },
            {
                "name": "Accord Highland Ooty",
                "type": "Premium Family Resort",
                "price": "₹5,800/night",
                "area": locality,
                "distance": "4.2 km from Ooty Center",
                "convenience": rec["convenience"],
                "attractions": rec["attractions"],
                "safety": rec["safety"],
                "badge": "Kids Approved",
                "why": "Highly recommended family resort featuring kid play zones, private lawn compounds, and heating systems.",
                "desc": "High altitude premium hotel offering spectacular valley cloud views and customized plantation tours."
            }
        ]
    elif "charing cross" in locality.lower():
        stays = [
            {
                "name": "Zostel Ooty",
                "type": style_val,
                "price": "₹950/night",
                "area": locality,
                "distance": "2.0 km from bus stand",
                "convenience": rec["convenience"],
                "attractions": rec["attractions"],
                "safety": rec["safety"],
                "badge": "Backpacker Social",
                "why": "Highly popular social backpacker hub. Keeps you right next to Ooty town botanical trails and cheap eateries.",
                "desc": "Cozy shared wooden dorms with lively common rooms, evening bonfires, and a friendly traveler crowd."
            },
            {
                "name": "Hill View Homestay Ooty",
                "type": "Budget Homestay Room",
                "price": "₹1,200/night",
                "area": locality,
                "distance": "1.5 km from center",
                "convenience": rec["convenience"],
                "attractions": rec["attractions"],
                "safety": rec["safety"],
                "badge": "Attic Charm",
                "why": "Very affordable attic rooms with mountain fog views. Run by a lovely local family offering south Indian breakfast.",
                "desc": "Secluded wooden attic layout featuring hot running water, clean linen, and close market walks."
            }
        ]
    elif "fern hill" in locality.lower():
        stays = [
            {
                "name": "Savoy - IHCL SeleQtions",
                "type": style_val,
                "price": "₹12,500/night",
                "area": locality,
                "distance": "1.2 km from town center",
                "convenience": rec["convenience"],
                "attractions": rec["attractions"],
                "safety": rec["safety"],
                "badge": "Colonial Heritage",
                "why": "A majestic century-old manor with crackling fireplaces. Absolute luxury retreat for deep couple quietude.",
                "desc": "Impeccable historical English estate rooms with private garden teas and dynamic personal butler assistance."
            },
            {
                "name": "Sterling Ooty Fern Hill",
                "type": "Premium Hilltop Resort",
                "price": "₹8,500/night",
                "area": locality,
                "distance": "3.5 km from central stand",
                "convenience": rec["convenience"],
                "attractions": rec["attractions"],
                "safety": rec["safety"],
                "badge": "Tea Valley Vibe",
                "why": "Offers pristine views of stepped valley fog. Excellent bonfire meals and warm indoor heating.",
                "desc": "Modern premium resort suites overlooking lush tea gardens, offering local organic culinary menus."
            }
        ]
    elif "anna nagar" in locality.lower():
        stays = [
            {
                "name": "Poppys Ananya Hotel Madurai",
                "type": style_val,
                "price": "₹4,200/night",
                "area": locality,
                "distance": "3.5 km from temple",
                "convenience": rec["convenience"],
                "attractions": rec["attractions"],
                "safety": rec["safety"],
                "badge": "Quiet Locality",
                "why": "Comfortable family suites in a clean local neighborhood, completely free from early morning temple bells.",
                "desc": "Spacious rooms, highly secure parking, and clean multi-cuisine family diners with dedicated kids meals."
            },
            {
                "name": "Courtyard by Marriott Madurai",
                "type": "Premium Family Hotel",
                "price": "₹6,000/night",
                "area": locality,
                "distance": "2.9 km from temple",
                "convenience": rec["convenience"],
                "attractions": rec["attractions"],
                "safety": rec["safety"],
                "badge": "Premium Comfort",
                "why": "Outstanding international luxury standards for family groups, featuring stellar breakfast spreads and a safe environment for elders.",
                "desc": "Sleek modern rooms overlooking the historic temple tank lake, with luxury buffet spreads and dynamic concierge support."
            }
        ]
    elif "west tower" in locality.lower():
        stays = [
            {
                "name": "Madurai Backpackers",
                "type": style_val,
                "price": "₹800/night",
                "area": locality,
                "distance": "0.5 km from Madurai Station",
                "convenience": rec["convenience"],
                "attractions": rec["attractions"],
                "safety": rec["safety"],
                "badge": "Backpacker Vibe",
                "why": "Walking distance from the railway and temple. Surrounded by legendary food streets, saving huge transit costs.",
                "desc": "Air-conditioned dorms with private curtains, clean lockers, and a social rooftop overlooking temple towers."
            },
            {
                "name": "Temple View Residency Madurai",
                "type": "Budget Pilgrim Lodge",
                "price": "₹1,400/night",
                "area": locality,
                "distance": "0.3 km from Meenakshi Temple",
                "convenience": rec["convenience"],
                "attractions": rec["attractions"],
                "safety": rec["safety"],
                "badge": "Temple Views",
                "why": "Highly recommended for tight budgets wanting a clear view of the sunset over the temple towers from the rooftop lounge.",
                "desc": "Clean, simple air-conditioned rooms with traditional hospitality and 24/7 travel advice."
            }
        ]
    elif "pasumalai" in locality.lower():
        stays = [
            {
                "name": "Heritage Madurai Resort",
                "type": style_val,
                "price": "₹11,000/night",
                "area": locality,
                "distance": "2.8 km from temple",
                "convenience": rec["convenience"],
                "attractions": rec["attractions"],
                "safety": rec["safety"],
                "badge": "Bawa Masterpiece",
                "why": "Magnificent resort designed by Geoffrey Bawa featuring centenary banyan trees and plunge pools. Ultimate peaceful area.",
                "desc": "Luxury villas set in a heritage compound with traditional pillared corridors and Olympic-sized temple tank pools."
            },
            {
                "name": "The Gateway Hotel Pasumalai",
                "type": "Premium hilltop sanctuary",
                "price": "₹9,500/night",
                "area": locality,
                "distance": "5.0 km from temple",
                "convenience": rec["convenience"],
                "attractions": rec["attractions"],
                "safety": rec["safety"],
                "badge": "Hilltop Vista",
                "why": "Perched on a quiet hill with peacock gardens. Recommended for couples who want absolute quiet away from temple bells.",
                "desc": "Stunning colonial-era architecture, historic peacock-filled gardens, and panoramic city views."
            }
        ]
    elif "golf club" in locality.lower():
        stays = [
            {
                "name": "Pine Crest Valley Villa",
                "type": style_val,
                "price": "₹4,800/night",
                "area": locality,
                "distance": "1.5 km from lake",
                "convenience": rec["convenience"],
                "attractions": rec["attractions"],
                "safety": rec["safety"],
                "badge": "Scenic Golf Side",
                "why": "Highly secure fenced cottage compound, offering scenic pine trails and localized homestyle dining.",
                "desc": "Private cozy holiday cottage featuring beautiful wood ceilings, brick fireplaces, and children's garden swings."
            },
            {
                "name": "Kodai Valley Cottages",
                "type": "Family Holiday Cottage",
                "price": "₹4,200/night",
                "area": locality,
                "distance": "2.0 km from Pine Forest",
                "convenience": rec["convenience"],
                "attractions": rec["attractions"],
                "safety": rec["safety"],
                "badge": "Quiet Pine",
                "why": "Quiet secure lanes, close to pine forest and lakes, with private child-safe gardens and cottage kitchens.",
                "desc": "Charming rustic stone cabins with panoramic valley sunrise views, fully equipped kitchens, and bonfire rings."
            }
        ]
    elif "vattakanal" in locality.lower():
        stays = [
            {
                "name": "Zostel Kodaikanal Vattakanal",
                "type": style_val,
                "price": "₹950/night",
                "area": locality,
                "distance": "1.0 km from Dolphin's Nose",
                "convenience": rec["convenience"],
                "attractions": rec["attractions"],
                "safety": rec["safety"],
                "badge": "Hikers Heaven",
                "why": "Situated right near mountain trailheads, providing shared cabins and a super friendly social backpacker atmosphere.",
                "desc": "Cozy pine-wood bunk cabins with excellent common workspaces, valley-facing café balconies, and bonfire setups."
            },
            {
                "name": "Vattakanal Pine Cabins",
                "type": "Budget Hiking Cabin",
                "price": "₹1,200/night",
                "area": locality,
                "distance": "0.5 km from Vattakanal Falls",
                "convenience": rec["convenience"],
                "attractions": rec["attractions"],
                "safety": rec["safety"],
                "badge": "Mist Forest View",
                "why": "Outstanding cheap rustic cabins overlooking misty valley drops. Best suited for solo explorers wanting simple nature connections.",
                "desc": "Simple nature cabins with clean bathrooms, hot water heaters, and local trekking coordinators on call."
            }
        ]
    elif "upper lake" in locality.lower():
        stays = [
            {
                "name": "The Carlton Kodaikanal",
                "type": style_val,
                "price": "₹11,500/night",
                "area": locality,
                "distance": "0.2 km from Lake Boating",
                "convenience": rec["convenience"],
                "attractions": rec["attractions"],
                "safety": rec["safety"],
                "badge": "Lakefront Elite",
                "why": "Stunning glass-front rooms overlooking Kodaikanal lake. Features private boating dock and superb couple privacy.",
                "desc": "5-star luxury lakefront hotel offering private colonial shikara rides, pristine garden walkways, and high-end organic spa suites."
            },
            {
                "name": "Le Poshe by Sparsa",
                "type": "Premium Spa Resort",
                "price": "₹8,200/night",
                "area": locality,
                "distance": "1.5 km from lake",
                "convenience": rec["convenience"],
                "attractions": rec["attractions"],
                "safety": rec["safety"],
                "badge": "Scenic Hills",
                "why": "Quiet scenic surroundings near Coaker's Walk. Offers absolute premium wellness therapies and glass observatory balconies.",
                "desc": "Luxury hillside resort rooms with state-of-the-art spa facilities, indoor child play rooms, and organic fine dining."
            }
        ]
    else:
        # Fallback dynamic stay names generator using the destination name
        stays = [
            {
                "name": f"The Grand {destination} Palace",
                "type": style_val,
                "price": "₹5,200/night",
                "area": locality,
                "distance": "1.5 km from downtown",
                "convenience": rec["convenience"],
                "attractions": rec["attractions"],
                "safety": rec["safety"],
                "badge": rec["badge"],
                "why": f"Situated in the beautiful, {locality} area. Matches travelers comfort guidelines and local sightseeing routes perfectly.",
                "desc": f"Premium modern hospitality with spacious rooms, professional travel desks, and authentic regional cuisines."
            },
            {
                "name": f"{destination} Heritage Inn",
                "type": "Comfort Homestay",
                "price": "₹2,800/night",
                "area": locality,
                "distance": "2.2 km from main area",
                "convenience": rec["convenience"],
                "attractions": rec["attractions"],
                "safety": rec["safety"],
                "badge": "Local Charm",
                "why": f"Offers very cozy and safe local lodging inside {locality}, close to central walking lanes and transport points.",
                "desc": "Charming locally-hosted rooms featuring authentic filter coffee, home-cooked regional dishes, and sunrise views."
            }
        ]
        
    return {
        "recommended_area": locality,
        "area_description": rec["description"],
        "comfort_level": rec["badge"],
        "why_recommended": f"Recommended locality because it is a {rec['reason']}",
        "price_range": price_val,
        "list": stays
    }

def calc_distance(p1, p2):
    lat1, lon1 = p1.get('lat'), p1.get('lng')
    lat2, lon2 = p2.get('lat'), p2.get('lng')
    if lat1 is None or lon1 is None or lat2 is None or lon2 is None:
        return random.uniform(2.0, 15.0)
    # Rough km conversion
    return math.sqrt((lat1 - lat2)**2 + (lon1 - lon2)**2) * 111.0

def filter_by_style(items, style, is_family, is_solo, is_luxury):
    filtered = []
    style_lower = style.lower()
    for item in items:
        # Mock categorization based on text matching if tags are missing
        text = str(item).lower()
        score = 0
        
        if is_family and ('kid' in text or 'park' in text or 'zoo' in text or 'safe' in text or 'museum' in text):
            score += 2
        if is_solo and ('adventure' in text or 'trek' in text or 'solo' in text or 'culture' in text):
            score += 2
        if is_luxury and ('premium' in text or 'luxury' in text or 'spa' in text or 'resort' in text or 'fine' in text):
            score += 2
            
        if 'relaxed' in style_lower and ('view' in text or 'sunset' in text or 'cafe' in text or 'beach' in text or 'lake' in text):
            score += 2
        if 'explorer' in style_lower and ('hidden' in text or 'ruin' in text or 'local' in text or 'trail' in text):
            score += 2
            
        item['match_score'] = score
        filtered.append(item)
        
    # Sort by match score descending, then fallback to original order
    return sorted(filtered, key=lambda x: x.get('match_score', 0), reverse=True)

@router.post("/ai-trip-plan")
async def generate_ai_trip_plan(request: AIPlanRequest, current_user_id: str = Depends(get_current_user)):
    """Generate a truly intelligent AI trip plan based on rich preferences"""
    
    dest_collection = get_collection("destinations")
    destination_data = await dest_collection.find_one({"name": {"$regex": request.destination, "$options": "i"}})
    
    # 1. Base Data Gathering
    attractions = []
    food_places = []
    
    if destination_data:
        attractions = destination_data.get("attractions", [])
        food_places = destination_data.get("food", [])
        
    if not attractions:
        # Fallback rich data
        attractions = [
            {"name": f"{request.destination} Viewpoint", "type": "Sightseeing", "lat": 11.01, "lng": 78.01, "tags": ["relaxed", "view", "sunset"]},
            {"name": "Local Heritage Museum", "type": "Culture", "lat": 11.02, "lng": 78.02, "tags": ["family", "indoor", "history"]},
            {"name": "Hidden Waterfall Trail", "type": "Adventure", "lat": 11.05, "lng": 78.05, "tags": ["adventure", "trek", "hidden"]},
            {"name": "Botanical Gardens", "type": "Nature", "lat": 11.03, "lng": 78.03, "tags": ["family", "relaxed", "park"]},
            {"name": "Central Shopping Hub", "type": "Shopping", "lat": 11.015, "lng": 78.015, "tags": ["solo", "local", "market"]},
            {"name": "Sunset Peak", "type": "Sightseeing", "lat": 11.06, "lng": 78.06, "tags": ["relaxed", "view", "luxury"]}
        ]
    if not food_places:
        food_places = [
            {"name": "Authentic Local Diner", "cuisine": "Local", "rating": 4.5, "lat": 11.012, "lng": 78.012, "tags": ["budget", "local"]},
            {"name": "The Grand Restaurant", "cuisine": "Multi-cuisine", "rating": 4.8, "lat": 11.025, "lng": 78.025, "tags": ["luxury", "fine dining"]},
            {"name": "Backpacker's Cafe", "cuisine": "Continental", "rating": 4.2, "lat": 11.035, "lng": 78.035, "tags": ["solo", "budget", "cafe"]},
            {"name": "Family Feast House", "cuisine": "Indian", "rating": 4.4, "lat": 11.018, "lng": 78.018, "tags": ["family", "safe"]}
        ]

    # 2. Smart Personalization Flags
    style_lower = request.pace.lower()
    acc_lower = (request.accommodation or "").lower()
    
    is_family = request.travelers > 2 or 'family' in style_lower
    is_solo = request.travelers == 1 or 'solo' in style_lower
    is_luxury = 'luxury' in acc_lower or 'luxury' in style_lower
    is_budget = 'budget' in acc_lower or 'hostel' in acc_lower or 'budget' in style_lower
    
    # Pace setup
    if 'relaxed' in style_lower or is_family:
        acts_per_day = 2
        start_hour = 10
        gap_hours = 4
    elif 'adventure' in style_lower or 'explorer' in style_lower or 'packed' in style_lower:
        acts_per_day = 4
        start_hour = 8
        gap_hours = 2.5
    else:
        acts_per_day = 3
        start_hour = 9
        gap_hours = 3
        
    # Budget Calculation Engine
    days_count = max(1, (datetime.fromisoformat(request.endDate.replace('Z', '+00:00')) - datetime.fromisoformat(request.startDate.replace('Z', '+00:00'))).days + 1)
    
    base_daily_per_person = 2000
    if is_luxury: base_daily_per_person = 8000
    if is_budget: base_daily_per_person = 1200
    
    estimated_budget = base_daily_per_person * days_count * max(1, request.travelers)
    total_trip_budget = request.budget if request.budget > 0 else estimated_budget
    
    if request.budgetType == 'per_person' and request.budget > 0:
        total_trip_budget = request.budget * max(1, request.travelers)

    # Budget Distribution
    stay_pct, food_pct, travel_pct, sightseeing_pct = 0.3, 0.3, 0.2, 0.2
    if is_luxury:
        stay_pct, food_pct, travel_pct, sightseeing_pct = 0.5, 0.25, 0.15, 0.1
    elif is_budget:
        stay_pct, food_pct, travel_pct, sightseeing_pct = 0.2, 0.4, 0.2, 0.2

    # 3. Intelligent Itinerary Engine (Spatial & Temporal Grouping)
    itinerary = []
    available_attractions = filter_by_style(attractions, style_lower, is_family, is_solo, is_luxury)
    available_food = filter_by_style(food_places, style_lower, is_family, is_solo, is_luxury)
    
    total_distance_km = 0.0
    
    for day_idx in range(days_count):
        current_date = (datetime.fromisoformat(request.startDate.replace('Z', '+00:00')) + timedelta(days=day_idx)).strftime("%Y-%m-%d")
        day_activities = []
        
        current_latlng = None
        current_time = datetime.strptime(f"{start_hour:02d}:00", "%H:%M")
        
        # Pick acts_per_day attractions
        daily_attractions = []
        for _ in range(acts_per_day):
            if not available_attractions:
                available_attractions = list(attractions) # reshuffle if ran out
            
            # Find closest attraction to current_latlng to avoid backtracking
            if current_latlng:
                available_attractions.sort(key=lambda a: calc_distance(current_latlng, a))
                
            best_attr = available_attractions.pop(0)
            daily_attractions.append(best_attr)
            
            if current_latlng:
                total_distance_km += calc_distance(current_latlng, best_attr)
            current_latlng = best_attr
            
        # Build Day Timeline
        for idx, attr in enumerate(daily_attractions):
            # Morning/Afternoon Activity
            day_activities.append({
                "id": f"act_{day_idx}_{idx}_sight",
                "time": current_time.strftime("%H:%M"),
                "title": attr.get("name"),
                "description": attr.get("description", f"Enjoy the vibe at {attr.get('name')}."),
                "location": request.destination,
                "lat": attr.get("lat"),
                "lng": attr.get("lng"),
                "cost": total_trip_budget * (sightseeing_pct * 0.8) / (days_count * acts_per_day),
                "category": "sightseeing"
            })
            current_time += timedelta(hours=gap_hours)
            
            # Insert Lunch roughly around 13:00 - 14:00
            if idx == 0 and len(available_food) > 0:
                food = available_food.pop(0)
                lunch_time = datetime.strptime("13:30", "%H:%M")
                if current_time < lunch_time:
                    current_time = lunch_time
                
                day_activities.append({
                    "id": f"act_{day_idx}_lunch",
                    "time": current_time.strftime("%H:%M"),
                    "title": f"Lunch at {food.get('name')}",
                    "description": f"Taste amazing {food.get('cuisine', 'local')} food.",
                    "location": request.destination,
                    "lat": food.get("lat"),
                    "lng": food.get("lng"),
                    "cost": total_trip_budget * (food_pct * 0.4) / days_count,
                    "category": "food"
                })
                current_time += timedelta(hours=1.5)
                available_food.append(food) # recycle food places

        # Evening Dinner
        if len(available_food) > 0:
            dinner = available_food[-1] # pick a different one
            dinner_time = datetime.strptime("19:30", "%H:%M")
            if current_time < dinner_time:
                current_time = dinner_time
                
            day_activities.append({
                "id": f"act_{day_idx}_dinner",
                "time": current_time.strftime("%H:%M"),
                "title": f"Dinner at {dinner.get('name')}",
                "description": f"Relaxing dinner experience.",
                "location": request.destination,
                "lat": dinner.get("lat"),
                "lng": dinner.get("lng"),
                "cost": total_trip_budget * (food_pct * 0.6) / days_count,
                "category": "food"
            })

        itinerary.append({
            "day": day_idx + 1,
            "date": current_date,
            "activities": day_activities
        })

    # 4. Smart Review Metadata & Budget Health
    budget_health = "Excellent"
    if total_trip_budget < estimated_budget * 0.7:
        budget_health = "Tight"
    elif total_trip_budget > estimated_budget * 1.5:
        budget_health = "Lavish"

    hotel_type_rec = "Premium Resorts" if is_luxury else ("Budget Hostels/Homestays" if is_budget else "Comfortable Hotels")
    
    from utils.destination_intel import get_destination_metadata, get_locality_recommendation
    meta_intel = get_destination_metadata(request.destination)
    locality_rec = get_locality_recommendation(request.destination, request.travelers, is_luxury, is_budget, is_family, is_solo, request.pace)

    # Let's custom craft natural travel guidance alerts instead of robotic system statements
    weather_alert = "Perfect tropical climate. Evenings are pleasant for street-food strolling."
    if "ooty" in request.destination.lower() or "nilgiris" in request.destination.lower():
        weather_alert = "Mist-heavy mountain evenings. Carry warm jackets and avoid late-night fog driving."
    elif "kodai" in request.destination.lower():
        weather_alert = "Cool pine breeze with sudden light showers. Keep umbrellas handy for lake walking."

    best_time_alert = f"Mornings are best for visiting {locality_rec.get('attractions', 'local sites')}. Evenings are perfect to explore {locality_rec.get('food_streets', ['local avenues'])[0]}."

    return {
        "name": request.name,
        "destination": request.destination,
        "start_date": request.startDate,
        "end_date": request.endDate,
        "budget": total_trip_budget,
        "travelers": request.travelers,
        "itinerary": itinerary,
        "budget_distribution": {
            "sightseeing": total_trip_budget * sightseeing_pct,
            "food": total_trip_budget * food_pct,
            "travel": total_trip_budget * travel_pct,
            "stay": total_trip_budget * stay_pct
        },
        "stops": list(set([request.destination] + (request.stops or []))),
        "notes": f"AI Personalized Plan for {request.travelers} traveler(s). Style: {request.pace}. Health: {budget_health} Budget. Suggested Stay in {locality_rec['locality_name']}.",
        # Rich Metadata for frontend
        "metadata": {
            "estimated_distance_km": round(total_distance_km, 1),
            "budget_health": budget_health,
            "hotel_suggestions": hotel_type_rec,
            "accommodations": generate_accommodations(request.destination, request.travelers, is_luxury, is_budget, is_family, is_solo, request.pace),
            "weather_suitability": weather_alert,
            "best_time_alerts": best_time_alert,
            "locality_name": locality_rec["locality_name"],
            "locality_why": locality_rec["reason"],
            "locality_desc": locality_rec["description"],
            "locality_style": locality_rec["style"],
            "locality_safety": locality_rec["safety"],
            "locality_convenience": locality_rec["convenience"],
            "famous_foods": meta_intel["famous_foods"],
            "food_streets": meta_intel["food_streets"],
            "accessibility": meta_intel["railway_bus_accessibility"],
            "transit_advice": meta_intel["transport_convenience"],
            "crowd_level": meta_intel["crowd_level"],
            "safety_info": meta_intel["safety_info"]
        }
    }

class Coordinate(BaseModel):
    lat: float
    lng: float

class RoadTripRequest(BaseModel):
    origin: str
    destination: str
    routeCoordinates: Optional[List[Coordinate]] = None
    travelMode: Optional[str] = "driving"

@router.post("/road-trip-intelligence")
async def get_road_trip_intelligence(request: RoadTripRequest, current_user_id: str = Depends(get_current_user)):
    def safe_str(s: Any) -> str:
        return str(s).encode('ascii', errors='ignore').decode('ascii')

    # Defensive logging: log the incoming request body
    print(f"\n[AUDIT] [START] Incoming POST /api/ai/road-trip-intelligence request:")
    print(f"   - Origin: {safe_str(request.origin)}")
    print(f"   - Destination: {safe_str(request.destination)}")
    print(f"   - Travel Mode: {safe_str(request.travelMode)}")
    print(f"   - Route Coordinates Passed: {safe_str(len(request.routeCoordinates) if request.routeCoordinates else 'None')}")
    print(f"   - User ID: {safe_str(current_user_id)}")

    from utils.route_intelligence import generate_live_route_intelligence
    try:
        # Generate base live route intelligence
        base_data = generate_live_route_intelligence(request.origin, request.destination)
        
        # Build enhanced response incorporating placeholders and metadata requested by the user
        enhanced_data = {
            # 1. Main backward-compatible fields
            "origin": base_data.get("origin"),
            "destination": base_data.get("destination"),
            "distance_km": base_data.get("distance_km"),
            "duration": base_data.get("duration"),
            "weather": base_data.get("weather"),
            "status_badge": base_data.get("status_badge"),
            "status_color": base_data.get("status_color"),
            "geometry": base_data.get("geometry"),
            "insights": base_data.get("insights"),
            
            # 2. Rich structured placeholders conforming to instructions
            "live_route_insights": base_data.get("insights", []),
            "route_metadata": {
                "distance_km": base_data.get("distance_km"),
                "duration": base_data.get("duration"),
                "travel_mode": request.travelMode or "driving",
                "engine_version": "v1.2.0-production",
                "calculated_at": datetime.utcnow().isoformat()
            },
            "weather_placeholders": {
                "current_weather": base_data.get("weather"),
                "suitability_index": "Excellent" if "Clear" in base_data.get("status_badge", "") else "Caution",
                "temperature": "26°C",
                "wind_speed": "12 km/h",
                "visibility": "10 km",
                "hourly_forecast": [
                    {"time": "Next 1 hr", "condition": "Sunny", "temp": "27°C"},
                    {"time": "Next 3 hrs", "condition": "Sunny", "temp": "28°C"},
                    {"time": "Next 6 hrs", "condition": "Clear", "temp": "24°C"}
                ]
            },
            "traffic_placeholders": {
                "congestion_level": "Low" if "Clear" in base_data.get("status_badge", "") else "Moderate",
                "average_speed_kmh": 60 if "Clear" in base_data.get("status_badge", "") else 45,
                "delays_minutes": 0 if "Clear" in base_data.get("status_badge", "") else 12,
                "incidents": []
            },
            "nearby_stop_placeholders": [
                {
                    "name": "Highway Food Plaza (A2B & Starbucks)",
                    "type": "rest_stop",
                    "distance_from_origin_km": 45.0,
                    "rating": 4.6,
                    "facilities": ["Restrooms", "Food Court", "ATM", "Fuel Station"]
                },
                {
                    "name": "Tata Power EZ Charge Station",
                    "type": "ev_charger",
                    "distance_from_origin_km": 80.0,
                    "rating": 4.8,
                    "facilities": ["CCS2 50kW Fast Charger", "Cafeteria", "Lounge"]
                },
                {
                    "name": "Scenic Valley Overlook Bay",
                    "type": "viewpoint",
                    "distance_from_origin_km": 120.0,
                    "rating": 4.9,
                    "facilities": ["Parking Bay", "View deck", "Local Tea Shop"]
                }
            ]
        }
        
        # Defensive logging: log generated intelligence summary
        print(f"[AUDIT] [SUCCESS] Successfully generated route intelligence:")
        print(f"   - Distance: {safe_str(enhanced_data['distance_km'])} km")
        print(f"   - Duration: {safe_str(enhanced_data['duration'])}")
        print(f"   - Status: {safe_str(enhanced_data['status_badge'])}")
        print(f"   - Number of Insights: {safe_str(len(enhanced_data['live_route_insights']))}")
        print(f"   - Nearby Stops: {safe_str(len(enhanced_data['nearby_stop_placeholders']))}")
        
        return enhanced_data
        
    except Exception as e:
        import traceback
        error_trace = traceback.format_exc()
        # Defensive logging: log API failures
        print(f"[AUDIT] [ERROR] API Failure in get_road_trip_intelligence:")
        print(f"   - Error: {safe_str(e)}")
        print(f"   - Traceback:\n{safe_str(error_trace)}")
        raise HTTPException(status_code=500, detail=f"Route Intelligence Error: {str(e)}")
