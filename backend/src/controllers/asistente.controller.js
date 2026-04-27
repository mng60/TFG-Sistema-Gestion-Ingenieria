const path = require('path');
const fs   = require('fs');
const { ask, traducirSiNecesario, isAvailable } = require('../services/ai.service');
const { esConsultaEnergiaActual, construirRespuestaEnergia } = require('./helpers/asistenteEnergia.helper');

// ── Conocimiento por categoría (cargado una vez al arrancar) ──────────────────
function cargarPorCategoria() {
  const dir = path.join(__dirname, '../data/knowledge');
  const categorias = {};
  for (const f of fs.readdirSync(dir).filter((f) => f.endsWith('.json'))) {
    const nombre = f.replace('.json', '');
    const entradas = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf-8'));
    categorias[nombre] = entradas.map((e) => `### ${e.titulo}\n${e.contenido}`).join('\n\n');
  }
  return categorias;
}

const KB = cargarPorCategoria();

// Palabras clave por categoría para seleccionar contexto relevante
const KB_KEYWORDS = {
  empresa:      /empresa|bluearc|quien|quienes|somos|contacto|horario|telefono|email|zona|donde|trabajan|proceso|garantia|pago|factura|iva|habilitad|certif|seguro/,
  servicios:    /instala|electr|solar|fotovolt|plac|panel|cuadro|mantenimient|averia|urgencia|legaliz|cie|boletin|domotica|led|ilumina|wallbox|cargador|coche electr|industrial|nave|trifas|reforma|cableado/,
  presupuestos: /precio|cuanto|cuesta|coste|presupuest|euros|tarifa|orientativ|cuadro|solar|residencial|local|comercial|nave|vivienda|m2|metros/,
  faq:          /plazo|tarda|tiempo.*obra|garantia|subvenci|ayuda|portal|cliente|murcia.*sol|rentab|amortiz|urgencia|impuesto|iva reducido/,
};

function seleccionarContexto(t) {
  const seleccionadas = Object.entries(KB_KEYWORDS)
    .filter(([, re]) => re.test(t))
    .map(([cat]) => cat);

  // Siempre incluir empresa como fallback (info básica de contacto)
  if (!seleccionadas.includes('empresa')) seleccionadas.unshift('empresa');

  // Máximo 2 categorías para mantener el prompt corto
  return seleccionadas
    .slice(0, 2)
    .map((cat) => KB[cat])
    .filter(Boolean)
    .join('\n\n');
}

// ── Utilidades ────────────────────────────────────────────────────────────────
const DIAS  = ['domingo','lunes','martes','miercoles','jueves','viernes','sabado'];
const MESES = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];

function getMadridDate() {
  return new Date(new Date().toLocaleString('en-US', { timeZone: 'Europe/Madrid' }));
}

function norm(texto) {
  return String(texto || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
}

function detectarEasterEgg(texto) {
  const j = texto.match(/\b(xd|uwu|ewe|owo)\b/i);
  if (j) return j[1].toLowerCase();
  const e = texto.match(/(?<![a-z])(?::\)|;\)|:D|:P|:\(|:o|:O|\^_\^|>_<|<3)(?![a-z])/i);
  return e ? e[0] : null;
}

// ── Saludos y conversación simple (sin LLM) ───────────────────────────────────
const RESPUESTAS_CONVERSACIONALES = [
  { re: /^(hola|hey|ey|hi|hello|buenas?|buen[oa]s? (dias?|tardes?|noches?))[\s!.]*$/,
    r: ['Hola. Cuentame en que puedo ayudarte.', 'Hola. ¿En qué puedo ayudarte?', 'Hi! How can I help you?'] },
  { re: /^(gracias|thanks?|thank you|merci|danke|molt[eo] gra[cz]|grac?ias)[\s!.]*$/i,
    r: ['A ti. Si necesitas algo mas, aqui estoy.', 'De nada, para lo que necesites.'] },
  { re: /^(ok|vale|perfecto|genial|entendido|de acuerdo|claro|understood)[\s!.]*$/i,
    r: ['Perfecto. ¿Algo más en lo que pueda ayudarte?', 'De acuerdo. Si tienes otra duda, adelante.'] },
  { re: /^(adios|bye|hasta luego|nos vemos|chao|ciao)[\s!.]*$/i,
    r: ['Hasta luego. Si mas adelante necesitas algo, aqui estare.', 'Bye! Come back anytime.'] },
];

function respuestaConversacional(texto) {
  for (const { re, r } of RESPUESTAS_CONVERSACIONALES) {
    if (re.test(texto)) return r[Math.floor(Math.random() * r.length)];
  }
  return null;
}

// ── Fecha y hora (sin LLM) ────────────────────────────────────────────────────
function esFechaHora(t) {
  return /que dia es|que fecha|que hora es|que horas son|en que mes|que dia de la semana|fecha de hoy|hoy que dia|dia de hoy|hora actual|hora ahora|que ano|dia y hora/.test(t);
}

function respuestaFechaHora(t) {
  const now = getMadridDate();
  const h = String(now.getHours()).padStart(2, '0');
  const m = String(now.getMinutes()).padStart(2, '0');
  if (/que hora es|hora actual|hora ahora|que horas son/.test(t))
    return `Son las ${h}:${m} h (hora de Madrid).`;
  if (/en que mes/.test(t))
    return `Estamos en ${MESES[now.getMonth()]} de ${now.getFullYear()}.`;
  return `Hoy es ${DIAS[now.getDay()]} ${now.getDate()} de ${MESES[now.getMonth()]} de ${now.getFullYear()}. Son las ${h}:${m} h.`;
}

// ── Tiempo meteorológico (sin LLM) ────────────────────────────────────────────
function esTiempo(t) {
  return /que tiempo hace|como esta el tiempo|(hoy|manana|ahora).*(tiempo|lluv|temperatura|nublad|viento|calor|frio)|tiempo.*(hoy|manana|murcia|hace|hara)|clima.*(murcia|hoy|manana)|va a llover|hace frio|hace calor|temperatura.*murcia|llueve|lluvia|nublado|pronostico.*tiempo|weather|forecast/.test(t);
}

async function respuestaTiempo() {
  const key = process.env.OPENWEATHER_API_KEY;
  if (!key) return 'No tengo acceso al tiempo ahora mismo. Consulta tu app del tiempo.';
  try {
    const r = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=Murcia,ES&appid=${key}&units=metric&lang=es`);
    if (!r.ok) throw new Error();
    const d = await r.json();
    return `Ahora en Murcia: ${d.weather[0].description}, ${Math.round(d.main.temp)} °C (sensacion ${Math.round(d.main.feels_like)} °C), humedad ${d.main.humidity}%, viento ${Math.round(d.wind.speed * 3.6)} km/h. Para el pronostico de manana consulta tu app del tiempo.`;
  } catch {
    return 'No he podido obtener el tiempo ahora mismo. Intentalo en unos minutos.';
  }
}

// ── Calculadora solar (sin LLM) ───────────────────────────────────────────────
const W_PANEL = 430, M2_PANEL = 1.9;

function esCalculadoraSolar(t) {
  return (
    (/cuantos paneles|cuantas placas|cuantos kw|cuanta potencia|cuanto kwp/.test(t) && /necesito|para|tengo|quiero|caben/.test(t)) ||
    (/cuantos m2|cuantos metros|superficie.*solar|tejado.*para/.test(t) && /panel|placa|solar|kwp/.test(t))
  );
}

function respuestaCalculadoraSolar(t) {
  const mKw = t.match(/(\d+(?:[.,]\d+)?)\s*kw/);
  const mM2 = t.match(/(\d+(?:[.,]\d+)?)\s*(?:m2|metros cuadrados)/);
  const mP  = t.match(/(\d+)\s*(?:paneles|placas)/);
  if (mKw) {
    const kw = parseFloat(mKw[1].replace(',', '.'));
    const p  = Math.ceil(kw * 1000 / W_PANEL);
    return `Para ${kw} kWp necesitas unos ${p} paneles de ${W_PANEL} W, que ocupan aprox. ${(p * M2_PANEL).toFixed(1)} m² (orientativo, sin IVA). Con una visita rapida ajustamos el dimensionado a tu consumo real.`;
  }
  if (mM2) {
    const m2 = parseFloat(mM2[1].replace(',', '.'));
    const p  = Math.floor(m2 / M2_PANEL);
    return `Con ${m2} m² caben unos ${p} paneles, equivalentes a ${((p * W_PANEL) / 1000).toFixed(2)} kWp. Contacta con nosotros y lo estudiamos a fondo.`;
  }
  if (mP) {
    const n = parseInt(mP[1]);
    return `${n} paneles de ${W_PANEL} W = ${((n * W_PANEL) / 1000).toFixed(2)} kWp, unos ${(n * M2_PANEL).toFixed(1)} m² de tejado. Orientativo; el estudio real ajusta segun consumo y orientacion.`;
  }
  return 'Para orientarte necesito saber la potencia que buscas (en kW) o los m² de tejado disponibles.';
}

// ── Caché en memoria ──────────────────────────────────────────────────────────
const cache = new Map();
const CACHE_TTL_MS = 30 * 60 * 1000;

function cacheGet(key) {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.ts > CACHE_TTL_MS) { cache.delete(key); return null; }
  return entry.value;
}

function cacheSet(key, value) {
  if (cache.size >= 200) cache.delete(cache.keys().next().value);
  cache.set(key, { value, ts: Date.now() });
}

function cacheKey(t) {
  return t.replace(/\s+/g, ' ').trim();
}

// ── System prompt base (sin conocimiento — se añade por petición) ─────────────
const BASE_PROMPT = `Eres Blue, asistente de BlueArc Ingeniería (ingeniería eléctrica, Murcia). REGLA OBLIGATORIA: detecta el idioma del último mensaje del usuario y responde SIEMPRE en ese mismo idioma (inglés si escribe en inglés, español si escribe en español, etc.). Tono cercano y profesional. Máx 2-3 frases, sin listas. Precios: siempre orientativos y sin IVA. No inventes datos. Sin info suficiente: pide detalles o deriva al formulario de contacto.`;

// ── Endpoint principal ────────────────────────────────────────────────────────
const preguntar = async (req, res) => {
  try {
    const { pregunta, historial = [] } = req.body;
    if (!pregunta || pregunta.trim().length < 3) {
      return res.status(400).json({ success: false, message: 'Pregunta demasiado corta' });
    }

    const easterEgg = detectarEasterEgg(pregunta);
    const conEgg    = (texto) => easterEgg ? `${texto} ${easterEgg}` : texto;
    const t         = norm(pregunta);

    // Respuestas sin LLM (instantáneas, no cuentan contra el rate limit)
    const conv = respuestaConversacional(t);
    if (conv) return res.json({ success: true, respuesta: conEgg(conv) });

    if (esFechaHora(t))        return res.json({ success: true, respuesta: conEgg(respuestaFechaHora(t)) });
    if (esTiempo(t))           return res.json({ success: true, respuesta: conEgg(await respuestaTiempo()) });
    if (esCalculadoraSolar(t)) return res.json({ success: true, respuesta: conEgg(respuestaCalculadoraSolar(t)) });
    if (esConsultaEnergiaActual(pregunta)) {
      const respEnergia = await construirRespuestaEnergia(pregunta);
      const respTraducida = await traducirSiNecesario(respEnergia, pregunta);
      return res.json({ success: true, respuesta: conEgg(respTraducida) });
    }

    // Caché para preguntas sin conversación activa
    const key = cacheKey(t);
    const hayHistorial = historial.some((m) => m?.text?.length > 0);
    if (!hayHistorial) {
      const cached = cacheGet(key);
      if (cached) {
        console.log('[AsistenteIA] Cache hit');
        return res.json({ success: true, respuesta: conEgg(cached) });
      }
    }

    // Seleccionar solo el conocimiento relevante (~500-800 tokens vs 3500 antes)
    const contexto = seleccionarContexto(t);
    const systemPrompt = `${BASE_PROMPT}\n\n## CONOCIMIENTO\n\n${contexto}`;

    const history = historial
      .filter((m) => m?.text?.length > 0)
      .slice(-8)
      .map((m) => ({ role: m.from === 'user' ? 'user' : 'assistant', content: m.text }));

    const respuesta = await ask(systemPrompt, pregunta, history);
    if (!hayHistorial) cacheSet(key, respuesta);
    res.json({ success: true, respuesta: conEgg(respuesta) });
  } catch (error) {
    console.error('[AsistenteIA] Error:', error.message);
    res.status(503).json({ success: false, message: 'Asistente no disponible' });
  }
};

const estado = async (req, res) => {
  const disponible = await isAvailable();
  res.json({ disponible });
};

module.exports = { preguntar, estado };
