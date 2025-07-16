import { generateResponse } from '../services/aiService.js';
import { MemoryService } from '../services/memoryService.js';
import { Message } from '../models/Message.js';
import { getDatabase } from '../models/database.js';
import { getContextualPrompt } from '../utils/hinglishPrompts.js';

export const sendMessage = async (req, res) => {
  try {
    const { message, context } = req.body;
    
    if (!message || !message.trim()) {
      return res.status(400).json({ error: 'Message cannot be empty' });
    }

    // Create user message using Message model
    const userMessage = await Message.create('user', message.trim());

    // Extract and save any memories from the message
    const memories = await MemoryService.extractMemoriesFromMessage(message);
    for (const memory of memories) {
      await MemoryService.addMemory(memory.key, memory.value, memory.category);
    }

    // Generate AI response
    const response = await generateResponse(message, context);
    
    // Create AI message using Message model
    const aiMessage = await Message.create('assistant', response);
    
    res.json({
      response,
      timestamp: aiMessage.timestamp,
      messageId: aiMessage.id,
      contextualPrompt: getContextualPrompt(message)
    });
  } catch (error) {
    console.error('Chat controller error:', error);
    res.status(500).json({ 
      error: 'Yaar, kuch technical problem hai! Try again! 😅' 
    });
  }
};

export const getChatHistory = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const offset = parseInt(req.query.offset) || 0;
    
    const messages = await Message.findAll(limit, offset);
    
    res.json({ 
      messages: messages.reverse().map(msg => msg.toJSON()),
      hasMore: messages.length === limit
    });
  } catch (error) {
    console.error('Chat history error:', error);
    res.status(500).json({ error: 'Failed to fetch chat history' });
  }
};
