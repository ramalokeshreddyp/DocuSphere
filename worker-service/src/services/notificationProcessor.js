import axios from 'axios';

const MOCK_PROVIDER_URL = process.env.MOCK_PROVIDER_URL || 'http://mock-provider:4000';
const REQUEST_TIMEOUT = 5000; // 5 seconds

/**
 * Send notification via external HTTP provider
 * This simulates calling real external services (SendGrid, Twilio, FCM, etc.)
 */
async function sendNotificationViaProvider({ correlationId, userId, type, message, recipient, subject }) {
  const endpoints = {
    email: `${MOCK_PROVIDER_URL}/send-email`,
    sms: `${MOCK_PROVIDER_URL}/send-sms`,
    push: `${MOCK_PROVIDER_URL}/send-push`
  };

  const endpoint = endpoints[type];
  if (!endpoint) {
    throw new Error(`Unsupported notification type: ${type}`);
  }

  const payload = {
    correlationId,
    userId,
    recipient,
    message,
    subject,
    type
  };

  if (type === 'push') {
    payload.title = subject;
  }

  try {
    const response = await axios.post(endpoint, payload, {
      timeout: REQUEST_TIMEOUT,
      headers: {
        'Content-Type': 'application/json',
        'X-Correlation-Id': correlationId
      }
    });

    console.log(`[PROVIDER] ${correlationId} - ${type.toUpperCase()} sent successfully via external provider`);
    return response.data;
    
  } catch (error) {
    if (error.response) {
      // HTTP error from provider
      const status = error.response.status;
      const errorMsg = error.response.data?.error || 'Provider error';
      console.error(`[PROVIDER] ${correlationId} - ${type.toUpperCase()} failed (HTTP ${status}): ${errorMsg}`);
      throw new Error(`Provider returned ${status}: ${errorMsg}`);
    } else if (error.code === 'ECONNREFUSED') {
      console.error(`[PROVIDER] ${correlationId} - ${type.toUpperCase()} - Provider unreachable (ECONNREFUSED)`);
      throw new Error('External provider unreachable');
    } else if (error.code === 'ETIMEDOUT' || error.code === 'ESOCKETTIMEDOUT') {
      console.error(`[PROVIDER] ${correlationId} - ${type.toUpperCase()} - Request timeout`);
      throw new Error('Provider request timeout');
    } else {
      console.error(`[PROVIDER] ${correlationId} - ${type.toUpperCase()} - Unexpected error:`, error.message);
      throw error;
    }
  }
}

// Legacy logging functions for backward compatibility
function logEmail ({ recipient, subject, body }) {
  console.log(`[EMAIL] To: ${recipient} | Subject: ${subject} | Body: ${body}`);
}

function logSms ({ recipient, body }) {
  console.log(`[SMS] To: ${recipient} | Body: ${body}`);
}

function logPush ({ recipient, body, subject }) {
  console.log(`[PUSH] To: ${recipient} | Title: ${subject} | Body: ${body}`);
}

async function processNotification (payload) {
  if (payload.type === 'email') {
    logEmail(payload);
  } else if (payload.type === 'sms') {
    logSms(payload);
  } else if (payload.type === 'push') {
    logPush(payload);
  } else {
    throw new Error('Unsupported notification type');
  }
}

export { sendNotificationViaProvider, processNotification, logEmail, logSms, logPush };
