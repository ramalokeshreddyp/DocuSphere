# API Documentation

## Base URL
```
http://localhost:3000
```

## Endpoints

### POST /api/notifications/send

Send a notification request to be processed asynchronously.

**Rate Limiting:** This endpoint is rate-limited per user and notification type (default: 5 requests per 60 seconds).

**Request:**
```http
POST /api/notifications/send
Content-Type: application/json

{
  "userId": "user123",
  "type": "email",
  "recipient": "user@example.com",
  "message": "Your order has been shipped!",
  "subject": "Order Shipped"
}
```

**Parameters:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| userId | string | Yes | Unique identifier for the user |
| type | string | Yes | Notification type: `email`, `sms`, or `push` |
| recipient | string | Yes | Recipient address (email, phone, or device token) |
| message | string | Yes | Notification message body |
| subject | string | No | Email/push notification subject |
| template_id | number | No | Template ID to use (overrides message/subject) |

**Success Response (202 Accepted):**
```json
{
  "id": 1,
  "correlationId": "a1b2c3d4-e5f6-7890-1234-567890abcdef",
  "status": "queued"
}
```

**Headers:**
```
X-RateLimit-Limit: 5
X-RateLimit-Remaining: 4
X-RateLimit-Reset: 2026-01-23T16:00:00.000Z
```

**Error Responses:**

**400 Bad Request** - Invalid input:
```json
{
  "message": "\"userId\" is required"
}
```

**429 Too Many Requests** - Rate limit exceeded:
```json
{
  "message": "Too Many Requests",
  "retryAfter": "2026-01-23T16:00:00.000Z",
  "limit": 5,
  "window": "60 seconds"
}
```

**500 Internal Server Error** - Server error:
```json
{
  "message": "Internal Server Error"
}
```

---

### GET /api/notifications/status/:id

Retrieve the status of a notification.

**Request:**
```http
GET /api/notifications/status/1
```

**Success Response (200 OK):**
```json
{
  "id": 1,
  "correlationId": "a1b2c3d4-e5f6-7890-1234-567890abcdef",
  "userId": "user123",
  "type": "email",
  "message": "Your order has been shipped!",
  "recipient": "user@example.com",
  "status": "sent",
  "sentAt": "2026-01-23T15:30:00.000Z",
  "errorDetails": null
}
```

**Status Values:**

| Status | Description |
|--------|-------------|
| queued | Notification is queued for processing |
| sent | Successfully sent to external provider |
| failed | Failed after max retries |
| retried | Currently retrying after temporary failure |
| rate_limited | Rejected due to rate limiting |
| circuit_open | Circuit breaker is open, will retry later |

**Error Response (404 Not Found):**
```json
{
  "message": "Notification not found"
}
```

---

### GET /health

Health check endpoint.

**Response (200 OK):**
```json
{
  "status": "ok"
}
```

---

## Examples

### Send Email Notification
```bash
curl -X POST http://localhost:3000/api/notifications/send \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user123",
    "type": "email",
    "recipient": "john.doe@example.com",
    "message": "Welcome to our platform!",
    "subject": "Welcome"
  }'
```

### Send SMS Notification
```bash
curl -X POST http://localhost:3000/api/notifications/send \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user456",
    "type": "sms",
    "recipient": "+1234567890",
    "message": "Your verification code is 123456"
  }'
```

### Send Push Notification
```bash
curl -X POST http://localhost:3000/api/notifications/send \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user789",
    "type": "push",
    "recipient": "device_token_abc123",
    "message": "You have a new message",
    "subject": "New Message"
  }'
```

### Use Template
```bash
curl -X POST http://localhost:3000/api/notifications/send \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user999",
    "type": "email",
    "recipient": "alice@example.com",
    "message": "Placeholder",
    "template_id": 1
  }'
```

### Check Notification Status
```bash
curl http://localhost:3000/api/notifications/status/1
```

---

## Rate Limiting

### Configuration

Rate limits are configurable via environment variables:
- `RATE_LIMIT_WINDOW`: Time window in seconds (default: 60)
- `RATE_LIMIT_MAX_REQUESTS`: Maximum requests per window (default: 5)

### Rate Limit Headers

All API responses include rate limit headers:
- `X-RateLimit-Limit`: Maximum requests allowed
- `X-RateLimit-Remaining`: Requests remaining in current window
- `X-RateLimit-Reset`: Timestamp when the limit resets

### Per-User, Per-Type Limits

Rate limits are enforced **independently** for each combination of:
- `userId`: Different users have separate rate limits
- `type`: Each notification type (email, sms, push) has its own limit

Example: A user can send 5 emails AND 5 SMS messages per minute.

---

## Circuit Breaker

The worker service implements a circuit breaker pattern when communicating with external notification providers.

### States

1. **CLOSED**: Normal operation, all requests are attempted
2. **OPEN**: Provider is failing, requests fail immediately without attempting
3. **HALF_OPEN**: Testing if provider has recovered

### Configuration

- `CIRCUIT_BREAKER_FAILURE_THRESHOLD`: Consecutive failures before opening (default: 5)
- `CIRCUIT_BREAKER_RESET_TIMEOUT`: Time in ms before attempting recovery (default: 60000)
- `CIRCUIT_BREAKER_HALF_OPEN_MAX_CALLS`: Test calls in half-open state (default: 1)

### Behavior

When the circuit is OPEN, notifications are marked with status `circuit_open` and will be automatically retried once the circuit closes.

---

## Error Handling

All errors follow a consistent format:

```json
{
  "message": "Error description"
}
```

### HTTP Status Codes

| Code | Meaning |
|------|---------|
| 202 | Accepted - Notification queued successfully |
| 400 | Bad Request - Invalid input data |
| 404 | Not Found - Notification ID not found |
| 429 | Too Many Requests - Rate limit exceeded |
| 500 | Internal Server Error - Server-side error |

---

## Message Queue Format

Internal queue message structure (for development reference):

```json
{
  "correlationId": "uuid-v4",
  "userId": "user123",
  "type": "email",
  "message": "Message body",
  "recipient": "user@example.com",
  "subject": "Subject line",
  "logId": 1,
  "timestamp": "2026-01-23T15:30:00.000Z"
}
```

---

## Database Schema

### notification_logs Table

| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER | Primary key, auto-increment |
| correlation_id | UUID | Unique correlation ID for tracking |
| user_id | STRING | User identifier |
| notification_type | ENUM | email, sms, or push |
| message | TEXT | Notification message |
| recipient | STRING | Recipient address |
| status | ENUM | queued, sent, failed, retried, rate_limited, circuit_open |
| sent_at | TIMESTAMP | When notification was sent |
| error_details | TEXT | Error message if failed |

### notification_templates Table

| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER | Primary key, auto-increment |
| name | STRING | Template name |
| subject_template | STRING | Subject template |
| body_template | TEXT | Message body template |
| type | ENUM | email, sms, or push |

---

## Testing

### Test Rate Limiting

```bash
# Send 6 requests rapidly (5 should succeed, 1 should be rate-limited)
for i in {1..6}; do
  curl -X POST http://localhost:3000/api/notifications/send \
    -H "Content-Type: application/json" \
    -d "{\"userId\":\"test-user\",\"type\":\"email\",\"recipient\":\"test@example.com\",\"message\":\"Test $i\"}"
  echo ""
done
```

### Test Circuit Breaker

The mock provider is configured with a failure rate (default 30%). Monitor worker logs to see circuit breaker state transitions:

```bash
docker-compose logs -f worker-service
```

Look for:
- `[CIRCUIT-BREAKER] State transition: CLOSED → OPEN`
- `[CIRCUIT-BREAKER] State transition: OPEN → HALF_OPEN`
- `[CIRCUIT-BREAKER] State transition: HALF_OPEN → CLOSED`
