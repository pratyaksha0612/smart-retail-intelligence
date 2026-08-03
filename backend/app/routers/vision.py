from fastapi import APIRouter, Depends, UploadFile, File
from sqlalchemy.orm import Session
from deepface import DeepFace
import os
import shutil

from .. import models
from ..database import get_db

router = APIRouter(
    prefix="/vision",
    tags=["vision"]
)

@router.post("/recognize")
def recognize_face(file: UploadFile = File(...), db: Session = Depends(get_db)):
    # Save the incoming frame temporarily
    temp_dir = "uploads/temp"
    os.makedirs(temp_dir, exist_ok=True)
    temp_path = f"{temp_dir}/frame.jpg"
    
    with open(temp_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    # We need to compare this face against all users who have a profile picture
    users = db.query(models.User).filter(models.User.profile_picture_path.isnot(None)).all()
    
    best_match = None
    highest_confidence = 0
    
    # Simple loop - in production, you'd extract embeddings once and use a vector DB
    for user in users:
        if not os.path.exists(user.profile_picture_path):
            continue
            
        try:
            # DeepFace.verify returns distance and a boolean for match based on threshold
            result = DeepFace.verify(
                img1_path=temp_path, 
                img2_path=user.profile_picture_path,
                model_name="VGG-Face",
                enforce_detection=False
            )
            
            if result["verified"]:
                # Lower distance means higher confidence. 
                # Convert distance to a rough confidence percentage
                confidence = max(0, min(100, (1 - result["distance"]) * 100))
                
                if confidence > highest_confidence:
                    highest_confidence = confidence
                    best_match = user
        except Exception as e:
            # DeepFace might throw if no face is found
            pass
            
    if best_match:
        name_display = best_match.full_name or best_match.email
        if best_match.role == "admin":
            name_display = f"{name_display} (Admin)"
            
        return {
            "match": True,
            "user_id": best_match.id,
            "name": name_display,
            "confidence": highest_confidence
        }
        
    return {"match": False, "message": "No recognized face"}
