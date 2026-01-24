# Testing Guide

## Unit Tests

### API Service Tests
```bash
cd api-service
npm test
```

Tests cover:
- Input validation (invalid notification types rejected)
- Valid notifications accepted and queued
- Pending status recorded in database
- In-memory queue for test isolation

### Worker Service Tests
```bash
cd worker-service
npm test
```

Tests cover:
- Successful message processing
- Status updates to database
- DLQ handling for missing templates
- Retry logic simulation

## Integration Testing

### End-to-End Flow
With docker-compose running:

```bash
# 1. Send email notification
curl -X POST http://localhost:3000/api/notifications/send \
  -H "Content-Type: application/json" \
  -d '{
    "type": "email",
    "recipient": "user@example.com",
    "subject": "Test Email",
    "body": "This is a test notification"
  }'

# Expected response:
# {"id":1,"status":"pending"}

# 2. Check status
curl http://localhost:3000/api/notifications/status/1

# Expected response:
# {"id":1,"type":"email","recipient":"user@example.com","status":"sent","sent_at":"2026-01-23T...","error_message":null}

# 3. Send notification with template
curl -X POST http://localhost:3000/api/notifications/send \
  -H "Content-Type: application/json" \
  -d '{
    "type": "email",
    "recipient": "newuser@example.com",
    "template_id": 1
  }'

# 4. Send SMS notification
curl -X POST http://localhost:3000/api/notifications/send \
  -H "Content-Type: application/json" \
  -d '{
    "type": "sms",
    "recipient": "+1234567890",
    "body": "Your verification code is 123456"
  }'

# 5. Send push notification
curl -X POST http://localhost:3000/api/notifications/send \
  -H "Content-Type: application/json" \
  -d '{
    "type": "push",
    "recipient": "device-token-123",
    "subject": "New Message",
    "body": "You have a new message"
  }'

# 6. Test invalid type (should return 400)
curl -X POST http://localhost:3000/api/notifications/send \
  -H "Content-Type: application/json" \
  -d '{
    "type": "fax",
    "recipient": "test@test.com",
    "body": "Invalid"
  }'

# 7. Test missing template (should fail and move to DLQ)
curl -X POST http://localhost:3000/api/notifications/send \
  -H "Content-Type: application/json" \
  -d '{
    "type": "email",
    "recipient": "test@test.com",
    "template_id": 999
  }'
```

### Verify Worker Logs
```bash
# View worker processing
docker-compose logs -f worker-service

# You should see output like:
# [EMAIL] To: user@example.com | Subject: Test Email | Body: This is a test notification
# [SMS] To: +1234567890 | Body: Your verification code is 123456
# [PUSH] To: device-token-123 | Title: New Message | Body: You have a new message
```

### Check RabbitMQ Management UI
- Open http://localhost:15672
- Login: guest / guest
- Navigate to Queues tab
- Verify `notification_queue` and `notification_dlq` exist

### Database Verification
```bash
# Connect to Postgres
docker-compose exec postgres psql -U notification -d notifications

# Check templates
SELECT * FROM notification_templates;

# Check logs
SELECT * FROM notification_logs ORDER BY id DESC LIMIT 10;

# Exit
\q
```

## Load Testing

### High Volume Test
```bash
# Send 100 notifications rapidly
for i in {1..100}; do
  curl -X POST http://localhost:3000/api/notifications/send \
    -H "Content-Type: application/json" \
    -d "{\"type\":\"email\",\"recipient\":\"user$i@example.com\",\"subject\":\"Load Test $i\",\"body\":\"Message $i\"}" &
done
wait

# Check all were processed
docker-compose logs worker-service | grep "\[EMAIL\]" | wc -l
```

### Retry Logic Test
```bash
# Simulate transient failure by sending invalid data that triggers retry
# (Implementation would require modifying worker to simulate failures)
```

## Performance Metrics

### Expected Throughput
- API response time: < 50ms (for accepting requests)
- Worker processing: ~100 notifications/second
- End-to-end latency: < 500ms (request to processing complete)

### Resource Usage
- API service: ~50MB RAM
- Worker service: ~50MB RAM
- RabbitMQ: ~100MB RAM
- Postgres: ~50MB RAM

## Troubleshooting

### Services won't start
```bash
# Check logs
docker-compose logs

# Restart with clean state
docker-compose down -v
docker-compose up --build
```

### Messages stuck in queue
```bash
# Check RabbitMQ
docker-compose logs rabbitmq

# Restart worker
docker-compose restart worker-service
```

### Database connection issues
```bash
# Verify Postgres is healthy
docker-compose ps postgres

# Check connection from API
docker-compose logs api-service | grep "database"
```

## Cleanup

```bash
# Stop all services
docker-compose down

# Remove volumes (clears database)
docker-compose down -v

# Remove images
docker-compose down --rmi all
```
