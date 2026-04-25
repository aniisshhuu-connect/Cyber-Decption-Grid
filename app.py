import logging
import os
from datetime import datetime, date
from decimal import Decimal

from flask import Flask, jsonify, request, send_from_directory
from flask.json.provider import DefaultJSONProvider
from flask_cors import CORS
from dotenv import load_dotenv

from routes.alerts import alerts_bp
from routes.auth import auth_bp
from routes.logs import logs_bp
from routes.resources import resources_bp
from routes.users import users_bp

ASSET_EXTENSIONS = {
    ".css",
    ".js",
    ".mjs",
    ".png",
    ".jpg",
    ".jpeg",
    ".gif",
    ".svg",
    ".webp",
    ".ico",
    ".woff",
    ".woff2",
    ".ttf",
}


class SentinelXJSONProvider(DefaultJSONProvider):
    """Custom JSON provider to handle MySQL data types."""

    def default(self, obj):
        if isinstance(obj, Decimal):
            return float(obj)
        if isinstance(obj, datetime):
            return obj.isoformat()
        if isinstance(obj, date):
            return obj.isoformat()
        if isinstance(obj, bytes):
            return bool(obj[0]) if len(obj) == 1 else obj.decode("utf-8", errors="replace")
        return super().default(obj)


def configure_logging() -> None:
    logging.basicConfig(
        level=os.getenv("LOG_LEVEL", "INFO").upper(),
        format="%(asctime)s | %(levelname)s | %(name)s | %(message)s",
    )


def create_app() -> Flask:
    load_dotenv()
    configure_logging()

    app = Flask(__name__)
    app.json_provider_class = SentinelXJSONProvider
    app.json = SentinelXJSONProvider(app)
    app.config["JSON_SORT_KEYS"] = False
    frontend_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "frontend")

    if os.getenv("ENABLE_CORS", "true").lower() == "true":
        CORS(app)

    app.register_blueprint(auth_bp)
    app.register_blueprint(resources_bp)
    app.register_blueprint(alerts_bp)
    app.register_blueprint(logs_bp)
    app.register_blueprint(users_bp)

    @app.after_request
    def apply_cache_policy(response):
        path = request.path.lower()

        if path.startswith("/health"):
            response.headers["Cache-Control"] = "no-store"
            return response

        if response.mimetype == "application/json":
            response.headers["Cache-Control"] = "no-store, private"
            return response

        if path.endswith(".html") or path == "/":
            response.headers["Cache-Control"] = "no-cache, no-store, must-revalidate"
            response.headers["Pragma"] = "no-cache"
            response.headers["Expires"] = "0"
            return response

        if any(path.endswith(ext) for ext in ASSET_EXTENSIONS):
            response.headers["Cache-Control"] = "public, max-age=86400, stale-while-revalidate=300"
            return response

        response.headers["Cache-Control"] = "no-store"
        return response

    if os.path.isdir(frontend_dir):
        @app.get("/")
        def serve_index():
            return send_from_directory(frontend_dir, "index.html")

        @app.get("/<path:path>")
        def serve_frontend(path):
            requested_file = os.path.join(frontend_dir, path)
            if os.path.isfile(requested_file):
                return send_from_directory(frontend_dir, path)
            return send_from_directory(frontend_dir, "index.html")

    @app.get("/health")
    def health_check():
        return jsonify({"status": "ok", "service": "SentinelX backend"}), 200

    @app.errorhandler(404)
    def not_found(_error):
        return jsonify({"error": "Endpoint not found"}), 404

    @app.errorhandler(500)
    def internal_server_error(_error):
        return jsonify({"error": "Internal server error"}), 500

    return app


if __name__ == "__main__":
    flask_app = create_app()
    flask_app.run(host="0.0.0.0", port=int(os.getenv("PORT", "5000")), debug=True)
