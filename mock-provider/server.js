import express from 'express';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;
const FAILURE_RATE = parseFloat(process.env.FAILURE_RATE || '0.3');

app.use(express.json());

let requestCount = 0;
const stats = {
  total: 0,
  successful: 0,
  failed: 0
};

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', failureRate: FAILURE_RATE, stats });
});

// Mock email provider
app.post('/send-email', (req, res) => {
  requestCount++;
  stats.total++;
  
  const { correlationId, userId, recipient, subject, message } = req.body;
  
  // Simulate processing time
  setTimeout(() => {
    if (Math.random() < FAILURE_RATE) {
      stats.failed++;
      console.log(`[MOCK-EMAIL] ❌ FAILED - CorrelationId: ${correlationId}, User: ${userId}, To: ${recipient}`);
      return res.status(500).json({ 
        error: 'Email service temporarily unavailable',
        correlationId 
      });
    }
    
    stats.successful++;
    console.log(`[MOCK-EMAIL] ✅ SUCCESS - CorrelationId: ${correlationId}, User: ${userId}, To: ${recipient}, Subject: ${subject}`);
    res.json({ 
      success: true, 
      messageId: `email-${correlationId}`,
      correlationId 
    });
  }, Math.random() * 200); // 0-200ms latency
});

// Mock SMS provider
app.post('/send-sms', (req, res) => {
  requestCount++;
  stats.total++;
  
  const { correlationId, userId, recipient, message } = req.body;
  
  setTimeout(() => {
    if (Math.random() < FAILURE_RATE) {
      stats.failed++;
      console.log(`[MOCK-SMS] ❌ FAILED - CorrelationId: ${correlationId}, User: ${userId}, To: ${recipient}`);
      return res.status(503).json({ 
        error: 'SMS gateway timeout',
        correlationId 
      });
    }
    
    stats.successful++;
    console.log(`[MOCK-SMS] ✅ SUCCESS - CorrelationId: ${correlationId}, User: ${userId}, To: ${recipient}`);
    res.json({ 
      success: true, 
      messageId: `sms-${correlationId}`,
      correlationId 
    });
  }, Math.random() * 300); // 0-300ms latency
});

// Mock push notification provider
app.post('/send-push', (req, res) => {
  requestCount++;
  stats.total++;
  
  const { correlationId, userId, recipient, title, message } = req.body;
  
  setTimeout(() => {
    if (Math.random() < FAILURE_RATE) {
      stats.failed++;
      console.log(`[MOCK-PUSH] ❌ FAILED - CorrelationId: ${correlationId}, User: ${userId}, To: ${recipient}`);
      return res.status(502).json({ 
        error: 'Push notification service unreachable',
        correlationId 
      });
    }
    
    stats.successful++;
    console.log(`[MOCK-PUSH] ✅ SUCCESS - CorrelationId: ${correlationId}, User: ${userId}, To: ${recipient}, Title: ${title}`);
    res.json({ 
      success: true, 
      messageId: `push-${correlationId}`,
      correlationId 
    });
  }, Math.random() * 250); // 0-250ms latency
});

// Reset stats endpoint (for testing)
app.post('/reset-stats', (req, res) => {
  stats.total = 0;
  stats.successful = 0;
  stats.failed = 0;
  requestCount = 0;
  res.json({ message: 'Stats reset successfully' });
});

app.listen(PORT, () => {
  console.log(`Mock Provider Service running on port ${PORT}`);
  console.log(`Configured failure rate: ${(FAILURE_RATE * 100).toFixed(0)}%`);
});
