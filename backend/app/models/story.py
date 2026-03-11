from datetime import datetime, timezone
from app.extensions import db


class Story(db.Model):
    __tablename__ = "stories"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    media_url = db.Column(db.String(255), nullable=False)
    media_type = db.Column(db.String(20), default="image")  # image, video
    caption = db.Column(db.Text, default="")
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    expires_at = db.Column(db.DateTime, nullable=False)

    views = db.relationship("StoryView", backref="story", lazy="dynamic", cascade="all, delete-orphan")
    reactions = db.relationship("StoryReaction", backref="story", lazy="dynamic", cascade="all, delete-orphan")

    def to_dict(self, current_user_id=None):
        data = {
            "id": self.id,
            "user_id": self.user_id,
            "author": self.author.to_dict() if self.author else None,
            "media_url": self.media_url,
            "media_type": self.media_type,
            "caption": self.caption,
            "views_count": self.views.count(),
            "created_at": self.created_at.isoformat(),
            "expires_at": self.expires_at.isoformat(),
        }
        if current_user_id:
            data["is_viewed"] = StoryView.query.filter_by(
                story_id=self.id, user_id=current_user_id
            ).first() is not None
        return data


class StoryView(db.Model):
    __tablename__ = "story_views"

    id = db.Column(db.Integer, primary_key=True)
    story_id = db.Column(db.Integer, db.ForeignKey("stories.id"), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    viewed_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    user = db.relationship("User")

    __table_args__ = (db.UniqueConstraint("story_id", "user_id"),)


class StoryReaction(db.Model):
    __tablename__ = "story_reactions"

    id = db.Column(db.Integer, primary_key=True)
    story_id = db.Column(db.Integer, db.ForeignKey("stories.id"), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    emoji = db.Column(db.String(10), nullable=False)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    user = db.relationship("User")

    __table_args__ = (db.UniqueConstraint("story_id", "user_id"),)
