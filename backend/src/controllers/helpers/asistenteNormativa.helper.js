const { normalizarTextoPlano, incluye } = require('./asistenteTexto.helper');

function obtenerEntrada(knowledgeBase, id) {
  return knowledgeBase.find((entrada) => entrada && entrada.id === id) || null;
}

function esConsultaNormativa(preguntaActual, preguntaAnalizada) {
  const texto = normalizarTextoPlano(`${preguntaActual} ${preguntaAnalizada}`);
  const pareceConsultaComercial = incluye(texto, [
    /cuanto|cuesta|coste|precio|presupuesto|baremo|rango orientativo/,
    /cambiar cuadro|cuadro electrico|adaptar cableado|reforma electrica/,
    /m2|metros|cubierta|baterias|zonas comunes|repartir entre viviendas/
  ]);

  if (pareceConsultaComercial) return false;

  return incluye(texto, [
    /cie|boletin|certificado electrico|certificado de instalacion/,
    /industria|baja tension|procedimiento 0019|documentacion/,
    /autoconsumo individual|autoconsumo colectivo|colectivo/,
    /cargador|wallbox|vehiculo electrico|itc bt 52|itc-bt-52/
  ]);
}

function construirRespuestaCIE(texto, knowledgeBase) {
  const entradaCuando = obtenerEntrada(knowledgeBase, 'norma_cie_cuando');
  const entradaMurcia = obtenerEntrada(knowledgeBase, 'murcia_registro_bt_0019');

  if (/cuando hace falta|cuando necesito|cuando suele ser necesario/.test(texto)) {
    return 'En Murcia, el CIE suele hacer falta al dar de alta un nuevo suministro, en determinadas ampliaciones de potencia, tras reformas relevantes o cuando la distribuidora o la administracion exigen acreditar el estado reglamentario de la instalacion. Ademas, la puesta en servicio y el registro de baja tension se tramitan por el procedimiento 0019 de la CARM.';
  }

  if (/quien lo emite|quien puede hacerlo/.test(texto)) {
    return 'El CIE lo emite una empresa instaladora habilitada en baja tension, dentro del ambito reglamentario que corresponda. Luego la tramitacion concreta depende del procedimiento aplicable en Murcia.';
  }

  return entradaCuando?.contenido || entradaMurcia?.contenido || null;
}

function construirRespuestaDocumentacion(texto, knowledgeBase) {
  const entradaRegistro = obtenerEntrada(knowledgeBase, 'murcia_registro_bt_0019');
  if (!entradaRegistro) return null;

  if (/documentacion|documentos|que suele pedir industria|que pide industria/.test(texto)) {
    return 'En Murcia, para baja tension la documentacion depende del tipo de instalacion, pero suele hablarse de certificado, declaracion responsable y, segun el caso, memoria tecnica de diseno o proyecto. Lo normal es revisarlo segun el procedimiento 0019 y el alcance real de la instalacion.';
  }

  return entradaRegistro.contenido;
}

function construirRespuestaAutoconsumo(texto, knowledgeBase) {
  const entradaGeneral = obtenerEntrada(knowledgeBase, 'norma_autoconsumo_rd244');
  const entradaColectivo = obtenerEntrada(knowledgeBase, 'colectivo_comunidad_propietarios');

  if (/diferencia|individual y colectivo|colectivo e individual/.test(texto)) {
    return 'El autoconsumo individual se refiere a una instalacion asociada a un solo consumidor, mientras que el colectivo permite repartir la energia entre varias viviendas o locales segun un criterio de reparto. En edificios y comunidades, antes de valorar precio o tramites conviene dejar claro si sera solo para zonas comunes o si habra reparto entre vecinos.';
  }

  return entradaColectivo?.contenido || entradaGeneral?.contenido || null;
}

function construirRespuestaRecargaVE(texto, knowledgeBase) {
  const entradaVE = obtenerEntrada(knowledgeBase, 'norma_bt52_recarga_vehiculo');
  if (!entradaVE) return null;

  if (/tramite|tramites|especial|hace falta/.test(texto)) {
    return 'Para un cargador de coche electrico no conviene decir que nunca hay tramite, porque depende del esquema de instalacion, del tipo de inmueble y de si hay que adaptar la instalacion existente. La referencia tecnica principal es la ITC-BT-52, y segun el caso puede hacer falta revisar protecciones, linea, cuadro y documentacion asociada.';
  }

  return entradaVE.contenido;
}

function construirRespuestaNormativa({ preguntaActual, preguntaAnalizada, knowledgeBase }) {
  const texto = normalizarTextoPlano(`${preguntaActual} ${preguntaAnalizada}`);

  if (incluye(texto, [/cie|boletin|certificado electrico|certificado de instalacion/])) {
    return construirRespuestaCIE(texto, knowledgeBase);
  }

  if (incluye(texto, [/industria|baja tension|procedimiento 0019|documentacion/])) {
    return construirRespuestaDocumentacion(texto, knowledgeBase);
  }

  if (incluye(texto, [/autoconsumo individual|autoconsumo colectivo|colectivo/])) {
    return construirRespuestaAutoconsumo(texto, knowledgeBase);
  }

  if (incluye(texto, [/cargador|wallbox|vehiculo electrico|itc bt 52|itc-bt-52/])) {
    return construirRespuestaRecargaVE(texto, knowledgeBase);
  }

  return null;
}

module.exports = {
  esConsultaNormativa,
  construirRespuestaNormativa
};
