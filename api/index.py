from flask import Flask, jsonify
import sys
import os

app = Flask(__name__)

@app.route("/api/ping")
def ping():
    return jsonify({"status": "ok", "message": "Pong from Vercel minimal app"}), 200

@app.route("/api/health")
def health():
    return jsonify({"status": "ok", "message": "Minimal health check works"}), 200

@app.route("/api/debug")
def debug():
    return jsonify({
        "sys_path": sys.path,
        "cwd": os.getcwd(),
        "env": dict(os.environ)
    }), 200

@app.route("/", defaults={"path": ""})
@app.route("/<path:path>")
def catch_all(path):
    return jsonify({"message": f"Path {path} not found in minimal app"}), 404
