import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { getDatabase } from '../models/database.js';
import { parseWhatsAppChat } from '../services/whatsappService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const fs = require('fs');
    const uploadDir = path.join(__dirname, '../../uploads/chats/');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    // Accept both .txt files and plain text
    if (file.mimetype === 'text/plain' || file.originalname.endsWith('.txt')) {
      cb(null, true);
    } else {
      cb(new Error('Only .txt files are allowed!'), false);
    }
  }
});

export const uploadWhatsAppChat = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const fs = await import('fs');
    const chatContent = fs.readFileSync(req.file.path, 'utf8');
    
    // Parse WhatsApp chat
    const parsedMessages = parseWhatsAppChat(chatContent);
    
    if (parsedMessages.length === 0) {
      return res.status(400).json({ 
        error: 'No valid messages found in chat file' 
      });
    }

    const db = getDatabase();
    
    // Clear existing WhatsApp context
    await db.run('DELETE FROM whatsapp_context');
    
    // Insert new context
    for (const message of parsedMessages) {
      await db.run(
        'INSERT INTO whatsapp_context (sender, message, timestamp, processed) VALUES (?, ?, ?, ?)',
        [message.sender, message.content, message.timestamp, true]
      );
    }
    
    // Clean up uploaded file
    fs.unlinkSync(req.file.path);
    
    res.json({ 
      success: true,
      message: 'WhatsApp chat uploaded successfully',
      messageCount: parsedMessages.length,
      senders: [...new Set(parsedMessages.map(m => m.sender))]
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ 
      error: 'Failed to process WhatsApp chat: ' + error.message 
    });
  }
};

export const getUploadStatus = async (req, res) => {
  try {
    const db = getDatabase();
    const messageCount = await db.get(
      'SELECT COUNT(*) as count FROM whatsapp_context WHERE processed = TRUE'
    );
    
    const senders = await db.all(
      'SELECT DISTINCT sender FROM whatsapp_context WHERE processed = TRUE'
    );
    
    res.json({
      uploaded: messageCount.count > 0,
      messageCount: messageCount.count,
      senders: senders.map(s => s.sender)
    });
  } catch (error) {
    console.error('Status error:', error);
    res.status(500).json({ error: 'Failed to get upload status' });
  }
};

export const uploadMiddleware = upload.single('chatFile');
