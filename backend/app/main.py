from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os

from . import models
from .database import engine, SessionLocal
from .routers import customers, auth, vision, dashboard, biometrics, sentiment, chatbot
from .utils.security import get_password_hash

models.Base.metadata.create_all(bind=engine)

# Ensure uploads directory exists
os.makedirs("uploads", exist_ok=True)

app = FastAPI(
    title="Smart Retail & Customer Intelligence API",
    description="Enterprise API for retail intelligence, face recognition, and sentiment analysis.",
    version="1.0.0"
)

app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

origins = [
    "http://localhost",
    "http://localhost:5173", # Vite default
    "http://127.0.0.1:5173",
    "http://127.0.0.1:5174",
    "http://localhost:5174",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(customers.router)
app.include_router(vision.router)
app.include_router(dashboard.router)
app.include_router(biometrics.router)
app.include_router(sentiment.router)
app.include_router(chatbot.router)
from .seeds import seed_database

@app.on_event("startup")
def seed_db():
    db = SessionLocal()
    try:
        seed_database(db)
    finally:
        db.close()


@app.get("/")
def read_root():
    return {"status": "ok", "message": "Smart Retail API is running"}
