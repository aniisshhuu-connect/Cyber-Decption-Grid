# SentinelX Frontend

Vanilla HTML/CSS/JavaScript UI for SentinelX.

## Run Locally

From project root:

```bash
cd frontend
python3 -m http.server 8080
```

Open: `http://localhost:8080`

## Backend API

By default the frontend uses same-origin endpoints:
- `/login`
- `/alerts`
- `/logs`
- `/user-risk/<id>`

If backend runs on a different host/port, add this before page scripts:

```html
<script>window.SENTINELX_API_BASE = 'http://localhost:5000';</script>
```

## Dummy Data Mode

If API calls fail, frontend automatically falls back to embedded dummy data for:
- Alerts
- Access logs
- User risk details

This allows UI testing without backend availability.
