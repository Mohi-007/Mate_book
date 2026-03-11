from datetime import datetime, timezone
from app.extensions import db


class Friendship(db.Model):
    __tablename__ = "friendships"

    id = db.Column(db.Integer, primary_key=True)
    requester_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    addressee_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    status = db.Column(db.String(20), default="pending")  # pending, accepted, blocked
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    requester = db.relationship("User", foreign_keys=[requester_id], backref="sent_requests")
    addressee = db.relationship("User", foreign_keys=[addressee_id], backref="received_requests")

    __table_args__ = (db.UniqueConstraint("requester_id", "addressee_id"),)

    def to_dict(self):
        return {
            "id": self.id,
            "requester": self.requester.to_dict(),
            "addressee": self.addressee.to_dict(),
            "status": self.status,
            "created_at": self.created_at.isoformat(),
        }
