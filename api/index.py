import os
import sys
import traceback
from flask import Flask, jsonify

# Vercel structure check:
# /api/index.py
# /backend/app/__init__.py
current_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.dirname(current_dir)
backend_path = os.path.join(parent_dir, 'backend')

if backend_path not in sys.path:
    sys.path.insert(0, backend_path)

def get_app():
    # Fallback/Diagnostic app base
    fallback_app = Flask(__name__)

    def add_diag_routes(target_app, error=None):
        @target_app.route("/api/health")
        @target_app.route("/api/auth/health")
        def health():
            if error:
                return jsonify({"status": "error", "message": str(error)}), 500
            return jsonify({"status": "ok", "message": "App is running"}), 200

        @target_app.route("/api/diag")
        def diag():
            return jsonify({
                "error": str(error) if error else None,
                "path": sys.path,
                "env_vars": {k: "SET" for k in os.environ},
                "cwd": os.getcwd()
            }), 200
        return target_app

    try:
        from app import create_app
        flask_app = create_app()
        return add_diag_routes(flask_app)
    except Exception as e:
        print(f"FAILED TO LOAD APP: {e}")
        traceback.print_exc()
        return add_diag_routes(fallback_app, error=e)

app = get_app()
