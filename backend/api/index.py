import os
import sys

# Ensure the backend directory is in the path
parent_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if parent_dir not in sys.path:
    sys.path.append(parent_dir)

try:
    from app import create_app
    flask_app = create_app()
    app = flask_app
except Exception as e:
    print(f"CRITICAL ERROR during app initialization: {e}")
    import traceback
    traceback.print_exc()
    # Provide a minimal app that returns the error for debugging
    from flask import Flask
    app = Flask(__name__)
    @app.route("/api/debug-error")
    def debug_error():
        return {"error": str(e), "traceback": traceback.format_exc()}, 500
    @app.route("/api/auth/health")
    def health_error():
        return {"error": "App failed to start. Check /api/debug-error for details."}, 500
    @app.route("/(.*)")
    def fallback(path):
        return {"error": "App failed to start. Check /api/debug-error for details."}, 503
