from sqlalchemy.orm import Session
from datetime import datetime, timedelta
import random

from . import models
from .utils.security import get_password_hash

def seed_database(db: Session):
    # Check if admin already exists
    admin_user = db.query(models.User).filter(models.User.email == "pratyakshasingh0703@gmail.com").first()
    if not admin_user:
        print("Seeding Admin User...")
        hashed_password = get_password_hash("admin")
        admin = models.User(
            email="pratyakshasingh0703@gmail.com",
            hashed_password=hashed_password,
            full_name="Pratyaksha Singh",
            role="Administrator",
            theme_preference="dark"
        )
        db.add(admin)
        db.commit()
        db.refresh(admin)

    # Check if we need to seed the rest
    existing_customers = db.query(models.Customer).count()
    if existing_customers > 0:
        print("Sample data already seeded. Skipping.")
        return

    print("Seeding robust sample data...")
    now = datetime.utcnow()

    # 1. Customers
    customer_names = ["John Doe", "Jane Smith", "Michael Johnson", "Sarah Williams", "David Brown"]
    customers = []
    for name in customer_names:
        c = models.Customer(
            name=name,
            email=f"{name.lower().replace(' ', '.')}@example.com",
            phone=f"555-010{random.randint(0, 9)}",
            created_at=now - timedelta(days=random.randint(10, 30))
        )
        db.add(c)
        customers.append(c)
    db.commit()
    for c in customers:
        db.refresh(c)

    # 2. Customer Visits (Generate realistic time series)
    for i in range(30):
        # random date in last 7 days
        visit_date = now - timedelta(days=random.randint(0, 7), hours=random.randint(0, 23))
        v = models.CustomerVisit(
            customer_id=random.choice(customers).id,
            timestamp=visit_date
        )
        db.add(v)

    # 3. Recognition Logs
    for i in range(15):
        rec_date = now - timedelta(hours=random.randint(1, 48))
        r = models.RecognitionLog(
            customer_id=random.choice(customers).id,
            camera_id=f"CAM_0{random.randint(1, 4)}",
            confidence=random.uniform(85.0, 99.5),
            timestamp=rec_date
        )
        db.add(r)

    # 4. Product Predictions
    categories = ["Electronics", "Apparel", "Groceries", "Home & Garden", "Toys"]
    for i in range(20):
        pred_date = now - timedelta(hours=random.randint(1, 48))
        p = models.ProductPrediction(
            product_category=random.choice(categories),
            confidence=random.uniform(80.0, 99.0),
            inference_time_ms=random.uniform(40.0, 150.0),
            timestamp=pred_date
        )
        db.add(p)

    # 5. Sentiment Reviews
    sentiments = [
        ("Positive", "Great store layout and friendly staff!"),
        ("Positive", "Found exactly what I was looking for."),
        ("Neutral", "Standard experience, nothing special."),
        ("Negative", "Checkout line was way too long.")
    ]
    for i in range(10):
        rev_date = now - timedelta(days=random.randint(0, 14))
        s, text = random.choice(sentiments)
        rev = models.SentimentReview(
            customer_id=random.choice(customers).id,
            review_text=text,
            sentiment=s,
            confidence=random.uniform(70.0, 95.0),
            source="In-Store Kiosk",
            timestamp=rev_date
        )
        db.add(rev)

    # 6. Chat Sessions
    for i in range(5):
        c = models.ChatSession(
            session_id=f"session_{i}",
            role="user",
            content="Where can I find the electronics section?",
            timestamp=now - timedelta(minutes=random.randint(10, 100))
        )
        db.add(c)
        bot = models.ChatSession(
            session_id=f"session_{i}",
            role="bot",
            content="The electronics section is located in Aisle 4, to your left.",
            timestamp=now - timedelta(minutes=random.randint(10, 100)) + timedelta(seconds=2)
        )
        db.add(bot)

    # 7. Notifications
    notifs = [
        ("System Update", "AI Models successfully updated to v2.1", "info"),
        ("High Traffic", "Unusual customer volume detected at Entrance A", "warning"),
        ("VIP Recognized", "VIP Customer John Doe has entered the store", "success")
    ]
    for n in notifs:
        notif = models.Notification(
            title=n[0],
            message=n[1],
            type=n[2],
            timestamp=now - timedelta(hours=random.randint(1, 24))
        )
        db.add(notif)

    # 8. System Logs
    logs = [
        ("INFO", "system", "Server started successfully"),
        ("INFO", "database", "Database backup completed"),
        ("WARNING", "vision", "Camera CAM_03 frame drop detected")
    ]
    for l in logs:
        log = models.SystemLog(
            level=l[0],
            module=l[1],
            message=l[2],
            timestamp=now - timedelta(hours=random.randint(1, 48))
        )
        db.add(log)

    db.commit()
    print("Database seeding completed.")
