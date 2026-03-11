from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.extensions import db
from app.models.chat import Conversation, ConversationMember, Message
from app.models.user import User

chat_bp = Blueprint("chat", __name__, url_prefix="/api/chat")


@chat_bp.route("/conversations", methods=["GET"])
@jwt_required()
def get_conversations():
    user_id = get_jwt_identity()
    memberships = ConversationMember.query.filter_by(user_id=user_id).all()
    conv_ids = [m.conversation_id for m in memberships]
    conversations = Conversation.query.filter(
        Conversation.id.in_(conv_ids)
    ).order_by(Conversation.created_at.desc()).all()

    return jsonify({
        "conversations": [c.to_dict(current_user_id=user_id) for c in conversations]
    }), 200


@chat_bp.route("/conversations", methods=["POST"])
@jwt_required()
def create_conversation():
    user_id = get_jwt_identity()
    data = request.get_json() or {}
    other_user_id = data.get("user_id")
    is_group = data.get("is_group", False)
    name = data.get("name", "")
    member_ids = data.get("member_ids", [])

    if not is_group and other_user_id:
        # Check if private conversation already exists
        existing = db.session.query(Conversation).join(ConversationMember).filter(
            Conversation.is_group == False,
            ConversationMember.user_id == user_id
        ).all()

        for conv in existing:
            members = [m.user_id for m in conv.members.all()]
            if other_user_id in members and len(members) == 2:
                return jsonify({"conversation": conv.to_dict(current_user_id=user_id)}), 200

        member_ids = [other_user_id]

    conv = Conversation(name=name, is_group=is_group)
    db.session.add(conv)
    db.session.flush()

    # Add creator
    db.session.add(ConversationMember(conversation_id=conv.id, user_id=user_id))
    # Add other members
    for mid in member_ids:
        if mid != user_id:
            db.session.add(ConversationMember(conversation_id=conv.id, user_id=mid))

    db.session.commit()
    return jsonify({"conversation": conv.to_dict(current_user_id=user_id)}), 201


@chat_bp.route("/conversations/<int:conv_id>/messages", methods=["GET"])
@jwt_required()
def get_messages(conv_id):
    user_id = get_jwt_identity()
    page = request.args.get("page", 1, type=int)

    # Verify membership
    member = ConversationMember.query.filter_by(
        conversation_id=conv_id, user_id=user_id
    ).first()
    if not member:
        return jsonify({"error": "Not a member of this conversation"}), 403

    messages = Message.query.filter_by(conversation_id=conv_id).order_by(
        Message.created_at.desc()
    ).paginate(page=page, per_page=50, error_out=False)

    return jsonify({
        "messages": [m.to_dict() for m in reversed(messages.items)],
        "has_more": messages.has_next,
    }), 200


@chat_bp.route("/conversations/<int:conv_id>/messages", methods=["POST"])
@jwt_required()
def send_message(conv_id):
    user_id = get_jwt_identity()
    data = request.get_json() or {}

    member = ConversationMember.query.filter_by(
        conversation_id=conv_id, user_id=user_id
    ).first()
    if not member:
        return jsonify({"error": "Not a member"}), 403

    content = data.get("content", "").strip()
    media_url = data.get("media_url", "")
    media_type = data.get("media_type", "")

    if not content and not media_url:
        return jsonify({"error": "Message cannot be empty"}), 400

    msg = Message(
        conversation_id=conv_id,
        sender_id=user_id,
        content=content,
        media_url=media_url,
        media_type=media_type,
    )
    db.session.add(msg)
    db.session.commit()

    return jsonify({"message": msg.to_dict()}), 201


@chat_bp.route("/messages/<int:msg_id>/seen", methods=["POST"])
@jwt_required()
def mark_seen(msg_id):
    msg = Message.query.get_or_404(msg_id)
    msg.is_seen = True
    db.session.commit()
    return jsonify({"message": msg.to_dict()}), 200
