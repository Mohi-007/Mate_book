import os
from dotenv import load_dotenv
from flask import Flask, send_from_directory
from app.config import Config
from app.extensions import db, jwt, bcrypt, cors

# Load .env file
load_dotenv(os.path.join(os.path.dirname(os.path.dirname(__file__)), '.env'))


def create_app():
    flask_app = Flask(__name__)
    flask_app.config.from_object(Config)

    # Initialize extensions
    db.init_app(flask_app)
    jwt.init_app(flask_app)
    bcrypt.init_app(flask_app)
    cors.init_app(flask_app, origins=Config.CORS_ORIGINS, supports_credentials=True)
    # socketio.init_app(flask_app, cors_allowed_origins="*", async_mode="eventlet") # Removed for Vercel

    # Ensure upload directory exists
    os.makedirs(Config.UPLOAD_FOLDER, exist_ok=True)

    # Serve uploaded files
    @flask_app.route("/uploads/<path:filename>")
    def serve_upload(filename):
        return send_from_directory(Config.UPLOAD_FOLDER, filename)

    # Register blueprints
    from app.routes.auth import auth_bp
    from app.routes.posts import posts_bp
    from app.routes.chat import chat_bp
    from app.routes.stories import stories_bp
    from app.routes.friends import friends_bp
    from app.routes.news import news_bp
    from app.routes.features import features_bp
    from app.routes.admin import admin_bp

    flask_app.register_blueprint(auth_bp)
    flask_app.register_blueprint(posts_bp)
    flask_app.register_blueprint(chat_bp)
    flask_app.register_blueprint(stories_bp)
    flask_app.register_blueprint(friends_bp)
    flask_app.register_blueprint(news_bp)
    flask_app.register_blueprint(features_bp)
    flask_app.register_blueprint(admin_bp)

    return flask_app
