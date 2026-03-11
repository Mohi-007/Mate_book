import os
import sys
import traceback
from flask import Flask, jsonify
from flask_cors import CORS

# Vercel structure check:
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
        print(f"CRITICAL ERROR: {e}")
        traceback.print_exc()
        
        # Fallback app for diagnostics
        err_app = Flask(__name__)
        CORS(err_app)
        
        @err_app.route("/api/health")
        @err_app.route("/api/auth/health")
        def health_err():
            return jsonify({"status": "error", "message": str(e)}), 500
            
        @err_app.route("/api/diag")
        def diag():
            return jsonify({
                "error": str(e),
                "traceback": traceback.format_exc().split('\n'),
                "path": sys.path
            }), 500
            
        return err_app

app = get_app()
