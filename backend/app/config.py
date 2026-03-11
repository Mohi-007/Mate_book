import os
from datetime import timedelta

BASE_DIR = os.path.abspath(os.path.dirname(os.path.dirname(__file__)))


class Config:
    SECRET_KEY = os.environ.get("SECRET_KEY", "super-secret-dev-key-change-in-prod")
    IS_VERCEL = "VERCEL" in os.environ

    # Database — Supabase PostgreSQL or local SQLite fallback
    # On Vercel, we MUST have a DATABASE_URL
    SQLALCHEMY_DATABASE_URI = os.environ.get("DATABASE_URL")
    if not SQLALCHEMY_DATABASE_URI:
        if IS_VERCEL:
             # This will still likely fail if used, but at least it won't crash on startup trying to write to disk
            SQLALCHEMY_DATABASE_URI = "postgresql://missing_url_check_vercel_env_vars"
        else:
            SQLALCHEMY_DATABASE_URI = f"sqlite:///{os.path.join(BASE_DIR, 'matebook.db')}"

    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SQLALCHEMY_ENGINE_OPTIONS = {
        "pool_pre_ping": True,
        "pool_recycle": 300,
    }

    JWT_SECRET_KEY = os.environ.get("JWT_SECRET_KEY", "super-secret-jwt-dev-key-change-in-prod-minimum-32")
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(days=7)
    JWT_TOKEN_LOCATION = ["headers"]

    # On Vercel, the filesystem is read-only except for /tmp
    if IS_VERCEL:
        UPLOAD_FOLDER = "/tmp/uploads"
    else:
        UPLOAD_FOLDER = os.path.join(BASE_DIR, "uploads")
        
    MAX_CONTENT_LENGTH = 16 * 1024 * 1024  # 16MB

    # News API - live key
    NEWS_API_KEY = os.environ.get("NEWS_API_KEY", "f2eb35f7ce974d6ca16cab3e75bbd124")
    NEWS_API_URL = "https://newsapi.org/v2"
    NEWS_API_COUNTRY = "us"

    # Supabase
    SUPABASE_URL = os.environ.get("SUPABASE_URL", "https://vhhkpzrlhmoclieuhwma.supabase.co")
    SUPABASE_KEY = os.environ.get("SUPABASE_KEY", "sb_publishable_gWOFPg_8w9PGK3HMcI0pDA_oNawl-Qv")

    CORS_ORIGINS = "*"
