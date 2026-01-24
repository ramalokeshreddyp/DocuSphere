# Asynchronous Notification Service

[![Build Status](https://img.shields.io/badge/build-passing-brightgreen)]()
[![Docker](https://img.shields.io/badge/docker-ready-blue)]()
[![License](https://img.shields.io/badge/license-MIT-green)]()

Production-ready asynchronous notification service built with Express.js, RabbitMQ, PostgreSQL, and background workers. Handles email, SMS, and push notifications with retry logic, dead-letter queues, and full observability.

## Features

✅ RESTful API for notification submission  
✅ Support for Email, SMS, and Push notifications  
✅ Template-based notifications with dynamic content  
✅ Event-driven architecture with RabbitMQ  
✅ Automatic retry with exponential backoff  
✅ Dead Letter Queue for failed messages  
✅ Comprehensive logging and status tracking  
✅ Docker containerization with health checks  
✅ Horizontal scaling support  
✅ Full test coverage

## Quick Start

### Prerequisites
- Docker 20.10+
- Docker Compose 2.0+
- 2GB RAM minimum

### Setup and Run

```bash
# 1. Navigate to project directory
cd mandatory

# 2. Copy environment template
cp .env.example .env

# 3. Start all services (Postgres, RabbitMQ, API, Worker)
docker-compose up --build

# 4. Verify services are healthy
docker-compose ps

# 5. Test health endpoint
curl http://localhost:3000/health
```

Services will be available at:
- **API**: http://localhost:3000
- **RabbitMQ Management**: http://localhost:15672 (guest/guest)
- **Postgres**: localhost:5432

### Send Your First Notification

```bash
# Send an email notification
curl -X POST http://localhost:3000/api/notifications/send \
  -H "Content-Type: application/json" \
  -d '{
    "type": "email",
    "recipient": "user@example.com",
    "subject": "Welcome!",
    "body": "Thanks for joining our service"
  }'

# Response: {"id":1,"status":"pending"}

# Check notification status
curl http://localhost:3000/api/notifications/status/1

# Response: {"id":1,"type":"email","recipient":"user@example.com","status":"sent",...}
```

### View Worker Processing

```bash
docker-compose logs -f worker-service

# Output:
# [EMAIL] To: user@example.com | Subject: Welcome! | Body: Thanks for joining...
```

## Architecture

The service uses an event-driven architecture with the following components:

- **API Service**: Validates requests, resolves templates, logs to database, publishes to queue
- **RabbitMQ**: Message broker with main queue (`notification_queue`) and dead-letter queue (`notification_dlq`)
- **Worker Service**: Consumes messages, processes notifications, handles retries, updates status
- **PostgreSQL**: Stores notification templates and logs

See [ARCHITECTURE.md](ARCHITECTURE.md) for detailed design documentation.

## API Documentation

### POST /api/notifications/send

Send a notification request.

**Request:**
```json
{
  "type": "email|sms|push",
  "recipient": "string",
  "subject": "string (optional)",
  "body": "string (optional)",
  "template_id": 1
}
```

**Response:** `202 Accepted`
```json
{
  "id": 1,
  "status": "pending"
}
```

### GET /api/notifications/status/:id

Get notification status.

**Response:** `200 OK`
```json
{
  "id": 1,
  "type": "email",
  "recipient": "user@example.com",
  "status": "sent|pending|failed|retried",
  "sent_at": "2026-01-23T12:00:00.000Z",
  "error_message": null
}
```

See [API_DOCS.md](API_DOCS.md) for complete API reference.

## Testing

### Run Unit Tests

```bash
# API service tests
cd api-service
npm install
npm test

# Worker service tests
cd worker-service
npm install
npm test
```

### Integration Testing

See [TESTING.md](TESTING.md) for comprehensive testing guide including:
- End-to-end flow testing
- Load testing scenarios
- Error handling verification
- Database validation

## Development

### Local Development (without Docker)

**Requirements:**
- Node.js 20+
- PostgreSQL 16+
- RabbitMQ 3.13+

**API Service:**
```bash
cd api-service
npm install

# Set environment variables
export DB_HOST=localhost
export DB_USER=notification
export DB_PASSWORD=notification
export DB_NAME=notifications
export QUEUE_HOST=localhost

npm run dev
```

**Worker Service:**
```bash
cd worker-service
npm install

# Set same environment variables
npm run dev
```

### Project Structure

```
mandatory/
├── api-service/
│   ├── src/
│   │   ├── app.js                 # Express app setup
│   │   ├── routes/
│   │   │   └── notifications.js   # API routes
│   │   ├── controllers/
│   │   │   └── notificationController.js
│   │   ├── models/               # (via Sequelize)
│   │   ├── config/
│   │   │   ├── database.js       # DB connection & models
│   │   │   └── messageQueue.js   # RabbitMQ setup
│   │   └── validation/
│   │       └── notificationSchema.js
│   ├── tests/
│   ├── Dockerfile
│   └── package.json
├── worker-service/
│   ├── src/
│   │   ├── worker.js             # Worker entry point
│   │   ├── consumers/
│   │   │   └── notificationConsumer.js
│   │   ├── services/
│   │   │   └── notificationProcessor.js
│   │   └── config/
│   ├── tests/
│   ├── Dockerfile
│   └── package.json
├── docker-compose.yml
├── .env.example
├── README.md
├── ARCHITECTURE.md
├── API_DOCS.md
├── TESTING.md
└── DEPLOYMENT.md
```

## Configuration

### Environment Variables

All configuration is via environment variables (see `.env.example`):

```env
# Database
DB_HOST=postgres
DB_PORT=5432
DB_USER=notification
DB_PASSWORD=notification
DB_NAME=notifications

# RabbitMQ
QUEUE_HOST=rabbitmq
QUEUE_PORT=5672
QUEUE_USER=guest
QUEUE_PASSWORD=guest
QUEUE_NAME=notification_queue
DLQ_NAME=notification_dlq

# API
API_PORT=3000

# Worker
WORKER_CONCURRENCY=3
```

### Templates

Three notification templates are pre-seeded on startup:

1. **Welcome** (email) - `template_id: 1`
2. **Order Confirmation** (push) - `template_id: 2`
3. **Password Reset** (sms) - `template_id: 3`

## Deployment

### Production Deployment

See [DEPLOYMENT.md](DEPLOYMENT.md) for:
- Production configuration
- Security hardening
- Scaling strategies
- Cloud deployment (AWS, K8s, Docker Swarm)
- Monitoring and logging
- Backup and recovery

### Scaling

```bash
# Scale worker instances
docker-compose up --scale worker-service=5

# Or set in docker-compose.yml
worker-service:
  deploy:
    replicas: 5
```

## Monitoring

### Health Checks

All services include health checks:
```bash
# API health
curl http://localhost:3000/health

# Service status
docker-compose ps
```

### Logs

```bash
# All logs
docker-compose logs -f

# Specific service
docker-compose logs -f api-service
docker-compose logs -f worker-service
```

### RabbitMQ Management UI

Access at http://localhost:15672 (guest/guest):
- View queues and message rates
- Monitor connections
- Check dead-letter queue

### Database

```bash
# Connect to Postgres
docker-compose exec postgres psql -U notification -d notifications

# View templates
SELECT * FROM notification_templates;

# View logs
SELECT * FROM notification_logs ORDER BY id DESC LIMIT 10;
```

## Troubleshooting

### Common Issues

**Services won't start:**
```bash
docker-compose down -v
docker-compose up --build
```

**Port conflicts:**
Update ports in `docker-compose.yml`

**Memory issues:**
```yaml
services:
  api-service:
    mem_limit: 512m
```

See [DEPLOYMENT.md](DEPLOYMENT.md) for comprehensive troubleshooting guide.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## License

MIT License - feel free to use this project for learning or production.

## Support

- Documentation: See `ARCHITECTURE.md`, `API_DOCS.md`, `TESTING.md`, `DEPLOYMENT.md`
- Issues: Check logs with `docker-compose logs`
- Questions: Review documentation or create an issue

---

**Built with ❤️ for high-scale notification processing**
