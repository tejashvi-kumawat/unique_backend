import express from 'express';
import { uploadWhatsAppChat, getUploadStatus, uploadMiddleware } from '../controllers/uploadController.js';

const router = express.Router();

router.post('/whatsapp', uploadMiddleware, uploadWhatsAppChat);
router.get('/status', getUploadStatus);

export default router;
