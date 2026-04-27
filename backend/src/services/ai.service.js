// Servicio IA — Groq (Llama 3.3 70B), OpenAI-compatible
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_MODEL   = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';

const AI_TEMPERATURE = 0.1;

async function callGroq(messages, maxTokens) {
  const response = await fetch(GROQ_API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ model: GROQ_MODEL, messages, max_tokens: maxTokens, temperature: AI_TEMPERATURE }),
    signal: AbortSignal.timeout(15000)
  });
  const data = await response.json();
  if (!response.ok) {
    const msg = data.error?.message || `error ${response.status}`;
    throw Object.assign(new Error(msg), { status: response.status });
  }
  return data.choices[0].message.content.trim();
}

// history: array de { role: 'user'|'assistant', content: string }
async function ask(systemPrompt, userMessage, history = []) {
  if (!process.env.GROQ_API_KEY) {
    throw new Error('No hay proveedor de IA configurado (GROQ_API_KEY)');
  }
  const messages = [
    { role: 'system', content: systemPrompt },
    ...history,
    { role: 'user', content: userMessage }
  ];
  return callGroq(messages, 500);
}

async function traducirSiNecesario(texto, preguntaOriginal) {
  const esEspanol = /\b(como|cuando|donde|cuanto|que|cual|quien|precio|luz|solar|hoy|ahora|franja|hora|tiempo|cuanto)\b/i.test(preguntaOriginal);
  if (esEspanol) return texto;
  return ask(
    'Translate the following text to the same language as the user question. Keep numbers, units and time values exactly as they are. Output only the translated text.',
    `User question: "${preguntaOriginal}"\n\nText to translate: "${texto}"`
  );
}

async function isAvailable() {
  return Boolean(process.env.GROQ_API_KEY);
}

module.exports = { ask, traducirSiNecesario, isAvailable };
