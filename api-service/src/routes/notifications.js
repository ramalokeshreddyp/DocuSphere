import express from 'express';
import { sendNotification, getStatus } from '../controllers/notificationController.js';

const router = express.Router();

router.post('/send', sendNotification);
router.get('/status/:id', getStatus);

export default router;
