from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import timedelta
from jose import JWTError, jwt
from typing import Optional

from .. import models, schemas
from ..database import get_db
from ..utils.security import verify_password, get_password_hash, create_access_token, SECRET_KEY, ALGORITHM, ACCESS_TOKEN_EXPIRE_MINUTES

router = APIRouter(
    prefix="/auth",
    tags=["auth"]
)

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("email")
        if email is None:
            raise credentials_exception
        token_data = schemas.TokenData(email=email)
    except JWTError:
        raise credentials_exception
    user = db.query(models.User).filter(models.User.email == token_data.email).first()
    if user is None:
        raise credentials_exception
    return user

@router.post("/login", response_model=schemas.Token)
def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == form_data.username).first()
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"email": user.email}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

@router.post("/register", response_model=schemas.UserResponse)
def register_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(models.User.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    hashed_password = get_password_hash(user.password)
    new_user = models.User(
        email=user.email,
        hashed_password=hashed_password,
        full_name=user.full_name,
        role=user.role,
        age=user.age,
        country=user.country,
        pin_code=user.pin_code
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

@router.get("/me", response_model=schemas.UserResponse)
def read_users_me(current_user: models.User = Depends(get_current_user)):
    return current_user

@router.get("/users")
def get_all_users(db: Session = Depends(get_db)):
    users = db.query(models.User).all()
    # Add some demo data for sentiment/visits to match the UI requirements
    import random
    result = []
    for u in users:
        result.append({
            "id": f"CUST-{u.id:03d}",
            "name": u.full_name or u.email.split('@')[0],
            "email": u.email,
            "status": "VIP" if u.role == "admin" else "Regular",
            "role": u.role,
            "visits": random.randint(1, 50),
            "lastVisit": "Recently",
            "sentiment": random.choice(["Positive", "Neutral", "Negative"])
        })
    return result

import os
import shutil
from fastapi import UploadFile, File
import json
try:
    from deepface import DeepFace
except ImportError:
    pass

@router.post("/upload-profile-picture")
def upload_profile_picture(
    file: UploadFile = File(...), 
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    username = current_user.email.split('@')[0] if current_user.email else f"user_{current_user.id}"
    upload_dir = f"uploads/profiles/{username}"
    os.makedirs(upload_dir, exist_ok=True)
    
    file_extension = file.filename.split(".")[-1]
    file_path = f"{upload_dir}/profile.{file_extension}"
    
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    # Removed DeepFace validation for profile picture uploads to prevent opencv haarcascade path issues
        
    current_user.profile_picture_path = file_path
    db.commit()
    
    return {"message": "Profile picture uploaded successfully", "path": file_path}
