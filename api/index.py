import os
import sys
import traceback
from flask import Flask, jsonify

app = Flask(__name__)

# Very simple health check
@app.route("/api/health")
def health():
    return jsonify({"status": "ok", "message": "Vercel standalone ping works!"})

@app.route("/api/ping")
def ping():
    return jsonify({"status": "pong", "message": "Vercel function is running"}), 200

# Try-except for the actual app, but with app variable already defined
try:
    # We'll just define the parent dir for now but NOT import yet
    current_dir = os.path.dirname(os.path.abspath(__file__))
    parent_dir = os.path.dirname(current_dir)
    backend_dir = os.path.join(parent_dir, 'backend')
    if backend_dir not in sys.path:
        sys.path.insert(0, backend_dir)
    
    # from app import create_app
    # flask_app = create_app()
    # app = flask_app
    pass # Temporarily disabled to debug 500
except Exception as e:
    # Error handling remains same
    pass
