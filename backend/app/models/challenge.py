from datetime import datetime, timezone
from app.extensions import db


class Challenge(db.Model):
    __tablename__ = "challenges"

    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text, nullable=False)
    challenge_type = db.Column(db.String(50), default="photo")  # photo, gratitude, creative, fitness
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    expires_at = db.Column(db.DateTime, nullable=True)

    entries = db.relationship("ChallengeEntry", backref="challenge", lazy="dynamic", cascade="all, delete-orphan")

    def to_dict(self):
        return {
            "id": self.id,
            "title": self.title,
            "description": self.description,
            "challenge_type": self.challenge_type,
            "is_active": self.is_active,
            "entries_count": self.entries.count(),
            "created_at": self.created_at.isoformat(),
            "expires_at": self.expires_at.isoformat() if self.expires_at else None,
        }


class ChallengeEntry(db.Model):
    __tablename__ = "challenge_entries"

    id = db.Column(db.Integer, primary_key=True)
    challenge_id = db.Column(db.Integer, db.ForeignKey("challenges.id"), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    content = db.Column(db.Text, default="")
    media_url = db.Column(db.String(255), default="")
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    user = db.relationship("User", backref="challenge_entries")

    def to_dict(self):
        return {
            "id": self.id,
            "challenge_id": self.challenge_id,
            "user": self.user.to_dict() if self.user else None,
            "content": self.content,
            "media_url": self.media_url,
            "created_at": self.created_at.isoformat(),
        }
