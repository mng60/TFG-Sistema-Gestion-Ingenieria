const DatoMercado = require('../../models/DatoMercado');
const { normalizarTextoPlano } = require('./asistenteTexto.helper');

// Franja PVPC vigente (reforma 2021, Península)
// P3 valle:  lunes-viernes 00:00-08:00 + sábados, domingos y festivos todo el día
// P2 llano:  lunes-viernes 08:00-10:00, 14:00-18:00, 22:00-24:00
// P1 punta:  lunes-viernes 10:00-14:00, 18:00-22:00
function getFranjaActual() {
  const ahora = new Date();
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

const HORARIO_FRANJA = {
  valle: 'de 00:00 a 08:00 en dias laborables y todo el dia en fin de semana',
  llano: 'de 08:00 a 10:00, de 14:00 a 18:00 y de 22:00 a 00:00 en dias laborables',
  punta: 'de 10:00 a 14:00 y de 18:00 a 22:00 en dias laborables'
};

function esConsultaEnergiaActual(pregunta) {
  const t = normalizarTextoPlano(pregunta);
  return (
    /precio.*kwh|kwh.*precio|precio de la luz|\bpvpc\b/.test(t) ||
    /cuanto.*kwh|kwh.*cuanto|a cuanto esta.*luz|como esta.*luz/.test(t) ||
    /precio.*luz hoy|luz.*precio.*hoy|tarifa.*luz|tarifa electrica/.test(t) ||
    /franja.*barata|hora.*barata|cuando.*barata|horas baratas|mas barato.*luz/.test(t) ||
    /franja.*cara|hora.*cara|cuando.*cara|horas caras|mas cara.*luz|franja punta/.test(t) ||
    /franja.*ahora|que franja|estamos.*franja|periodo.*ahora|franja.*estamos/.test(t) ||
    /precio.*ahora.*luz|luz.*ahora|a cuanto esta ahora/.test(t) ||
    /renovables.*hoy|energia renovable.*hoy|mix.*energetico|cuanta.*renovable/.test(t)
  );
}

async function construirRespuestaEnergia(pregunta) {
  const t = normalizarTextoPlano(pregunta);
  const franjaActual = getFranjaActual();

  let datos = null;
  try {
    const registro = await DatoMercado.get('pvpc_hoy');
    const hoy = new Date().toISOString().split('T')[0];
    if (registro?.valor?.fecha === hoy) datos = registro.valor;
  } catch (_) {}

  // Sin datos frescos: responder con franja actual (calculable sin API) + aviso
  if (!datos) {
    if (/franja.*ahora|que franja|estamos.*franja|periodo.*ahora|franja.*estamos/.test(t)) {
      return `Ahora estamos en franja ${NOMBRE_FRANJA[franjaActual]}. Esa franja corre ${HORARIO_FRANJA[franjaActual]}. No tengo el precio exacto de hoy actualizado, pero puedes consultarlo en la app de tu comercializadora o en la web de REE.`;
    }
    if (/franja.*barata|hora.*barata|cuando.*barata|horas baratas/.test(t)) {
      return `La franja mas barata del PVPC es la valle: de 00:00 a 08:00 en dias laborables y todo el dia en fin de semana. No tengo el precio exacto de hoy, pero en esa franja siempre es mas economico usar electrodomesticos o cargar baterias.`;
    }
    return 'Ahora mismo no tengo el precio del kWh de hoy cargado. La franja mas barata siempre es la valle (00:00-08:00 laborables y fin de semana completo). Para el dato exacto consulta REE o tu comercializadora.';
  }

  const { precio_medio, precio_min, hora_min, precio_max, hora_max, precios_por_hora, renovables_pct } = datos;
  const horaActual = new Date().getHours();
  const precioAhora = precios_por_hora?.find((v) => v.hora === horaActual)?.precio;

  // Franja actual
  if (/franja.*ahora|que franja|estamos.*franja|periodo.*ahora|franja.*estamos/.test(t)) {
    const precioStr = precioAhora != null ? ` El precio ahora mismo es ${precioAhora.toFixed(4)} €/kWh.` : '';
    return `Ahora (${horaActual}:00 h) estamos en franja ${NOMBRE_FRANJA[franjaActual]}.${precioStr} La hora mas barata de hoy es a las ${hora_min}:00 h (${precio_min.toFixed(4)} €/kWh).`;
  }

  // Franja más barata
  if (/franja.*barata|hora.*barata|cuando.*barata|horas baratas|mas barato.*luz/.test(t)) {
    return `Hoy la hora mas barata es a las ${hora_min}:00 h con ${precio_min.toFixed(4)} €/kWh. La franja valle (00:00-08:00 laborables y todo el fin de semana) suele ser siempre la mas economica; el precio medio del dia esta en ${precio_medio.toFixed(4)} €/kWh.`;
  }

  // Franja más cara
  if (/franja.*cara|hora.*cara|cuando.*cara|horas caras|mas cara.*luz|franja punta/.test(t)) {
    return `Hoy el precio mas alto es a las ${hora_max}:00 h con ${precio_max.toFixed(4)} €/kWh. La franja punta (10:00-14:00 y 18:00-22:00 laborables) es siempre la mas cara; el precio medio del dia esta en ${precio_medio.toFixed(4)} €/kWh.`;
  }

  // Renovables
  if (/renovables|mix.*energetico|cuanta.*renovable/.test(t)) {
    const renovStr = renovables_pct != null
      ? ` Hoy el ${renovables_pct}% de la electricidad en la Peninsula es de origen renovable.`
      : '';
    return `Hoy el PVPC esta de media en ${precio_medio.toFixed(4)} €/kWh.${renovStr} Con solar puedes cubrir buena parte de tu consumo diurno y reducir lo que compras a la red.`;
  }

  // Precio general / kWh hoy
  const precioAhoraStr = precioAhora != null
    ? ` Ahora mismo (${horaActual}:00 h, franja ${franjaActual}) esta en ${precioAhora.toFixed(4)} €/kWh.`
    : '';
  return `Hoy el PVPC esta de media en ${precio_medio.toFixed(4)} €/kWh.${precioAhoraStr} La hora mas barata es a las ${hora_min}:00 h (${precio_min.toFixed(4)} €/kWh) y la mas cara a las ${hora_max}:00 h (${precio_max.toFixed(4)} €/kWh).`;
}

module.exports = { esConsultaEnergiaActual, construirRespuestaEnergia };
