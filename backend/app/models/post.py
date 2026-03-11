from datetime import datetime, timezone
from app.extensions import db


class Post(db.Model):
    __tablename__ = "posts"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    content = db.Column(db.Text, default="")
    media_url = db.Column(db.String(255), default="")
    media_type = db.Column(db.String(20), default="")  # image, video
    visibility = db.Column(db.String(20), default="public")  # public, friends, private
    likes_count = db.Column(db.Integer, default=0)
    comments_count = db.Column(db.Integer, default=0)
    shares_count = db.Column(db.Integer, default=0)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    # Relationships
    likes = db.relationship("Like", backref="post", lazy="dynamic", cascade="all, delete-orphan")
    comments = db.relationship("Comment", backref="post", lazy="dynamic", cascade="all, delete-orphan")
    shares = db.relationship("Share", backref="post", lazy="dynamic", cascade="all, delete-orphan")

    def to_dict(self, current_user_id=None):
        data = {
            "id": self.id,
            "user_id": self.user_id,
            "author": self.author.to_dict() if self.author else None,
            "content": self.content,
            "media_url": self.media_url,
            "media_type": self.media_type,
            "visibility": self.visibility,
            "likes_count": self.likes_count,
            "comments_count": self.comments_count,
            "shares_count": self.shares_count,
            "created_at": self.created_at.isoformat(),
        }
        if current_user_id:
            data["is_liked"] = Like.query.filter_by(
                post_id=self.id, user_id=current_user_id
            ).first() is not None
            data["is_saved"] = SavedPost.query.filter_by(
                post_id=self.id, user_id=current_user_id
            ).first() is not None
        return data


class Like(db.Model):
    __tablename__ = "likes"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    post_id = db.Column(db.Integer, db.ForeignKey("posts.id"), nullable=False)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    __table_args__ = (db.UniqueConstraint("user_id", "post_id"),)


class Comment(db.Model):
    __tablename__ = "comments"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    post_id = db.Column(db.Integer, db.ForeignKey("posts.id"), nullable=False)
    content = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    user = db.relationship("User", backref="comments")

    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "user": self.user.to_dict() if self.user else None,
            "post_id": self.post_id,
            "content": self.content,
            "created_at": self.created_at.isoformat(),
        }


class Share(db.Model):
    __tablename__ = "shares"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    post_id = db.Column(db.Integer, db.ForeignKey("posts.id"), nullable=False)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))


class SavedPost(db.Model):
    __tablename__ = "saved_posts"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    post_id = db.Column(db.Integer, db.ForeignKey("posts.id"), nullable=False)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    __table_args__ = (db.UniqueConstraint("user_id", "post_id"),)
