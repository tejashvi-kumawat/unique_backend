import Groq from 'groq-sdk';
import { getDatabase } from '../models/database.js';
import { buildPersonalityPrompt } from '../utils/personalityBuilder.js';
import dotenv from 'dotenv';
dotenv.config();
console.log('ALL ENV VARS:', process.env);
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY || ''
});
if (!process.env.GROQ_API_KEY) {
  console.error('❌ GROQ_API_KEY is not set in environment variables!');
}

export async function generateResponse(userMessage, context = {}) {
  const db = getDatabase();

  // Get recent conversation history
  const recentMessages = await db.all(
    'SELECT * FROM messages ORDER BY timestamp DESC LIMIT 2'
  );

  // RAG: Retrieve top 3 relevant memories using FTS
  let memories = await db.all(
    'SELECT value FROM memories_fts WHERE memories_fts MATCH ? LIMIT 3',
    [userMessage.replace(/['"*:,]/g, ' ')]
  );
  memories = memories.map(m => ({ value: m.value?.slice(0, 300) }));

  // RAG: Retrieve top 3 relevant WhatsApp context messages using FTS
  let whatsappContext = await db.all(
    'SELECT message FROM whatsapp_context_fts WHERE whatsapp_context_fts MATCH ? LIMIT 3',
    [userMessage.replace(/['"*:,]/g, ' ')]
  );
  whatsappContext = whatsappContext.map(m => ({ message: m.message?.slice(0, 300) }));

  // Fetch user and partner names from sender_mapping
  const senderRows = await db.all('SELECT role, sender_name FROM sender_mapping');
  let userName = 'User';
  let partnerName = 'Partner';
  senderRows.forEach(row => {
    if (row.role === 'user') userName = row.sender_name;
    if (row.role === 'partner') partnerName = row.sender_name;
  });

  // Build conversation context
  const conversationHistory = recentMessages.reverse().map(msg => ({
    role: msg.sender === 'user' ? 'user' : 'assistant',
    content: msg.content
  }));

  const personalityPrompt = buildPersonalityPrompt(memories, whatsappContext, { userName, partnerName });

  try {
    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: personalityPrompt
        },
        ...conversationHistory,
        {
          role: 'user',
          content: userMessage
        }
      ],
      model: 'llama3-8b-8192', // Free model
      temperature: 0.8,
      max_tokens: 1000,
    });

    const response = completion.choices[0]?.message?.content || 'Sorry, I couldn\'t understand that!';

    // Save messages to database
    await db.run(
      'INSERT INTO messages (sender, content) VALUES (?, ?)',
      ['user', userMessage]
    );
    // Also insert into FTS table for memories if not already present
    await db.run(
      'INSERT INTO memories_fts (value) VALUES (?)',
      [userMessage]
    );

    await db.run(
      'INSERT INTO messages (sender, content) VALUES (?, ?)',
      ['assistant', response]
    );
    // Also insert into FTS table for WhatsApp context if not already present
    await db.run(
      'INSERT INTO whatsapp_context_fts (message) VALUES (?)',
      [response]
    );

    return response;
  } catch (error) {
    console.error('AI Service Error:', error);
    return 'Arey yaar, kuch technical problem hai. Try again! 😅';
  }
}
