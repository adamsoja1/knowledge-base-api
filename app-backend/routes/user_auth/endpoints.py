from fastapi import APIRouter, HTTPException, status, Depends
from fastapi.security import OAuth2PasswordRequestForm
from .schemas import AuthRequest, AuthResponse
from .utils import verify_password, create_access_token
from database.db import get_db
from sqlalchemy.orm import Session
from . import schemas, utils
from database import models

router = APIRouter(prefix="/auth", tags=["auth"])

@router.post("/", response_model=AuthResponse)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.get(form_data.username)
    if not user or not verify_password(form_data.password, user["hashed_password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Nieprawidłowa nazwa użytkownika lub hasło",
            headers={"WWW-Authenticate": "Bearer"},
        )

    access_token = create_access_token(data={"sub": user["username"]})
    return {"access_token": access_token, "token_type": "bearer"}


@router.post("/register", response_model=schemas.RegisterResponse)
def register_user(payload: schemas.RegisterRequest, db: Session = Depends(get_db)):
    existing_user = db.query(models.User).filter(models.User.email == payload.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Użytkownik o podanym adresie e-mail już istnieje."
        )

    hashed_pwd = utils.hash_password(payload.password)
    new_user = models.User(
        name=payload.name,
        surname=payload.surname,
        email=payload.email,
        phone=payload.phone,
        hashed_password=hashed_pwd
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return schemas.RegisterResponse(
        id=new_user.id,
        email=new_user.email,
        name=new_user.name,
        surname=new_user.surname
    )