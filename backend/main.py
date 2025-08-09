from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import uvicorn
from database.base import engine, Base
from api import auth_v2 as auth, auth_twitter, fixtures, predictions, admin, users, leaderboard, seasons, mini_leagues, user_account
import os
from dotenv import load_dotenv

load_dotenv()

@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    yield

app = FastAPI(
    title="Coventry City Tweet League API",
    version="1.0.0",
    lifespan=lifespan
)

# Configure CORS
allowed_origins = [
    "http://localhost:3000",
    "https://tweetleague-frontend.onrender.com",
]

# Add FRONTEND_URL from environment if it exists
if os.getenv("FRONTEND_URL"):
    allowed_origins.append(os.getenv("FRONTEND_URL"))

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(auth_twitter.router, prefix="/api/auth/twitter", tags=["auth-twitter"])
app.include_router(fixtures.router, prefix="/api/fixtures", tags=["fixtures"])
app.include_router(predictions.router, prefix="/api/predictions", tags=["predictions"])
app.include_router(users.router, prefix="/api/users", tags=["users"])
app.include_router(leaderboard.router, prefix="/api/leaderboard", tags=["leaderboard"])
app.include_router(admin.router, prefix="/api/admin", tags=["admin"])
app.include_router(seasons.router, prefix="/api/seasons", tags=["seasons"])
app.include_router(mini_leagues.router, prefix="/api/mini-leagues", tags=["mini-leagues"])
app.include_router(user_account.router, prefix="/api/account", tags=["account"])

@app.get("/")
def read_root():
    return {"message": "Coventry City Tweet League API", "version": "1.0.0"}

@app.get("/health")
def health_check():
    return {"status": "healthy"}

@app.get("/api/health")
def api_health_check():
    return {"status": "healthy", "service": "Tweet League API", "version": "1.0.0"}

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)