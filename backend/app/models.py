from sqlalchemy import Boolean, Column, ForeignKey, Integer, String, Float, DateTime, Text, JSON
from sqlalchemy.orm import relationship
from datetime import datetime
from .database import Base

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    is_active = Column(Boolean, default=True)
    full_name = Column(String, nullable=True)
    role = Column(String, default="user") # 'admin' or 'user'
    profile_picture_path = Column(String, nullable=True)
    age = Column(Integer, nullable=True)
    country = Column(String, nullable=True)
    pin_code = Column(String, nullable=True)
    theme_preference = Column(String, default="dark")
    joined_date = Column(DateTime, default=datetime.utcnow)
    last_login = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class Customer(Base):
    __tablename__ = "customers"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    email = Column(String, nullable=True)
    phone = Column(String, nullable=True)
    face_encoding = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    visits = relationship("CustomerVisit", back_populates="customer")
    sentiment_reviews = relationship("SentimentReview", back_populates="customer")
    recognition_logs = relationship("RecognitionLog", back_populates="customer")

class CustomerVisit(Base):
    __tablename__ = "customer_visits"
    id = Column(Integer, primary_key=True, index=True)
    customer_id = Column(Integer, ForeignKey("customers.id"))
    timestamp = Column(DateTime, default=datetime.utcnow)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    customer = relationship("Customer", back_populates="visits")

class RecognitionLog(Base):
    __tablename__ = "recognition_logs"
    id = Column(Integer, primary_key=True, index=True)
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=True)
    camera_id = Column(String, nullable=True)
    confidence = Column(Float)
    timestamp = Column(DateTime, default=datetime.utcnow)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    customer = relationship("Customer", back_populates="recognition_logs")

class ProductPrediction(Base):
    __tablename__ = "product_predictions"
    id = Column(Integer, primary_key=True, index=True)
    product_category = Column(String, index=True)
    confidence = Column(Float)
    image_path = Column(String, nullable=True)
    inference_time_ms = Column(Float)
    timestamp = Column(DateTime, default=datetime.utcnow)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class SentimentReview(Base):
    __tablename__ = "sentiment_reviews"
    id = Column(Integer, primary_key=True, index=True)
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=True)
    review_text = Column(Text)
    sentiment = Column(String) # Positive, Negative, Neutral
    confidence = Column(Float)
    source = Column(String, nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    customer = relationship("Customer", back_populates="sentiment_reviews")

class ChatSession(Base):
    __tablename__ = "chat_sessions"
    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(String, index=True)
    role = Column(String) # 'user' or 'bot'
    content = Column(Text)
    timestamp = Column(DateTime, default=datetime.utcnow)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class Notification(Base):
    __tablename__ = "notifications"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String)
    message = Column(Text)
    type = Column(String) # info, success, warning, error
    is_read = Column(Boolean, default=False)
    timestamp = Column(DateTime, default=datetime.utcnow)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class SystemLog(Base):
    __tablename__ = "system_logs"
    id = Column(Integer, primary_key=True, index=True)
    level = Column(String) # INFO, ERROR, WARNING
    module = Column(String)
    message = Column(Text)
    timestamp = Column(DateTime, default=datetime.utcnow)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class Setting(Base):
    __tablename__ = "settings"
    id = Column(Integer, primary_key=True, index=True)
    key = Column(String, unique=True, index=True)
    value = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class AnalyticsCache(Base):
    __tablename__ = "analytics_cache"
    id = Column(Integer, primary_key=True, index=True)
    metric_name = Column(String, unique=True, index=True)
    metric_value = Column(String)
    calculated_at = Column(DateTime, default=datetime.utcnow)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class BiometricSample(Base):
    __tablename__ = "biometric_samples"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    image_path = Column(String)
    pose = Column(String) # Front, Left, Right, Up, Down, Near, Far, Smile, Neutral
    embedding = Column(Text) # JSON string of floats
    quality_score = Column(Float)
    embedding_version = Column(Integer, default=1)
    glasses = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    user = relationship("User", backref="biometric_samples")
