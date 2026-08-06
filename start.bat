@echo off
echo Starting Smart Retail Backend and Frontend...

cd backend
start cmd /k ".\venv\Scripts\activate && uvicorn app.main:app --host 127.0.0.1 --port 8000"

cd ..\frontend
start cmd /k "npm run dev"

echo Both services started in separate windows!
