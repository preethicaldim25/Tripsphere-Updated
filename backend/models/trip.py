from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime
from bson import ObjectId

class ItineraryItem(BaseModel):
    day: int
    description: str

class TripBase(BaseModel):
    title: str
    destination_id: str
    start_date: str
    end_date: str
    total_budget: float
    used_budget: float = 0.0
    status: str = "upcoming"
    members: List[str] = []
    itinerary: List[dict] = []

class TripCreate(TripBase):
    pass

class TripUpdate(BaseModel):
    title: Optional[str] = None
    destination_name: Optional[str] = None
    destination_image: Optional[str] = None
    location: Optional[str] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    total_budget: Optional[float] = None
    used_budget: Optional[float] = None
    status: Optional[str] = None
    members: Optional[List[str]] = None
    itinerary: Optional[List[ItineraryItem]] = None

class TripResponse(TripBase):
    id: str = Field(alias="_id")
    user_id: str
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}
