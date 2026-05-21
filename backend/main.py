# Force UTF-8 output so emoji print()s don't crash on Windows cp1252 consoles
import sys, io
if hasattr(sys.stdout, 'buffer'):
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
if hasattr(sys.stderr, 'buffer'):
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace')

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import auth, trips, expenses, destinations, ai
from database import init_db
import uvicorn
import os
from dotenv import load_dotenv
from datetime import datetime

load_dotenv()

app = FastAPI(title="Tripsphere API")

@app.on_event("startup")
async def startup_event():
    """Initialize database on startup"""
    await init_db()
    port = int(os.getenv("PORT", 8000))
    print(f"\nBackend running on:")
    print(f"   - Local:    http://localhost:{port}")
    print(f"   - Network:  http://0.0.0.0:{port}")
    print(f"   - Docs:     http://localhost:{port}/docs\n")
    print(f"   - Test:     http://192.168.1.74:{port}/health")

# CORS configuration - VERY IMPORTANT for web and mobile
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:8082", "http://localhost:19006", "http://localhost:19000", "*"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allow_headers=["*", "Authorization", "Content-Type", "Bypass-Tunnel-Reminder", "ngrok-skip-browser-warning"],
    expose_headers=["*"],
)

# Root route
@app.get("/")
async def root():
    return {
        "name": "Tripsphere API",
        "version": "1.0.0",
        "status": "running",
        "docs": "/docs",
        "endpoints": {
            "auth": "/api/auth",
            "destinations": "/api/destinations",
            "trips": "/api/trips",
            "expenses": "/api/expenses"
        }
    }

# Health check - Use this to test connection
@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "database": "connected",
        "message": "Backend is reachable!"
    }

# Include routers
app.include_router(auth.router, prefix="/api")
app.include_router(destinations.router, prefix="/api")
app.include_router(destinations.places_router, prefix="/api")
app.include_router(trips.router, prefix="/api")
app.include_router(expenses.router, prefix="/api")
app.include_router(ai.router, prefix="/api")

# Direct alias route for /api/road-trip-intelligence to prevent any 404 prefix mismatch
from routers.ai import RoadTripRequest, get_road_trip_intelligence
from auth import get_current_user
from fastapi import Depends

@app.post("/api/road-trip-intelligence")
async def get_road_trip_intelligence_alias(request: RoadTripRequest, current_user_id: str = Depends(get_current_user)):
    print("[ALIAS ROUTE] Intercepted call to direct /api/road-trip-intelligence - Proxying to get_road_trip_intelligence")
    return await get_road_trip_intelligence(request, current_user_id)


if __name__ == "__main__":
    port = int(os.getenv("PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)