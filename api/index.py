import os
import sys
import traceback
from flask import Flask, jsonify
from flask_cors import CORS

# Path setup: add 'backend' to sys.path so 'from app import ...' works
# Structure:
# /api/index.py
# /backend/app/__init__.py
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
        print(f"FAILED TO LOAD APP: {e}")
        traceback.print_exc()
        
        # Fallback diagnostics app
        diag_app = Flask(__name__)
        CORS(diag_app)
        
        @diag_app.route("/api/health")
        @diag_app.route("/api/auth/health")
        def health():
            return jsonify({"status": "error", "message": "App failed to load. Check /api/diag."}), 500
            
        @diag_app.route("/api/diag")
        def diag():
            return jsonify({
                "error": str(e),
                "traceback": traceback.format_exc().split('\n'),
                "path": sys.path,
                "cwd": os.getcwd()
            }), 500
            
        @diag_app.route("/", defaults={"path": ""})
        @diag_app.route("/<path:path>")
        def catch_all(path):
            return jsonify({"error": "Initialization failure"}), 503
            
        return diag_app

app = get_app()
