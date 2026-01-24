import { createChannel, QUEUE_NAME, DLQ_NAME } from '../config/messageQueue.js';
import { NotificationTemplate, NotificationLog } from '../config/database.js';
import { sendNotificationViaProvider } from '../services/notificationProcessor.js';
import { CircuitBreaker } from '../lib/circuitBreaker.js';

const MAX_RETRIES = 3;

// Initialize circuit breaker
const circuitBreaker = new CircuitBreaker({
  failureThreshold: parseInt(process.env.CIRCUIT_BREAKER_FAILURE_THRESHOLD) || 5,
  resetTimeout: parseInt(process.env.CIRCUIT_BREAKER_RESET_TIMEOUT) || 60000,
  halfOpenMaxCalls: parseInt(process.env.CIRCUIT_BREAKER_HALF_OPEN_MAX_CALLS) || 1
});

// Track processed correlationIds for idempotency
const processedMessages = new Set();
const MESSAGE_CACHE_TTL = 600000; // 10 minutes

async function moveToDlq (channel, payload, reason) {
  const enriched = { ...payload, error: reason, dlqTimestamp: new Date().toISOString() };
  channel.sendToQueue(DLQ_NAME, Buffer.from(JSON.stringify(enriched)), { persistent: true });
}

async function handleMessage (channel, msg) {
  const payload = JSON.parse(msg.content.toString());
  const { correlationId, userId, type, message, recipient, subject, logId } = payload;
  const retryCount = payload.retryCount || 0;

  console.log(`[WORKER] ${correlationId} - Processing notification (attempt ${retryCount + 1})`);

  try {
    // Idempotency check - prevent duplicate processing
    if (processedMessages.has(correlationId)) {
      console.log(`[WORKER] ${correlationId} - Duplicate message detected, skipping`);
      channel.ack(msg);
      return;
    }

    // Check if already processed in database
    const existingLog = await NotificationLog.findOne({ where: { correlation_id: correlationId } });
    if (existingLog && (existingLog.status === 'sent' || existingLog.status === 'circuit_open')) {
      console.log(`[WORKER] ${correlationId} - Already processed with status ${existingLog.status}, skipping`);
      processedMessages.add(correlationId);
      setTimeout(() => processedMessages.delete(correlationId), MESSAGE_CACHE_TTL);
      channel.ack(msg);
      return;
    }

    // Check for template if provided
    if (payload.template_id) {
      const template = await NotificationTemplate.findByPk(payload.template_id);
      if (!template) {
        await NotificationLog.update(
          { status: 'failed', error_details: 'Template missing at processing time' },
          { where: { correlation_id: correlationId } }
        );
        await moveToDlq(channel, payload, 'template_missing');
        channel.ack(msg);
        return;
      }
    }

    // Execute notification via circuit breaker
    try {
      await circuitBreaker.execute(
        async () => await sendNotificationViaProvider({ correlationId, userId, type, message, recipient, subject }),
        correlationId
      );

      // Success - update log
      await NotificationLog.update(
        { status: 'sent', sent_at: new Date(), error_details: null },
        { where: { correlation_id: correlationId } }
      );

      // Mark as processed
      processedMessages.add(correlationId);
      setTimeout(() => processedMessages.delete(correlationId), MESSAGE_CACHE_TTL);

      console.log(`[WORKER] ${correlationId} - Successfully sent`);
      channel.ack(msg);

    } catch (circuitError) {
      // Check if it's a circuit breaker error
      if (circuitError.circuitState === 'OPEN') {
        console.log(`[WORKER] ${correlationId} - Circuit breaker OPEN, requeueing`);
        
        await NotificationLog.update(
          { status: 'circuit_open', error_details: 'Circuit breaker is OPEN, will retry' },
          { where: { correlation_id: correlationId } }
        );

        // Requeue with delay
        setTimeout(() => {
          channel.sendToQueue(QUEUE_NAME, Buffer.from(JSON.stringify({ ...payload, retryCount })), { persistent: true });
        }, 5000); // 5 second delay
        
        channel.ack(msg);
        return;
      }

      // Regular failure - apply retry logic
      throw circuitError;
    }

  } catch (err) {
    console.error(`[WORKER] ${correlationId} - Error:`, err.message);

    if (retryCount < MAX_RETRIES) {
      const nextRetry = retryCount + 1;
      await NotificationLog.update(
        { status: 'retried', error_details: `${err.message} (retry ${nextRetry}/${MAX_RETRIES})` },
        { where: { correlation_id: correlationId } }
      );
      
      const delayMs = Math.pow(2, retryCount) * 1000; // Exponential backoff
      console.log(`[WORKER] ${correlationId} - Retrying in ${delayMs}ms (attempt ${nextRetry})`);
      
      setTimeout(() => {
        channel.sendToQueue(QUEUE_NAME, Buffer.from(JSON.stringify({ ...payload, retryCount: nextRetry })), { persistent: true });
      }, delayMs);
      
      channel.ack(msg);
    } else {
      await NotificationLog.update(
        { status: 'failed', sent_at: new Date(), error_details: `Max retries exceeded: ${err.message}` },
        { where: { correlation_id: correlationId } }
      );
      
      console.log(`[WORKER] ${correlationId} - Max retries exceeded, moving to DLQ`);
      await moveToDlq(channel, payload, err.message);
      channel.ack(msg);
    }
  }
}

async function startConsumer (concurrency = 1) {
  const channel = await createChannel();
  await channel.prefetch(concurrency);
  await channel.consume(QUEUE_NAME, (msg) => {
    if (msg) handleMessage(channel, msg);
  }, { noAck: false });
  console.log('Worker consuming from queue');
  console.log(`Circuit Breaker initialized - Threshold: ${circuitBreaker.failureThreshold}, Reset: ${circuitBreaker.resetTimeout}ms`);
}

// Export circuit breaker for status endpoint
export { startConsumer, handleMessage, circuitBreaker };
