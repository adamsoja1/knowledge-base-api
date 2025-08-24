from pydantic import BaseModel, EmailStr, Field
from typing import Optional


class BaseModelRequest(BaseModel):
    prompt: str

