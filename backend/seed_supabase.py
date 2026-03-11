import os
from dotenv import load_dotenv
from app import create_app
from app.extensions import db, bcrypt
from app.models.user import User

# Load environment variables from .env (which contains the Supabase DATABASE_URL)
load_dotenv()

def seed():
    app = create_app()
    with app.app_context():
        # Create all tables on Supabase if they don't exist
        print("Creating tables on Supabase...")
        db.create_all()

        # Check if admin already exists
        admin = User.query.filter_by(username="admin").first()
        if not admin:
            print("Creating admin user...")
            admin = User(
                username="admin",
                email="admin@matebook.com",
                password_hash=bcrypt.generate_password_hash("admin123").decode("utf-8"),
                is_verified=True,
                is_admin=True
            )
            db.session.add(admin)
            db.session.commit()
            print("Admin user created successfully!")
        else:
            print("Admin user already exists.")

if __name__ == "__main__":
    seed()
