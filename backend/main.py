from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import models
from database import engine
from auth import router as auth_router
from contacts import router as contacts_router
from conversations import router as conversations_router
from messages import router as messages_router

from websockets_manager import router as websockets_router

models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="Signal Clone API")

import os

# Parse comma-separated CORS_ORIGINS from environment, fallback to localhost
cors_origins_str = os.environ.get("CORS_ORIGINS", "http://localhost:3000")
cors_origins = [origin.strip() for origin in cors_origins_str.split(",")]

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(contacts_router)
app.include_router(conversations_router)
app.include_router(messages_router)
app.include_router(websockets_router)

@app.get("/")
def read_root():
    return {"message": "Welcome to Signal Clone API"}
