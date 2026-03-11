from datetime import datetime, timezone
from app.extensions import db


class Conversation(db.Model):
    __tablename__ = "conversations"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), default="")  # for group chats
    is_group = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    members = db.relationship("ConversationMember", backref="conversation", lazy="dynamic", cascade="all, delete-orphan")
    messages = db.relationship("Message", backref="conversation", lazy="dynamic", cascade="all, delete-orphan")

    def to_dict(self, current_user_id=None):
        members_list = [m.to_dict() for m in self.members.all()]
        last_msg = self.messages.order_by(Message.created_at.desc()).first()
        unread = 0
        if current_user_id:
            unread = self.messages.filter(
                Message.sender_id != current_user_id,
                Message.is_seen == False
            ).count()
        return {
            "id": self.id,
            "name": self.name,
            "is_group": self.is_group,
            "members": members_list,
            "last_message": last_msg.to_dict() if last_msg else None,
            "unread_count": unread,
            "created_at": self.created_at.isoformat(),
        }


class ConversationMember(db.Model):
    __tablename__ = "conversation_members"

    id = db.Column(db.Integer, primary_key=True)
    conversation_id = db.Column(db.Integer, db.ForeignKey("conversations.id"), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    joined_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    user = db.relationship("User", backref="conversation_memberships")

    __table_args__ = (db.UniqueConstraint("conversation_id", "user_id"),)

    def to_dict(self):
        return {
            "user_id": self.user_id,
            "user": self.user.to_dict() if self.user else None,
            "joined_at": self.joined_at.isoformat(),
        }


class Message(db.Model):
    __tablename__ = "messages"

    id = db.Column(db.Integer, primary_key=True)
    conversation_id = db.Column(db.Integer, db.ForeignKey("conversations.id"), nullable=False)
    sender_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    content = db.Column(db.Text, default="")
    media_url = db.Column(db.String(255), default="")
    media_type = db.Column(db.String(20), default="")  # image, video, emoji
    is_seen = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    sender = db.relationship("User", backref="sent_messages")

    def to_dict(self):
        return {
            "id": self.id,
            "conversation_id": self.conversation_id,
            "sender_id": self.sender_id,
            "sender": self.sender.to_dict() if self.sender else None,
            "content": self.content,
            "media_url": self.media_url,
            "media_type": self.media_type,
            "is_seen": self.is_seen,
            "created_at": self.created_at.isoformat(),
        }
