import os
from datetime import timedelta
from sqlalchemy.pool import NullPool

BASE_DIR = os.path.abspath(os.path.dirname(os.path.dirname(__file__)))


def _get_database_url():
    """Get and fix DATABASE_URL for the current environment."""
    db_url = os.environ.get("DATABASE_URL", "")
    is_vercel = "VERCEL" in os.environ

    if not db_url:
        if is_vercel:
            return "postgresql://missing_url_check_vercel_env_vars"
        return f"sqlite:///{os.path.join(BASE_DIR, 'matebook.db')}"

    # For Vercel serverless: use Supabase connection pooler (port 6543)
    # Direct connections (port 5432) are unreliable in serverless environments
    if is_vercel and ":5432/" in db_url:
        db_url = db_url.replace(":5432/", ":6543/")

    # Ensure sslmode is set for cloud PostgreSQL
    if "postgresql" in db_url and "sslmode" not in db_url:
        separator = "&" if "?" in db_url else "?"
        db_url = f"{db_url}{separator}sslmode=require"

    return db_url


class Config:
    SECRET_KEY = os.environ.get("SECRET_KEY", "super-secret-dev-key-change-in-prod")
    IS_VERCEL = "VERCEL" in os.environ

    # Database — Supabase PostgreSQL or local SQLite fallback
    SQLALCHEMY_DATABASE_URI = _get_database_url()

    SQLALCHEMY_TRACK_MODIFICATIONS = False

    # On Vercel serverless, use NullPool (no persistent connection pool)
    # Each invocation creates and disposes connections as needed
    if IS_VERCEL:
        SQLALCHEMY_ENGINE_OPTIONS = {
            "pool_pre_ping": True,
            "poolclass": NullPool,
        }
    else:
        SQLALCHEMY_ENGINE_OPTIONS = {
            "pool_pre_ping": True,
            "pool_recycle": 280,
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
