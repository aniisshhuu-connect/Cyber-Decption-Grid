import logging

from flask import Blueprint, jsonify, request

from db_config import get_db_cursor

logs_bp = Blueprint("logs", __name__)
logger = logging.getLogger(__name__)


@logs_bp.get("/logs")
def get_logs():
    try:
        limit = int(request.args.get("limit", 100))
        limit = max(1, min(limit, 1000))

        with get_db_cursor(dictionary=True) as (_connection, cursor):
            cursor.execute(
                """
                SELECT
                    l.log_id,
                    l.user_id,
                    u.username,
                    l.resource_id,
                    r.resource_name,
                    l.token_id,
                    l.access_type,
                    l.ip_address,
                    l.is_honeytoken,
                    l.access_time
                FROM ACCESS_LOGS l
                LEFT JOIN USERS u ON l.user_id = u.user_id
                LEFT JOIN RESOURCES r ON l.resource_id = r.resource_id
                ORDER BY l.access_time DESC
                LIMIT %s
                """,
                (limit,),
            )
            logs = cursor.fetchall()

            return jsonify({"count": len(logs), "logs": logs}), 200
    except ValueError:
        return jsonify({"error": "limit must be a valid integer"}), 400
    except Exception as exc:
        logger.exception("Failed to fetch access logs")
        return jsonify({"error": "Failed to fetch logs", "details": str(exc)}), 500
