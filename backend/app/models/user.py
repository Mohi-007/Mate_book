from datetime import datetime, timezone
from app.extensions import db


class User(db.Model):
    __tablename__ = "users"

    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False, index=True)
    email = db.Column(db.String(120), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(255), nullable=False)
    bio = db.Column(db.Text, default="")
    profile_pic = db.Column(db.String(255), default="")
    cover_photo = db.Column(db.String(255), default="")
    mood = db.Column(db.String(50), default="")
    mood_updated_at = db.Column(db.DateTime, nullable=True)
    theme_color = db.Column(db.String(7), default="#FFD500")
    productivity_score = db.Column(db.Integer, default=0)
    is_admin = db.Column(db.Boolean, default=False)
    is_verified = db.Column(db.Boolean, default=False)
    is_online = db.Column(db.Boolean, default=False)
    last_seen = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    # Relationships
    posts = db.relationship("Post", backref="author", lazy="dynamic")
    stories = db.relationship("Story", backref="author", lazy="dynamic")
    mood_history = db.relationship("MoodHistory", backref="user", lazy="dynamic")

    def to_dict(self, include_email=False):
        data = {
            "id": self.id,
            "username": self.username,
            "bio": self.bio,
            "profile_pic": self.profile_pic,
            "cover_photo": self.cover_photo,
            "mood": self.mood,
            "mood_updated_at": self.mood_updated_at.isoformat() if self.mood_updated_at else None,
            "theme_color": self.theme_color,
            "productivity_score": self.productivity_score,
            "is_online": self.is_online,
            "last_seen": self.last_seen.isoformat() if self.last_seen else None,
            "created_at": self.created_at.isoformat(),
        }
        if include_email:
            data["email"] = self.email
            data["is_verified"] = self.is_verified
            data["is_admin"] = self.is_admin
        return data
