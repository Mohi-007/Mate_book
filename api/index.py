import os
import sys
import traceback
from flask import Flask, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

# Health check
@app.route("/api/auth/health")
def health():
    return jsonify({"status": "ok", "message": "Matebook Backend is alive!"})

@app.route("/api/ping")
def ping():
    return jsonify({"status": "pong", "message": "Vercel function is running"}), 200

try:
    current_dir = os.path.dirname(os.path.abspath(__file__))
    parent_dir = os.path.dirname(current_dir)
    backend_dir = os.path.join(parent_dir, 'backend')
    if backend_dir not in sys.path:
        sys.path.insert(0, backend_dir)
    
    from app import create_app
    flask_app = create_app()
    # We use the routes from flask_app but keep 'app' as the main entry
    app = flask_app
except Exception as e:
    error_msg = str(e)
    tb = traceback.format_exc()
    print(f"CRITICAL ERROR: {error_msg}")
    
    @app.route("/api/debug-error")
    def debug_error():
        return jsonify({
            "error": error_msg,
            "traceback": tb.split('\n')
        }), 500

    @app.route("/api/", defaults={"path": ""})
    @app.route("/api/<path:path>")
    def fallback(path):
        return jsonify({
            "error": "Initialization failed",
            "diagnostics": "/api/debug-error"
        }), 500
