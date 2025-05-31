import os
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from sqlalchemy import create_engine, Column, Integer, String, Text, text
from sqlalchemy.orm import sessionmaker, declarative_base
from pgvector.sqlalchemy import Vector
from typing import List
from migrations import run_migrations
from models.models import SessionLocal, Document
from datetime import datetime
from fastapi.middleware.cors import CORSMiddleware


from core.embedder import get_embedder

from routes.generate import generation_router

class DocumentCreate(BaseModel):
    text: str
    embedding: List[float]

class DocumentOut(BaseModel):
    id: int
    text: str
    filename_id: int
    added: datetime


app = FastAPI(title="RAG API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # frontend origin (np. Vite dev server)
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(generation_router)



@app.on_event("startup")
def startup_event():
    get_embedder()


@app.get('/home', response_model=List[DocumentOut])
def home():
    with SessionLocal() as session:
        docs = session.query(Document).filter().all()
    return docs

@app.post("/documents/", response_model=DocumentOut)
def create_document(doc: DocumentCreate):
    session = SessionLocal()
    db_doc = Document(text=doc.text, embedding=doc.embedding)
    session.add(db_doc)
    session.commit()
    session.refresh(db_doc)
    session.close()
    return db_doc

@app.post("/search/", response_model=List[DocumentOut])
def search_similar_documents(embedding: List[float], top_k: int = 5):
    session = SessionLocal()
    results = session.query(Document).order_by(Document.embedding.cosine_distance(embedding)).limit(top_k).all()
    session.close()
    return results
