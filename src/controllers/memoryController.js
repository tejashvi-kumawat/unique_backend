import { MemoryService } from '../services/memoryService.js';
import { getDatabase } from '../models/database.js';

export const getMemories = async (req, res) => {
  try {
    const memories = await MemoryService.getAllMemories();
    res.json({ memories });
  } catch (error) {
    console.error('Failed to fetch memories:', error);
    res.status(500).json({ error: 'Failed to fetch memories' });
  }
};

export const addMemory = async (req, res) => {
  try {
    const { key, value } = req.body;
    
    if (!key || !value) {
      return res.status(400).json({ 
        error: 'Key and value are required' 
      });
    }
    
    await MemoryService.addMemory(key, value);
    
    res.json({ 
      success: true, 
      message: 'Memory added successfully' 
    });
  } catch (error) {
    console.error('Failed to add memory:', error);
    res.status(500).json({ error: 'Failed to add memory' });
  }
};

export const deleteMemory = async (req, res) => {
  try {
    const { key } = req.params;
    
    if (!key) {
      return res.status(400).json({ error: 'Memory key is required' });
    }
    
    const db = getDatabase();
    await db.run('DELETE FROM memories WHERE key = ?', [key]);
    
    res.json({ 
      success: true, 
      message: 'Memory deleted successfully' 
    });
  } catch (error) {
    console.error('Failed to delete memory:', error);
    res.status(500).json({ error: 'Failed to delete memory' });
  }
};

export const searchMemories = async (req, res) => {
  try {
    const { query } = req.query;
    
    if (!query) {
      return res.status(400).json({ error: 'Search query is required' });
    }
    
    const db = getDatabase();
    const memories = await db.all(
      'SELECT * FROM memories WHERE key LIKE ? OR value LIKE ? ORDER BY timestamp DESC',
      [`%${query}%`, `%${query}%`]
    );
    
    res.json({ memories });
  } catch (error) {
    console.error('Failed to search memories:', error);
    res.status(500).json({ error: 'Failed to search memories' });
  }
};
