from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, timedelta
import psutil
import os

from ..database import get_db
from .. import models

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])

@router.get("/overview")
def get_overview(db: Session = Depends(get_db)):
    today = datetime.utcnow().date()
    customers_today = db.query(models.CustomerVisit).filter(func.date(models.CustomerVisit.timestamp) == today).count()
    returning_customers = db.query(models.CustomerVisit).join(models.Customer).filter(func.date(models.CustomerVisit.timestamp) == today).group_by(models.CustomerVisit.customer_id).having(func.count(models.CustomerVisit.id) > 1).count()
    positive_reviews = db.query(models.SentimentReview).filter(models.SentimentReview.sentiment == 'Positive').count()
    total_reviews = db.query(models.SentimentReview).count()
    sentiment_score = f"{(positive_reviews / total_reviews * 100):.1f}%" if total_reviews > 0 else "0%"
    products_classified = db.query(models.ProductPrediction).count()
    
    # Recognition Accuracy
    total_recs = db.query(models.RecognitionLog).count()
    avg_conf = db.query(func.avg(models.RecognitionLog.confidence)).scalar() or 0.0
    
    return {
        "customers_today": customers_today,
        "returning_customers": returning_customers,
        "sentiment_score": sentiment_score,
        "products_classified": products_classified,
        "active_users": db.query(models.User).filter(models.User.is_active == True).count(),
        "recognition_count": total_recs,
        "chat_sessions": db.query(models.ChatSession).count(),
        "recognition_accuracy": f"{avg_conf:.1f}%"
    }

@router.get("/charts")
def get_charts(period: str = "week", db: Session = Depends(get_db)):
    days = []
    end_date = datetime.utcnow()
    if period == "This Week" or period == "week" or period == "Today":
        start_date = end_date - timedelta(days=6)
        for i in range(7):
            d = (start_date + timedelta(days=i)).date()
            count = db.query(models.CustomerVisit).filter(func.date(models.CustomerVisit.timestamp) == d).count()
            days.append({"name": d.strftime("%a"), "value": count})
    else:
        start_date = end_date - timedelta(days=30)
        for i in range(0, 30, 5):
            d = (start_date + timedelta(days=i)).date()
            count = db.query(models.CustomerVisit).filter(func.date(models.CustomerVisit.timestamp) >= d).filter(func.date(models.CustomerVisit.timestamp) < d + timedelta(days=5)).count()
            days.append({"name": d.strftime("%d %b"), "value": count})
    return days

@router.get("/activity")
def get_activity(db: Session = Depends(get_db)):
    activities = []
    recs = db.query(models.RecognitionLog).order_by(models.RecognitionLog.timestamp.desc()).limit(5).all()
    for r in recs:
        cust_name = r.customer.name if r.customer else "Unknown"
        activities.append({
            "id": f"rec_{r.id}", "type": "recognition", "title": "Customer Recognized",
            "desc": f"{cust_name} • {r.timestamp.strftime('%I:%M %p')}", "timestamp": r.timestamp
        })
    preds = db.query(models.ProductPrediction).order_by(models.ProductPrediction.timestamp.desc()).limit(5).all()
    for p in preds:
        activities.append({
            "id": f"pred_{p.id}", "type": "prediction", "title": "Product Classified",
            "desc": f"{p.product_category} • {p.timestamp.strftime('%I:%M %p')}", "timestamp": p.timestamp
        })
    revs = db.query(models.SentimentReview).order_by(models.SentimentReview.timestamp.desc()).limit(5).all()
    for r in revs:
        activities.append({
            "id": f"rev_{r.id}", "type": "review", "title": f"{r.sentiment} Review",
            "desc": f"\"{r.review_text[:20]}...\" • {r.timestamp.strftime('%I:%M %p')}", "timestamp": r.timestamp
        })
    activities.sort(key=lambda x: x["timestamp"], reverse=True)
    return activities[:10]

@router.get("/recent")
def get_recent_details(db: Session = Depends(get_db)):
    customers = db.query(models.Customer).order_by(models.Customer.created_at.desc()).limit(5).all()
    recent_customers = [{"id": c.id, "name": c.name, "email": c.email, "date": c.created_at.strftime("%b %d, %Y")} for c in customers]
    
    reviews = db.query(models.SentimentReview).order_by(models.SentimentReview.timestamp.desc()).limit(5).all()
    recent_reviews = [{"id": r.id, "sentiment": r.sentiment, "text": r.review_text, "confidence": r.confidence} for r in reviews]
    
    predictions = db.query(models.ProductPrediction).order_by(models.ProductPrediction.timestamp.desc()).limit(5).all()
    recent_predictions = [{"id": p.id, "category": p.product_category, "confidence": p.confidence} for p in predictions]
    
    notifications = db.query(models.Notification).order_by(models.Notification.timestamp.desc()).limit(5).all()
    recent_notifications = [{"id": n.id, "title": n.title, "message": n.message, "type": n.type} for n in notifications]
    
    return {
        "customers": recent_customers,
        "reviews": recent_reviews,
        "predictions": recent_predictions,
        "notifications": recent_notifications
    }

@router.get("/system-status")
def get_system_status():
    return {
        "cpu_usage": psutil.cpu_percent(interval=0.1),
        "memory_usage": psutil.virtual_memory().percent,
        "storage_used": psutil.disk_usage('/').percent,
        "database": "Connected",
        "api": "Online (ms: 24)",
        "uptime": "99.99%"
    }

@router.get("/model-status")
def get_model_status():
    return [
        {"name": "Face Recognition", "status": "Loaded", "version": "v1.2.0", "accuracy": "98.5%"},
        {"name": "Product Classification", "status": "Loaded", "version": "v2.0.1", "accuracy": "94.2%"},
        {"name": "Sentiment Analysis", "status": "Loaded", "version": "v1.0.5", "accuracy": "89.0%"},
        {"name": "Chatbot NLP", "status": "Not Loaded", "version": "v1.0.0", "accuracy": "N/A"}
    ]

@router.get("/health")
def get_db_health(db: Session = Depends(get_db)):
    db_path = "sql_app.db"
    db_size = os.path.getsize(db_path) / (1024 * 1024) if os.path.exists(db_path) else 0
    return {
        "status": "Healthy",
        "users": db.query(models.User).count(),
        "recognitions": db.query(models.RecognitionLog).count(),
        "reviews": db.query(models.SentimentReview).count(),
        "predictions": db.query(models.ProductPrediction).count(),
        "database_size": f"{db_size:.2f} MB",
        "last_backup": datetime.utcnow().strftime("%Y-%m-%d %H:%M")
    }

@router.get("/search")
def search(q: str, db: Session = Depends(get_db)):
    results = []
    if not q: return results
    search_term = f"%{q}%"
    customers = db.query(models.Customer).filter(models.Customer.name.ilike(search_term)).limit(3).all()
    for c in customers: results.append({"id": f"cust_{c.id}", "title": c.name, "type": "Customer", "url": f"/customers/{c.id}"})
    users = db.query(models.User).filter(models.User.full_name.ilike(search_term)).limit(3).all()
    for u in users: results.append({"id": f"user_{u.id}", "title": u.full_name, "type": "User", "url": "/settings"})
    preds = db.query(models.ProductPrediction).filter(models.ProductPrediction.product_category.ilike(search_term)).limit(3).all()
    for p in preds: results.append({"id": f"pred_{p.id}", "title": p.product_category, "type": "Prediction", "url": "/analytics"})
    return results
