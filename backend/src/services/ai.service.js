// Servicio IA — Gemini 2.0 Flash via Google AI Studio
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions';
const GEMINI_MODEL   = process.env.GEMINI_MODEL || 'gemini-2.0-flash';
const AI_TEMPERATURE = 0.1;

async function callGemini(messages) {
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

// Reintenta una vez si Gemini devuelve 429 (rate limit del plan gratuito: 15 rpm)
async function callGeminiWithRetry(messages) {
  try {
    return await callGemini(messages);
  } catch (err) {
    if (err.message.includes('429')) {
      await new Promise((r) => setTimeout(r, 5000));
      return callGemini(messages);
    }
    throw err;
  }
}

// history: array de { role: 'user'|'assistant', content: string }
async function ask(systemPrompt, userMessage, history = []) {
  const messages = [
    { role: 'system', content: systemPrompt },
    ...history,
    { role: 'user', content: userMessage }
  ];
  return callGeminiWithRetry(messages);
}

// Traduce un texto al idioma detectado en la pregunta del usuario
async function traducirSiNecesario(texto, preguntaOriginal) {
  const esEspanol = /^[a-záéíóúüñ\s\d¿¡.,!?;:()\-"']+$/i.test(preguntaOriginal) ||
    /\b(como|cuando|donde|cuanto|que|cual|quien|cuantos|precio|luz|solar|hoy|ahora|franja|hora)\b/i.test(preguntaOriginal);
  if (esEspanol) return texto;
  return ask(
    'Translate the following text to the same language as the user question. Keep numbers, units and time values exactly as they are. Output only the translated text.',
    `User question: "${preguntaOriginal}"\n\nText to translate: "${texto}"`
  );
}

async function isAvailable() {
  return Boolean(process.env.GEMINI_API_KEY);
}

module.exports = { ask, traducirSiNecesario, isAvailable };
