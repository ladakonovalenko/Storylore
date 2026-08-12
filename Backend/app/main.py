import os
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from .database import engine, Base
from . import models
from .routers import router as api_router
from app.migrations import run_lightweight_migrations


Base.metadata.create_all(bind=engine)
run_lightweight_migrations()

app = FastAPI()

# ВИПРАВЛЕНО: allow_origins=["*"] разом з allow_credentials=True — заборонена
# CORS-специфікацією комбінація (браузери не приймають "будь-яке джерело" разом
# з передачею токенів авторизації). Через це раніше сервер узагалі НЕ додавав
# заголовок Access-Control-Allow-Origin — і запити з нового домену блокувались.
# Тепер — явний список конкретних дозволених адрес.
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://storylore-nine.vercel.app",  # старий Vercel-піддомен (лишаємо про всяк випадок)
        "https://storyloreapp.com",           # новий власний домен
        "https://www.storyloreapp.com",       # www-версія нового домену
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router)

app.mount("/static", StaticFiles(directory="static"), name="static")

@app.get("/{full_path:path}")
async def serve_frontend(full_path: str):
    file_path = os.path.join("static", full_path)
    if os.path.exists(file_path) and os.path.isfile(file_path):
        return FileResponse(file_path)
    return FileResponse("static/index.html")