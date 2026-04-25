import logging

from flask import Blueprint, jsonify, request

from db_config import get_db_cursor

users_bp = Blueprint("users", __name__)
logger = logging.getLogger(__name__)


@users_bp.get("/users")
def get_all_users():
    """Return all users with role and department info."""
    try:
        with get_db_cursor(dictionary=True) as (_connection, cursor):
            cursor.execute(
                """
                SELECT
                    u.user_id,
                    u.username,
                    u.role_id,
                    r.role_name,
                    u.department_id,
                    d.department_name,
                    u.risk_score,
                    u.is_active,
                    u.created_at
                FROM USERS u
                LEFT JOIN ROLES r ON u.role_id = r.role_id
                LEFT JOIN DEPARTMENTS d ON u.department_id = d.department_id
                ORDER BY u.user_id
                """
            )
            users = cursor.fetchall()
            # Convert Decimal and bool for JSON
            for u in users:
                u["risk_score"] = float(u["risk_score"])
                u["is_active"] = bool(u["is_active"])
            return jsonify({"count": len(users), "users": users}), 200
    except Exception as exc:
        logger.exception("Failed to fetch users")
        return jsonify({"error": "Failed to fetch users", "details": str(exc)}), 500


@users_bp.get("/user-risk/<int:user_id>")
def get_user_risk(user_id: int):
    try:
        with get_db_cursor(dictionary=True) as (_connection, cursor):
            cursor.execute(
                """
                SELECT u.user_id, u.username, u.risk_score,
                       u.role_id, r.role_name,
                       u.department_id, u.is_active
                FROM USERS u
                LEFT JOIN ROLES r ON u.role_id = r.role_id
                WHERE u.user_id = %s
                LIMIT 1
                """,
                (user_id,),
            )
            user = cursor.fetchone()
            if not user:
                return jsonify({"error": "User not found"}), 404

            cursor.execute(
                """
                SELECT risk_event_id, old_score, points_added, new_score, reason, event_time
                FROM RISK_HISTORY
                WHERE user_id = %s
                ORDER BY event_time DESC
                LIMIT 50
                """,
                (user_id,),
            )
            history = cursor.fetchall()

            return (
                jsonify(
                    {
                        "user": {
                            "user_id": user["user_id"],
                            "username": user["username"],
                            "risk_score": float(user["risk_score"]),
                            "role_id": user["role_id"],
                            "role_name": user.get("role_name", "Unknown"),
                            "department_id": user["department_id"],
                            "is_active": bool(user["is_active"]),
                        },
                        "risk_history_count": len(history),
                        "risk_history": history,
                    }
                ),
                200,
            )
    except Exception as exc:
        logger.exception("Failed to fetch user risk")
        return jsonify({"error": "Failed to fetch user risk", "details": str(exc)}), 500


@users_bp.put("/users/<int:user_id>/toggle-lock")
def toggle_lock_user(user_id: int):
    """Toggle user active/locked status."""
    try:
        with get_db_cursor(dictionary=True) as (connection, cursor):
            cursor.execute(
                "SELECT user_id, username, is_active FROM USERS WHERE user_id = %s LIMIT 1",
                (user_id,),
            )
            user = cursor.fetchone()
            if not user:
                return jsonify({"error": "User not found"}), 404

            new_status = not bool(user["is_active"])
            cursor.execute(
                "UPDATE USERS SET is_active = %s WHERE user_id = %s",
                (new_status, user_id),
            )

            action = "UNLOCK_USER" if new_status else "LOCK_USER"
            cursor.execute(
                """
                INSERT INTO AUDIT_TRAIL (actor_user_id, action, target_type, target_id, metadata)
                VALUES (%s, %s, %s, %s, %s)
                """,
                (None, action, "USER", str(user_id), f"username={user['username']}"),
            )

            connection.commit()
            return jsonify({
                "message": f"User {'unlocked' if new_status else 'locked'}",
                "user_id": user_id,
                "is_active": new_status,
            }), 200
    except Exception as exc:
        logger.exception("Failed to toggle user lock")
        return jsonify({"error": "Operation failed", "details": str(exc)}), 500


@users_bp.delete("/users/<int:user_id>")
def delete_user(user_id: int):
    """Delete a user and all their associated records (Admin only context)."""
    try:
        with get_db_cursor(dictionary=True) as (connection, cursor):
            # Check if user exists
            cursor.execute("SELECT user_id, username FROM USERS WHERE user_id = %s", (user_id,))
            user = cursor.fetchone()
            if not user:
                return jsonify({"error": "User not found"}), 404

            # Before deleting, we must clean up foreign key references:
            # 1. ALERTS (where user_id matches)
            # 2. LOGIN_HISTORY (where user_id matches)
            # 3. RISK_HISTORY (where user_id matches)
            # 4. ACCESS_LOGS (where user_id matches)
            # 5. AUDIT_TRAIL (where actor_user_id matches)
            
            cursor.execute("DELETE FROM ALERTS WHERE user_id = %s", (user_id,))
            cursor.execute("DELETE FROM LOGIN_HISTORY WHERE user_id = %s", (user_id,))
            cursor.execute("DELETE FROM RISK_HISTORY WHERE user_id = %s", (user_id,))
            cursor.execute("DELETE FROM ACCESS_LOGS WHERE user_id = %s", (user_id,))
            
            # For audit trail, we can nullify or delete. We'll delete to keep it fully removed.
            cursor.execute("DELETE FROM AUDIT_TRAIL WHERE actor_user_id = %s", (user_id,))

            # Finally delete the user
            cursor.execute("DELETE FROM USERS WHERE user_id = %s", (user_id,))
            
            connection.commit()
            
            return jsonify({
                "message": f"User {user['username']} and all associated records deleted successfully.",
                "user_id": user_id
            }), 200
    except Exception as exc:
        logger.exception("Failed to delete user")
        return jsonify({"error": "Failed to delete user", "details": str(exc)}), 500
