import os
from dotenv import load_dotenv
from sqlalchemy import create_engine, text

load_dotenv()
db_url = os.environ.get("DATABASE_URL")

try:
    engine = create_engine(db_url)
    with engine.connect() as conn:
        result = conn.execute(text("SELECT id, username, email FROM users"))
        rows = result.fetchall()
        print(f"Total Users: {len(rows)}")
        for r in rows:
            print(r)
except Exception as e:
    print(f"Error connecting to Supabase: {e}")
