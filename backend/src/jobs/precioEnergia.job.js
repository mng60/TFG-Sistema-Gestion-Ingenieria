// Job diario: fetcha precios PVPC de REE y los guarda en datos_mercado
const cron = require('node-cron');
const DatoMercado = require('../models/DatoMercado');

const REE_BASE = 'https://apidatos.ree.es/es/datos/mercados/precios-mercados-tiempo-real';

const fetchPrecioEnergia = async () => {
  try {
    // Fecha local Madrid (no UTC) para que el cron nocturno cargue el día correcto
    const madridDate = new Date(new Date().toLocaleString('en-US', { timeZone: 'Europe/Madrid' }));
    const fecha = `${madridDate.getFullYear()}-${String(madridDate.getMonth() + 1).padStart(2, '0')}-${String(madridDate.getDate()).padStart(2, '0')}`;
    const url = `${REE_BASE}?time_trunc=hour&geo_trunc=electric_system&geo_limit=peninsular&geo_ids=8741&start_date=${fecha}T00:00&end_date=${fecha}T23:59`;

    const res = await fetch(url, { signal: AbortSignal.timeout(20000) });
    if (!res.ok) throw new Error(`REE responde ${res.status}`);

    const json = await res.json();
    const included = json.included || [];

    // PVPC: id '600' o type 'PVPC'
    const pvpc = included.find((e) => e.id === '600' || e.type === 'PVPC' ||
      (e.attributes?.title || '').toLowerCase().includes('pvpc'));
    if (!pvpc?.attributes?.values?.length) throw new Error('Sin datos PVPC en respuesta REE');

    const valores = pvpc.attributes.values
      .map((v) => ({
        // Hora local Madrid: la API REE da datetimes con offset local, pero por seguridad forzamos la zona
        hora: new Date(new Date(v.datetime).toLocaleString('en-US', { timeZone: 'Europe/Madrid' })).getHours(),
        precio: Math.round((v.value / 1000) * 100000) / 100000 // €/MWh → €/kWh, 5 decimales
      }))
      .filter((v) => !isNaN(v.precio) && v.precio >= 0)
      .sort((a, b) => a.hora - b.hora);

    if (!valores.length) throw new Error('Sin valores válidos PVPC');

    const precios = valores.map((v) => v.precio);
    const precioMedio = Math.round((precios.reduce((a, b) => a + b, 0) / precios.length) * 100000) / 100000;
    const minEntry = valores.reduce((a, b) => (a.precio <= b.precio ? a : b));
    const maxEntry = valores.reduce((a, b) => (a.precio >= b.precio ? a : b));

    // Renovables: buscar por title — logear IDs disponibles para diagnóstico
    console.log('[PrecioEnergia] IDs en included:', included.map((e) => `${e.id}|${e.type}|${e.attributes?.title}`).join(' / '));
    const renovables = included.find((e) =>
      (e.attributes?.title || '').toLowerCase().includes('renov') ||
      (e.attributes?.title || '').toLowerCase().includes('renovable') ||
      e.type === 'Renovable' ||
      e.type === 'Renovables'
    );
    // La API REE puede devolver el % directamente o como valor entre 0-1
    let renovablesPct = null;
    if (renovables?.attributes?.values?.length) {
      const v0 = renovables.attributes.values[0];
      if (v0.percentage != null) {
        renovablesPct = Math.round(v0.percentage <= 1 ? v0.percentage * 100 : v0.percentage);
      } else if (v0.value != null) {
        renovablesPct = Math.round(v0.value <= 1 ? v0.value * 100 : v0.value);
      }
    }

    const datos = {
      fecha,
      precio_medio: precioMedio,
      precio_min: minEntry.precio,
      hora_min: minEntry.hora,
      precio_max: maxEntry.precio,
      hora_max: maxEntry.hora,
      precios_por_hora: valores,
      renovables_pct: renovablesPct
    };

    await DatoMercado.set('pvpc_hoy', datos);
    console.log(`[PrecioEnergia] Actualizado — media: ${precioMedio} €/kWh, min: ${minEntry.precio} a las ${minEntry.hora}h`);
  } catch (err) {
    console.error('[PrecioEnergia] Error al fetchar REE:', err.message);
  }
};

const startPrecioEnergiaJob = () => {
  fetchPrecioEnergia(); // Ejecutar al arrancar para tener dato desde el inicio
  cron.schedule('30 0 * * *', fetchPrecioEnergia, { timezone: 'Europe/Madrid' });
  console.log('[PrecioEnergia] Job programado (diario 00:30 Europe/Madrid)');
};

module.exports = { startPrecioEnergiaJob, fetchPrecioEnergia };
