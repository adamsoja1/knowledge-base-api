from pydantic import BaseModel
from sqlalchemy import create_engine, Column, Integer, String, Text, DateTime, ForeignKey, LargeBinary, Table, Boolean
from sqlalchemy.orm import sessionmaker, declarative_base, relationship
from pgvector.sqlalchemy import Vector
from sqlalchemy.sql import func

import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    raise RuntimeError("No variable DATABASE_URL")

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

user_group_access = Table(
    "user_group_access",
    Base.metadata,
    Column("user_id", Integer, ForeignKey("users.id"), primary_key=True),
    Column("group_id", Integer, ForeignKey("groups.id"), primary_key=True)
)

class Group(Base):
    __tablename__ = "groups"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, nullable=False)

    description = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=True)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), nullable=True)
    is_active = Column(Boolean, default=True, nullable=True)

    users = relationship("User", secondary=user_group_access, back_populates="groups")
    documents = relationship("Document", back_populates="group")


class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(Text, nullable=False)
    surname = Column(Text, nullable=False)
    email = Column(Text, nullable=False)

    phone = Column(String, nullable=True)
    registered_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=True)
    last_login = Column(DateTime(timezone=True), nullable=True)
    is_active = Column(Boolean, default=True, nullable=True)
    phone = Column(String, nullable=True)
    hashed_password = Column(String, nullable=False)
    
    groups = relationship("Group", secondary=user_group_access, back_populates="users")


class Files(Base):
    __tablename__ = "files"
    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String, nullable=False)
    data = Column(LargeBinary, nullable=False)

    content_type = Column(String, nullable=True)
    uploaded_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=True)
    description = Column(Text, nullable=True)
    is_public = Column(Boolean, default=False, nullable=True)


class Document(Base):
    __tablename__ = "documents"
    id = Column(Integer, primary_key=True, index=True)
    text = Column(Text, nullable=False)
    embedding = Column(Vector(1024))
    page = Column(Integer, nullable=True)
    filename_id = Column(Integer, ForeignKey("files.id"), nullable=False)
    added = Column(DateTime(timezone=True), server_default=func.now())
    group_id = Column(Integer, ForeignKey("groups.id"), nullable=False)

    author = Column(String, nullable=True)
    summary = Column(Text, nullable=True)
    tags = Column(Text, nullable=True) 
    reviewed = Column(Boolean, default=False, nullable=True)

    group = relationship("Group", back_populates="documents")
    file = relationship("Files")
    

Base.metadata.create_all(bind=engine)


