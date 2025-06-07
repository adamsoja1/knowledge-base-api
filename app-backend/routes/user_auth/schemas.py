from pydantic import BaseModel, EmailStr, Field
from typing import Optional


class AuthRequest(BaseModel):
    username: str
    password: str

class AuthResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"

class RegisterRequest(BaseModel):
    name: str
    surname: str
    email: str
    phone: Optional[str] = None
    password: str = Field(min_length=8)

class RegisterResponse(BaseModel):
    id: int
    email: str
    name: str
    surname: str