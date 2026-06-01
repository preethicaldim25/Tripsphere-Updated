import sys
import io
import os
import logging
import traceback
from datetime import datetime
from fastapi import FastAPI, Depends, Request, Response
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

# Force UTF-8 for Windows console
if hasattr(sys.stdout, 'buffer'):
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

load_dotenv()

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("tripsphere")

# Internal imports
from database import init_db, close_db
import auth as auth_utils # Import top-level auth.py
from routers import (
    auth as auth_router,
    trips as trips_router,
    expenses as expenses_router,
    destinations as destinations_router,
    ai as ai_router,
    users as users_router
)

app = FastAPI(
    title="Tripsphere API",
    description="Backend for Tripsphere travel app",
    version="1.0.0"
)

# CORS Configuration
# IMPORTANT: When allow_credentials=True, allow_origins cannot be ["*"]
# We must list the specific origins or use allow_origin_regex
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:8081",
        "http://127.0.0.1:8081",
        "http://localhost:8000",
        "http://127.0.0.1:8000",
        "http://localhost:19006",
        "http://localhost:19000",
        "https://tricky-dedicate-quill.ngrok-free.dev"
    ],
    allow_origin_regex=r"https://.*\.ngrok-free\.dev", # Allow all ngrok subdomains
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)

# Global Exception Handler to catch 500 errors and return JSON
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"GLOBAL ERROR: {str(exc)}")
    logger.error(traceback.format_exc())
    return JSONResponse(
        status_code=500,
        content={
            "detail": "Internal Server Error", 
            "message": str(exc),
            "path": request.url.path
        },
    )

# Debug middleware to log all requests
@app.middleware("http")
async def log_requests(request: Request, call_next):
    print(f"[DEBUG] Incoming request: {request.method} {request.url}")
    try:
        response = await call_next(request)
        print(f"[DEBUG] Response status: {response.status_code}")
        return response
    except Exception as e:
        print(f"[DEBUG] Request failed: {e}")
        raise

@app.on_event("startup")
async def startup_event():
    """Initialize database on startup"""
    logger.info("[STARTUP] Initializing database...")
    db = await init_db()
    if db is not None:
        logger.info("[STARTUP] Database initialized successfully")
    else:
        logger.error("[STARTUP] CRITICAL: Database initialization failed")
    
    port = int(os.getenv("PORT", 8000))
    logger.info(f"🚀 TRIPSPHERE BACKEND READY on port {port}")

@app.on_event("shutdown")
async def shutdown_event():
    """Close database connection on shutdown"""
    logger.info("[SHUTDOWN] Closing database connection...")
    await close_db()

# --- Global Routes ---

@app.get("/")
async def root():
    return {
        "name": "Tripsphere API",
        "version": "1.0.0",
        "status": "running",
        "docs": "/docs"
    }

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "database": "connected"
    }

# --- Include Routers ---
app.include_router(auth_router.router, prefix="/api")
app.include_router(destinations_router.router, prefix="/api")
app.include_router(destinations_router.places_router, prefix="/api")
app.include_router(trips_router.router, prefix="/api")
app.include_router(expenses_router.router, prefix="/api")
app.include_router(ai_router.router, prefix="/api")
app.include_router(users_router.router, prefix="/api/users", tags=["users"])

# Direct alias for AI endpoint to handle legacy frontend calls
from routers.ai import RoadTripRequest, get_road_trip_intelligence

@app.post("/api/road-trip-intelligence")
async def get_road_trip_intelligence_alias(
    request: RoadTripRequest, 
    current_user_id: str = Depends(auth_utils.get_current_user)
):
    """Proxy request to the actual AI intelligence endpoint"""
    return await get_road_trip_intelligence(request, current_user_id)

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)
