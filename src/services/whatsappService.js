export function parseWhatsAppChat(chatContent) {
  const messages = [];
  const lines = chatContent.split('\n');
  
  // Enhanced regex patterns for different WhatsApp formats
  const patterns = [
    // Pattern 1: [DD/MM/YY, HH:MM[:SS] [AM|PM]] Name: Message
    /^\[(\d{1,2}\/\d{1,2}\/\d{2,4}),?\s*(\d{1,2}:\d{2}(?::\d{2})?)(?:\s*[APMapm\.]+)?\]\s*([^:]+):\s*(.+)$/,
    // Pattern 2: DD/MM/YY, HH:MM - Name: Message
    /^(\d{1,2}\/\d{1,2}\/\d{2,4}),?\s*(\d{1,2}:\d{2})\s*-\s*([^:]+):\s*(.+)$/,
    // Pattern 3: DD/MM/YYYY, HH:MM:SS - Name: Message
    /^(\d{1,2}\/\d{1,2}\/\d{4}),?\s*(\d{1,2}:\d{2}:\d{2})\s*-\s*([^:]+):\s*(.+)$/
  ];
  
  let currentMessage = null;
  
  for (const line of lines) {
    let matched = false;
    
    for (const pattern of patterns) {
      const match = line.match(pattern);
      if (match) {
        // Save previous message if exists
        if (currentMessage) {
          messages.push(currentMessage);
        }
        
        const [, date, time, sender, content] = match;
        
        // Skip system messages
        if (isSystemMessage(content)) {
          matched = true;
          currentMessage = null;
          break;
        }
        
        currentMessage = {
          timestamp: `${date} ${time}`,
          sender: sender.trim(),
          content: content.trim(),
          type: detectMessageType(content)
        };
        
        matched = true;
        break;
      }
    }
    
    // If no pattern matched and we have a current message, it's a continuation
    if (!matched && currentMessage && line.trim()) {
      currentMessage.content += '\n' + line.trim();
    }
  }
  
  // Add the last message
  if (currentMessage) {
    messages.push(currentMessage);
  }
  
  return messages;
}

function isSystemMessage(content) {
  const systemPatterns = [
    /Messages and calls are end-to-end encrypted/,
    /You deleted this message/,
    /This message was deleted/,
    /joined using this group's invite link/,
    /left/,
    /was added/,
    /changed the group description/,
    /changed this group's icon/,
    /Missed voice call/,
    /Missed video call/,
    /<Media omitted>/
  ];
  
  return systemPatterns.some(pattern => pattern.test(content));
}

function detectMessageType(content) {
  if (content.includes('<Media omitted>')) return 'media';
  if (content.includes('audio omitted')) return 'audio';
  if (content.includes('video omitted')) return 'video';
  if (content.includes('image omitted')) return 'image';
  if (content.includes('document omitted')) return 'document';
  return 'text';
}
