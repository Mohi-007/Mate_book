import os
from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.extensions import db
from app.models.story import Story, StoryView, StoryReaction
from app.utils.helpers import save_upload
from datetime import datetime, timezone, timedelta

stories_bp = Blueprint("stories", __name__, url_prefix="/api/stories")


@stories_bp.route("", methods=["POST"])
@jwt_required()
def create_story():
    user_id = get_jwt_identity()
    media_url = ""
    media_type = "image"
    caption = ""

    if request.content_type and "multipart" in request.content_type:
        caption = request.form.get("caption", "")
        upload_folder = current_app.config["UPLOAD_FOLDER"]
        if "media" in request.files:
            media_url = save_upload(request.files["media"], upload_folder)
            if media_url:
                filename = media_url.split("/")[-1]
                ext = filename.rsplit(".", 1)[1].lower() if "." in filename else ""
                media_type = "video" if ext in ("mp4", "webm") else "image"
    else:
        data = request.get_json() or {}
        media_url = data.get("media_url", "")
        media_type = data.get("media_type", "image")
        caption = data.get("caption", "")

    if not media_url:
        return jsonify({"error": "Story must have media"}), 400

    story = Story(
        user_id=user_id,
        media_url=media_url,
        media_type=media_type,
        caption=caption,
        expires_at=datetime.now(timezone.utc) + timedelta(hours=24),
    )
    db.session.add(story)
    db.session.commit()

    return jsonify({"story": story.to_dict(current_user_id=user_id)}), 201


@stories_bp.route("/feed", methods=["GET"])
@jwt_required()
def get_story_feed():
    user_id = get_jwt_identity()
    now = datetime.now(timezone.utc)

    # Get active (non-expired) stories grouped by user
    stories = Story.query.filter(
        Story.expires_at > now
    ).order_by(Story.created_at.desc()).all()

    # Group by user
    user_stories = {}
    for s in stories:
        if s.user_id not in user_stories:
            user_stories[s.user_id] = {
                "user": s.author.to_dict(),
                "stories": [],
            }
        user_stories[s.user_id]["stories"].append(s.to_dict(current_user_id=user_id))

    return jsonify({"story_groups": list(user_stories.values())}), 200


@stories_bp.route("/<int:story_id>/view", methods=["POST"])
@jwt_required()
def view_story(story_id):
    user_id = get_jwt_identity()
    story = Story.query.get_or_404(story_id)

    existing = StoryView.query.filter_by(story_id=story_id, user_id=user_id).first()
    if not existing:
        view = StoryView(story_id=story_id, user_id=user_id)
        db.session.add(view)
        db.session.commit()

    return jsonify({"story": story.to_dict(current_user_id=user_id)}), 200


@stories_bp.route("/<int:story_id>/react", methods=["POST"])
@jwt_required()
def react_to_story(story_id):
    user_id = get_jwt_identity()
    data = request.get_json() or {}
    emoji = data.get("emoji", "❤️")

    Story.query.get_or_404(story_id)

    existing = StoryReaction.query.filter_by(story_id=story_id, user_id=user_id).first()
    if existing:
        existing.emoji = emoji
    else:
        reaction = StoryReaction(story_id=story_id, user_id=user_id, emoji=emoji)
        db.session.add(reaction)

    db.session.commit()
    return jsonify({"message": "Reaction added"}), 200


@stories_bp.route("/<int:story_id>/viewers", methods=["GET"])
@jwt_required()
def get_viewers(story_id):
    views = StoryView.query.filter_by(story_id=story_id).all()
    return jsonify({
        "viewers": [{"user": v.user.to_dict(), "viewed_at": v.viewed_at.isoformat()} for v in views]
    }), 200
