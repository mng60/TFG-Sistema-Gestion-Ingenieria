const DatoMercado = require('../../models/DatoMercado');

function normalizarTextoPlano(texto) {
  return String(texto || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
}

// Fecha/hora en zona Europe/Madrid (evita error UTC en Railway/servidores remotos)
function getMadridDate() {
  return new Date(new Date().toLocaleString('en-US', { timeZone: 'Europe/Madrid' }));
}

// Franja PVPC vigente (reforma 2021, Península)
// P3 valle:  lunes-viernes 00:00-08:00 + sábados, domingos y festivos todo el día
// P2 llano:  lunes-viernes 08:00-10:00, 14:00-18:00, 22:00-24:00
// P1 punta:  lunes-viernes 10:00-14:00, 18:00-22:00
function getFranjaActual() {
  const ahora = getMadridDate();
  const hora = ahora.getHours();
  const dia = ahora.getDay(); // 0=domingo, 6=sábado
  if (dia === 0 || dia === 6) return 'valle';
  if (hora < 8) return 'valle';
  if ((hora >= 10 && hora < 14) || (hora >= 18 && hora < 22)) return 'punta';
  return 'llano';
}

const NOMBRE_FRANJA = {
  valle: 'valle (la mas barata)',
  llano: 'llano (precio intermedio)',
  punta: 'punta (la mas cara)'
};

const RANGO_FRANJA = {
  valle: '00:00-08:00 en dias laborables y todo el dia en fin de semana',
  llano: '08:00-10:00, 14:00-18:00 y 22:00-00:00 en dias laborables',
  punta: '10:00-14:00 y 18:00-22:00 en dias laborables'
};

function esConsultaEnergiaActual(pregunta) {
  const t = normalizarTextoPlano(pregunta);
  return (
    // Precio kWh / luz general
    /precio.*kwh|kwh.*precio|precio de la luz|\bpvpc\b/.test(t) ||
    /cuanto.*kwh|kwh.*cuanto|a cuanto esta.*luz|como esta.*luz/.test(t) ||
    /precio.*luz hoy|luz.*precio.*hoy|tarifa.*luz|tarifa electrica/.test(t) ||
    /precio.*electricidad|cuanto.*electricidad|electricidad.*precio/.test(t) ||

    // Precio en este momento
    /precio.*ahora|ahora.*precio|cuanto.*ahora.*luz|cuanto.*cuesta.*ahora|en este momento.*luz|precio.*este momento/.test(t) ||
    /a cuanto esta ahora/.test(t) ||

    // Franjas baratas
    /franja.*barata|hora.*barata|cuando.*barata|horas baratas|mas barato.*luz/.test(t) ||
    /mejor hora.*poner|cuando.*poner.*lavadora|poner.*lavadora|hora.*lavadora/.test(t) ||
    /cuando.*consumir|evitar.*consumir|menos.*consumir|bajo.*consumo|horas.*consumir/.test(t) ||
    /mejor hora para.*electr|cuando.*electr.*barato/.test(t) ||

    // Franjas caras
    /franja.*cara|hora.*cara|cuando.*cara|horas caras|mas cara.*luz|franja punta/.test(t) ||

    // Franja actual
    /franja.*ahora|que franja|estamos.*franja|periodo.*ahora|franja.*estamos/.test(t) ||

    // Renovables / mix energético
    /renovables.*hoy|energia renovable.*hoy|mix.*energetico|cuanta.*renovable/.test(t) ||

    // Inglés — precio general
    /electricity price|price.*electricity|kwh.*price|price.*kwh|energy price|power price/.test(t) ||
    /energy tariff|power tariff|electricity tariff|electricity rate|power rate/.test(t) ||
    /how much.*electricity|electricity.*cost|cost.*electricity/.test(t) ||

    // Inglés — ahora
    /electricity.*now|price.*now.*electricity|current.*price.*electricity|right now.*electricity/.test(t) ||
    /cheapest.*electricity|electricity.*cheapest/.test(t) ||

    // Inglés — franjas
    /cheapest hour|cheapest time|off.peak|peak hour|peak time/.test(t) ||
    /when.*cheap.*electricity|when.*electricity.*cheap/.test(t)
  );
}

async function construirRespuestaEnergia(pregunta) {
  const t = normalizarTextoPlano(pregunta);
  const ahora = getMadridDate();
  const horaActual = ahora.getHours();
  const franjaActual = getFranjaActual();

  let datos = null;
  try {
    const registro = await DatoMercado.get('pvpc_hoy');
    const hoy = ahora.toISOString().split('T')[0];
    // Comparar con fecha local Madrid, no UTC
    const fechaMadrid = `${ahora.getFullYear()}-${String(ahora.getMonth() + 1).padStart(2, '0')}-${String(ahora.getDate()).padStart(2, '0')}`;
    if (registro?.valor?.fecha === fechaMadrid) datos = registro.valor;
  } catch (_) {}

  // ── Detectar intención ──────────────────────────────────────────────
  const esAhora = /precio.*ahora|ahora.*precio|cuanto.*ahora|cuanto.*cuesta.*ahora|en este momento|a cuanto esta ahora|right now|current.*price|electricity.*now/.test(t);
  const esFranjaActual = /franja.*ahora|que franja|estamos.*franja|periodo.*ahora|franja.*estamos/.test(t);
  const esBarata = /franja.*barata|hora.*barata|cuando.*barata|horas baratas|mas barato.*luz|mejor hora.*poner|cuando.*poner.*lavadora|poner.*lavadora|hora.*lavadora|cuando.*consumir|menos.*consumir|mejor hora para|cheapest|off.peak|when.*cheap/.test(t);
  const esCara = /franja.*cara|hora.*cara|cuando.*cara|horas caras|mas cara.*luz|franja punta|peak hour|peak time|evitar.*consumir|cuando.*no.*consumir/.test(t);
  const esRenovables = /renovables|mix.*energetico|cuanta.*renovable/.test(t);

  // ── Sin datos frescos: respuesta con franja calculable ──────────────
  if (!datos) {
    if (esFranjaActual || esAhora) {
      return `Ahora (${horaActual}:00 h) estamos en franja ${NOMBRE_FRANJA[franjaActual]}, que cubre ${RANGO_FRANJA[franjaActual]}. No tengo el precio exacto de hoy, pero puedes consultarlo en la app de tu comercializadora o en REE.`;
    }
    if (esBarata) {
      return `La franja mas barata del PVPC es la valle: ${RANGO_FRANJA.valle}. Es el mejor momento para poner la lavadora, el lavavajillas o cargar baterias. No tengo el precio exacto de hoy actualizado.`;
    }
    if (esCara) {
      return `La franja punta (${RANGO_FRANJA.punta}) es siempre la mas cara. Mejor evitar electrodomesticos de alto consumo en esas horas si tienes PVPC. No tengo el precio exacto de hoy.`;
    }
    return `Ahora mismo no tengo el precio del kWh de hoy cargado. La franja mas barata siempre es la valle (${RANGO_FRANJA.valle}). Para el dato exacto consulta REE o tu comercializadora.`;
  }

  const { precio_medio, precio_min, hora_min, precio_max, hora_max, precios_por_hora, renovables_pct } = datos;
  const precioAhora = precios_por_hora?.find((v) => v.hora === horaActual)?.precio;

  // ── Franja actual ───────────────────────────────────────────────────
  if (esFranjaActual) {
    const precioStr = precioAhora != null ? ` El precio ahora es ${precioAhora.toFixed(4)} €/kWh.` : '';
    return `Ahora (${horaActual}:00 h) estamos en franja ${NOMBRE_FRANJA[franjaActual]}, que cubre ${RANGO_FRANJA[franjaActual]}.${precioStr} La hora mas barata de hoy es a las ${hora_min}:00 h (${precio_min.toFixed(4)} €/kWh).`;
  }

  // ── Precio en este momento ──────────────────────────────────────────
  if (esAhora) {
    if (precioAhora != null) {
      return `Ahora mismo (${horaActual}:00 h, franja ${franjaActual}) el kWh esta a ${precioAhora.toFixed(4)} €. La hora mas barata de hoy es a las ${hora_min}:00 h (${precio_min.toFixed(4)} €/kWh).`;
    }
    return `Ahora (${horaActual}:00 h) estamos en franja ${NOMBRE_FRANJA[franjaActual]}. El precio medio del dia es ${precio_medio.toFixed(4)} €/kWh; lo mas barato es a las ${hora_min}:00 h (${precio_min.toFixed(4)} €/kWh).`;
  }

  // ── Franja más barata / lavadora / evitar consumo ──────────────────
  if (esBarata) {
    return `Hoy la hora mas barata es a las ${hora_min}:00 h con ${precio_min.toFixed(4)} €/kWh. La franja valle (${RANGO_FRANJA.valle}) siempre es la mas economica: perfecto para poner la lavadora, el lavavajillas o cargar baterias. El precio medio del dia esta en ${precio_medio.toFixed(4)} €/kWh.`;
  }

  // ── Franja más cara ─────────────────────────────────────────────────
  if (esCara) {
    return `Hoy el precio mas alto es a las ${hora_max}:00 h con ${precio_max.toFixed(4)} €/kWh. La franja punta (${RANGO_FRANJA.punta}) es siempre la mas cara: mejor evitar electrodomesticos de alto consumo en esas horas. El precio medio del dia esta en ${precio_medio.toFixed(4)} €/kWh.`;
  }

  // ── Renovables ──────────────────────────────────────────────────────
  if (esRenovables) {
    const renovStr = renovables_pct != null
      ? ` Hoy el ${renovables_pct}% de la electricidad en la Peninsula es de origen renovable.`
      : '';
    return `Hoy el PVPC esta de media en ${precio_medio.toFixed(4)} €/kWh.${renovStr} Con solar puedes cubrir buena parte de tu consumo diurno y reducir lo que compras a la red.`;
  }

  // ── Precio general / kWh hoy (default) ─────────────────────────────
  return `Hoy el PVPC esta de media en ${precio_medio.toFixed(4)} €/kWh, con un minimo de ${precio_min.toFixed(4)} €/kWh a las ${hora_min}:00 h y un maximo de ${precio_max.toFixed(4)} €/kWh a las ${hora_max}:00 h. La franja mas economica es la valle (${RANGO_FRANJA.valle}).`;
}

module.exports = { esConsultaEnergiaActual, construirRespuestaEnergia };
