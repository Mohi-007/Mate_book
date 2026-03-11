import os
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.extensions import db
from app.models.post import Post, Like, Comment, Share, SavedPost
from app.models.friendship import Friendship
from app.models.user import User
from app.utils.helpers import save_upload
from datetime import datetime, timezone, timedelta
from sqlalchemy import func

posts_bp = Blueprint("posts", __name__, url_prefix="/api/posts")


def _uid():
    """Get current user id as int from JWT."""
    return int(get_jwt_identity())


@posts_bp.route("", methods=["POST"])
@jwt_required()
def create_post():
    user_id = _uid()

    if request.content_type and "multipart" in request.content_type:
        data = request.form.to_dict()
    else:
        data = request.get_json() or {}

    content = data.get("content", "").strip()
    visibility = data.get("visibility", "public")
    media_url = ""
    media_type = ""

    # Handle media upload
    upload_folder = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "uploads")
    if "media" in request.files:
        media_url = save_upload(request.files["media"], upload_folder)
        if media_url:
            filename = media_url.split("/")[-1]
            ext = filename.rsplit(".", 1)[1].lower() if "." in filename else ""
            media_type = "video" if ext in ("mp4", "webm") else "image"

    if not content and not media_url:
        return jsonify({"error": "Post must have content or media"}), 400

    post = Post(
        user_id=user_id,
        content=content,
        media_url=media_url,
        media_type=media_type,
        visibility=visibility,
    )
    db.session.add(post)

    # Update productivity score
    user = User.query.get(user_id)
    if user:
        user.productivity_score = (user.productivity_score or 0) + 5
    db.session.commit()

    return jsonify({"post": post.to_dict(current_user_id=user_id)}), 201


@posts_bp.route("/feed", methods=["GET"])
@jwt_required()
def get_feed():
    user_id = _uid()
    page = request.args.get("page", 1, type=int)
    per_page = request.args.get("per_page", 10, type=int)

    # Get friend IDs
    friend_ids = set()
    friendships = Friendship.query.filter(
        ((Friendship.requester_id == user_id) | (Friendship.addressee_id == user_id)),
        Friendship.status == "accepted"
    ).all()
    for f in friendships:
        friend_ids.add(f.requester_id if f.addressee_id == user_id else f.addressee_id)

    # Feed: public posts + friends' posts + own posts
    posts = Post.query.filter(
        db.or_(
            Post.visibility == "public",
            db.and_(Post.visibility == "friends", Post.user_id.in_(friend_ids)),
            Post.user_id == user_id,
        )
    ).order_by(Post.created_at.desc()).paginate(
        page=page, per_page=per_page, error_out=False
    )

    return jsonify({
        "posts": [p.to_dict(current_user_id=user_id) for p in posts.items],
        "has_more": posts.has_next,
        "page": page,
        "total": posts.total,
    }), 200


@posts_bp.route("/user/<int:target_user_id>", methods=["GET"])
@jwt_required()
def get_user_posts(target_user_id):
    current_user_id = _uid()
    page = request.args.get("page", 1, type=int)

    query = Post.query.filter_by(user_id=target_user_id)
    if target_user_id != current_user_id:
        query = query.filter(Post.visibility != "private")
    posts = query.order_by(Post.created_at.desc()).paginate(
        page=page, per_page=10, error_out=False
    )

    return jsonify({
        "posts": [p.to_dict(current_user_id=current_user_id) for p in posts.items],
        "has_more": posts.has_next,
    }), 200


@posts_bp.route("/trending", methods=["GET"])
@jwt_required()
def get_trending():
    user_id = _uid()
    # Trending = most liked in last 7 days
    week_ago = datetime.now(timezone.utc) - timedelta(days=7)
    posts = Post.query.filter(
        Post.visibility == "public",
        Post.created_at >= week_ago,
    ).order_by(Post.likes_count.desc()).limit(20).all()

    return jsonify({
        "posts": [p.to_dict(current_user_id=user_id) for p in posts]
    }), 200


@posts_bp.route("/<int:post_id>/like", methods=["POST"])
@jwt_required()
def toggle_like(post_id):
    user_id = _uid()
    post = Post.query.get_or_404(post_id)

    existing = Like.query.filter_by(user_id=user_id, post_id=post_id).first()
    if existing:
        db.session.delete(existing)
        post.likes_count = max(0, post.likes_count - 1)
    else:
        like = Like(user_id=user_id, post_id=post_id)
        db.session.add(like)
        post.likes_count += 1
        user = User.query.get(user_id)
        if user:
            user.productivity_score = (user.productivity_score or 0) + 1

    db.session.commit()
    return jsonify({"post": post.to_dict(current_user_id=user_id)}), 200


@posts_bp.route("/<int:post_id>/comment", methods=["POST"])
@jwt_required()
def add_comment(post_id):
    user_id = _uid()
    post = Post.query.get_or_404(post_id)
    data = request.get_json() or {}
    content = data.get("content", "").strip()

    if not content:
        return jsonify({"error": "Comment cannot be empty"}), 400

    comment = Comment(user_id=user_id, post_id=post_id, content=content)
    db.session.add(comment)
    post.comments_count += 1

    user = User.query.get(user_id)
    if user:
        user.productivity_score = (user.productivity_score or 0) + 2

    db.session.commit()
    return jsonify({"comment": comment.to_dict()}), 201


@posts_bp.route("/<int:post_id>/comments", methods=["GET"])
@jwt_required()
def get_comments(post_id):
    comments = Comment.query.filter_by(post_id=post_id).order_by(
        Comment.created_at.asc()
    ).all()
    return jsonify({"comments": [c.to_dict() for c in comments]}), 200


@posts_bp.route("/<int:post_id>/share", methods=["POST"])
@jwt_required()
def share_post(post_id):
    user_id = _uid()
    post = Post.query.get_or_404(post_id)

    share = Share(user_id=user_id, post_id=post_id)
    db.session.add(share)
    post.shares_count += 1
    db.session.commit()

    return jsonify({"post": post.to_dict(current_user_id=user_id)}), 200


@posts_bp.route("/<int:post_id>/save", methods=["POST"])
@jwt_required()
def toggle_save(post_id):
    user_id = _uid()
    Post.query.get_or_404(post_id)

    existing = SavedPost.query.filter_by(user_id=user_id, post_id=post_id).first()
    if existing:
        db.session.delete(existing)
        saved = False
    else:
        sp = SavedPost(user_id=user_id, post_id=post_id)
        db.session.add(sp)
        saved = True

    db.session.commit()
    return jsonify({"saved": saved}), 200


@posts_bp.route("/saved", methods=["GET"])
@jwt_required()
def get_saved_posts():
    user_id = _uid()
    saved = SavedPost.query.filter_by(user_id=user_id).order_by(
        SavedPost.created_at.desc()
    ).all()
    post_ids = [s.post_id for s in saved]
    posts = Post.query.filter(Post.id.in_(post_ids)).all()
    return jsonify({
        "posts": [p.to_dict(current_user_id=user_id) for p in posts]
    }), 200


@posts_bp.route("/<int:post_id>", methods=["DELETE"])
@jwt_required()
def delete_post(post_id):
    user_id = _uid()
    post = Post.query.get_or_404(post_id)
    if post.user_id != user_id:
        user = User.query.get(user_id)
        if not user or not user.is_admin:
            return jsonify({"error": "Unauthorized"}), 403
    db.session.delete(post)
    db.session.commit()
    return jsonify({"message": "Post deleted"}), 200


@posts_bp.route("/memories", methods=["GET"])
@jwt_required()
def get_memories():
    """On This Day - posts from same date in previous years."""
    user_id = _uid()
    today = datetime.now(timezone.utc)
    memories = []

    for years_ago in range(1, 10):
        target_date = today.replace(year=today.year - years_ago)
        start = target_date.replace(hour=0, minute=0, second=0)
        end = target_date.replace(hour=23, minute=59, second=59)
        posts = Post.query.filter(
            Post.user_id == user_id,
            Post.created_at >= start,
            Post.created_at <= end,
        ).all()
        for p in posts:
            memories.append({
                "years_ago": years_ago,
                "post": p.to_dict(current_user_id=user_id),
            })

    return jsonify({"memories": memories}), 200
