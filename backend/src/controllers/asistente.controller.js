const path = require('path');
const fs = require('fs');
const { ask, isAvailable } = require('../services/ai.service');
const {
  construirRespuestaPrecio,
  esTemaPrecioActualEnergia,
  RESPUESTA_PRECIO_ACTUAL_ENERGIA
} = require('./helpers/asistentePrecio.helper');
const {
  esConsultaNormativa,
  construirRespuestaNormativa
} = require('./helpers/asistenteNormativa.helper');
const {
  normalizar,
  normalizarTextoPlano,
  expandirConSinonimos,
  truncar
} = require('./helpers/asistenteTexto.helper');

let knowledgeBase = [];

function loadKnowledge() {
  const dir = path.join(__dirname, '../data/knowledge');
  const files = fs.readdirSync(dir).filter((f) => f.endsWith('.json'));

  for (const file of files) {
    const data = JSON.parse(fs.readFileSync(path.join(dir, file), 'utf-8'));
    knowledgeBase = knowledgeBase.concat(data);
  }

  console.log(`[AsistenteIA] Base de conocimiento: ${knowledgeBase.length} entradas`);
}

loadKnowledge();

function esPreguntaPrecio(texto) {
  return /cuanto|cuesta|coste|precio|presupuesto|vale|tarifa/.test(normalizarTextoPlano(texto));
}

function esPreguntaSobreTema(texto) {
  const t = normalizarTextoPlano(texto);
  const tieneTema =
    /solar|fotovoltaic|placas|paneles|autoconsumo/.test(t) ||
    /cuadro electrico|cambiar el cuadro|cuadro de luz|magnetotermic|diferencial/.test(t) ||
    /\bcie\b|boletin electrico|certificado electrico|legalizacion electrica/.test(t) ||
    /instalacion electrica|reforma electrica|cableado electrico/.test(t) ||
    /mantenimiento electrico|averia electrica|urgencia electrica/.test(t) ||
    /nave industrial|instalacion (en|para) (nave|empresa|local|negocio)/.test(t);
  const tieneIntencion =
    /instalar|colocar|poner|montar|necesito|quiero|quisiera|queremos|me interesa|nos interesa/.test(t);
  return tieneTema && tieneIntencion;
}

function esPreguntaConversacional(pregunta) {
  const texto = normalizarTextoPlano(pregunta).trim();
  return /puedo hacerte otra pregunta|te puedo hacer otra pregunta|otra pregunta|sigues ahi|estas ahi|puedes ayudarme|me puedes ayudar|puedes ayudar|me ayudas|gracias|muchas gracias|vale|perfecto|ok|genial|adios|hasta luego|chao|nos vemos|me voy|hola/.test(texto);
}

function construirRespuestaConversacional(pregunta) {
  const texto = normalizarTextoPlano(pregunta).trim();

  if (/puedo hacerte otra pregunta|te puedo hacer otra pregunta|otra pregunta/.test(texto)) {
    return 'Claro, preguntame lo que necesites y te ayudo encantado.';
  }

  if (/sigues ahi|estas ahi/.test(texto)) {
    return 'Si, sigo aqui. Dime y lo vemos.';
  }

  if (/puedes ayudarme|me puedes ayudar|puedes ayudar|me ayudas/.test(texto)) {
    return 'Claro. Cuentame tu duda y te ayudo en lo que pueda.';
  }

  if (/hola/.test(texto)) {
    return 'Hola. Cuentame en que puedo ayudarte y lo vemos.';
  }

  if (/gracias|muchas gracias/.test(texto)) {
    return 'A ti. Si quieres, puedes hacerme otra pregunta y seguimos.';
  }

  if (/vale|perfecto|ok|genial/.test(texto)) {
    return 'Perfecto. Si quieres, seguimos con otra duda.';
  }

  if (/adios|hasta luego|chao|nos vemos|me voy/.test(texto)) {
    return 'Hasta luego. Si mas adelante necesitas algo, aqui estare para ayudarte.';
  }

  return null;
}

function esMensajeReinicioConversacion(texto = '') {
  const plano = normalizarTextoPlano(texto).trim();
  return /puedo hacerte otra pregunta|te puedo hacer otra pregunta|otra pregunta|nueva pregunta|cambio de tema/.test(plano);
}

function obtenerMensajesUsuarioRecientes(historial = [], limite = 5) {
  const indiceUltimoReinicio = [...historial]
    .map((msg, index) => ({ msg, index }))
    .filter(({ msg }) => msg && msg.from === 'user' && typeof msg.text === 'string' && esMensajeReinicioConversacion(msg.text))
    .map(({ index }) => index)
    .pop();

  const historialActivo = typeof indiceUltimoReinicio === 'number'
    ? historial.slice(indiceUltimoReinicio + 1)
    : historial;

  return historialActivo
    .filter((msg) => msg && msg.from === 'user' && typeof msg.text === 'string')
    .slice(-limite);
}

function esSeguimientoDePrecio(pregunta, historial = []) {
  const texto = normalizarTextoPlano(pregunta);
  const pareceSeguimiento = /m2|metros|cubierta|terraza|tejado|techo|plana|inclinada|zonas comunes|comunes|baterias|sin baterias|con baterias|repartir|viviendas|seria|serian|solo para|parcial|integral|cuadro|local|nave|vivienda|casa|piso|oficina|bar|tienda|boletin|cie|ambas opciones|las dos opciones|ambos casos|con y sin|precio de ambas|precio de los dos|dos opciones|baremo|alguna recomendacion|que me recomiendas|que opcion recomiendas|que harias|y esa opcion|esa opcion|esa otra|antigua|vieja|funciona|defectos|arreglar|corregir|adaptar cableado|merece la pena|recomendarias|sustituir|sin tocar|solo el cuadro|solo cambiar|sin cableado|sin cie/.test(texto);
  if (!pareceSeguimiento) return false;

  const mensajesUsuario = obtenerMensajesUsuarioRecientes(historial, 4);
  const hayContextoPrecio = mensajesUsuario.some((msg) => {
    const previo = normalizarTextoPlano(msg.text);
    return esPreguntaPrecio(previo) || /baremo|presupuesto|orientacion/.test(previo);
  });

  if (hayContextoPrecio) return true;

  const ultimoMensajeAsistente = [...historial]
    .reverse()
    .find((msg) => msg && msg.from === 'bot' && typeof msg.text === 'string');

  if (!ultimoMensajeAsistente) return false;

  const textoBot = normalizarTextoPlano(ultimoMensajeAsistente.text);
  return /rango orientativo|baremo|m2 utiles|zonas comunes|repartir entre viviendas|sin iva|baterias|te lo ajusto|te lo afino|te oriento mejor|ambas opciones|con o sin|cubierta|plana o inclinada/.test(textoBot);
}

function construirPreguntaCompuesta(pregunta, historial = []) {
  const mensajesUsuario = obtenerMensajesUsuarioRecientes(historial, 6)
    .map((msg) => msg.text.trim())
    .filter(Boolean);

  if (mensajesUsuario.length === 0) return pregunta;
  return [...mensajesUsuario, pregunta].join('. ');
}

function limitarFrases(texto, maxFrases = 3) {
  const frases = texto
    .replace(/\s+/g, ' ')
    .trim()
    .match(/[^.!?]+[.!?]?/g);

  if (!frases) return texto.trim();
  return frases.slice(0, maxFrases).join(' ').trim();
}

function sanearRespuestaModelo(texto) {
  return texto
    .replace(/\n+/g, ' ')
    .replace(/#{2,}.*$/gim, '')
    .replace(/instruccion[^.!?]*[.!?]?/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
}

const SCORE_MIN = 3;

function buscarContexto(pregunta, topN = 3) {
  const tokensBase = normalizar(pregunta);
  const tokens = expandirConSinonimos(tokensBase);

  const puntuados = knowledgeBase.map((entrada) => {
    let score = 0;
    const tituloTokens = normalizar(entrada.titulo);
    const contenidoTokens = normalizar(entrada.contenido);
    const matchedKeywords = new Set();

    for (const token of tokens) {
      if (tituloTokens.includes(token)) score += 3;
      if (contenidoTokens.includes(token)) score += 1;
    }

    for (const kw of (entrada.keywords || [])) {
      const kwTokens = normalizar(kw);
      if (kwTokens.some((kt) => tokens.has(kt))) {
        matchedKeywords.add(kw);
      }
    }

    score += matchedKeywords.size * 2;

    return { entrada, score };
  });

  return puntuados
    .filter((p) => p.score >= SCORE_MIN)
    .sort((a, b) => b.score - a.score)
    .slice(0, topN)
    .map((p) => ({
      entrada: p.entrada,
      score: p.score,
      fragmento: `### ${p.entrada.titulo}\n${truncar(p.entrada.contenido)}`
    }));
}

const cache = new Map();
const CACHE_MAX = 50;

function claveCache(pregunta) {
  return normalizar(pregunta).join('_');
}

function guardarEnCache(clave, respuesta) {
  if (cache.size >= CACHE_MAX) {
    cache.delete(cache.keys().next().value);
  }
  cache.set(clave, respuesta);
}

const SYSTEM_PROMPT = `Eres el asistente virtual de BlueArc Ingenieria, empresa de ingenieria electrica de la Region de Murcia.
Ayudas con dudas sobre servicios electricos, precios orientativos y normativa tecnica.
Responde siempre en espanol, con tono cercano, directo y profesional, como si fuera un tecnico de confianza explicando algo a un cliente.
Responde en un maximo de 2 frases claras. No uses listas, guiones ni titulos.
Basa la respuesta unicamente en el contexto proporcionado.
Si te falta algun dato importante para responder bien, pidelo con naturalidad: por ejemplo, "si me dices..." o "si me cuentas...".
No inventes importes, equipos, inversores, baterias, tramites, marcas, IVA ni plazos si no aparecen en el contexto.
Si hablas de precios, dejalo siempre como orientativo y sin IVA.
No uses expresiones como "base de conocimientos", "contexto proporcionado", "segun la informacion que tengo" ni ningun lenguaje tecnico interno.
Si no tienes informacion suficiente, recomienda contactar o una visita tecnica con cercania: "lo vemos mejor si contactas con nosotros" o "con una visita rapida te lo aclaramos".
Di siempre "contacta con nosotros" o "usa el formulario de contacto", nunca "busquen a la empresa" ni formas frias.`;

const RESPUESTA_SIN_CONTEXTO = 'Eso no lo tengo bien cubierto por aqui. Lo mejor es comentarlo directamente; usa el formulario de contacto y lo vemos contigo sin compromiso.';

const preguntar = async (req, res) => {
  try {
    const { pregunta, historial = [] } = req.body;
    if (!pregunta || pregunta.trim().length < 3) {
      return res.status(400).json({ success: false, message: 'Pregunta demasiado corta' });
    }

    const esSeguimientoPrecio = esSeguimientoDePrecio(pregunta, historial);
    const preguntaAnalizada = esSeguimientoPrecio
      ? construirPreguntaCompuesta(pregunta, historial)
      : pregunta;

    const clave = esSeguimientoPrecio ? null : claveCache(preguntaAnalizada);
    if (clave && cache.has(clave)) {
      console.log('[AsistenteIA] Cache hit');
      return res.json({ success: true, respuesta: cache.get(clave) });
    }

    const respuestaConversacional = construirRespuestaConversacional(pregunta);
    if (respuestaConversacional) {
      if (clave) guardarEnCache(clave, respuestaConversacional);
      return res.json({ success: true, respuesta: respuestaConversacional });
    }

    if (esTemaPrecioActualEnergia(pregunta)) {
      if (clave) guardarEnCache(clave, RESPUESTA_PRECIO_ACTUAL_ENERGIA);
      return res.json({ success: true, respuesta: RESPUESTA_PRECIO_ACTUAL_ENERGIA });
    }

    const resultados = buscarContexto(preguntaAnalizada);

    if (resultados.length === 0) {
      console.log('[AsistenteIA] Sin contexto suficiente, respuesta directa');
      return res.json({ success: true, respuesta: RESPUESTA_SIN_CONTEXTO });
    }

    const debeResolverComoPrecio =
      esPreguntaPrecio(preguntaAnalizada) ||
      esSeguimientoPrecio ||
      esPreguntaSobreTema(preguntaAnalizada) ||
      /alguna recomendacion|que me recomiendas|que opcion recomiendas|que harias|merece.*la pena|merecer.*la pena|recomendarias/.test(normalizarTextoPlano(preguntaAnalizada));

    if (!debeResolverComoPrecio && esConsultaNormativa(pregunta, preguntaAnalizada)) {
      const respuestaNormativa = construirRespuestaNormativa({
        preguntaActual: pregunta,
        preguntaAnalizada,
        knowledgeBase
      });

      if (respuestaNormativa) {
        if (clave) guardarEnCache(clave, respuestaNormativa);
        return res.json({ success: true, respuesta: respuestaNormativa });
      }
    }

    if (debeResolverComoPrecio) {
      const respuestaPrecio = construirRespuestaPrecio({
        preguntaActual: pregunta,
        preguntaAnalizada,
        historialUsuario: obtenerMensajesUsuarioRecientes(historial, 6).map((msg) => msg.text),
        resultados,
        knowledgeBase
      });
      if (clave) guardarEnCache(clave, respuestaPrecio);
      return res.json({ success: true, respuesta: respuestaPrecio });
    }

    const contexto = `Informacion relevante:\n\n${resultados.map((r) => r.fragmento).join('\n\n')}`;
    const respuesta = await ask(`${SYSTEM_PROMPT}\n\n${contexto}`, preguntaAnalizada);
    const respuestaFinal = limitarFrases(sanearRespuestaModelo(respuesta), 2);

    if (clave) guardarEnCache(clave, respuestaFinal);
    res.json({ success: true, respuesta: respuestaFinal });
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
