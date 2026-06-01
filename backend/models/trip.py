from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime
from bson import ObjectId

class TripBase(BaseModel):
    title: str
    destination_name: str
    destination_image: Optional[str] = None
    location: str
    start_date: str
    end_date: str
    total_budget: float
    used_budget: float = 0.0
    status: str = "upcoming"
    members: List[str] = []
    itinerary: List[dict] = []

class TripCreate(TripBase):
    pass

class TripResponse(TripBase):
    id: str
    created_by: str
    created_at: datetime
    updated_at: Optional[datetime] = None

    model_config = {
        "from_attributes": True,
        "populate_by_name": True,
        "json_encoders": {
            ObjectId: str
        }
    }
