import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv

load_dotenv()

MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017")
client = AsyncIOMotorClient(MONGO_URI)
db = client.tripsphere
collection = db.destinations

destinations = [
    {
        "name": "Coimbatore",
        "slug": "coimbatore",
        "category": "City",
        "district": "Coimbatore",
        "description": "Known as the Manchester of South India, Coimbatore is a major hub for industry and textiles. Nestled at the foothills of the Nilgiris, it offers a pleasant climate, ancient temples like Marudhamalai, and serene spots like the Adiyogi Shiva statue.",
        "longDescription": "Coimbatore is the second largest city in Tamil Nadu, serving as a gateway to several hill stations including Ooty and Munnar. The city is famous for its textile industries, engineering firms, educational institutions, and pleasant weather due to its proximity to the Western Ghats. Visitors can explore the massive Adiyogi Shiva statue at the Isha Yoga Center, the ancient Marudhamalai Murugan Temple, and enjoy the scenic beauty of the Siruvani Waterfalls.",
        "location": "Western Tamil Nadu",
        "coordinates": {"lat": 11.0168, "lng": 76.9558},
        "rating": 4.5,
        "is_featured": True,
        "is_hidden_gem": False,
        "estimated_budget": 3000,
        "avg_cost_per_person": 3000,
        "crowd_level": "medium",
        "timeRequired": "2-3 Days",
        "best_time_to_visit": "September to March",
        "nearby_places": [
            {"name": "Ooty", "distance": "86 km"},
            {"name": "Pollachi", "distance": "40 km"},
            {"name": "Valparai", "distance": "100 km"}
        ],
        "famous_food": ["Kovai Kaalan", "Pachaiappan Mess Meals", "Annapoorna Sambar Idli"],
        "recommended_hotels": ["The Residency Towers", "Radisson Blu", "Vivanta Coimbatore"],
        "transport_info": "Connected by Coimbatore International Airport (CJB), major railway junctions, and extensive bus networks.",
        "emergency_info": "Police: 100, Ambulance: 108, Kovai Medical Center and Hospital (KMCH) is a major healthcare facility.",
        "attractions": [
            {"name": "Adiyogi Shiva Statue", "lat": 10.9723, "lng": 76.7405, "type": "Spiritual"},
            {"name": "Marudhamalai Hill Temple", "lat": 11.0456, "lng": 76.8488, "type": "Temple"},
            {"name": "Siruvani Waterfalls", "lat": 10.9381, "lng": 76.6853, "type": "Nature"}
        ],
        "food": [
            {"name": "Sree Annapoorna", "cuisine": "South Indian", "rating": 4.8, "image": "https://images.unsplash.com/photo-1589301760014-d929f39ce9b1"},
            {"name": "Haribhavanam", "cuisine": "Traditional Non-Veg", "rating": 4.6, "image": "https://images.unsplash.com/photo-1618161117865-c7e6eb1fdbb8"}
        ]
    },
    {
        "name": "Trichy",
        "slug": "trichy",
        "category": "Heritage",
        "district": "Tiruchirappalli",
        "description": "Tiruchirappalli, affectionately called Trichy, is a city built around the spectacular Rock Fort. It is a major educational and cultural hub featuring the massive Srirangam temple complex.",
        "longDescription": "Located at the geographic center of Tamil Nadu, Trichy is an ancient city that dates back to the Chola dynasty. Its most prominent landmark is the Rock Fort, a historic fort and temple complex built on an ancient rock. Just across the river Cauvery lies Srirangam, an island town housing the Sri Ranganathaswamy Temple, one of the largest functioning Hindu temples in the world. The city is a bustling blend of the old and new.",
        "location": "Central Tamil Nadu",
        "coordinates": {"lat": 10.7905, "lng": 78.7047},
        "rating": 4.6,
        "is_featured": True,
        "is_hidden_gem": False,
        "estimated_budget": 2500,
        "avg_cost_per_person": 2500,
        "crowd_level": "high",
        "timeRequired": "1-2 Days",
        "best_time_to_visit": "October to March",
        "nearby_places": [
            {"name": "Thanjavur", "distance": "60 km"},
            {"name": "Madurai", "distance": "135 km"}
        ],
        "famous_food": ["Trichy Parotta", "Srirangam Puliyodharai"],
        "recommended_hotels": ["Courtyard by Marriott", "SRM Hotel", "Sangam Hotel"],
        "transport_info": "Trichy International Airport (TRZ) connects to Southeast Asia. Trichy Junction is a major rail hub.",
        "emergency_info": "Police: 100, Ambulance: 108, Kauvery Hospital is centrally located.",
        "attractions": [
            {"name": "Rock Fort Temple", "lat": 10.8282, "lng": 78.6970, "type": "Heritage"},
            {"name": "Sri Ranganathaswamy Temple", "lat": 10.8624, "lng": 78.6901, "type": "Temple"},
            {"name": "Kallanai Dam", "lat": 10.8327, "lng": 78.8209, "type": "Heritage"}
        ],
        "food": [
            {"name": "Vasantha Bhavan", "cuisine": "South Indian", "rating": 4.4, "image": "https://images.unsplash.com/photo-1610192244261-3f33de3f55e4"},
            {"name": "Kannappa Chettinad", "cuisine": "Chettinad", "rating": 4.5, "image": "https://images.unsplash.com/photo-1565557623262-b51c2513a641"}
        ]
    },
    {
        "name": "Kanyakumari",
        "slug": "kanyakumari",
        "category": "Coastal",
        "district": "Kanyakumari",
        "description": "The southernmost tip of the Indian subcontinent where the Arabian Sea, the Bay of Bengal, and the Indian Ocean meet. Famous for its spectacular sunrises, sunsets, and the Vivekananda Rock Memorial.",
        "longDescription": "Kanyakumari is a coastal town of immense geographic and spiritual significance. It is the only place in India where you can watch the sunrise and sunset from the same ocean beach. The town is renowned for the Vivekananda Rock Memorial and the towering Thiruvalluvar Statue that stand on rocky islands just off the coast. It is a major pilgrimage center with the ancient Bhagavathy Amman Temple.",
        "location": "Southern Tip of India",
        "coordinates": {"lat": 8.0883, "lng": 77.5385},
        "rating": 4.7,
        "is_featured": True,
        "is_hidden_gem": False,
        "estimated_budget": 2000,
        "avg_cost_per_person": 2000,
        "crowd_level": "high",
        "timeRequired": "2 Days",
        "best_time_to_visit": "October to March",
        "nearby_places": [
            {"name": "Trivandrum", "distance": "90 km"},
            {"name": "Tirunelveli", "distance": "85 km"}
        ],
        "famous_food": ["Meen Kolambu", "Banana Chips", "Tapioca with Fish Curry"],
        "recommended_hotels": ["Sparsa Resort", "The Seashore Hotel", "Hotel Sea View"],
        "transport_info": "Nearest airport is Trivandrum (TRV) 90km away. Connected directly via Kanyakumari Railway Station (CAPE).",
        "emergency_info": "Police: 100, Ambulance: 108, Kanyakumari Medical Mission Hospital.",
        "attractions": [
            {"name": "Vivekananda Rock Memorial", "lat": 8.0781, "lng": 77.5552, "type": "Monument"},
            {"name": "Thiruvalluvar Statue", "lat": 8.0778, "lng": 77.5540, "type": "Monument"},
            {"name": "Kanyakumari Beach", "lat": 8.0822, "lng": 77.5502, "type": "Beach"}
        ],
        "food": [
            {"name": "Hotel Saravana", "cuisine": "South Indian", "rating": 4.2, "image": "https://images.unsplash.com/photo-1610192244261-3f33de3f55e4"},
            {"name": "The Ocean Restaurant", "cuisine": "Seafood", "rating": 4.5, "image": "https://images.unsplash.com/photo-1544025162-d76694265947"}
        ]
    }
]

async def seed():
    for dest in destinations:
        # Check if exists (case insensitive)
        existing = await collection.find_one({"name": {"$regex": f"^{dest['name']}$", "$options": "i"}})
        if not existing:
            await collection.insert_one(dest)
            print(f"Inserted: {dest['name']}")
        else:
            # Update missing fields
            await collection.update_one({"_id": existing["_id"]}, {"$set": dest})
            print(f"Updated: {dest['name']}")
            
    print("Seeding complete.")

if __name__ == "__main__":
    asyncio.run(seed())
