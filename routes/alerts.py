import logging

from flask import Blueprint, jsonify, request

from db_config import get_db_cursor

alerts_bp = Blueprint("alerts", __name__)
logger = logging.getLogger(__name__)


@alerts_bp.get("/alerts")
def get_alerts():
    try:
        with get_db_cursor(dictionary=True) as (_connection, cursor):
            cursor.execute(
                """
                SELECT
                    a.alert_id,
                    a.user_id,
                    u.username,
                    a.access_log_id,
                    a.alert_type,
                    a.severity,
                    a.message,
                    a.status,
                    a.created_at
                FROM ALERTS a
                LEFT JOIN USERS u ON a.user_id = u.user_id
                ORDER BY a.created_at DESC
                """
            )
            alerts = cursor.fetchall()

            return jsonify({"count": len(alerts), "alerts": alerts}), 200
    except Exception as exc:
        logger.exception("Failed to fetch alerts")
        return jsonify({"error": "Failed to fetch alerts", "details": str(exc)}), 500


@alerts_bp.put("/alerts/<int:alert_id>/status")
def update_alert_status(alert_id: int):
    """Update the status of an alert."""
    payload = request.get_json(silent=True) or {}
    new_status = payload.get("status", "").upper()

    if new_status not in ("OPEN", "ACKNOWLEDGED", "RESOLVED"):
        return jsonify({"error": "Invalid status. Valid: OPEN, ACKNOWLEDGED, RESOLVED"}), 400

    try:
        with get_db_cursor(dictionary=True) as (connection, cursor):
            cursor.execute(
                "SELECT alert_id, status FROM ALERTS WHERE alert_id = %s LIMIT 1",
                (alert_id,),
            )
            alert = cursor.fetchone()
            if not alert:
                return jsonify({"error": "Alert not found"}), 404

            cursor.execute(
                "UPDATE ALERTS SET status = %s WHERE alert_id = %s",
                (new_status, alert_id),
            )

            cursor.execute(
                """
                INSERT INTO AUDIT_TRAIL (actor_user_id, action, target_type, target_id, metadata)
                VALUES (%s, %s, %s, %s, %s)
                """,
                (None, "UPDATE_ALERT_STATUS", "ALERT", str(alert_id), f"status={new_status}"),
            )

            connection.commit()
            return jsonify({"message": "Alert status updated", "alert_id": alert_id, "status": new_status}), 200
    except Exception as exc:
        logger.exception("Failed to update alert status")
        return jsonify({"error": "Failed to update alert status", "details": str(exc)}), 500


@alerts_bp.get("/audit-trail")
def get_audit_trail():
    """Return audit trail records."""
    try:
        limit = int(request.args.get("limit", 100))
        limit = max(1, min(limit, 500))

        with get_db_cursor(dictionary=True) as (_connection, cursor):
            cursor.execute(
                """
                SELECT
                    at.audit_id,
                    at.actor_user_id,
                    u.username AS actor_username,
                    at.action,
                    at.target_type,
                    at.target_id,
                    at.metadata,
                    at.created_at
                FROM AUDIT_TRAIL at
                LEFT JOIN USERS u ON at.actor_user_id = u.user_id
                ORDER BY at.created_at DESC
                LIMIT %s
                """,
                (limit,),
            )
            records = cursor.fetchall()
            return jsonify({"count": len(records), "audit_trail": records}), 200
    except Exception as exc:
        logger.exception("Failed to fetch audit trail")
        return jsonify({"error": "Failed to fetch audit trail", "details": str(exc)}), 500
