from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from ..ml.sentiment_model import analyzer

router = APIRouter(prefix="/api/sentiment", tags=["Sentiment Analysis"])

class SentimentRequest(BaseModel):
    text: str

class SentimentResponse(BaseModel):
    sentiment: str
    confidence: float
    emotion: str
    keywords: list[str]

@router.post("/analyze", response_model=SentimentResponse)
def analyze_text(request: SentimentRequest):
    if not request.text or not request.text.strip():
        raise HTTPException(status_code=400, detail="Text cannot be empty")
    
    try:
        result = analyzer.analyze(request.text)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
