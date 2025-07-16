export const hinglishPrompts = {
  romantic: [
    "Arey yaar, tu kitni cute hai! 😘",
    "Tere bina dil nahi lagta, seriously! 💕",
    "Bas tera intezaar kar raha tha, jaan! 🥰",
    "Tujhe dekh kar mera day ban jata hai! ☀️",
    "Yaar, tu mere liye everything hai! ❤️"
  ],
  
  flirty: [
    "Kya baat hai! Tu aaj extra beautiful lag rahi hai! 😍",
    "Mere phone mein tera contact save hai, but dil mein tu permanently stored hai! 💾💕",
    "Tere smile se mera heart.exe crash ho jata hai! 😄💻",
    "Debug karna pada mujhe kyuki tere pyaar mein mera logic fail ho gaya! 🤭",
    "Yaar, tu mere localStorage mein permanent save hai! 💾❤️"
  ],
  
  funny: [
    "Aaj GitHub down tha, par mera love for you always up hai! 🚀",
    "Tere bina mera code compile nahi hota! 😂💻",
    "Yaar, tu mere life ka favorite function hai! 🤗",
    "Bas tera notification ka intezaar karta rehta hu! 📱💕",
    "Tujhe dekh kar mera JavaScript asynchronous ho jata hai! 🤪"
  ],
  
  caring: [
    "Khana khaya? Paani piya? Health ka dhyan rakhna! 🍽️💧",
    "Arey sleepy head, enough coding for today! Rest kar! 😴",
    "Yaar, break le. Continuously kaam mat kar! 🛑",
    "Meri jaan, thoda relax kar. Stress mat le! 🧘‍♀️",
    "Chal oye, walk pe chalte hain. Fresh air lenge! 🚶‍♀️"
  ],
  
  supportive: [
    "Yaar, tu strong hai. Sab handle kar legi! 💪",
    "Bas kar diya na tune! Proud of you! 🎉",
    "Difficulties come and go, but my support is permanent! 🤝",
    "Chal na, everything will be alright. I'm here! 🫂",
    "Yaar, tu amazing hai. Bas believe kar apne aap pe! ✨"
  ],
  
  goodMorning: [
    "Good morning beautiful! Aaj ka din awesome banayenge! ☀️",
    "Uth ja sleepy! Coffee peeke day start karte hain! ☕",
    "Morning sunshine! Aaj kya plan hai? 🌞",
    "Yaar, good morning! Aaj productive day hoga! 💪",
    "Uth ja meri jaan! Subah ho gayi hai! 🌅"
  ],
  
  goodNight: [
    "Good night baby! Sweet dreams! 🌙",
    "Bas kar diya na work? Ab so ja! 😴",
    "Yaar, late night coding mat kar! Sleep is important! 💤",
    "Good night sunshine! Kal phir milenge! ✨",
    "Dreamland mein mere saath dance karna! 💃🕺"
  ],
  
  techJokes: [
    "Mera love for you is like a while loop - infinite! ∞",
    "Tere bina mera system mein null pointer exception aa jata hai! 🚫",
    "Yaar, tu mere heart ka admin hai! 👨‍💼❤️",
    "Tujhe dekh kar mera CPU usage 100% ho jata hai! 💻",
    "Bas tera love mere life mein perfect algorithm hai! 🤖"
  ]
};

export const getRandomPrompt = (category) => {
  const prompts = hinglishPrompts[category];
  if (!prompts || prompts.length === 0) return null;
  
  const randomIndex = Math.floor(Math.random() * prompts.length);
  return prompts[randomIndex];
};

export const getContextualPrompt = (message, mood = 'normal') => {
  const lowerMessage = message.toLowerCase();
  
  // Check for keywords and return appropriate category
  if (lowerMessage.includes('good morning') || lowerMessage.includes('morning')) {
    return getRandomPrompt('goodMorning');
  }
  
  if (lowerMessage.includes('good night') || lowerMessage.includes('night') || lowerMessage.includes('sleep')) {
    return getRandomPrompt('goodNight');
  }
  
  if (lowerMessage.includes('sad') || lowerMessage.includes('problem') || lowerMessage.includes('stress')) {
    return getRandomPrompt('supportive');
  }
  
  if (lowerMessage.includes('code') || lowerMessage.includes('programming') || lowerMessage.includes('tech')) {
    return getRandomPrompt('techJokes');
  }
  
  // Default based on mood
  switch (mood) {
    case 'romantic': return getRandomPrompt('romantic');
    case 'flirty': return getRandomPrompt('flirty');
    case 'funny': return getRandomPrompt('funny');
    case 'caring': return getRandomPrompt('caring');
    default: return getRandomPrompt('romantic');
  }
};
