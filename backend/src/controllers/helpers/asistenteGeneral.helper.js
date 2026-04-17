const { normalizarTextoPlano } = require('./asistenteTexto.helper');

function getMadridDate() {
  return new Date(new Date().toLocaleString('en-US', { timeZone: 'Europe/Madrid' }));
}

const DIAS  = ['domingo','lunes','martes','miercoles','jueves','viernes','sabado'];
const MESES = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];

const SALUDO_PREFIX = /^(hola|hey|ey|buenas|buenos dias|buenas tardes|buenas noches)[,!.\s]*/i;

function extraerPreguntaSinSaludo(pregunta) {
  const sinSaludo = pregunta.replace(SALUDO_PREFIX, '').trim();
  return sinSaludo.length >= 10 ? sinSaludo : null;
}

// ── Fecha / hora ─────────────────────────────────────────────────────────────
function esConsultaFechaHora(pregunta) {
  const t = normalizarTextoPlano(pregunta);
  return /que dia es|que fecha|que hora es|que horas son|en que mes|que dia de la semana|fecha de hoy|hoy que dia|dia de hoy|hora actual|hora ahora|que ano|que year/.test(t);
}

function construirRespuestaFechaHora(pregunta) {
  const t = normalizarTextoPlano(pregunta);
  const ahora = getMadridDate();
  const dia   = DIAS[ahora.getDay()];
  const diaMes = ahora.getDate();
  const mes   = MESES[ahora.getMonth()];
  const año   = ahora.getFullYear();
  const hora  = String(ahora.getHours()).padStart(2, '0');
  const min   = String(ahora.getMinutes()).padStart(2, '0');

  if (/que hora es|hora actual|hora ahora|que horas son/.test(t)) {
    return `Son las ${hora}:${min} h (hora de Madrid).`;
  }
  if (/en que mes/.test(t)) {
    return `Estamos en ${mes} de ${año}.`;
  }
  return `Hoy es ${dia} ${diaMes} de ${mes} de ${año}. Son las ${hora}:${min} h.`;
}

// ── Tiempo meteorológico (OpenWeatherMap) ────────────────────────────────────
function esConsultaTiempo(pregunta) {
  const t = normalizarTextoPlano(pregunta);
  return /que tiempo hace|como esta el tiempo|va a llover|hace frio|hace calor|temperatura.*hoy|tiempo.*hoy|tiempo.*murcia|clima.*murcia|llueve|lluvia.*hoy|sol.*hoy|nublado|viento.*hoy/.test(t);
}

async function construirRespuestaTiempo() {
  const apiKey = process.env.OPENWEATHER_API_KEY;
  if (!apiKey) {
    return 'No tengo acceso al tiempo en este momento. Puedes consultarlo en el movil con la app del tiempo.';
  }
  try {
    const res  = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=Murcia,ES&appid=${apiKey}&units=metric&lang=es`);
    const data = await res.json();
    if (data.cod !== 200) throw new Error('api error');

    const desc     = data.weather[0].description;
    const temp     = Math.round(data.main.temp);
    const sensacion = Math.round(data.main.feels_like);
    const humedad  = data.main.humidity;
    const viento   = Math.round(data.wind.speed * 3.6);

    return `Ahora en Murcia: ${desc}, ${temp} °C (sensacion ${sensacion} °C), humedad ${humedad}%, viento ${viento} km/h.`;
  } catch {
    return 'No he podido obtener el tiempo ahora mismo. Intentalo en unos minutos o consulta la app del tiempo.';
  }
}

// ── Calculadora solar básica ─────────────────────────────────────────────────
const W_PANEL = 430;
const M2_PANEL = 1.9;

function esConsultaCalculadoraSolar(pregunta) {
  const t = normalizarTextoPlano(pregunta);
  return (
    /cuantos paneles|cuantas placas|cuantos kw|cuanta potencia|cuanto kwp/.test(t) &&
    /necesito|para|tengo|quiero|caben/.test(t)
  ) || (
    /cuantos m2|cuantos metros|superficie.*solar|tejado.*para/.test(t) &&
    /panel|placa|solar|kwp/.test(t)
  );
}

function construirRespuestaCalculadoraSolar(pregunta) {
  const t = normalizarTextoPlano(pregunta);

  const matchKw      = t.match(/(\d+(?:[.,]\d+)?)\s*kw/);
  const matchM2      = t.match(/(\d+(?:[.,]\d+)?)\s*(?:m2|metros cuadrados)/);
  const matchPaneles = t.match(/(\d+)\s*(?:paneles|placas)/);

  if (matchKw) {
    const kw      = parseFloat(matchKw[1].replace(',', '.'));
    const paneles = Math.ceil((kw * 1000) / W_PANEL);
    const m2      = (paneles * M2_PANEL).toFixed(1);
    return `Para ${kw} kWp necesitas unos ${paneles} paneles de ${W_PANEL} W, que ocupan aprox. ${m2} m² de tejado (sin iva, orientativo). Con una visita rapida te ajustamos el dimensionado a tu consumo real.`;
  }
  if (matchM2) {
    const m2      = parseFloat(matchM2[1].replace(',', '.'));
    const paneles = Math.floor(m2 / M2_PANEL);
    const kw      = ((paneles * W_PANEL) / 1000).toFixed(2);
    return `Con ${m2} m² caben unos ${paneles} paneles estandar, equivalentes a ${kw} kWp. Suficiente para una instalacion interesante. Contacta con nosotros y lo estudiamos a fondo.`;
  }
  if (matchPaneles) {
    const n  = parseInt(matchPaneles[1]);
    const kw = ((n * W_PANEL) / 1000).toFixed(2);
    const m2 = (n * M2_PANEL).toFixed(1);
    return `${n} paneles de ${W_PANEL} W = ${kw} kWp, necesitan unos ${m2} m² de tejado. Son cifras orientativas; el estudio real ajusta segun tu consumo y la orientacion del tejado.`;
  }

  return `Para orientarte necesito saber la potencia que buscas (en kW) o los m² de tejado disponibles. Cuentame y te oriento.`;
}

// ── Autoconciencia del asistente ─────────────────────────────────────────────
function esConsultaCapacidades(pregunta) {
  const t = normalizarTextoPlano(pregunta);
  return /que puedes hacer|en que puedes ayudar|para que sirves|que sabes|que eres|quien eres|como funcionas|que haces|eres un robot|eres ia|eres inteligencia artificial/.test(t);
}

function construirRespuestaCapacidades() {
  return 'Soy el asistente de BlueArc Ingenieria. Puedo responder sobre instalaciones electricas, precios orientativos, normativa tecnica, calcular paneles solares, decirte el precio de la luz ahora mismo, darte la fecha y hora, y contarte el tiempo en Murcia. Para todo lo demas, contacta con el equipo.';
}

// ── Easter egg: jerga / emoticonos ───────────────────────────────────────────
// Si el usuario manda "xd", "uwu", "ewe", "owo" o un emoticon de texto,
// el asistente repite esa misma palabra/emoticon al final de su respuesta.
const JERGA_RE    = /\b(xd|uwu|ewe|owo)\b/i;
const EMOTICON_RE = /(?<![a-z])(?::\)|;\)|:D|:P|:\(|:o|:O|\^_\^|>_<|<3)(?![a-z])/i;

function detectarEasterEgg(pregunta) {
  const j = pregunta.match(JERGA_RE);
  if (j) return j[1].toLowerCase();
  const e = pregunta.match(EMOTICON_RE);
  if (e) return e[0];
  return null;
}

module.exports = {
  extraerPreguntaSinSaludo,
  esConsultaFechaHora,
  construirRespuestaFechaHora,
  esConsultaTiempo,
  construirRespuestaTiempo,
  esConsultaCalculadoraSolar,
  construirRespuestaCalculadoraSolar,
  esConsultaCapacidades,
  construirRespuestaCapacidades,
  detectarEasterEgg,
};
