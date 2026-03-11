import os
from functools import wraps
from flask import request, jsonify
from flask_jwt_extended import get_jwt_identity, verify_jwt_in_request
from werkzeug.utils import secure_filename
from app.config import Config
from supabase import create_client, Client

supabase: Client = None
if Config.SUPABASE_URL and Config.SUPABASE_KEY:
    try:
        supabase = create_client(Config.SUPABASE_URL, Config.SUPABASE_KEY)
    except Exception as e:
        print(f"Supabase init error: {e}")

ALLOWED_EXTENSIONS = {"png", "jpg", "jpeg", "gif", "webp", "mp4", "webm"}


def allowed_file(filename):
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS


def save_upload(file, upload_folder, bucket_name="matebook"):
    """Save an uploaded file and return its URL or relative path."""
    if not file or not allowed_file(file.filename):
        return None

    filename = secure_filename(file.filename)
    import time
    filename = f"{int(time.time())}_{filename}"

    # Try cloud upload first
    if supabase:
        try:
            # We need to read file content
            file_content = file.read()
            # Reset file pointer just in case
            file.seek(0)
            
            res = supabase.storage.from_(bucket_name).upload(
                path=filename,
                file=file_content,
                file_options={"content-type": file.content_type}
            )
            # URL format: {URL}/storage/v1/object/public/{bucket}/{path}
            public_url = f"{Config.SUPABASE_URL}/storage/v1/object/public/{bucket_name}/{filename}"
            return public_url
        except Exception as e:
            print(f"Supabase upload error: {e}")
            # Fallback to local
    
    # Local fallback
    os.makedirs(upload_folder, exist_ok=True)
    filepath = os.path.join(upload_folder, filename)
    file.save(filepath)
    return f"/uploads/{filename}"


def admin_required(fn):
    """Decorator that requires admin privileges."""
    @wraps(fn)
    def wrapper(*args, **kwargs):
        verify_jwt_in_request()
        from app.models.user import User
        user = User.query.get(get_jwt_identity())
        if not user or not user.is_admin:
            return jsonify({"error": "Admin access required"}), 403
        return fn(*args, **kwargs)
    return wrapper
