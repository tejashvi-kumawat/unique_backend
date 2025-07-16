import { getDatabase } from '../models/database.js';

export class MemoryService {
  // Add a new memory
  static async addMemory(key, value, category = 'general') {
    const db = getDatabase();
    const timestamp = new Date().toISOString();
    
    await db.run(
      'INSERT OR REPLACE INTO memories (key, value, category, timestamp) VALUES (?, ?, ?, ?)',
      [key, value, category, timestamp]
    );
    
    return { key, value, category, timestamp };
  }

  // Get a specific memory by key
  static async getMemory(key) {
    const db = getDatabase();
    const result = await db.get('SELECT * FROM memories WHERE key = ?', [key]);
    return result || null;
  }

  // Get all memories
  static async getAllMemories() {
    const db = getDatabase();
    return await db.all('SELECT * FROM memories ORDER BY timestamp DESC');
  }

  // Get memories by category
  static async getMemoriesByCategory(category) {
    const db = getDatabase();
    return await db.all(
      'SELECT * FROM memories WHERE category = ? ORDER BY timestamp DESC',
      [category]
    );
  }

  // Search memories
  static async searchMemories(query) {
    const db = getDatabase();
    return await db.all(
      'SELECT * FROM memories WHERE key LIKE ? OR value LIKE ? ORDER BY timestamp DESC',
      [`%${query}%`, `%${query}%`]
    );
  }

  // Delete a memory
  static async deleteMemory(key) {
    const db = getDatabase();
    const result = await db.run('DELETE FROM memories WHERE key = ?', [key]);
    return result.changes > 0;
  }

  // Extract memories from message content
  static async extractMemoriesFromMessage(message, sender = 'user') {
    const memories = [];
    const content = message.toLowerCase();
    
    // Extract personal information
    const personalPatterns = [
      { pattern: /my name is ([a-zA-Z\s]+)/i, category: 'personal', key: 'name' },
      { pattern: /i am (\d+) years old/i, category: 'personal', key: 'age' },
      { pattern: /i work at ([a-zA-Z\s]+)/i, category: 'personal', key: 'workplace' },
      { pattern: /i study at ([a-zA-Z\s]+)/i, category: 'personal', key: 'education' },
      { pattern: /i live in ([a-zA-Z\s]+)/i, category: 'personal', key: 'location' }
    ];

    // Extract preferences
    const preferencePatterns = [
      { pattern: /i like (.+?)(?:\.|$|,)/i, category: 'preferences', key: 'likes' },
      { pattern: /i love (.+?)(?:\.|$|,)/i, category: 'preferences', key: 'loves' },
      { pattern: /i hate (.+?)(?:\.|$|,)/i, category: 'preferences', key: 'dislikes' },
      { pattern: /i don't like (.+?)(?:\.|$|,)/i, category: 'preferences', key: 'dislikes' },
      { pattern: /my favorite (.+?) is (.+?)(?:\.|$|,)/i, category: 'preferences', key: 'favorites' },
      { pattern: /i prefer (.+?)(?:\.|$|,)/i, category: 'preferences', key: 'preferences' }
    ];

    // Extract dates and events
    const datePatterns = [
      { pattern: /my birthday is (.+?)(?:\.|$|,)/i, category: 'dates', key: 'birthday' },
      { pattern: /our anniversary is (.+?)(?:\.|$|,)/i, category: 'dates', key: 'anniversary' },
      { pattern: /(\d{1,2}\/\d{1,2}\/\d{2,4})/g, category: 'dates', key: 'date_mentioned' },
      { pattern: /(january|february|march|april|may|june|july|august|september|october|november|december) \d{1,2}/i, category: 'dates', key: 'date_mentioned' }
    ];

    // Extract relationships
    const relationshipPatterns = [
      { pattern: /my boyfriend is (.+?)(?:\.|$|,)/i, category: 'relationships', key: 'boyfriend' },
      { pattern: /my girlfriend is (.+?)(?:\.|$|,)/i, category: 'relationships', key: 'girlfriend' },
      { pattern: /my partner is (.+?)(?:\.|$|,)/i, category: 'relationships', key: 'partner' },
      { pattern: /my friend (.+?) is (.+?)(?:\.|$|,)/i, category: 'relationships', key: 'friend' }
    ];

    // Extract activities and hobbies
    const activityPatterns = [
      { pattern: /i play (.+?)(?:\.|$|,)/i, category: 'activities', key: 'plays' },
      { pattern: /i watch (.+?)(?:\.|$|,)/i, category: 'activities', key: 'watches' },
      { pattern: /i read (.+?)(?:\.|$|,)/i, category: 'activities', key: 'reads' },
      { pattern: /i listen to (.+?)(?:\.|$|,)/i, category: 'activities', key: 'listens_to' },
      { pattern: /my hobby is (.+?)(?:\.|$|,)/i, category: 'activities', key: 'hobbies' }
    ];

    // Extract food preferences
    const foodPatterns = [
      { pattern: /i eat (.+?)(?:\.|$|,)/i, category: 'food', key: 'eats' },
      { pattern: /i drink (.+?)(?:\.|$|,)/i, category: 'food', key: 'drinks' },
      { pattern: /my favorite food is (.+?)(?:\.|$|,)/i, category: 'food', key: 'favorite_food' },
      { pattern: /i'm vegetarian/i, category: 'food', key: 'diet', value: 'vegetarian' },
      { pattern: /i'm vegan/i, category: 'food', key: 'diet', value: 'vegan' }
    ];

    // Extract emotional states
    const emotionPatterns = [
      { pattern: /i feel (.+?)(?:\.|$|,)/i, category: 'emotions', key: 'current_feeling' },
      { pattern: /i'm (sad|happy|angry|excited|tired|stressed|relaxed|worried)/i, category: 'emotions', key: 'current_mood' },
      { pattern: /today was (.+?)(?:\.|$|,)/i, category: 'emotions', key: 'day_summary' }
    ];

    // Extract goals and aspirations
    const goalPatterns = [
      { pattern: /i want to (.+?)(?:\.|$|,)/i, category: 'goals', key: 'wants' },
      { pattern: /my goal is (.+?)(?:\.|$|,)/i, category: 'goals', key: 'goals' },
      { pattern: /i plan to (.+?)(?:\.|$|,)/i, category: 'goals', key: 'plans' },
      { pattern: /i dream of (.+?)(?:\.|$|,)/i, category: 'goals', key: 'dreams' }
    ];

    // Combine all patterns
    const allPatterns = [
      ...personalPatterns,
      ...preferencePatterns,
      ...datePatterns,
      ...relationshipPatterns,
      ...activityPatterns,
      ...foodPatterns,
      ...emotionPatterns,
      ...goalPatterns
    ];

    // Process patterns
    for (const { pattern, category, key, value } of allPatterns) {
      const matches = message.match(pattern);
      if (matches) {
        const extractedValue = value || matches[1]?.trim();
        if (extractedValue) {
          const memoryKey = `${key}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          memories.push({
            key: memoryKey,
            value: extractedValue,
            category,
            originalKey: key,
            extractedFrom: message.substring(0, 100),
            sender
          });
        }
      }
    }

    // Save extracted memories
    for (const memory of memories) {
      await this.addMemory(memory.key, memory.value, memory.category);
    }

    return memories;
  }

  // Get contextual memories for AI response
  static async getContextualMemories(message, limit = 10) {
    const db = getDatabase();
    const keywords = message.toLowerCase().split(' ').filter(word => word.length > 3);
    
    if (keywords.length === 0) {
      return await db.all('SELECT * FROM memories ORDER BY timestamp DESC LIMIT ?', [limit]);
    }

    const conditions = keywords.map(() => '(key LIKE ? OR value LIKE ?)').join(' OR ');
    const params = keywords.flatMap(keyword => [`%${keyword}%`, `%${keyword}%`]);
    params.push(limit);

    return await db.all(
      `SELECT * FROM memories WHERE ${conditions} ORDER BY timestamp DESC LIMIT ?`,
      params
    );
  }

  // Get memories for personality building
  static async getPersonalityMemories() {
    const db = getDatabase();
    return await db.all(`
      SELECT * FROM memories 
      WHERE category IN ('personal', 'preferences', 'relationships', 'activities') 
      ORDER BY timestamp DESC 
      LIMIT 50
    `);
  }

  // Update memory
  static async updateMemory(key, newValue, category = null) {
    const db = getDatabase();
    const timestamp = new Date().toISOString();
    
    if (category) {
      await db.run(
        'UPDATE memories SET value = ?, category = ?, timestamp = ? WHERE key = ?',
        [newValue, category, timestamp, key]
      );
    } else {
      await db.run(
        'UPDATE memories SET value = ?, timestamp = ? WHERE key = ?',
        [newValue, timestamp, key]
      );
    }
    
    return await this.getMemory(key);
  }

  // Get memory statistics
  static async getMemoryStats() {
    const db = getDatabase();
    
    const totalMemories = await db.get('SELECT COUNT(*) as count FROM memories');
    const categoryCounts = await db.all(`
      SELECT category, COUNT(*) as count 
      FROM memories 
      GROUP BY category 
      ORDER BY count DESC
    `);
    
    const recentMemories = await db.get(`
      SELECT COUNT(*) as count 
      FROM memories 
      WHERE timestamp > datetime('now', '-7 days')
    `);

    return {
      total: totalMemories.count,
      categories: categoryCounts,
      recentWeek: recentMemories.count
    };
  }

  // Clean up old or duplicate memories
  static async cleanupMemories(daysToKeep = 90) {
    const db = getDatabase();
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
    
    // Delete old memories
    const deletedCount = await db.run(
      'DELETE FROM memories WHERE timestamp < ?',
      [cutoffDate.toISOString()]
    );
    
    // Remove duplicate memories (keep the most recent)
    await db.run(`
      DELETE FROM memories 
      WHERE id NOT IN (
        SELECT MIN(id) 
        FROM memories 
        GROUP BY key, value
      )
    `);
    
    return deletedCount.changes;
  }

  // Export memories to JSON
  static async exportMemories() {
    const memories = await this.getAllMemories();
    return {
      exportDate: new Date().toISOString(),
      totalMemories: memories.length,
      memories: memories
    };
  }

  // Import memories from JSON
  static async importMemories(memoriesData) {
    const imported = [];
    
    for (const memory of memoriesData.memories) {
      try {
        await this.addMemory(memory.key, memory.value, memory.category);
        imported.push(memory.key);
      } catch (error) {
        console.error(`Failed to import memory ${memory.key}:`, error);
      }
    }
    
    return imported;
  }
}
