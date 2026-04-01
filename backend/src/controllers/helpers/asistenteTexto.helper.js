// Utilidades de texto compartidas por todos los módulos del asistente

const STOPWORDS = new Set([
  'que', 'hay', 'como', 'cual', 'para', 'por', 'con', 'del', 'los', 'las',
  'una', 'uno', 'sus', 'son', 'ser', 'mas', 'pero', 'sin', 'sobre', 'entre',
  'cuando', 'muy', 'hasta', 'desde', 'ese', 'esa', 'esto', 'esta', 'este',
  'puede', 'puedo', 'quiero', 'saber', 'decir', 'tengo', 'necesito', 'favor',
  'hola', 'buenas', 'dias', 'tardes', 'gracias', 'por'
]);

const SINONIMOS = {
  placa: ['panel', 'fotovoltaica', 'solar'],
  panel: ['placa', 'fotovoltaica', 'solar'],
  solar: ['fotovoltaica', 'placas', 'paneles'],
  fotovoltaica: ['solar', 'placas', 'paneles'],
  luz: ['iluminacion', 'alumbrado', 'luminaria'],
  iluminacion: ['luz', 'alumbrado'],
  alumbrado: ['luz', 'iluminacion'],
  precio: ['coste', 'cuanto', 'cuesta', 'tarifa', 'vale'],
  coste: ['precio', 'cuanto', 'cuesta', 'tarifa'],
  cuanto: ['precio', 'coste', 'cuesta', 'vale'],
  cuesta: ['precio', 'coste', 'cuanto'],
  vale: ['precio', 'coste', 'cuanto'],
  instalacion: ['montar', 'instalar', 'poner', 'colocar'],
  instalar: ['instalacion', 'montar', 'poner'],
  boletin: ['cie', 'certificado', 'legalizar'],
  cie: ['boletin', 'certificado'],
  certificado: ['boletin', 'cie'],
  cuadro: ['centralita', 'caja', 'electrico'],
  averia: ['fallo', 'problema', 'urgencia', 'emergencia'],
  urgencia: ['averia', 'fallo', 'emergencia'],
  cable: ['conductor', 'cableado', 'hilo'],
  conductor: ['cable', 'cableado'],
  tierra: ['puesta', 'masa'],
  mantenimiento: ['revision', 'preventivo', 'conservacion'],
  revision: ['mantenimiento', 'inspeccion'],
  subvencion: ['ayuda', 'beca', 'descuento', 'bonificacion'],
  ayuda: ['subvencion', 'beca'],
  plazo: ['tiempo', 'duracion', 'tarda', 'tardais'],
  garantia: ['garantizan', 'garantizado', 'responsabilidad']
};

// Normaliza a tokens sin stopwords (para scoring y caché)
function normalizar(texto) {
  return String(texto || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOPWORDS.has(w));
}

// Normaliza a texto plano sin acentos (para regex de detección)
function normalizarTextoPlano(texto) {
  return String(texto || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function expandirConSinonimos(tokens) {
  const expandidos = new Set(tokens);
  for (const token of tokens) {
    for (const sinonimo of (SINONIMOS[token] || [])) {
      expandidos.add(sinonimo);
    }
  }
  return expandidos;
}

function incluye(texto, patrones) {
  return patrones.some((patron) => patron.test(texto));
}

function truncar(texto, max = 300) {
  if (texto.length <= max) return texto;
  return texto.slice(0, max).replace(/\s\S*$/, '') + '...';
}

module.exports = {
  STOPWORDS,
  SINONIMOS,
  normalizar,
  normalizarTextoPlano,
  expandirConSinonimos,
  incluye,
  truncar
};
