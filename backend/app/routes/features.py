from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.extensions import db
from app.models.challenge import Challenge, ChallengeEntry
from app.models.debate import DebateRoom, DebateComment, DebateVote
from app.models.user import User
from app.models.post import Post, Like, Comment
from app.models.mood import MoodHistory
from datetime import datetime, timezone, timedelta

features_bp = Blueprint("features", __name__, url_prefix="/api/features")


# ─── CHALLENGES ─────────────────────────────────────
@features_bp.route("/challenges", methods=["GET"])
@jwt_required()
def get_challenges():
    challenges = Challenge.query.filter_by(is_active=True).order_by(
        Challenge.created_at.desc()
    ).all()
    return jsonify({"challenges": [c.to_dict() for c in challenges]}), 200


@features_bp.route("/challenges", methods=["POST"])
@jwt_required()
def create_challenge():
    data = request.get_json() or {}
    challenge = Challenge(
        title=data.get("title", ""),
        description=data.get("description", ""),
        challenge_type=data.get("challenge_type", "photo"),
        expires_at=datetime.now(timezone.utc) + timedelta(hours=24),
    )
    db.session.add(challenge)
    db.session.commit()
    return jsonify({"challenge": challenge.to_dict()}), 201


@features_bp.route("/challenges/<int:challenge_id>/enter", methods=["POST"])
@jwt_required()
def enter_challenge(challenge_id):
    user_id = get_jwt_identity()
    data = request.get_json() or {}

    entry = ChallengeEntry(
        challenge_id=challenge_id,
        user_id=user_id,
        content=data.get("content", ""),
        media_url=data.get("media_url", ""),
    )
    db.session.add(entry)

    # Productivity boost
    user = User.query.get(user_id)
    if user:
        user.productivity_score = (user.productivity_score or 0) + 10

    db.session.commit()
    return jsonify({"entry": entry.to_dict()}), 201


@features_bp.route("/challenges/<int:challenge_id>/entries", methods=["GET"])
@jwt_required()
def get_challenge_entries(challenge_id):
    entries = ChallengeEntry.query.filter_by(challenge_id=challenge_id).order_by(
        ChallengeEntry.created_at.desc()
    ).all()
    return jsonify({"entries": [e.to_dict() for e in entries]}), 200


# ─── DEBATES ────────────────────────────────────────
@features_bp.route("/debates", methods=["GET"])
@jwt_required()
def get_debates():
    user_id = get_jwt_identity()
    debates = DebateRoom.query.filter_by(is_active=True).order_by(
        DebateRoom.created_at.desc()
    ).all()
    return jsonify({
        "debates": [d.to_dict(current_user_id=user_id) for d in debates]
    }), 200


@features_bp.route("/debates", methods=["POST"])
@jwt_required()
def create_debate():
    user_id = get_jwt_identity()
    data = request.get_json() or {}

    debate = DebateRoom(
        topic=data.get("topic", ""),
        description=data.get("description", ""),
        created_by=user_id,
        option_a=data.get("option_a", "Yes"),
        option_b=data.get("option_b", "No"),
        expires_at=datetime.now(timezone.utc) + timedelta(hours=int(data.get("duration_hours", 24))),
    )
    db.session.add(debate)
    db.session.commit()
    return jsonify({"debate": debate.to_dict(current_user_id=user_id)}), 201


@features_bp.route("/debates/<int:debate_id>/vote", methods=["POST"])
@jwt_required()
def vote_debate(debate_id):
    user_id = get_jwt_identity()
    data = request.get_json() or {}
    option = data.get("option", "a")  # "a" or "b"

    debate = DebateRoom.query.get_or_404(debate_id)
    existing = DebateVote.query.filter_by(debate_id=debate_id, user_id=user_id).first()

    if existing:
        # Change vote
        if existing.option == "a":
            debate.votes_a = max(0, debate.votes_a - 1)
        else:
            debate.votes_b = max(0, debate.votes_b - 1)
        existing.option = option
    else:
        vote = DebateVote(debate_id=debate_id, user_id=user_id, option=option)
        db.session.add(vote)

    if option == "a":
        debate.votes_a += 1
    else:
        debate.votes_b += 1

    db.session.commit()
    return jsonify({"debate": debate.to_dict(current_user_id=user_id)}), 200


@features_bp.route("/debates/<int:debate_id>/comment", methods=["POST"])
@jwt_required()
def comment_debate(debate_id):
    user_id = get_jwt_identity()
    data = request.get_json() or {}

    comment = DebateComment(
        debate_id=debate_id,
        user_id=user_id,
        content=data.get("content", ""),
        side=data.get("side", ""),
    )
    db.session.add(comment)
    db.session.commit()
    return jsonify({"comment": comment.to_dict()}), 201


@features_bp.route("/debates/<int:debate_id>/comments", methods=["GET"])
@jwt_required()
def get_debate_comments(debate_id):
    comments = DebateComment.query.filter_by(debate_id=debate_id).order_by(
        DebateComment.created_at.asc()
    ).all()
    return jsonify({"comments": [c.to_dict() for c in comments]}), 200


# ─── ANALYTICS ──────────────────────────────────────
@features_bp.route("/analytics", methods=["GET"])
@jwt_required()
def get_analytics():
    user_id = request.args.get("user_id", get_jwt_identity(), type=int)
    user = User.query.get(user_id)
    if not user:
        return jsonify({"error": "User not found"}), 404

    now = datetime.now(timezone.utc)
    week_ago = now - timedelta(days=7)
    month_ago = now - timedelta(days=30)

    # Post stats
    total_posts = Post.query.filter_by(user_id=user_id).count()
    weekly_posts = Post.query.filter(
        Post.user_id == user_id, Post.created_at >= week_ago
    ).count()

    # Engagement stats
    total_likes = db.session.query(db.func.sum(Post.likes_count)).filter(
        Post.user_id == user_id
    ).scalar() or 0
    total_comments = db.session.query(db.func.sum(Post.comments_count)).filter(
        Post.user_id == user_id
    ).scalar() or 0

    # Mood history for chart
    mood_history = MoodHistory.query.filter(
        MoodHistory.user_id == user_id,
        MoodHistory.created_at >= month_ago,
    ).order_by(MoodHistory.created_at.asc()).all()

    # Daily post counts for chart (last 7 days)
    daily_posts = []
    for i in range(7):
        day = now - timedelta(days=6 - i)
        start = day.replace(hour=0, minute=0, second=0)
        end = day.replace(hour=23, minute=59, second=59)
        count = Post.query.filter(
            Post.user_id == user_id,
            Post.created_at >= start,
            Post.created_at <= end,
        ).count()
        daily_posts.append({
            "date": start.strftime("%a"),
            "count": count,
        })

    return jsonify({
        "analytics": {
            "total_posts": total_posts,
            "weekly_posts": weekly_posts,
            "total_likes": int(total_likes),
            "total_comments": int(total_comments),
            "productivity_score": user.productivity_score or 0,
            "daily_posts": daily_posts,
            "mood_history": [m.to_dict() for m in mood_history],
        }
    }), 200
