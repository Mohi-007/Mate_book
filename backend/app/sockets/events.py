from flask_socketio import emit, join_room, leave_room
from flask_jwt_extended import decode_token
from app.extensions import socketio, db
from app.models.user import User
from app.models.chat import Message, ConversationMember
from datetime import datetime, timezone

# Track online users: {user_id (int): sid}
online_users = {}


def _get_user_id_from_sid(sid):
    """Look up user_id by socket session id."""
    for uid, s in online_users.items():
        if s == sid:
            return uid
    return None


@socketio.on("connect")
def handle_connect(auth=None):
    """Handle WebSocket connection with JWT auth."""
    token = None
    if auth and isinstance(auth, dict):
        token = auth.get("token", "")
    if not token:
        return False

    try:
        decoded = decode_token(token)
        user_id_str = decoded.get("sub")
        if user_id_str:
            user_id = int(user_id_str)
            from flask import request as flask_request
            online_users[user_id] = flask_request.sid

            user = User.query.get(user_id)
            if user:
                user.is_online = True
                user.last_seen = datetime.now(timezone.utc)
                db.session.commit()

            # Join user's personal room
            join_room(f"user_{user_id}")

            # Join all conversation rooms
            memberships = ConversationMember.query.filter_by(user_id=user_id).all()
            for m in memberships:
                join_room(f"conv_{m.conversation_id}")

            emit("user_online", {"user_id": user_id}, broadcast=True)
    except Exception:
        return False


@socketio.on("disconnect")
def handle_disconnect():
    """Handle WebSocket disconnection."""
    from flask import request as flask_request
    user_id = _get_user_id_from_sid(flask_request.sid)

    if user_id:
        del online_users[user_id]
        user = User.query.get(user_id)
        if user:
            user.is_online = False
            user.last_seen = datetime.now(timezone.utc)
            db.session.commit()
        emit("user_offline", {"user_id": user_id}, broadcast=True)


@socketio.on("send_message")
def handle_send_message(data):
    """Handle real-time message sending with full sender info."""
    from flask import request as flask_request
    user_id = _get_user_id_from_sid(flask_request.sid)

    if not user_id:
        return

    conv_id = data.get("conversation_id")
    content = data.get("content", "").strip()
    media_url = data.get("media_url", "")
    media_type = data.get("media_type", "")

    if not content and not media_url:
        return

    msg = Message(
        conversation_id=conv_id,
        sender_id=user_id,
        content=content,
        media_url=media_url,
        media_type=media_type,
    )
    db.session.add(msg)
    db.session.commit()

    # Include sender info in the emitted message
    msg_data = msg.to_dict()
    user = User.query.get(user_id)
    if user:
        msg_data["sender"] = {
            "id": user.id,
            "username": user.username,
            "profile_pic": user.profile_pic,
        }

    emit("new_message", msg_data, room=f"conv_{conv_id}")


@socketio.on("typing")
def handle_typing(data):
    """Broadcast typing indicator."""
    from flask import request as flask_request
    user_id = _get_user_id_from_sid(flask_request.sid)

    if user_id:
        conv_id = data.get("conversation_id")
        user = User.query.get(user_id)
        emit("user_typing", {
            "conversation_id": conv_id,
            "user_id": user_id,
            "username": user.username if user else "Unknown",
        }, room=f"conv_{conv_id}", include_self=False)


@socketio.on("stop_typing")
def handle_stop_typing(data):
    from flask import request as flask_request
    user_id = _get_user_id_from_sid(flask_request.sid)

    if user_id:
        conv_id = data.get("conversation_id")
        emit("user_stop_typing", {
            "conversation_id": conv_id,
            "user_id": user_id,
        }, room=f"conv_{conv_id}", include_self=False)


@socketio.on("mark_seen")
def handle_mark_seen(data):
    """Mark messages as seen."""
    msg_id = data.get("message_id")
    if msg_id:
        msg = Message.query.get(msg_id)
        if msg:
            msg.is_seen = True
            db.session.commit()
            emit("message_seen", {
                "message_id": msg_id,
                "conversation_id": msg.conversation_id,
            }, room=f"conv_{msg.conversation_id}")


@socketio.on("join_conversation")
def handle_join_conversation(data):
    conv_id = data.get("conversation_id")
    if conv_id:
        join_room(f"conv_{conv_id}")


@socketio.on("leave_conversation")
def handle_leave_conversation(data):
    conv_id = data.get("conversation_id")
    if conv_id:
        leave_room(f"conv_{conv_id}")
