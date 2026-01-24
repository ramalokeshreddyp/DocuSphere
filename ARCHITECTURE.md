# Architecture

## Components
- **API service (Express)**: Validates requests, resolves optional templates, writes `notification_logs` with `pending`, and publishes to RabbitMQ.
- **RabbitMQ**: `notification_queue` for live work, `notification_dlq` for terminal failures.
- **Worker service**: Consumes queue, fetches templates if referenced, processes notification (mocked console log), applies retry with exponential backoff, updates log status, and moves hopeless messages to DLQ.
- **Postgres**: Stores `notification_templates` (seeded on startup) and `notification_logs` for status tracking.

## Data model
- `notification_templates(id, name, subject_template, body_template, type)`
- `notification_logs(id, notification_type, recipient, status, sent_at, error_message)`

## Message flow
1. `POST /api/notifications/send` validates payload and optional `template_id`.
2. API seeds DB at startup, records `pending` log, publishes message `{type, recipient, subject, body, template_id?, logId}`.
3. Worker consumes with `prefetch`, retries up to 3 times (`1s, 2s, 4s` backoff). On success: log `sent`. On transient error: log `retried` and requeue. On exhausted retries or fatal (missing template): log `failed` and push to DLQ.
4. `GET /api/notifications/status/{id}` reads `notification_logs` for status.

## Reliability notes
- DLQ configured via RabbitMQ dead-letter routing.
- Health checks: API `/health`, RabbitMQ diagnostics, Postgres `pg_isready`, worker basic liveness.
- Tests run with SQLite in-memory to keep them fast and isolated.
