import os
import sys
from dotenv import load_dotenv

# Ensure the backend directory is in the path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app import create_app
from app.extensions import db, bcrypt
from app.models import User, Challenge

def init_db():
    app = create_app()
    with app.app_context():
        print("Creating all tables...")
        db.create_all()

        # Create default admin user if none exists
        if not User.query.filter_by(is_admin=True).first():
            print("Creating default admin user...")
            admin_user = User(
                username="admin",
                email="admin@matebook.com",
                password_hash=bcrypt.generate_password_hash("admin123").decode("utf-8"),
                is_admin=True,
                is_verified=True,
                bio="Platform Administrator",
            )
            db.session.add(admin_user)
            db.session.commit()
            print("Admin user created.")
        else:
            print("Admin user already exists.")

        # Seed default challenges
        defaults = [
            ("\U0001f4f8 Photo Challenge", "Share a photo that represents your day!", "photo"),
            ("\U0001f64f Gratitude Post", "Share 3 things you're grateful for today.", "gratitude"),
            ("\U0001f3a8 Creative Challenge", "Draw, design, or create something unique today!", "creative"),
            ("\U0001f4aa Fitness Check-in", "Share your workout or healthy meal today!", "fitness"),
        ]
        print("Checking default challenges...")
        for title, desc, ctype in defaults:
            if not Challenge.query.filter_by(title=title).first():
                db.session.add(Challenge(title=title, description=desc, challenge_type=ctype))
        db.session.commit()
        print("Database initialization complete.")

if __name__ == "__main__":
    load_dotenv()
    init_db()
