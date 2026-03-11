from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.extensions import db
from app.models.friendship import Friendship
from app.models.user import User

friends_bp = Blueprint("friends", __name__, url_prefix="/api/friends")


@friends_bp.route("/request", methods=["POST"])
@jwt_required()
def send_request():
    user_id = get_jwt_identity()
    data = request.get_json() or {}
    addressee_id = data.get("user_id")

    if not addressee_id or addressee_id == user_id:
        return jsonify({"error": "Invalid user"}), 400

    # Check if friendship already exists
    existing = Friendship.query.filter(
        db.or_(
            db.and_(Friendship.requester_id == user_id, Friendship.addressee_id == addressee_id),
            db.and_(Friendship.requester_id == addressee_id, Friendship.addressee_id == user_id),
        )
    ).first()

    if existing:
        if existing.status == "accepted":
            return jsonify({"error": "Already friends"}), 409
        if existing.status == "pending":
            return jsonify({"error": "Request already sent"}), 409

    friendship = Friendship(requester_id=user_id, addressee_id=addressee_id)
    db.session.add(friendship)
    db.session.commit()

    return jsonify({"friendship": friendship.to_dict()}), 201


@friends_bp.route("/accept/<int:friendship_id>", methods=["POST"])
@jwt_required()
def accept_request(friendship_id):
    user_id = get_jwt_identity()
    friendship = Friendship.query.get_or_404(friendship_id)

    if friendship.addressee_id != user_id:
        return jsonify({"error": "Unauthorized"}), 403

    friendship.status = "accepted"
    db.session.commit()
    return jsonify({"friendship": friendship.to_dict()}), 200


@friends_bp.route("/decline/<int:friendship_id>", methods=["POST"])
@jwt_required()
def decline_request(friendship_id):
    user_id = get_jwt_identity()
    friendship = Friendship.query.get_or_404(friendship_id)

    if friendship.addressee_id != user_id:
        return jsonify({"error": "Unauthorized"}), 403

    db.session.delete(friendship)
    db.session.commit()
    return jsonify({"message": "Request declined"}), 200


@friends_bp.route("", methods=["GET"])
@jwt_required()
def get_friends():
    user_id = request.args.get("user_id", get_jwt_identity(), type=int)
    friendships = Friendship.query.filter(
        ((Friendship.requester_id == user_id) | (Friendship.addressee_id == user_id)),
        Friendship.status == "accepted"
    ).all()

    friends = []
    for f in friendships:
        friend_id = f.addressee_id if f.requester_id == user_id else f.requester_id
        user = User.query.get(friend_id)
        if user:
            friends.append(user.to_dict())

    return jsonify({"friends": friends}), 200


@friends_bp.route("/requests", methods=["GET"])
@jwt_required()
def get_pending_requests():
    user_id = get_jwt_identity()
    requests_list = Friendship.query.filter_by(
        addressee_id=user_id, status="pending"
    ).all()
    return jsonify({
        "requests": [r.to_dict() for r in requests_list]
    }), 200


@friends_bp.route("/unfriend/<int:user_id_to_remove>", methods=["DELETE"])
@jwt_required()
def unfriend(user_id_to_remove):
    user_id = get_jwt_identity()
    friendship = Friendship.query.filter(
        db.or_(
            db.and_(Friendship.requester_id == user_id, Friendship.addressee_id == user_id_to_remove),
            db.and_(Friendship.requester_id == user_id_to_remove, Friendship.addressee_id == user_id),
        )
    ).first()

    if not friendship:
        return jsonify({"error": "Not friends"}), 404

    db.session.delete(friendship)
    db.session.commit()
    return jsonify({"message": "Unfriended"}), 200


@friends_bp.route("/status/<int:other_user_id>", methods=["GET"])
@jwt_required()
def friendship_status(other_user_id):
    user_id = get_jwt_identity()
    friendship = Friendship.query.filter(
        db.or_(
            db.and_(Friendship.requester_id == user_id, Friendship.addressee_id == other_user_id),
            db.and_(Friendship.requester_id == other_user_id, Friendship.addressee_id == user_id),
        )
    ).first()

    if not friendship:
        return jsonify({"status": "none", "friendship": None}), 200
    return jsonify({
        "status": friendship.status,
        "friendship": friendship.to_dict(),
        "is_requester": friendship.requester_id == user_id,
    }), 200
