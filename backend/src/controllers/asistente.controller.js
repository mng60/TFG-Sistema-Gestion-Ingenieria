const path = require('path');
const fs   = require('fs');
const { ask, traducirSiNecesario, isAvailable } = require('../services/ai.service');
const { esConsultaEnergiaActual, construirRespuestaEnergia } = require('./helpers/asistenteEnergia.helper');

// ── Conocimiento embebido en el system prompt ─────────────────────────────────
function cargarConocimiento() {
  const dir = path.join(__dirname, '../data/knowledge');
  const entradas = fs.readdirSync(dir)
    .filter((f) => f.endsWith('.json'))
    .flatMap((f) => JSON.parse(fs.readFileSync(path.join(dir, f), 'utf-8')));
  return entradas.map((e) => `### ${e.titulo}\n${e.contenido}`).join('\n\n');
}

const CONOCIMIENTO = cargarConocimiento();
console.log(`[AsistenteIA] Conocimiento: ${CONOCIMIENTO.length} caracteres`);

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

// ── Fecha y hora (sin LLM — respuesta instantánea) ────────────────────────────
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

// ── Tiempo meteorológico (sin LLM — datos en tiempo real) ────────────────────
function esTiempo(t) {
  return /que tiempo hace|como esta el tiempo|va a llover|hace frio|hace calor|temperatura.*hoy|tiempo.*hoy|tiempo.*murcia|clima.*murcia|llueve|lluvia.*hoy|sol.*hoy|nublado|viento.*hoy/.test(t);
}

async function respuestaTiempo() {
  const key = process.env.OPENWEATHER_API_KEY;
  if (!key) return 'No tengo acceso al tiempo ahora mismo. Consulta tu app del tiempo.';
  try {
    const r = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=Murcia,ES&appid=${key}&units=metric&lang=es`);
    if (!r.ok) throw new Error();
    const d = await r.json();
    return `Ahora en Murcia: ${d.weather[0].description}, ${Math.round(d.main.temp)} °C (sensacion ${Math.round(d.main.feels_like)} °C), humedad ${d.main.humidity}%, viento ${Math.round(d.wind.speed * 3.6)} km/h.`;
  } catch {
    return 'No he podido obtener el tiempo ahora mismo. Intentalo en unos minutos.';
  }
}

// ── Calculadora solar (sin LLM — aritmética pura) ────────────────────────────
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

// ── System prompt con todo el conocimiento embebido ───────────────────────────
const SYSTEM_PROMPT = `Eres Blue, el asistente virtual de BlueArc Ingeniería, empresa de ingeniería eléctrica de la Región de Murcia.
Responde en el mismo idioma en que te escriba el usuario, con tono cercano, directo y profesional, como un técnico de confianza.
Responde en un máximo de 2-3 frases claras. Sin listas, guiones ni títulos.
Si hablas de precios, siempre como orientativo y sin IVA. No inventes datos, precios, plazos ni trámites que no estén en el conocimiento.
Si te falta algún dato importante, pídelo con naturalidad: "si me dices..." o "si me cuentas...".
Si no tienes información suficiente, recomienda contactar: "usa el formulario de contacto" o "contacta con nosotros".

## CONOCIMIENTO DE BLUEARC INGENIERÍA

${CONOCIMIENTO}`;

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

    if (esFechaHora(t))        return res.json({ success: true, respuesta: conEgg(respuestaFechaHora(t)) });
    if (esTiempo(t))           return res.json({ success: true, respuesta: conEgg(await respuestaTiempo()) });
    if (esCalculadoraSolar(t)) return res.json({ success: true, respuesta: conEgg(respuestaCalculadoraSolar(t)) });
    if (esConsultaEnergiaActual(pregunta)) {
      const respEnergia = await construirRespuestaEnergia(pregunta);
      const respTraducida = await traducirSiNecesario(respEnergia, pregunta);
      return res.json({ success: true, respuesta: conEgg(respTraducida) });
    }

    // Historial de conversación para contexto multi-turno en Gemini
    const history = historial
      .filter((m) => m?.text?.length > 0)
      .slice(-10)
      .map((m) => ({ role: m.from === 'user' ? 'user' : 'assistant', content: m.text }));

    const respuesta = await ask(SYSTEM_PROMPT, pregunta, history);
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
