import logging

from flask import Blueprint, jsonify, request
from werkzeug.security import check_password_hash, generate_password_hash

from db_config import get_db_cursor

auth_bp = Blueprint("auth", __name__)
logger = logging.getLogger(__name__)


@auth_bp.post("/login")
def login():
    payload = request.get_json(silent=True) or {}
    username = payload.get("username")
    password = payload.get("password")
    ip_address = payload.get("ip_address")
    user_agent = request.headers.get("User-Agent", "")

    if not username or not password:
        return jsonify({"error": "username and password are required"}), 400

    try:
        with get_db_cursor(dictionary=True) as (connection, cursor):
            cursor.execute(
                """
                SELECT u.user_id, u.username, u.password_hash,
                       u.role_id, r.role_name,
                       u.department_id, u.risk_score, u.is_active
                FROM USERS u
                LEFT JOIN ROLES r ON u.role_id = r.role_id
                WHERE u.username = %s
                LIMIT 1
                """,
                (username,),
            )
            user = cursor.fetchone()

            if not user or not bool(user["is_active"]) or not check_password_hash(user["password_hash"], password):
                cursor.execute(
                    """
                    INSERT INTO LOGIN_HISTORY (
                        user_id,
                        username_attempted,
                        ip_address,
                        user_agent,
                        login_status,
                        failure_reason
                    ) VALUES (%s, %s, %s, %s, %s, %s)
                    """,
                    (
                        user["user_id"] if user else None,
                        username,
                        ip_address,
                        user_agent,
                        "FAILED",
                        "Invalid credentials or inactive account",
                    ),
                )
                connection.commit()
                return jsonify({"error": "Invalid username or password"}), 401

            cursor.execute(
                """
                INSERT INTO LOGIN_HISTORY (
                    user_id,
                    username_attempted,
                    ip_address,
                    user_agent,
                    login_status,
                    failure_reason
                ) VALUES (%s, %s, %s, %s, %s, %s)
                """,
                (user["user_id"], username, ip_address, user_agent, "SUCCESS", None),
            )
            connection.commit()

            return (
                jsonify(
                    {
                        "message": "Login successful",
                        "user": {
                            "user_id": user["user_id"],
                            "username": user["username"],
                            "role_id": user["role_id"],
                            "role_name": user["role_name"] or "Unknown",
                            "department_id": user["department_id"],
                            "risk_score": float(user["risk_score"]),
                        },
                    }
                ),
                200,
            )
    except Exception as exc:
        logger.exception("Login failed due to server error")
        return jsonify({"error": "Login failed", "details": str(exc)}), 500


@auth_bp.post("/register")
def register():
    payload = request.get_json(silent=True) or {}
    username = payload.get("username", "").strip()
    password = payload.get("password", "")
    role = payload.get("role", "").strip()

    if not username or not password or not role:
        return jsonify({"error": "username, password, and role are required"}), 400

    if len(password) < 6:
        return jsonify({"error": "Password must be at least 6 characters"}), 400

    # Map role names to role_ids
    role_map = {
        "Admin": 1,
        "Security Analyst": 2,
        "Employee": 3,
    }
    role_id = role_map.get(role)
    if not role_id:
        return jsonify({"error": f"Invalid role. Valid roles: {', '.join(role_map.keys())}"}), 400

    try:
        with get_db_cursor(dictionary=True) as (connection, cursor):
            # Check for existing username
            cursor.execute(
                "SELECT user_id FROM USERS WHERE username = %s LIMIT 1",
                (username,),
            )
            if cursor.fetchone():
                return jsonify({"error": "Username already exists"}), 409

            password_hash = generate_password_hash(password)
            cursor.execute(
                """
                INSERT INTO USERS (username, password_hash, role_id, department_id, risk_score, is_active)
                VALUES (%s, %s, %s, %s, %s, %s)
                """,
                (username, password_hash, role_id, 1, 0.0, True),
            )
            new_user_id = cursor.lastrowid

            # Initial risk baseline
            cursor.execute(
                """
                INSERT INTO RISK_HISTORY (user_id, old_score, points_added, new_score, reason)
                VALUES (%s, %s, %s, %s, %s)
                """,
                (new_user_id, 0, 8, 8, "New account baseline"),
            )
            cursor.execute(
                "UPDATE USERS SET risk_score = 8 WHERE user_id = %s",
                (new_user_id,),
            )

            # Audit
            cursor.execute(
                """
                INSERT INTO AUDIT_TRAIL (actor_user_id, action, target_type, target_id, metadata)
                VALUES (%s, %s, %s, %s, %s)
                """,
                (None, "REGISTER_USER", "USER", str(new_user_id), f"role={role}"),
            )

            connection.commit()

            return (
                jsonify(
                    {
                        "message": "Registration successful",
                        "user_id": new_user_id,
                        "username": username,
                        "role": role,
                    }
                ),
                201,
            )
    except Exception as exc:
        logger.exception("Registration failed")
        return jsonify({"error": "Registration failed", "details": str(exc)}), 500
