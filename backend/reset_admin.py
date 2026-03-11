import os
from dotenv import load_dotenv
from sqlalchemy import create_engine, text
from flask_bcrypt import Bcrypt
from flask import Flask

load_dotenv()
db_url = os.environ.get("DATABASE_URL")

# Need flask app context for bcrypt if not used standalone
app = Flask(__name__)
bcrypt = Bcrypt(app)

password = "admin123"
hashed_password = bcrypt.generate_password_hash(password).decode("utf-8")

try:
    engine = create_engine(db_url)
    with engine.connect() as conn:
        # Check if user exists
        res = conn.execute(text("SELECT id FROM users WHERE email = 'admin@matebook.com'"))
        user = res.fetchone()
        
        if user:
            conn.execute(
                text("UPDATE users SET password_hash = :hp WHERE email = 'admin@matebook.com'"),
                {"hp": hashed_password}
            )
            conn.commit()
            print("Successfully updated admin password to 'admin123'")
        else:
            print("Admin user not found in Supabase")
except Exception as e:
    print(f"Error: {e}")
