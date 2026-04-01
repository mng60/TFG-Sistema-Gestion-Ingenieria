// Servicio IA unificado: usa Groq en produccion (GROQ_API_KEY) u Ollama en local
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_MODEL = process.env.GROQ_MODEL || 'llama-3.1-8b-instant';
const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'phi3:mini';
const AI_MAX_TOKENS = 220;
const AI_TEMPERATURE = 0.1;

async function askGroq(systemPrompt, userMessage) {
  const response = await fetch(GROQ_API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage }
      ],
      max_tokens: AI_MAX_TOKENS,
      temperature: AI_TEMPERATURE
    }),
    signal: AbortSignal.timeout(15000)
  });

  const data = await response.json();
  if (!response.ok) throw new Error(data.error?.message || `Groq error ${response.status}`);
  return data.choices[0].message.content.trim();
}

async function askOllama(systemPrompt, userMessage) {
  const response = await fetch(`${OLLAMA_URL}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: OLLAMA_MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage }
      ],
      stream: false,
      options: {
        temperature: AI_TEMPERATURE,
        num_predict: AI_MAX_TOKENS
      }
    }),
    signal: AbortSignal.timeout(30000)
  });

  const data = await response.json();
  if (!response.ok) throw new Error(data.error || `Ollama error ${response.status}`);
  return data.message.content.trim();
}

async function ask(systemPrompt, userMessage) {
  if (process.env.GROQ_API_KEY) return askGroq(systemPrompt, userMessage);
  return askOllama(systemPrompt, userMessage);
}

// Ping ligero sin llamar al modelo:
// Groq -> disponible si la key esta configurada
// Ollama -> GET /api/tags (solo lista modelos, no genera nada)
async function isAvailable() {
  try {
    if (process.env.GROQ_API_KEY) return true;
    const res = await fetch(`${OLLAMA_URL}/api/tags`, {
      signal: AbortSignal.timeout(3000)
    });
    return res.ok;
  } catch {
    return false;
  }
}

module.exports = { ask, isAvailable };
