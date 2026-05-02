# Backend (Flask + MySQL)

Production-style backend for SentinelX, an insider threat detection platform using honeytokens.

## Features

- Authentication: `POST /login`
- Resource access tracking with honeytoken risk escalation: `POST /access-resource`
- Alerts retrieval: `GET /alerts`
- Access logs retrieval: `GET /logs`
- User risk profile and risk history: `GET /user-risk/<user_id>`
- MySQL connection pooling and parameterized queries
- JSON error handling + optional CORS + structured logging
- Frontend served by Flask from `frontend/` (single-origin UI + API)

## Project Structure

```text
.
├── app.py
├── db_config.py
├── requirements.txt
├── schema.sql
├── .env.example
├── models/
│   └── __init__.py
├── frontend/
│   ├── index.html
│   ├── login.html
│   ├── dashboard.html
│   ├── alerts.html
│   ├── logs.html
│   ├── user-risk.html
│   ├── styles.css
│   └── js/
│       ├── api.js
│       ├── common.js
│       ├── dashboard.js
│       ├── alerts.js
│       ├── logs.js
│       ├── risk.js
│       ├── login.js
│       ├── charts-helper.js
│       └── dummy-data.js
└── routes/
    ├── __init__.py
    ├── auth.py
    ├── resources.py
    ├── alerts.py
    ├── logs.py
    └── users.py
```

## Setup

1. Create a virtual environment and install dependencies:

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

2. Create database schema:

```bash
mysql -u root -p < schema.sql
```

3. Configure environment:

```bash
cp .env.example .env
# Then edit .env with your MySQL credentials
```

4. Run Flask app:

```bash
python app.py
```

Server will start at `http://localhost:5000`.

### Accessing UI and APIs

- Frontend UI: `http://localhost:5000/` (redirects to login page)
- API endpoints (same origin):
  - `POST /login`
  - `POST /access-resource`
  - `GET /alerts`
  - `GET /logs`
  - `GET /user-risk/<user_id>`

## API Examples

### 1) Login

Endpoint: `POST /login`

Request:

```json
{
  "username": "alice",
  "password": "MySecurePassword123",
  "ip_address": "192.168.1.20"
}
```

Success response:

```json
{
  "message": "Login successful",
  "user": {
    "user_id": 1,
    "username": "alice",
    "role_id": 2,
    "department_id": 1,
    "risk_score": 0.0
  }
}
```

Failure response:

```json
{
  "error": "Invalid username or password"
}
```

### 2) Access Resource (Normal)

Endpoint: `POST /access-resource`

Request:

```json
{
  "user_id": 1,
  "resource_id": 101,
  "token_id": null,
  "access_type": "READ",
  "ip_address": "192.168.1.20"
}
```

Response:

```json
{
  "message": "Access event recorded",
  "access_log_id": 501,
  "is_honeytoken": false,
  "risk_points_added": 0,
  "old_risk_score": 5.0,
  "new_risk_score": 5.0,
  "alert_id": null
}
```

### 3) Access Resource (Honeytoken Hit)

Endpoint: `POST /access-resource`

Request:

```json
{
  "user_id": 1,
  "resource_id": 101,
  "token_id": 9001,
  "access_type": "READ",
  "ip_address": "192.168.1.20"
}
```

Response:

```json
{
  "message": "Access event recorded",
  "access_log_id": 502,
  "is_honeytoken": true,
  "risk_points_added": 20,
  "old_risk_score": 5.0,
  "new_risk_score": 25.0,
  "alert_id": 77
}
```

### 4) Get Alerts

Endpoint: `GET /alerts`

Response:

```json
{
  "count": 1,
  "alerts": [
    {
      "alert_id": 77,
      "user_id": 1,
      "username": "alice",
      "access_log_id": 502,
      "alert_type": "HONEYTOKEN_ACCESS",
      "severity": "HIGH",
      "message": "User 1 accessed honeytoken 9001 on resource 101",
      "status": "OPEN",
      "created_at": "2026-04-20T10:21:31"
    }
  ]
}
```

### 5) Get Access Logs

Endpoint: `GET /logs?limit=100`

Response:

```json
{
  "count": 2,
  "logs": [
    {
      "log_id": 502,
      "user_id": 1,
      "username": "alice",
      "resource_id": 101,
      "resource_name": "Finance S3 Report",
      "token_id": 9001,
      "access_type": "READ",
      "ip_address": "192.168.1.20",
      "is_honeytoken": 1,
      "access_time": "2026-04-20T10:21:31"
    }
  ]
}
```

### 6) Get User Risk

Endpoint: `GET /user-risk/1`

Response:

```json
{
  "user": {
    "user_id": 1,
    "username": "alice",
    "risk_score": 25.0,
    "role_id": 2,
    "department_id": 1,
    "is_active": true
  },
  "risk_history_count": 1,
  "risk_history": [
    {
      "risk_event_id": 44,
      "old_score": 5.0,
      "points_added": 20,
      "new_score": 25.0,
      "reason": "Honeytoken access detected for resource_id=101, token_id=9001",
      "event_time": "2026-04-20T10:21:31"
    }
  ]
}
```

## Notes

- Passwords must be stored as hashes in `USERS.password_hash`.
- Use `werkzeug.security.generate_password_hash` when creating users.
- Every SQL call uses parameterized placeholders (`%s`) to reduce SQL injection risk.
