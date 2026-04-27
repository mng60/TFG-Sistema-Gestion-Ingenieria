// Servicio IA unificado: Gemini (GEMINI_API_KEY) > Groq (GROQ_API_KEY) > Ollama local
const GROQ_API_URL   = 'https://api.groq.com/openai/v1/chat/completions';
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions';

const GROQ_MODEL   = process.env.GROQ_MODEL   || 'llama-3.1-8b-instant';
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.0-flash';
const OLLAMA_URL   = process.env.OLLAMA_URL   || 'http://localhost:11434';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'phi3:mini';

const AI_TEMPERATURE = 0.1;

async function callOpenAICompatible(url, apiKey, model, messages, maxTokens) {
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ model, messages, max_tokens: maxTokens, temperature: AI_TEMPERATURE }),
    signal: AbortSignal.timeout(15000)
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error?.message || `API error ${response.status}`);
  return data.choices[0].message.content.trim();
}

async function askOllama(messages) {
  const response = await fetch(`${OLLAMA_URL}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: OLLAMA_MODEL,
      messages,
      stream: false,
      options: { temperature: AI_TEMPERATURE, num_predict: 220 }
    }),
    signal: AbortSignal.timeout(30000)
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || `Ollama error ${response.status}`);
  return data.message.content.trim();
}

// history: array de { role: 'user'|'assistant', content: string }
async function ask(systemPrompt, userMessage, history = []) {
  const messages = [
    { role: 'system', content: systemPrompt },
    ...history,
    { role: 'user', content: userMessage }
  ];
  if (process.env.GEMINI_API_KEY) return callOpenAICompatible(GEMINI_API_URL, process.env.GEMINI_API_KEY, GEMINI_MODEL, messages, 500);
  if (process.env.GROQ_API_KEY)  return callOpenAICompatible(GROQ_API_URL,   process.env.GROQ_API_KEY,   GROQ_MODEL,   messages, 220);
  return askOllama(messages);
}

async function isAvailable() {
  try {
    if (process.env.GEMINI_API_KEY) return true;
    if (process.env.GROQ_API_KEY)  return true;
    const res = await fetch(`${OLLAMA_URL}/api/tags`, { signal: AbortSignal.timeout(3000) });
    return res.ok;
  } catch {
    return false;
  }
}

module.exports = { ask, isAvailable };
