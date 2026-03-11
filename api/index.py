import os
import sys
import traceback
from flask import Flask, jsonify

# Ensure the backend directory is in the path
# This assumes the 'backend' folder is in the same directory as the 'api' folder (root deployment)
current_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.dirname(current_dir)
backend_dir = os.path.join(parent_dir, 'backend')

if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

app = None

try:
    from app import create_app
    app = create_app()
except Exception as e:
    error_msg = str(e)
    tb = traceback.format_exc()
    print(f"CRITICAL ERROR during app initialization: {error_msg}")
    print(tb)
    
    # Fallback app for diagnostics
    app = Flask(__name__)
    
    @app.route("/api/debug-error")
    def debug_error():
        # Check for common issues
        db_url = os.environ.get("DATABASE_URL")
        diag = {
            "error": error_msg,
            "traceback": tb.split('\n'),
            "sys_path": sys.path,
            "cwd": os.getcwd(),
            "env_vars_present": {
                "DATABASE_URL": bool(db_url),
                "SUPABASE_URL": bool(os.environ.get("SUPABASE_URL")),
                "JWT_SECRET_KEY": bool(os.environ.get("JWT_SECRET_KEY"))
            }
        }
        return jsonify(diag), 500

    @app.route("/", defaults={"path": ""})
    @app.route("/<path:path>")
    def fallback(path):
        return jsonify({
            "error": "Backend initialization failed",
            "message": "The server encountered an error while starting the Flask application.",
            "diagnostics": "/api/debug-error"
        }), 500

# Vercel needs 'app' to be the Flask instance
if not app:
    app = Flask(__name__)
    @app.route("/<path:path>")
    def emergency_fallback(path):
        return "Critical Failure: App instance not created.", 500
