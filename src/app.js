import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server } from 'socket.io';
import path from 'path';
import { fileURLToPath } from 'url';

// Routes
import chatRoutes from './routes/chat.js';
import uploadRoutes from './routes/upload.js';
import photoRoutes from './routes/photos.js';
import memoryRoutes from './routes/memory.js';

// Middleware
import { chatLimiter, uploadLimiter, photoLimiter } from './middleware/rateLimiter.js';
import { initializeDatabase } from './models/database.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.set('trust proxy', 1); // Trust first proxy for correct IP handling on Render
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    methods: ["GET", "POST"],
    credentials: true
  }
});
if (!process.env.FRONTEND_URL) {
  console.error('❌ FRONTEND_URL is not set in environment variables!');
}

// Request logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  next();
});

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

// Compression middleware
app.use(compression());

// CORS configuration
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:5173",
  credentials: true
}));

if (!process.env.FRONTEND_URL) {
  console.error('❌ FRONTEND_URL is not set in environment variables!');
}

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, '../uploads');
const fs = await import('fs');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
if (!fs.existsSync(path.join(uploadsDir, 'chats'))) {
  fs.mkdirSync(path.join(uploadsDir, 'chats'), { recursive: true });
}

// Static files
app.use('/uploads', express.static(uploadsDir));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});
app.get('/', (req, res) => {
  res.send('AI-Teju backend is running!');
});

// Routes with rate limiting
app.use('/api/chat', chatLimiter, chatRoutes);
app.use('/api/upload', uploadLimiter, uploadRoutes);
app.use('/api/photos', photoLimiter, photoRoutes);
app.use('/api/memory', memoryRoutes);

// Socket.io for real-time features
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);
  
  socket.on('typing', (data) => {
    socket.broadcast.emit('user-typing', data);
  });
  
  socket.on('stop-typing', () => {
    socket.broadcast.emit('user-stop-typing');
  });
  
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: 'Something went wrong! Please try again.' 
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Initialize database and start server
const PORT = process.env.PORT || 3000;
if (!process.env.PORT) {
  console.error('❌ PORT is not set in environment variables!');
}

async function startServer() {
  try {
    await initializeDatabase();
    server.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 AI-Teju server running on port ${PORT}`);
      console.log(`📱 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:5173'}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

export { io };
