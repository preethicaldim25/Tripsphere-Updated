# Destination Intelligence & Locality Recommendation Service
# Powers accommodation recommendation, itinerary generation, food advice, and local transit choices.

DESTINATION_METADATA = {
    "trichy": {
        "name": "Trichy (Tiruchirappalli)",
        "categories": {
            "family": {
                "locality": "Srirangam",
                "description": "Safe, serene pilgrim island surrounded by lush temple trees.",
                "style": "Traditional Guest House & Heritage Homestay",
                "reason": "peaceful area, spectacular temple access, and a safer family environment with very minimal city traffic.",
                "est_price": "₹1,800 - ₹3,500 / night",
                "badge": "Heritage Calm",
                "safety": "High safety zone, heavily patrolled family friendly streets.",
                "convenience": "Walking access to temples, local shared rickshaws.",
                "attractions": "Sri Ranganathaswamy Temple, Jambukeswarar Temple",
                "food": "Srirangam outer ring traditional ghee roast and temple food stalls."
            },
            "budget": {
                "locality": "Cantonment",
                "description": "Bustling central transit neighborhood with extensive budget stays.",
                "style": "Transit Lodge & Cozy Backpacker Room",
                "reason": "near the central railway station, easier local transport, cheaper stays, and highly walkable food avenues.",
                "est_price": "₹900 - ₹1,600 / night",
                "badge": "Transit Value",
                "safety": "Safe central tourist area, active 24/7.",
                "convenience": "Superb train/bus link walkability.",
                "attractions": "Rockfort Temple, local shopping bazaars",
                "food": "Bustling street stalls near bus stand, famous filter coffee shops."
            },
            "luxury": {
                "locality": "Collectorate Road Area",
                "description": "Upscale premium administrative avenue featuring modern tree-lined roads.",
                "style": "Premium Boutique Hotel & Spa",
                "reason": "premium upscale environment, safe silent nights, high privacy, and excellent local airport access.",
                "est_price": "₹5,000 - ₹9,000 / night",
                "badge": "Elite Comfort",
                "safety": "Gated CCTV-secured administrative zone.",
                "convenience": "Pre-booked premium cabs, direct private parking.",
                "attractions": "Vayalur Murugan Temple, Kaveri River views",
                "food": "Premium rooftop multi-cuisine fine dining restaurants."
            }
        },
        "food_streets": ["NSB Road (Sweet shops & piping hot traditional halwa)", "Srirangam Temple Outer Ring Road (Pure vegetarian diners)", "Cantonment Main Street (Multi-cuisine modern eateries)"],
        "famous_foods": ["Trichy Filter Coffee", "Srirangam Puliyodharai (Tamarind Rice)", "Crispy Nei Ghee Roast Dosa", "Elaneer Payasam (Sweet tender coconut milk)"],
        "railway_bus_accessibility": "Outstanding. Trichy Junction connects all major lines in south India; Central Bus stand operates 24/7 routes.",
        "crowd_level": "Moderate during standard days; highly vibrant pilgrim crowds during temple festivals.",
        "safety_info": "Highly friendly pilgrim city with active police booths, making evening strolls secure.",
        "transport_convenience": "Abundant local city buses, shared auto-rickshaws, and instantly available Ola/Uber cabs."
    },
    "ooty": {
        "name": "Ooty (Udhagamandalam)",
        "categories": {
            "family": {
                "locality": "Doddabetta Road Side",
                "description": "Beautiful tea garden foothills overlooking lush misty valleys.",
                "style": "Cozy Family Cottage Resort",
                "reason": "peaceful area, secure gated villa compounds, spacious play lawns, and weather-aware fireplace heating.",
                "est_price": "₹3,800 - ₹6,000 / night",
                "badge": "Kids Approved",
                "safety": "Secure resort compounds, localized tourist safety staff.",
                "convenience": "Spacious family SUV parking and on-call cabs.",
                "attractions": "Doddabetta Peak, Tea Factory & Museum",
                "food": "Cozy family-style diners and home-cooked organic meals."
            },
            "budget": {
                "locality": "Charing Cross & Near Bus Stand",
                "description": "Vibrant downtown walking district with close links to local travel links.",
                "style": "Backpacker Wooden Cabin & Shared Lodge",
                "reason": "easier transport, walking access to botanical gardens, budget friendly shared stays, and social cafe networks.",
                "est_price": "₹900 - ₹1,800 / night",
                "badge": "Backpacker Pick",
                "safety": "Vibrant tourist hotspot, high pedestrian activity.",
                "convenience": "Walking access to buses, cheap shared auto stops.",
                "attractions": "Botanical Gardens, Ooty Lake, Rose Garden",
                "food": "Local hot chocolate shops, street-side steaming momos."
            },
            "luxury": {
                "locality": "Fern Hill & Lake Side View",
                "description": "Elite high-altitude ridges offering majestic panoramas of stepping tea estates.",
                "style": "Premium Colonial Heritage Manor",
                "reason": "scenic surroundings, authentic roaring brick fireplaces, maximum couple quietude, and private valet parking.",
                "est_price": "₹8,500 - ₹15,000 / night",
                "badge": "Heritage Elite",
                "safety": "Exclusive estate compounds with gated round-the-clock guards.",
                "convenience": "Dedicated resort private travel desk and luxury shuttles.",
                "attractions": "Fernhill Palace, quiet nature forest trails",
                "food": "Sprawling heritage English tea lounges and fine organic dining."
            }
        },
        "food_streets": ["Commercial Road (Fresh bakeries & homemade chocolate stalls)", "Charing Cross Market Road (Warm local soup & noodle points)"],
        "famous_foods": ["Homemade Nilgiri Chocolates", "Fresh Baked Plum Cake", "Hot Nilgiri Tea", "Warm Butter Bun & Coffee"],
        "railway_bus_accessibility": "Scenic heritage toy train access; well-connected hilltop national highway bus routes.",
        "crowd_level": "Crowded central town during summer holidays; quiet pristine environment in outer hill valleys.",
        "safety_info": "Extremely safe tourist-friendly hill station; caution suggested only during deep night fog driving.",
        "transport_convenience": "Pre-paid taxis, rental scooters, and traditional local auto networks."
    },
    "madurai": {
        "name": "Madurai",
        "categories": {
            "family": {
                "locality": "Anna Nagar",
                "description": "Modern family-friendly residential neighborhood with wide green streets.",
                "style": "Modern Quiet Family Hotel",
                "reason": "peaceful area, secure neighborhood, spacious parking, and highly comfortable family rooms away from early morning temple bells.",
                "est_price": "₹3,500 - ₹6,000 / night",
                "badge": "Residential Calm",
                "safety": "Highly rated peaceful local families and gate security.",
                "convenience": "Safe drop-off lanes, quick cab bookings.",
                "attractions": "Gandhi Memorial Museum, Vandiyur Teppakulam lake",
                "food": "Multi-cuisine family restaurants and traditional sweet stores."
            },
            "budget": {
                "locality": "West Tower Street Area",
                "description": "Vibrant pilgrim hub steps away from historic temple entrance towers.",
                "style": "Transit Backpacker Room & Simple Lodge",
                "reason": "near Meenakshi Temple, walking distance to train links, and surrounded by lively food streets offering round-the-clock options.",
                "est_price": "₹800 - ₹1,600 / night",
                "badge": "Temple Base",
                "safety": "Active 24/7 street monitoring, police patrol spots.",
                "convenience": "Walkable to railway/temple, massive auto-rickshaw availability.",
                "attractions": "Meenakshi Amman Temple, Koodal Azhagar Temple",
                "food": "World-famous Idli shops and warm Jigarthanda stalls."
            },
            "luxury": {
                "locality": "Pasumalai Hills Area",
                "description": "Charming heritage hills loaded with peacocks and panoramic hilltop views.",
                "style": "Historic Luxury Villa Resort",
                "reason": "scenic surroundings, premium private compounds, heritage pool villas, and outstanding local tranquility.",
                "est_price": "₹9,000 - ₹12,000 / night",
                "badge": "Peacock Hilltop",
                "safety": "Top-tier private estate surveillance, elite security guards.",
                "convenience": "Elite luxury travel coordinators and private chauffeur cars.",
                "attractions": "Thiruparankundram Temple, panoramic city views",
                "food": "Elite heritage rooftop diners featuring signature traditional royal spice platters."
            }
        },
        "food_streets": ["Town Hall Road (Midnight Idli street carts)", "Simmakkal Area (Traditional Madurai Parotta houses)", "West Tower Food Lane (Warm local filter coffee & sweet shops)"],
        "famous_foods": ["Madurai Jigarthanda", "Fluffy Bun Parotta with Salna", "Soft Murugan Idli", "Famous Kari Dosa (Mutton loaded Dosa)"],
        "railway_bus_accessibility": "Excellent. Madurai Junction is a massive hub; multiple high-frequency bus terminals.",
        "crowd_level": "Highly crowded around central temple rings; quiet elegant quarters in residential Pasumalai hills.",
        "safety_info": "Safe vibrant city active round the clock; pilgrim tourist-friendly culture.",
        "transport_convenience": "Vast shared auto-rickshaws, Ola/cabs, and traditional cycle rickshaws."
    },
    "kodaikanal": {
        "name": "Kodaikanal",
        "categories": {
            "family": {
                "locality": "Golf Club Road",
                "description": "Pristine pine surrounds, child-safe villa lanes, and gorgeous grassy hills.",
                "style": "Safe Fenced Family Villa",
                "reason": "peaceful area, secure fenced gardens, private cozy fireplaces, and excellent scenic morning walking paths.",
                "est_price": "₹3,800 - ₹6,000 / night",
                "badge": "Valley Retreat",
                "safety": "Highly secure fenced yards, cozy safe fireplace systems.",
                "convenience": "Private parking, quick on-call cab service.",
                "attractions": "Pine Forest, Kodaikanal Lake, Golf Course",
                "food": "Homestyle bakery cafes and traditional multi-cuisine family diners."
            },
            "budget": {
                "locality": "Vattakanal",
                "description": "Backpacker pine forests, beautiful hiking routes, and rustic shared wood cabins.",
                "style": "Backpacker Pine Cabin & Social Hostel",
                "reason": "near mountain trailheads, cheap scooter rentals, backpacker value stays, and social hippie cafe vibes.",
                "est_price": "₹800 - ₹1,800 / night",
                "badge": "Hikers Base",
                "safety": "Active young hikers hub, friendly hostel wardens.",
                "convenience": "Rental scooters, walkable nature trails.",
                "attractions": "Dolphin's Nose trail, Vattakanal Falls",
                "food": "Cozy local cafes serving hot soup, fresh pastries, and tea."
            },
            "luxury": {
                "locality": "Upper Lake Road Side",
                "description": "Premium ridge hills offering majestic views overlooking the central deep-blue lake.",
                "style": "Ultra-Premium Luxury Lake Resort",
                "reason": "scenic lake views, premium glass-front rooms, dedicated wellness spas, and private garden walks.",
                "est_price": "₹8,000 - ₹15,000 / night",
                "badge": "Lake View Elite",
                "safety": "High security estate perimeter, dedicated CCTV monitoring.",
                "convenience": "Valet parking, private lake shuttle service.",
                "attractions": "Coaker's Walk, Bryant Park, private boat docks",
                "food": "Gourmet fine dining featuring panoramic lake views."
            }
        },
        "food_streets": ["Lake Road Market (Fudge shops & warm local corn stalls)", "PT Road Area (Multi-cuisine boutique restaurants)"],
        "famous_foods": ["Homemade Kodaikanal Fudge", "Fresh Local Peaches & Plums", "Warm Herbal Tea", "Freshly Baked Sourdough & Cheese"],
        "railway_bus_accessibility": "Hill highway bus connectivity; nearest rail link Kodai Road Station is 80 km downhill.",
        "crowd_level": "Charming and peaceful on weekdays; busy around lake center on weekend peaks.",
        "safety_info": "Highly serene hill station; secure tourist paths with beautiful forest division checks.",
        "transport_convenience": "Rental bikes, pre-paid central cabs, and local tour cars."
    }
}

def get_destination_metadata(destination_name: str) -> dict:
    """
    Searches metadata for a destination. Returns a comprehensive dictionary.
    Falls back to a dynamic template for unsupported destinations to maintain scalability.
    """
    dest_key = destination_name.lower().strip()
    
    # Simple matching logic
    for key, value in DESTINATION_METADATA.items():
        if key in dest_key or dest_key in key:
            return value
            
    # Dynamic fallback generator for scalability
    return {
        "name": destination_name.title(),
        "categories": {
            "family": {
                "locality": "Quiet Green Suburb",
                "description": "Safe, serene neighborhood with local parks and family-oriented lanes.",
                "style": "Comfortable Modern Homestay",
                "reason": "peaceful area, secure neighborhood, child-friendly layout, and easier transport.",
                "est_price": "₹2,500 - ₹4,500 / night",
                "badge": "Safe Family Choice",
                "safety": "Secure residential zone, local family-friendly neighborhood.",
                "convenience": "Clean parking, easy taxi access.",
                "attractions": "Local parks and historic museums",
                "food": "Traditional family restaurants."
            },
            "budget": {
                "locality": "Downtown Central Area",
                "description": "Connected central district with abundant transit routes and local food.",
                "style": "Transit Backpacker Lodge",
                "reason": "near main transit points, cheaper stay options, easier local transport, and lively food streets.",
                "est_price": "₹800 - ₹1,600 / night",
                "badge": "Transit Value",
                "safety": "Active commercial street with constant patrol.",
                "convenience": "Walkable to bus and train links.",
                "attractions": "Main local street bazaars and monuments",
                "food": "Lively street food points and filter coffee."
            },
            "luxury": {
                "locality": "Scenic Horizon Estates",
                "description": "Upscale scenic district featuring premium gardens and high comfort.",
                "style": "Luxury Boutique Resort",
                "reason": "scenic surroundings, premium private amenities, absolute quietude, and direct travel transfers.",
                "est_price": "₹6,000 - ₹12,000 / night",
                "badge": "Exclusive Scenic",
                "safety": "Top-tier security guards and private entrance lanes.",
                "convenience": "Private valet and dedicated cabs.",
                "attractions": "Local panoramic viewpoints and high-end spas",
                "food": "Fine dining culinary options."
            }
        },
        "food_streets": ["Central Market Road (Authentic regional bakeries & street food)"],
        "famous_foods": ["Traditional filter coffee", "Hot crispy dosa", "Fresh local street food snacks"],
        "railway_bus_accessibility": "Well connected via state buses and regional railway terminals.",
        "crowd_level": "Vibrant during weekends; peaceful during weekdays.",
        "safety_info": "Highly tourist friendly with well-lit public streets.",
        "transport_convenience": "Abundant local auto-rickshaws and app cabs."
    }

def get_locality_recommendation(destination: str, travelers: int, is_luxury: bool, is_budget: bool, is_family: bool, is_solo: bool, style: str) -> dict:
    """
    Returns a customized locality recommendation matching traveler demographics and style constraints.
    Avoids robotic wording, speaking in organic, advisory travel language.
    """
    meta = get_destination_metadata(destination)
    
    # 1. Determine profile category
    if is_luxury or "luxury" in style.lower():
        cat_key = "luxury"
    elif is_budget or is_solo:
        cat_key = "budget"
    elif is_family or travelers > 2:
        cat_key = "family"
    else:
        cat_key = "family"  # default to family/couples standard
        
    choice = meta["categories"][cat_key]
    
    return {
        "locality_name": choice["locality"],
        "description": choice["description"],
        "style": choice["style"],
        "reason": choice["reason"],
        "price_range": choice["est_price"],
        "badge": choice["badge"],
        "safety": choice["safety"],
        "convenience": choice["convenience"],
        "attractions": choice["attractions"],
        "food_streets": meta["food_streets"],
        "famous_foods": meta["famous_foods"],
        "accessibility": meta["railway_bus_accessibility"],
        "transit_advice": meta["transport_convenience"],
        "crowd_level": meta["crowd_level"]
    }
