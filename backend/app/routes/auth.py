import os
from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from app.extensions import db, bcrypt
from app.models.user import User
from app.models.mood import MoodHistory
from app.utils.helpers import save_upload
from datetime import datetime, timezone

auth_bp = Blueprint("auth", __name__, url_prefix="/api/auth")


@auth_bp.route("/register", methods=["POST"])
def register():
    data = request.get_json(silent=True)
    if not data:
        data = request.form.to_dict()
    if not data and request.data:
        import json
        try:
            data = json.loads(request.data)
        except:
            data = {}
    data = data or {}

    username = data.get("username", "").strip()
    email = data.get("email", "").strip().lower()
    password = data.get("password", "")

    if not username or not email or not password:
        return jsonify({"error": "Username, email, and password are required"}), 400
    if len(password) < 6:
        return jsonify({"error": "Password must be at least 6 characters"}), 400
    if User.query.filter_by(username=username).first():
        return jsonify({"error": "Username already taken"}), 409
    if User.query.filter_by(email=email).first():
        return jsonify({"error": "Email already registered"}), 409

    user = User(
        username=username,
        email=email,
        password_hash=bcrypt.generate_password_hash(password).decode("utf-8"),
        is_verified=True,  # Auto-verify for dev
    )
    db.session.add(user)
    db.session.commit()

    token = create_access_token(identity=str(user.id))
    return jsonify({"token": token, "user": user.to_dict(include_email=True)}), 201


@auth_bp.route("/health", methods=["GET"])
def health_check():
    return {"status": "ok", "message": "Matebook Backend is alive!"}, 200

@auth_bp.route("/db-health", methods=["GET"])
def db_health_check():
    try:
        from app.models.user import User
        count = User.query.count()
        return {"status": "ok", "message": f"Database connected. Total users: {count}"}, 200
    except Exception as e:
        return {"status": "error", "message": f"Database error: {str(e)}"}, 500

@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.get_json(silent=True)
    if not data:
        data = request.form.to_dict()
    if not data and request.data:
        import json
        try:
            data = json.loads(request.data)
        except:
            data = {}
    data = data or {}

    login_identifier = data.get("email", "").strip()
    if not login_identifier:
        login_identifier = data.get("username", "").strip()
        
    password = data.get("password", "")

    if not login_identifier or not password:
        return jsonify({"error": "Please provide both your email/username and password."}), 400

    # Check if user exists by email or username
    user = User.query.filter(
        (User.email == login_identifier.lower()) | (User.username == login_identifier)
    ).first()

    if not user or not bcrypt.check_password_hash(user.password_hash, password):
        return jsonify({"error": "Invalid email/username or password. Please try again."}), 401

    user.is_online = True
    user.last_seen = datetime.now(timezone.utc)
    db.session.commit()

    token = create_access_token(identity=str(user.id))
    return jsonify({"token": token, "user": user.to_dict(include_email=True)}), 200


@auth_bp.route("/me", methods=["GET"])
@jwt_required()
def get_me():
    user = User.query.get(get_jwt_identity())
    if not user:
        return jsonify({"error": "User not found"}), 404
    return jsonify({"user": user.to_dict(include_email=True)}), 200


@auth_bp.route("/profile", methods=["PUT"])
@jwt_required()
def update_profile():
    user = User.query.get(get_jwt_identity())
    if not user:
        return jsonify({"error": "User not found"}), 404

    # Handle JSON or form data
    if request.content_type and "multipart" in request.content_type:
        data = request.form.to_dict()
    else:
        data = request.get_json() or {}

    if "username" in data:
        existing = User.query.filter_by(username=data["username"]).first()
        if existing and existing.id != user.id:
            return jsonify({"error": "Username already taken"}), 409
        user.username = data["username"]
    if "bio" in data:
        user.bio = data["bio"]
    if "theme_color" in data:
        user.theme_color = data["theme_color"]

    # Handle file uploads
    upload_folder = current_app.config["UPLOAD_FOLDER"]
    if "profile_pic" in request.files:
        user.profile_pic = save_upload(request.files["profile_pic"], upload_folder)
    if "cover_photo" in request.files:
        user.cover_photo = save_upload(request.files["cover_photo"], upload_folder)

    db.session.commit()
    return jsonify({"user": user.to_dict(include_email=True)}), 200


@auth_bp.route("/mood", methods=["PUT"])
@jwt_required()
def update_mood():
    user = User.query.get(get_jwt_identity())
    data = request.get_json() or {}
    mood = data.get("mood", "")

    user.mood = mood
    user.mood_updated_at = datetime.now(timezone.utc)
    db.session.commit()

    # Save to mood history
    history = MoodHistory(user_id=user.id, mood=mood)
    db.session.add(history)
    db.session.commit()

    return jsonify({"user": user.to_dict(include_email=True)}), 200


@auth_bp.route("/mood-history", methods=["GET"])
@jwt_required()
def get_mood_history():
    user_id = request.args.get("user_id", get_jwt_identity(), type=int)
    history = MoodHistory.query.filter_by(user_id=user_id).order_by(
        MoodHistory.created_at.desc()
    ).limit(30).all()
    return jsonify({"history": [h.to_dict() for h in history]}), 200


@auth_bp.route("/users/<int:user_id>", methods=["GET"])
@jwt_required()
def get_user(user_id):
    user = User.query.get(user_id)
    if not user:
        return jsonify({"error": "User not found"}), 404
    return jsonify({"user": user.to_dict()}), 200


@auth_bp.route("/users/search", methods=["GET"])
@jwt_required()
def search_users():
    q = request.args.get("q", "").strip()
    if not q:
        return jsonify({"users": []}), 200
    users = User.query.filter(
        User.username.ilike(f"%{q}%")
    ).limit(20).all()
    return jsonify({"users": [u.to_dict() for u in users]}), 200
