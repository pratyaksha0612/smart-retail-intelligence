from pydantic import BaseModel, EmailStr
from typing import List, Optional
from datetime import datetime

# --- User (Auth) ---
class UserBase(BaseModel):
    email: EmailStr
    full_name: Optional[str] = None
    role: Optional[str] = "user"
    age: Optional[int] = None
    country: Optional[str] = None
    pin_code: Optional[str] = None

class UserCreate(UserBase):
    password: str

class UserResponse(UserBase):
    id: int
    is_active: bool
    profile_picture_path: Optional[str] = None
    theme_preference: Optional[str] = None
    joined_date: Optional[datetime] = None
    last_login: Optional[datetime] = None
    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None

# --- Customer ---
class CustomerBase(BaseModel):
    name: str

class CustomerCreate(CustomerBase):
    pass

class CustomerResponse(CustomerBase):
    id: int
    created_at: datetime
    
    class Config:
        from_attributes = True

# --- Visit ---
class VisitBase(BaseModel):
    customer_id: int

class VisitCreate(VisitBase):
    pass

class VisitResponse(VisitBase):
    id: int
    timestamp: datetime
    
    class Config:
        from_attributes = True

# --- ML Logs ---
class PredictionLogBase(BaseModel):
    product_category: str
    confidence: float
    inference_time_ms: float

class PredictionLogCreate(PredictionLogBase):
    pass

class PredictionLogResponse(PredictionLogBase):
    id: int
    timestamp: datetime
    
    class Config:
        from_attributes = True

class SentimentLogBase(BaseModel):
    review_text: str
    sentiment: str
    confidence: float
    customer_id: Optional[int] = None

class SentimentLogCreate(SentimentLogBase):
    pass

class SentimentLogResponse(SentimentLogBase):
    id: int
    timestamp: datetime
    
    class Config:
        from_attributes = True

# --- Chat ---
class ChatMessage(BaseModel):
    role: str
    content: str

class ChatResponse(ChatMessage):
    id: int
    timestamp: datetime
    
    class Config:
        from_attributes = True
