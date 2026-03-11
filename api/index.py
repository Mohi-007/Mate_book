import os
import sys
from flask import Flask, jsonify
from flask_cors import CORS

# Path setup for Vercel functions
current_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.dirname(current_dir)
backend_path = os.path.join(parent_dir, 'backend')

if backend_path not in sys.path:
    sys.path.insert(0, backend_path)

def get_app():
    try:
        from app import create_app
        flask_app = create_app()
        return flask_app
    except Exception as e:
        # Fallback app for critical startup errors
        err_app = Flask(__name__)
        CORS(err_app)
        
        @err_app.route("/api/health")
        @err_app.route("/api/auth/health")
        def health_err():
            return jsonify({"status": "error", "message": str(e)}), 500
            
        @err_app.route("/", defaults={"path": ""})
        @err_app.route("/<path:path>")
        def catch_all(path):
            return jsonify({"error": "App failed to initialize", "details": str(e)}), 503
            
        return err_app

app = get_app()
