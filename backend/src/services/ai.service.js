// Servicio IA — Gemini 2.0 Flash via Google AI Studio
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions';
const GEMINI_MODEL   = process.env.GEMINI_MODEL || 'gemini-2.0-flash';
const AI_TEMPERATURE = 0.1;

async function ask(systemPrompt, userMessage, history = []) {
  const messages = [
    { role: 'system', content: systemPrompt },
    ...history,
    { role: 'user', content: userMessage }
  ];

  const response = await fetch(GEMINI_API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.GEMINI_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ model: GEMINI_MODEL, messages, max_tokens: 500, temperature: AI_TEMPERATURE }),
    signal: AbortSignal.timeout(15000)
  });

  const data = await response.json();
  if (!response.ok) throw new Error(data.error?.message || `Gemini error ${response.status}`);
  return data.choices[0].message.content.trim();
}

async function isAvailable() {
  return Boolean(process.env.GEMINI_API_KEY);
}

module.exports = { ask, isAvailable };
