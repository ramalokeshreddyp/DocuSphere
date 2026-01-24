# Deployment Guide

## Prerequisites

- Docker 20.10+
- Docker Compose 2.0+
- 2GB RAM minimum
- 5GB disk space

## Quick Start

```bash
# 1. Clone/navigate to project
cd mandatory

# 2. Copy environment template
cp .env.example .env

# 3. Start all services
docker-compose up --build

# 4. Verify services are running
docker-compose ps

# 5. Test health endpoint
curl http://localhost:3000/health
```

## Production Deployment

### Environment Configuration

Create `.env` file with production values:

```env
# Database
DB_HOST=your-postgres-host
DB_PORT=5432
DB_USER=notification_prod
DB_PASSWORD=strong_password_here
DB_NAME=notifications_prod

# RabbitMQ
QUEUE_HOST=your-rabbitmq-host
QUEUE_PORT=5672
QUEUE_USER=notification_user
QUEUE_PASSWORD=strong_queue_password
QUEUE_NAME=notification_queue
DLQ_NAME=notification_dlq

# API Service
API_PORT=3000

# Worker Service
WORKER_CONCURRENCY=10
```

### Security Hardening

1. **Change Default Credentials**
   ```yaml
   # Update docker-compose.yml
   postgres:
     environment:
       POSTGRES_USER: ${DB_USER}
       POSTGRES_PASSWORD: ${DB_PASSWORD}
   
   rabbitmq:
     environment:
       RABBITMQ_DEFAULT_USER: ${QUEUE_USER}
       RABBITMQ_DEFAULT_PASS: ${QUEUE_PASSWORD}
   ```

2. **Enable TLS for RabbitMQ**
   ```yaml
   rabbitmq:
     volumes:
       - ./rabbitmq/ssl:/etc/rabbitmq/ssl
     environment:
       RABBITMQ_SSL_CERTFILE: /etc/rabbitmq/ssl/cert.pem
       RABBITMQ_SSL_KEYFILE: /etc/rabbitmq/ssl/key.pem
   ```

3. **Network Isolation**
   ```yaml
   services:
     api-service:
       networks:
         - frontend
         - backend
     
     worker-service:
       networks:
         - backend
     
     postgres:
       networks:
         - backend
     
     rabbitmq:
       networks:
         - backend
   
   networks:
     frontend:
     backend:
       internal: true
   ```

### Scaling

#### Horizontal Scaling

```yaml
# Scale worker instances
docker-compose up --scale worker-service=5

# Or in docker-compose.yml
worker-service:
  deploy:
    replicas: 5
```

#### Vertical Scaling

```yaml
# Increase worker concurrency
worker-service:
  environment:
    WORKER_CONCURRENCY: 20
```

### Monitoring

#### Health Checks

All services include health checks:
```yaml
healthcheck:
  test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
  interval: 30s
  timeout: 10s
  retries: 3
  start_period: 40s
```

#### Logging

```bash
# View all logs
docker-compose logs -f

# View specific service
docker-compose logs -f api-service

# Export logs
docker-compose logs > logs-$(date +%Y%m%d).txt
```

#### Metrics

RabbitMQ Prometheus endpoint: http://localhost:15692/metrics

API metrics (if added):
- Request count by endpoint
- Response times
- Error rates

### Backup & Recovery

#### Database Backup

```bash
# Create backup
docker-compose exec postgres pg_dump -U notification notifications > backup.sql

# Restore backup
docker-compose exec -T postgres psql -U notification notifications < backup.sql
```

#### RabbitMQ Backup

```bash
# Export definitions
curl -u guest:guest http://localhost:15672/api/definitions > rabbitmq-definitions.json

# Import definitions
curl -u guest:guest -H "Content-Type: application/json" -X POST --data @rabbitmq-definitions.json http://localhost:15672/api/definitions
```

### Updates & Rollbacks

```bash
# Update with zero downtime
docker-compose pull
docker-compose up -d --no-deps --build api-service
docker-compose up -d --no-deps --build worker-service

# Rollback to previous version
docker-compose down
git checkout previous-version
docker-compose up -d --build
```

## Cloud Deployment

### AWS (ECS/Fargate)

1. Build and push images to ECR
2. Create ECS task definitions
3. Configure Application Load Balancer for API
4. Use RDS for Postgres
5. Use Amazon MQ for RabbitMQ

### Kubernetes

```yaml
# Example deployment
apiVersion: apps/v1
kind: Deployment
metadata:
  name: notification-api
spec:
  replicas: 3
  selector:
    matchLabels:
      app: notification-api
  template:
    metadata:
      labels:
        app: notification-api
    spec:
      containers:
      - name: api
        image: notification-api:latest
        ports:
        - containerPort: 3000
        env:
        - name: DB_HOST
          valueFrom:
            secretKeyRef:
              name: notification-secrets
              key: db-host
```

### Docker Swarm

```yaml
version: '3.9'
services:
  api-service:
    deploy:
      replicas: 3
      update_config:
        parallelism: 1
        delay: 10s
      restart_policy:
        condition: on-failure
```

## Troubleshooting

### Common Issues

1. **Port Already in Use**
   ```bash
   # Change ports in docker-compose.yml
   ports:
     - "3001:3000"  # API
     - "5433:5432"  # Postgres
   ```

2. **Out of Memory**
   ```yaml
   # Add memory limits
   services:
     api-service:
       mem_limit: 512m
     worker-service:
       mem_limit: 512m
   ```

3. **Slow Startup**
   ```bash
   # Increase timeout
   COMPOSE_HTTP_TIMEOUT=200 docker-compose up
   ```

### Performance Tuning

1. **Postgres**
   ```sql
   -- Add indexes
   CREATE INDEX idx_notification_logs_status ON notification_logs(status);
   CREATE INDEX idx_notification_logs_type ON notification_logs(notification_type);
   ```

2. **RabbitMQ**
   ```yaml
   rabbitmq:
     environment:
       RABBITMQ_VM_MEMORY_HIGH_WATERMARK: 0.7
   ```

3. **Node.js**
   ```yaml
   api-service:
     environment:
       NODE_OPTIONS: "--max-old-space-size=512"
   ```

## Maintenance

### Regular Tasks

- Monitor disk usage
- Review error logs weekly
- Update dependencies monthly
- Backup database daily
- Clean up old logs
- Monitor queue depths

### Graceful Shutdown

```bash
# Stop services gracefully
docker-compose stop

# Allow 30 seconds for cleanup
docker-compose down -t 30
```

## Support

For issues:
1. Check logs: `docker-compose logs`
2. Verify env vars: `docker-compose config`
3. Test connectivity: `docker-compose exec api-service ping postgres`
4. Review documentation in README.md, ARCHITECTURE.md, and API_DOCS.md
