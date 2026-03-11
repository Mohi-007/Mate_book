from datetime import datetime, timezone
from app.extensions import db


class MoodHistory(db.Model):
    __tablename__ = "mood_history"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    mood = db.Column(db.String(50), nullable=False)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    def to_dict(self):
        return {
            "id": self.id,
            "mood": self.mood,
            "created_at": self.created_at.isoformat(),
        }
