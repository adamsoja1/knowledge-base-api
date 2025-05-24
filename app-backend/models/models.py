
from pydantic import BaseModel
from sqlalchemy import create_engine, Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import sessionmaker, declarative_base
from pgvector.sqlalchemy import Vector
from sqlalchemy.sql import func

import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    raise RuntimeError("Brak ustawionej zmiennej DATABASE_URL")

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

class Document(Base):
    __tablename__ = "documents"
    id = Column(Integer, primary_key=True, index=True)
    text = Column(Text, nullable=False)
    embedding = Column(Vector(1024))  
    filename_id = Column(Integer, nullable=False)  
    added = Column(DateTime(timezone=True), server_default=func.now())  


Base.metadata.create_all(bind=engine)