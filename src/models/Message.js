import { getDatabase } from './database.js';

export class Message {
  constructor(data) {
    this.id = data.id;
    this.sender = data.sender;
    this.content = data.content;
    this.timestamp = data.timestamp;
    this.message_type = data.message_type || 'text';
    if (typeof data.metadata === 'string') {
      this.metadata = JSON.parse(data.metadata);
    } else if (typeof data.metadata === 'object' && data.metadata !== null) {
      this.metadata = data.metadata;
    } else {
      this.metadata = {};
    }
  }

  static async create(sender, content, messageType = 'text', metadata = {}) {
    const db = getDatabase();
    const timestamp = new Date().toISOString();
    
    const result = await db.run(
      'INSERT INTO messages (sender, content, message_type, timestamp, metadata) VALUES (?, ?, ?, ?, ?)',
      [sender, content, messageType, timestamp, JSON.stringify(metadata)]
    );
    
    return new Message({
      id: result.lastID,
      sender,
      content,
      message_type: messageType,
      timestamp,
      metadata
    });
  }

  static async findById(id) {
    const db = getDatabase();
    const row = await db.get('SELECT * FROM messages WHERE id = ?', [id]);
    return row ? new Message(row) : null;
  }

  static async findAll(limit = 50, offset = 0) {
    const db = getDatabase();
    const rows = await db.all(
      'SELECT * FROM messages ORDER BY timestamp DESC LIMIT ? OFFSET ?',
      [limit, offset]
    );
    return rows.map(row => new Message(row));
  }

  static async findBySender(sender, limit = 50) {
    const db = getDatabase();
    const rows = await db.all(
      'SELECT * FROM messages WHERE sender = ? ORDER BY timestamp DESC LIMIT ?',
      [sender, limit]
    );
    return rows.map(row => new Message(row));
  }

  static async findByDateRange(startDate, endDate) {
    const db = getDatabase();
    const rows = await db.all(
      'SELECT * FROM messages WHERE timestamp BETWEEN ? AND ? ORDER BY timestamp DESC',
      [startDate, endDate]
    );
    return rows.map(row => new Message(row));
  }

  static async search(query, limit = 50) {
    const db = getDatabase();
    const rows = await db.all(
      'SELECT * FROM messages WHERE content LIKE ? ORDER BY timestamp DESC LIMIT ?',
      [`%${query}%`, limit]
    );
    return rows.map(row => new Message(row));
  }

  static async getConversationHistory(limit = 20) {
    const db = getDatabase();
    const rows = await db.all(
      'SELECT * FROM messages ORDER BY timestamp DESC LIMIT ?',
      [limit]
    );
    return rows.reverse().map(row => new Message(row));
  }

  static async getMessageCount() {
    const db = getDatabase();
    const result = await db.get('SELECT COUNT(*) as count FROM messages');
    return result.count;
  }

  static async getMessageCountBySender(sender) {
    const db = getDatabase();
    const result = await db.get(
      'SELECT COUNT(*) as count FROM messages WHERE sender = ?',
      [sender]
    );
    return result.count;
  }

  static async deleteOldMessages(daysToKeep = 30) {
    const db = getDatabase();
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
    
    const result = await db.run(
      'DELETE FROM messages WHERE timestamp < ?',
      [cutoffDate.toISOString()]
    );
    
    return result.changes;
  }

  static async getRecentMessagesByType(messageType, limit = 10) {
    const db = getDatabase();
    const rows = await db.all(
      'SELECT * FROM messages WHERE message_type = ? ORDER BY timestamp DESC LIMIT ?',
      [messageType, limit]
    );
    return rows.map(row => new Message(row));
  }

  async update(content, metadata = {}) {
    const db = getDatabase();
    await db.run(
      'UPDATE messages SET content = ?, metadata = ? WHERE id = ?',
      [content, JSON.stringify(metadata), this.id]
    );
    
    this.content = content;
    this.metadata = metadata;
    return this;
  }

  async delete() {
    const db = getDatabase();
    await db.run('DELETE FROM messages WHERE id = ?', [this.id]);
    return true;
  }

  toJSON() {
    return {
      id: this.id,
      sender: this.sender,
      content: this.content,
      message_type: this.message_type,
      timestamp: this.timestamp,
      metadata: this.metadata
    };
  }

  // Check if message is from user
  isFromUser() {
    return this.sender === 'user';
  }

  // Check if message is from AI
  isFromAI() {
    return this.sender === 'assistant' || this.sender === 'ai';
  }

  // Format timestamp for display
  getFormattedTime() {
    return new Date(this.timestamp).toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getFormattedDate() {
    return new Date(this.timestamp).toLocaleDateString('en-IN');
  }

  // Check if message contains specific keywords
  containsKeywords(keywords) {
    const content = this.content.toLowerCase();
    return keywords.some(keyword => content.includes(keyword.toLowerCase()));
  }
}
