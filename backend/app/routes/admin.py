from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.extensions import db
from app.models.user import User
from app.models.post import Post
from app.models.challenge import Challenge
from app.models.debate import DebateRoom
from app.utils.helpers import admin_required

admin_bp = Blueprint("admin", __name__, url_prefix="/api/admin")


@admin_bp.route("/stats", methods=["GET"])
@admin_required
def get_platform_stats():
    return jsonify({
        "stats": {
            "total_users": User.query.count(),
            "total_posts": Post.query.count(),
            "active_challenges": Challenge.query.filter_by(is_active=True).count(),
            "active_debates": DebateRoom.query.filter_by(is_active=True).count(),
            "online_users": User.query.filter_by(is_online=True).count(),
        }
    }), 200


@admin_bp.route("/users", methods=["GET"])
@admin_required
def get_all_users():
    page = request.args.get("page", 1, type=int)
    users = User.query.order_by(User.created_at.desc()).paginate(
        page=page, per_page=20, error_out=False
    )
    return jsonify({
        "users": [u.to_dict(include_email=True) for u in users.items],
        "has_more": users.has_next,
        "total": users.total,
    }), 200


@admin_bp.route("/users/<int:user_id>/toggle-admin", methods=["POST"])
@admin_required
def toggle_admin(user_id):
    user = User.query.get_or_404(user_id)
    user.is_admin = not user.is_admin
    db.session.commit()
    return jsonify({"user": user.to_dict(include_email=True)}), 200


@admin_bp.route("/posts/<int:post_id>", methods=["DELETE"])
@admin_required
def delete_post(post_id):
    post = Post.query.get_or_404(post_id)
    db.session.delete(post)
    db.session.commit()
    return jsonify({"message": "Post deleted"}), 200


@admin_bp.route("/seed", methods=["POST"])
@admin_required
def seed_challenges():
    """Seed default daily challenges."""
    defaults = [
        ("📸 Photo Challenge", "Share a photo that represents your day!", "photo"),
        ("🙏 Gratitude Post", "Share 3 things you're grateful for today.", "gratitude"),
        ("🎨 Creative Challenge", "Draw, design, or create something unique today!", "creative"),
        ("💪 Fitness Check-in", "Share your workout or healthy meal today!", "fitness"),
    ]
    for title, desc, ctype in defaults:
        if not Challenge.query.filter_by(title=title).first():
            c = Challenge(title=title, description=desc, challenge_type=ctype)
            db.session.add(c)
    db.session.commit()
    return jsonify({"message": "Challenges seeded"}), 200
