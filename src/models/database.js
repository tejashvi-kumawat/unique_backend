import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let db;

export async function initializeDatabase() {
  // Ensure database directory exists
  const dbPath = path.join(process.cwd(), 'database');
  
  try {
    const fs = await import('fs');
    if (!fs.existsSync(dbPath)) {
      fs.mkdirSync(dbPath, { recursive: true });
    }
  } catch (error) {
    console.error('Error creating database directory:', error);
  }

  db = await open({
    filename: path.join(dbPath, 'chatbot.db'),
    driver: sqlite3.Database
  });

  // Create tables with correct schema
  await db.exec(`
    CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sender TEXT NOT NULL,
      content TEXT NOT NULL,
      message_type TEXT DEFAULT 'text',
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      metadata TEXT DEFAULT '{}'
    );

    CREATE TABLE IF NOT EXISTS memories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      key TEXT UNIQUE NOT NULL,
      value TEXT NOT NULL,
      category TEXT DEFAULT 'general',
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS photos (
      id TEXT PRIMARY KEY,
      filename TEXT NOT NULL,
      base64_data TEXT NOT NULL,
      caption TEXT,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS whatsapp_context (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sender TEXT NOT NULL,
      message TEXT NOT NULL,
      timestamp TEXT,
      processed BOOLEAN DEFAULT FALSE
    );

    CREATE TABLE IF NOT EXISTS sender_mapping (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      role TEXT NOT NULL, -- 'user' or 'partner'
      sender_name TEXT NOT NULL
    );

    -- Add indexes for better performance
    CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender);
    CREATE INDEX IF NOT EXISTS idx_messages_timestamp ON messages(timestamp);
    CREATE INDEX IF NOT EXISTS idx_memories_category ON memories(category);
    CREATE INDEX IF NOT EXISTS idx_memories_timestamp ON memories(timestamp);
    CREATE INDEX IF NOT EXISTS idx_photos_timestamp ON photos(timestamp);
    CREATE INDEX IF NOT EXISTS idx_whatsapp_timestamp ON whatsapp_context(timestamp);
  `);

  console.log('✅ Database initialized successfully');
  return db;
}

export function getDatabase() {
  if (!db) {
    throw new Error('Database not initialized. Call initializeDatabase() first.');
  }
  return db;
}
