from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import List, Optional
import os
from .auth import get_current_user

try:
    import google.generativeai as genai
    GENAI_AVAILABLE = True
except ImportError:
    GENAI_AVAILABLE = False

try:
    from groq import Groq
    GROQ_AVAILABLE = True
except ImportError:
    GROQ_AVAILABLE = False

from dotenv import load_dotenv
# Explicitly load .env file so the API key is always picked up
load_dotenv()

router = APIRouter(
    prefix="/chat",
    tags=["chat"]
)

class ChatMessage(BaseModel):
    role: str
    text: str

class ChatRequest(BaseModel):
    message: str
    history: List[ChatMessage] = []

SYSTEM_PROMPT = "You are a Smart Retail AI Assistant for a retail analytics platform. You help store managers understand their data, sentiment analysis, foot traffic, and biometrics. Be concise, professional, and helpful. Format your responses in plain text or simple markdown. If the user asks something completely unrelated to retail, politely guide them back to retail analytics."

@router.post("/message")
async def send_message(request: ChatRequest, current_user: dict = Depends(get_current_user)):
    api_key = os.getenv("GEMINI_API_KEY")
    groq_api_key = os.getenv("GROQ_API_KEY")
    
    if not api_key and not groq_api_key:
        raise HTTPException(
            status_code=500, 
            detail="Neither GEMINI_API_KEY nor GROQ_API_KEY is configured in the backend environment."
        )
        
    try:
        if not api_key or not GENAI_AVAILABLE:
            raise Exception("Gemini not available or API key missing, forcing fallback.")
            
        genai.configure(api_key=api_key)
        
        generation_config = {
            "temperature": 0.7,
            "top_p": 0.9,
            "top_k": 50,
            "max_output_tokens": 1024,
        }
        
        model = genai.GenerativeModel(
            model_name="gemini-flash-latest",
            generation_config=generation_config,
            system_instruction=SYSTEM_PROMPT
        )
        
        formatted_history = []
        for msg in request.history:
            formatted_history.append({
                "role": "model" if msg.role == "bot" else "user",
                "parts": [msg.text]
            })
            
        chat_session = model.start_chat(history=formatted_history)
        response = chat_session.send_message(request.message)
        
        return {"response": response.text}
        
    except Exception as e:
        print(f"Gemini API Error: {str(e)}. Attempting Groq fallback...")
        
        if not groq_api_key or not GROQ_AVAILABLE:
            raise HTTPException(
                status_code=500, 
                detail=f"Failed to generate response and Groq fallback is not available. Original error: {str(e)}"
            )
            
        try:
            client = Groq(api_key=groq_api_key)
            
            messages = [{"role": "system", "content": SYSTEM_PROMPT}]
            for msg in request.history:
                messages.append({
                    "role": "assistant" if msg.role == "bot" else "user",
                    "content": msg.text
                })
            messages.append({"role": "user", "content": request.message})
            
            chat_completion = client.chat.completions.create(
                messages=messages,
                model="llama3-8b-8192",
                temperature=0.7,
                max_tokens=1024,
            )
            
            return {"response": chat_completion.choices[0].message.content}
            
        except Exception as groq_e:
            print(f"Groq API Error: {str(groq_e)}")
            raise HTTPException(
                status_code=500, 
                detail=f"Both primary AI and fallback failed. Fallback error: {str(groq_e)}"
            )
