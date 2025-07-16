import express from 'express';
import { sendMessage, getChatHistory } from '../controllers/chatController.js';
import { getWhatsAppSenders, saveSenderMapping } from '../controllers/uploadController.js';

const router = express.Router();

router.post('/message', sendMessage);
router.get('/history', getChatHistory);
router.get('/whatsapp-senders', getWhatsAppSenders);
router.post('/save-sender-mapping', saveSenderMapping);

export default router;
