# API Documentation

## POST /api/notifications/send
- **Description**: Accepts notification request and enqueues for async processing.
- **Status codes**: `202` on accept, `400` for validation errors, `404` when `template_id` missing.
- **Request body**:
```json
{
  "type": "email | sms | push",
  "recipient": "string",
  "subject": "string (optional)",
  "body": "string (optional)",
  "template_id": 1
}
```
- **Response**:
```json
{ "id": 1, "status": "pending" }
```

## GET /api/notifications/status/{id}
- **Description**: Returns status from `notification_logs`.
- **Status codes**: `200` when found, `404` when unknown.
- **Response**:
```json
{
  "id": 1,
  "type": "email",
  "recipient": "user@example.com",
  "status": "pending | sent | failed | retried",
  "sent_at": "2026-01-23T00:00:00.000Z",
  "error_message": "string|null"
}
```

## Health
- `GET /health` returns `{ "status": "ok" }` for compose healthcheck.
