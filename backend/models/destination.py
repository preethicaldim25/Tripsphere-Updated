from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from bson import ObjectId

class PyObjectId(ObjectId):
    @classmethod
    def __get_validators__(cls):
        yield cls.validate

    @classmethod
    def validate(cls, v):
        if not ObjectId.is_valid(v):
            raise ValueError("Invalid objectid")
        return ObjectId(v)

    @classmethod
    def __modify_schema__(cls, field_schema):
        field_schema.update(type="string")

class DestinationDB(BaseModel):
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    name: str
    category: str
    image: str
    images: List[str] = []  # Gallery images
    description: str
    location: str
    district: str
    rating: float = 0.0
    budget: str
    bestTime: str
    overview: str
    coordinates: Optional[dict] = None
    is_featured: bool = False
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    class Config:
        json_encoders = {ObjectId: str}
        schema_extra = {
            "example": {
                "name": "Ooty",
                "category": "Hill Station",
                "image": "https://images.unsplash.com/photo-1589308078059-be1415eab4c3",
                "description": "Queen of Hill Stations",
                "location": "Nilgiris District",
                "district": "Nilgiris",
                "rating": 4.5,
                "budget": "₹3,000 - ₹8,000",
                "bestTime": "April to June",
                "overview": "Beautiful hill station...",
                "is_featured": True
            }
        }

class DestinationResponse(BaseModel):
    id: str
    name: str
    category: str
    image: str
    images: List[str]
    description: str
    location: str
    district: str
    rating: float
    budget: str
    bestTime: str
    overview: str
    coordinates: Optional[dict]
    is_featured: bool

class DestinationCreate(BaseModel):
    name: str
    category: str
    image: str
    images: List[str] = []
    description: str
    location: str
    district: str
    budget: str
    bestTime: str
    overview: str
    coordinates: Optional[dict] = None
    is_featured: bool = False

class DestinationUpdate(BaseModel):
    name: Optional[str]
    category: Optional[str]
    image: Optional[str]
    images: Optional[List[str]]
    description: Optional[str]
    location: Optional[str]
    district: Optional[str]
    budget: Optional[str]
    bestTime: Optional[str]
    overview: Optional[str]
    coordinates: Optional[dict]
    is_featured: Optional[bool]