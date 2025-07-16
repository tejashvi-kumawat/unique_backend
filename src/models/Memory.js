import { getDatabase } from '../models/database.js';

export class MemoryService {
  static async addMemory(key, value) {
    const db = getDatabase();
    await db.run(
      'INSERT OR REPLACE INTO memories (key, value) VALUES (?, ?)',
      [key, value]
    );
  }

  static async getMemory(key) {
    const db = getDatabase();
    const result = await db.get('SELECT value FROM memories WHERE key = ?', [key]);
    return result?.value || null;
  }

  static async getAllMemories() {
    const db = getDatabase();
    return await db.all('SELECT * FROM memories ORDER BY timestamp DESC');
  }

  static async extractMemoriesFromMessage(message) {
    const memories = [];
    
    // Extract dates
    const dateRegex = /(\d{1,2}\/\d{1,2}\/\d{2,4})|(\d{1,2}-\d{1,2}-\d{2,4})/g;
    const dates = message.match(dateRegex);
    if (dates) {
      dates.forEach(date => {
        memories.push({ key: `date_mentioned_${Date.now()}`, value: date });
      });
    }
    
    // Extract preferences
    const preferences = [
      { pattern: /i like (.+?)(?:\.|$)/i, key: 'likes' },
      { pattern: /i love (.+?)(?:\.|$)/i, key: 'loves' },
      { pattern: /i hate (.+?)(?:\.|$)/i, key: 'dislikes' },
      { pattern: /my favorite (.+?)(?:\.|$)/i, key: 'favorites' }
    ];
    
    preferences.forEach(({ pattern, key }) => {
      const matches = message.match(pattern);
      if (matches) {
        memories.push({ key: `${key}_${Date.now()}`, value: matches[1] });
      }
    });
    
    return memories;
  }
}
