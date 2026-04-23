# backend/main.py
import os
from contextlib import asynccontextmanager

from beanie import init_beanie
from dotenv import load_dotenv
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from motor.motor_asyncio import AsyncIOMotorClient
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.util import get_remote_address

from models import User, Transaction, AuditLog, Beneficiary, BillPayment
from routes import router

# Load environment variables
load_dotenv()

MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017")
MONGO_DB = os.getenv("MONGO_DB", "securebank")

# CORS origins from environment (comma-separated) or defaults
_default_origins = "http://localhost:5173,http://localhost:5174,http://localhost:3000,http://127.0.0.1:5173"
ALLOWED_ORIGINS = [o.strip() for o in os.getenv("ALLOWED_ORIGINS", _default_origins).split(",") if o.strip()]

# CIA: Availability — Rate limiting prevents brute force / DoS attacks
limiter = Limiter(key_func=get_remote_address)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initialize MongoDB connection and Beanie ODM on startup."""
    client = AsyncIOMotorClient(MONGO_URI)
    db = client[MONGO_DB]

    await init_beanie(database=db, document_models=[User, Transaction, AuditLog, Beneficiary, BillPayment])

    print(f"[OK] Connected to MongoDB -- {MONGO_DB}")
    print("[OK] Collections: users, transactions, audit_logs, beneficiaries, bill_payments")

    yield

    client.close()
    print("[INFO] MongoDB connection closed")


app = FastAPI(
    title="SecureBank API",
    description="Encrypted Banking System with Multi-Layer Security — CIA Triad Implementation",
    version="2.1.0",
    lifespan=lifespan,
)

# Attach rate limiter
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# CORS middleware — origins configurable via ALLOWED_ORIGINS env var
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routes
app.include_router(router)


# --- Request Logging Middleware (CIA: Integrity — audit trail) ---
@app.middleware("http")
async def log_requests(request: Request, call_next):
    """Log all API requests (without sensitive data) for security monitoring."""
    import time
    start = time.time()
    response = await call_next(request)
    duration = round((time.time() - start) * 1000, 2)

    # Only log API calls, skip static assets
    if request.url.path.startswith("/api"):
        print(f"[LOG] {request.method} {request.url.path} -> {response.status_code} ({duration}ms) [{request.client.host if request.client else 'unknown'}]")

    return response


@app.get("/")
async def root():
    return {
        "message": "SecureBank API is running",
        "version": "2.1.0",
        "security": "CIA Triad: Confidentiality, Integrity, Availability",
    }
