# Screenshots Directory

This directory contains screenshots demonstrating the notification service functionality.

## Required Screenshots

### 1. API Service Running
- Screenshot of `docker-compose ps` showing all services healthy
- File: `01-services-running.png`

### 2. Sending Email Notification
- cURL command and successful 202 response
- File: `02-send-email.png`

### 3. Sending SMS Notification
- cURL command and successful 202 response
- File: `03-send-sms.png`

### 4. Sending Push Notification
- cURL command and successful 202 response
- File: `04-send-push.png`

### 5. Checking Notification Status
- cURL command showing status endpoint response
- Status changed from 'pending' to 'sent'
- File: `05-check-status.png`

### 6. Worker Console Output
- Worker logs showing processed notifications:
  ```
  [EMAIL] To: user@example.com | Subject: Hello | Body: Welcome
  [SMS] To: +1234567890 | Body: Your code is 123456
  [PUSH] To: device-123 | Title: Alert | Body: New message
  ```
- File: `06-worker-logs.png`

### 7. RabbitMQ Management UI
- Queues tab showing notification_queue and notification_dlq
- Message rates and totals
- File: `07-rabbitmq-ui.png`

### 8. Database - Templates Table
- SELECT * FROM notification_templates showing 3 seeded templates
- File: `08-db-templates.png`

### 9. Database - Logs Table
- SELECT * FROM notification_logs showing various statuses
- File: `09-db-logs.png`

### 10. Error Handling
- Invalid notification type returning 400 error
- Missing template returning 404 error
- File: `10-error-handling.png`

### 11. DLQ Messages
- RabbitMQ UI showing messages in notification_dlq
- File: `11-dlq-messages.png`

### 12. Health Check
- cURL to /health endpoint returning {"status":"ok"}
- File: `12-health-check.png`

## How to Capture Screenshots

### Windows (PowerShell)
```powershell
# Run commands and capture using Snipping Tool or Win+Shift+S

# Example: Show all services
docker-compose ps

# Example: Send notification
curl -X POST http://localhost:3000/api/notifications/send -H "Content-Type: application/json" -d '{\"type\":\"email\",\"recipient\":\"test@example.com\",\"subject\":\"Test\",\"body\":\"Hello\"}'

# Example: Check status
curl http://localhost:3000/api/notifications/status/1

# Example: View worker logs
docker-compose logs worker-service

# Example: Database query
docker-compose exec postgres psql -U notification -d notifications -c "SELECT * FROM notification_templates;"
```

### Linux/macOS
```bash
# Use screenshot tool of your choice or `scrot`, `flameshot`, etc.
```

## Notes
- Ensure terminal/browser windows are clearly visible
- Include timestamps where relevant
- Highlight important parts (response codes, status changes)
- Keep file sizes reasonable (< 1MB per image)
