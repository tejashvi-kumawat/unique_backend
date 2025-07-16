import rateLimit from 'express-rate-limit';

// Chat rate limiter
export const chatLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 20, // limit each IP to 20 requests per windowMs
  message: {
    error: 'Too many messages, please slow down! 😅'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Upload rate limiter
export const uploadLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 100, // limit each IP to 100 uploads per windowMs
  message: {
    error: 'Too many uploads, please wait before uploading again! 📁'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Photo upload rate limiter
export const photoLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 5, // limit each IP to 5 photo uploads per windowMs
  message: {
    error: 'Too many photo uploads, please wait! 📸'
  },
  standardHeaders: true,
  legacyHeaders: false,
});
