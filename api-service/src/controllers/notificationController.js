import createError from 'http-errors';
import { v4 as uuidv4 } from 'uuid';
import { notificationSchema } from '../validation/notificationSchema.js';
import { NotificationTemplate, NotificationLog } from '../config/database.js';
import { publishNotification } from '../config/messageQueue.js';
import { checkRateLimit } from '../lib/rateLimiter.js';

function applyTemplate (payload, template) {
  if (!template) return payload;
  return {
    ...payload,
    subject: payload.subject || template.subject_template,
    message: payload.message || template.body_template
  };
}

async function sendNotification (req, res, next) {
  const correlationId = uuidv4();
  
  try {
    // Validate request
    const { error, value } = notificationSchema.validate(req.body, { abortEarly: false, stripUnknown: true });
    if (error) {
      console.log(`[API] ${correlationId} - Validation error:`, error.details.map(d => d.message).join(', '));
      return next(createError(400, error.details.map(d => d.message).join(', ')));
    }

    const { userId, type, recipient, message, subject, template_id } = value;

    // Check rate limit
    const rateLimitResult = await checkRateLimit(userId, type);
    console.log(`[API] ${correlationId} - Rate limit check for user ${userId}, type ${type}:`, rateLimitResult);
    
    if (!rateLimitResult.allowed) {
      // Log rate-limited request
      await NotificationLog.create({
        correlation_id: correlationId,
        user_id: userId,
        notification_type: type,
        message,
        recipient,
        status: 'rate_limited',
        sent_at: null,
        error_details: `Rate limit exceeded. Try again after ${new Date(rateLimitResult.resetAt).toISOString()}`
      });

      res.set('X-RateLimit-Limit', rateLimitResult.limit);
      res.set('X-RateLimit-Remaining', '0');
      res.set('X-RateLimit-Reset', new Date(rateLimitResult.resetAt).toISOString());
      
      return res.status(429).json({
        message: 'Too Many Requests',
        retryAfter: new Date(rateLimitResult.resetAt).toISOString(),
        limit: rateLimitResult.limit,
        window: `${rateLimitResult.window} seconds`
      });
    }

    // Fetch template if provided
    let template = null;
    if (template_id) {
      template = await NotificationTemplate.findByPk(template_id);
      if (!template) return next(createError(404, 'Template not found'));
      if (template.type !== type) return next(createError(400, 'Template type mismatch'));
    }

    const resolvedPayload = applyTemplate(value, template);
    
    // Create log entry with QUEUED status
    const log = await NotificationLog.create({
      correlation_id: correlationId,
      user_id: userId,
      notification_type: type,
      message: resolvedPayload.message,
      recipient,
      status: 'queued',
      sent_at: null,
      error_details: null
    });

    // Publish to message queue
    await publishNotification({ 
      correlationId,
      userId,
      type,
      message: resolvedPayload.message,
      recipient,
      subject: resolvedPayload.subject || '',
      template_id: template_id,
      logId: log.id,
      timestamp: new Date().toISOString()
    });

    console.log(`[API] ${correlationId} - Notification queued successfully for user ${userId}`);

    // Set rate limit headers
    res.set('X-RateLimit-Limit', rateLimitResult.limit);
    res.set('X-RateLimit-Remaining', rateLimitResult.remaining);
    res.set('X-RateLimit-Reset', new Date(rateLimitResult.resetAt).toISOString());

    res.status(202).json({ 
      id: log.id, 
      correlationId,
      status: 'queued' 
    });
  } catch (err) {
    console.error(`[API] ${correlationId} - Error:`, err);
    next(err);
  }
}

async function getStatus (req, res, next) {
  try {
    const log = await NotificationLog.findByPk(req.params.id);
    if (!log) return next(createError(404, 'Notification not found'));
    res.json({
      id: log.id,
      correlationId: log.correlation_id,
      userId: log.user_id,
      type: log.notification_type,
      message: log.message,
      recipient: log.recipient,
      status: log.status,
      sentAt: log.sent_at,
      errorDetails: log.error_details
    });
  } catch (err) {
    next(err);
  }
}

export { sendNotification, getStatus };
