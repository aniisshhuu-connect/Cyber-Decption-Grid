import logging

from flask import Blueprint, jsonify, request

from db_config import get_db_cursor

resources_bp = Blueprint("resources", __name__)
logger = logging.getLogger(__name__)


def _validate_payload(payload: dict):
    required_fields = ["user_id", "resource_id", "access_type", "ip_address"]
    missing = [field for field in required_fields if payload.get(field) in (None, "")]
    if missing:
        return False, f"Missing required fields: {', '.join(missing)}"
    return True, None


@resources_bp.get("/resources")
def get_resources():
    """Return all resources."""
    try:
        with get_db_cursor(dictionary=True) as (_connection, cursor):
            cursor.execute(
                """
                SELECT
                    r.resource_id,
                    r.resource_name,
                    r.resource_type,
                    r.department_id,
                    d.department_name,
                    r.is_sensitive,
                    r.created_at
                FROM RESOURCES r
                LEFT JOIN DEPARTMENTS d ON r.department_id = d.department_id
                ORDER BY r.resource_id
                """
            )
            resources = cursor.fetchall()
            return jsonify({"count": len(resources), "resources": resources}), 200
    except Exception as exc:
        logger.exception("Failed to fetch resources")
        return jsonify({"error": "Failed to fetch resources", "details": str(exc)}), 500


@resources_bp.get("/honeytokens")
def get_honeytokens():
    """Return all honeytokens."""
    try:
        with get_db_cursor(dictionary=True) as (_connection, cursor):
            cursor.execute(
                """
                SELECT
                    h.token_id,
                    h.resource_id,
                    r.resource_name,
                    h.token_name,
                    h.risk_points,
                    h.is_active,
                    h.created_at
                FROM HONEYTOKENS h
                LEFT JOIN RESOURCES r ON h.resource_id = r.resource_id
                ORDER BY h.token_id
                """
            )
            tokens = cursor.fetchall()
            return jsonify({"count": len(tokens), "honeytokens": tokens}), 200
    except Exception as exc:
        logger.exception("Failed to fetch honeytokens")
        return jsonify({"error": "Failed to fetch honeytokens", "details": str(exc)}), 500


@resources_bp.post("/access-resource")
def access_resource():
    """Log a resource access event.

    The SQL triggers on ACCESS_LOGS automatically handle:
    - Creating alerts for honeytoken accesses (trg_honeytoken_alert)
    - Updating user risk scores (trg_honeytoken_risk_update)
    - Recording risk history entries (trg_honeytoken_risk_update)
    """
    payload = request.get_json(silent=True) or {}
    is_valid, validation_error = _validate_payload(payload)
    if not is_valid:
        return jsonify({"error": validation_error}), 400

    user_id = payload.get("user_id")
    resource_id = payload.get("resource_id")
    token_id = payload.get("token_id")
    access_type = payload.get("access_type")
    ip_address = payload.get("ip_address")

    try:
        with get_db_cursor(dictionary=True) as (connection, cursor):
            # Validate user
            cursor.execute(
                "SELECT user_id, risk_score, is_active FROM USERS WHERE user_id = %s LIMIT 1",
                (user_id,),
            )
            user = cursor.fetchone()
            if not user:
                return jsonify({"error": "User not found"}), 404
            if not bool(user["is_active"]):
                return jsonify({"error": "Inactive user cannot access resources"}), 403

            # Validate resource
            cursor.execute(
                "SELECT resource_id, resource_name FROM RESOURCES WHERE resource_id = %s LIMIT 1",
                (resource_id,),
            )
            resource = cursor.fetchone()
            if not resource:
                return jsonify({"error": "Resource not found"}), 404

            is_honeytoken = token_id is not None
            old_risk_score = float(user["risk_score"])

            # Validate honeytoken if specified
            if is_honeytoken:
                cursor.execute(
                    """
                    SELECT token_id, token_name, risk_points, is_active
                    FROM HONEYTOKENS
                    WHERE token_id = %s AND resource_id = %s
                    LIMIT 1
                    """,
                    (token_id, resource_id),
                )
                token = cursor.fetchone()
                if not token:
                    return jsonify({"error": "Honeytoken not found for the specified resource"}), 404
                if not bool(token["is_active"]):
                    return jsonify({"error": "Honeytoken is inactive"}), 400

            # Insert the access log — triggers fire automatically
            cursor.execute(
                """
                INSERT INTO ACCESS_LOGS (
                    user_id,
                    resource_id,
                    token_id,
                    access_type,
                    ip_address,
                    is_honeytoken
                ) VALUES (%s, %s, %s, %s, %s, %s)
                """,
                (user_id, resource_id, token_id, access_type, ip_address, is_honeytoken),
            )
            access_log_id = cursor.lastrowid

            # Record in audit trail
            cursor.execute(
                """
                INSERT INTO AUDIT_TRAIL (actor_user_id, action, target_type, target_id, metadata)
                VALUES (%s, %s, %s, %s, %s)
                """,
                (
                    user_id,
                    "ACCESS_RESOURCE",
                    "RESOURCE",
                    str(resource_id),
                    f"access_type={access_type}; ip={ip_address}; is_honeytoken={is_honeytoken}",
                ),
            )

            connection.commit()

            # Read back the updated risk score
            cursor.execute(
                "SELECT risk_score FROM USERS WHERE user_id = %s LIMIT 1",
                (user_id,),
            )
            updated = cursor.fetchone()
            new_risk_score = float(updated["risk_score"]) if updated else old_risk_score

            return (
                jsonify(
                    {
                        "message": "Access event recorded",
                        "access_log_id": access_log_id,
                        "is_honeytoken": is_honeytoken,
                        "risk_points_added": int(new_risk_score - old_risk_score),
                        "old_risk_score": old_risk_score,
                        "new_risk_score": new_risk_score,
                    }
                ),
                201,
            )
    except Exception as exc:
        logger.exception("Error while processing /access-resource")
        return jsonify({"error": "Failed to process resource access", "details": str(exc)}), 500


@resources_bp.delete("/resources/<int:resource_id>")
def delete_resource(resource_id: int):
    """Delete a resource file option (Admin context)."""
    try:
        with get_db_cursor(dictionary=True) as (connection, cursor):
            # Check if resource exists
            cursor.execute("SELECT resource_id, resource_name FROM RESOURCES WHERE resource_id = %s", (resource_id,))
            resource = cursor.fetchone()
            if not resource:
                return jsonify({"error": "Resource not found"}), 404

            # Clean references: Alerts linked to this resource's access logs
            cursor.execute("""
                DELETE a FROM ALERTS a
                INNER JOIN ACCESS_LOGS al ON a.access_log_id = al.log_id
                WHERE al.resource_id = %s
            """, (resource_id,))

            # Clean up ACCESS_LOGS related to the resource
            cursor.execute("DELETE FROM ACCESS_LOGS WHERE resource_id = %s", (resource_id,))
            
            # Clean up HONEYTOKENS related to the resource
            cursor.execute("DELETE FROM HONEYTOKENS WHERE resource_id = %s", (resource_id,))

            # Final delete of resource
            cursor.execute("DELETE FROM RESOURCES WHERE resource_id = %s", (resource_id,))
            
            connection.commit()
            
            return jsonify({
                "message": f"Resource {resource['resource_name']} and all associated records deleted successfully.",
                "resource_id": resource_id
            }), 200
    except Exception as exc:
        logger.exception("Failed to delete resource")
        return jsonify({"error": "Failed to delete resource", "details": str(exc)}), 500
