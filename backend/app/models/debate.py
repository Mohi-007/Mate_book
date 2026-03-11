from datetime import datetime, timezone
from app.extensions import db


class DebateRoom(db.Model):
    __tablename__ = "debate_rooms"

    id = db.Column(db.Integer, primary_key=True)
    topic = db.Column(db.String(300), nullable=False)
    description = db.Column(db.Text, default="")
    created_by = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    option_a = db.Column(db.String(200), nullable=False)
    option_b = db.Column(db.String(200), nullable=False)
    votes_a = db.Column(db.Integer, default=0)
    votes_b = db.Column(db.Integer, default=0)
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    expires_at = db.Column(db.DateTime, nullable=True)

    creator = db.relationship("User", backref="created_debates")
    comments = db.relationship("DebateComment", backref="debate", lazy="dynamic", cascade="all, delete-orphan")
    votes = db.relationship("DebateVote", backref="debate", lazy="dynamic", cascade="all, delete-orphan")

    def to_dict(self, current_user_id=None):
        data = {
            "id": self.id,
            "topic": self.topic,
            "description": self.description,
            "creator": self.creator.to_dict() if self.creator else None,
            "option_a": self.option_a,
            "option_b": self.option_b,
            "votes_a": self.votes_a,
            "votes_b": self.votes_b,
            "total_votes": self.votes_a + self.votes_b,
            "comments_count": self.comments.count(),
            "is_active": self.is_active,
            "created_at": self.created_at.isoformat(),
            "expires_at": self.expires_at.isoformat() if self.expires_at else None,
        }
        if current_user_id:
            vote = DebateVote.query.filter_by(
                debate_id=self.id, user_id=current_user_id
            ).first()
            data["user_vote"] = vote.option if vote else None
        return data


class DebateComment(db.Model):
    __tablename__ = "debate_comments"

    id = db.Column(db.Integer, primary_key=True)
    debate_id = db.Column(db.Integer, db.ForeignKey("debate_rooms.id"), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    content = db.Column(db.Text, nullable=False)
    side = db.Column(db.String(1), default="")  # "a" or "b"
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    user = db.relationship("User", backref="debate_comments")

    def to_dict(self):
        return {
            "id": self.id,
            "debate_id": self.debate_id,
            "user": self.user.to_dict() if self.user else None,
            "content": self.content,
            "side": self.side,
            "created_at": self.created_at.isoformat(),
        }


class DebateVote(db.Model):
    __tablename__ = "debate_votes"

    id = db.Column(db.Integer, primary_key=True)
    debate_id = db.Column(db.Integer, db.ForeignKey("debate_rooms.id"), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    option = db.Column(db.String(1), nullable=False)  # "a" or "b"
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    __table_args__ = (db.UniqueConstraint("debate_id", "user_id"),)
