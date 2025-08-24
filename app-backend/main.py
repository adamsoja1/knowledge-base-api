import os
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from sqlalchemy import create_engine, Column, Integer, String, Text, text
from sqlalchemy.orm import sessionmaker, declarative_base
from pgvector.sqlalchemy import Vector
from typing import List
from migrations import run_migrations
from database.models import SessionLocal, Document
from datetime import datetime
from fastapi.middleware.cors import CORSMiddleware

from core.models.embedder import get_embedder

from routes.user_auth.endpoints import register_router
from routes.agent.response import response_router

class DocumentCreate(BaseModel):
    text: str
    embedding: List[float]

class DocumentOut(BaseModel):
    id: int
    text: str
    filename_id: int
    added: datetime


app = FastAPI(title="Agent")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(register_router)
app.include_router(response_router)



@app.on_event("startup")
def startup_event():
    get_embedder()

