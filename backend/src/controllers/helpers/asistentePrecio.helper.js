const { normalizarTextoPlano, incluye } = require('./asistenteTexto.helper');

function extraerSuperficieM2(texto) {
  const match = normalizarTextoPlano(texto).match(/(\d+(?:[.,]\d+)?)\s*(m2|m\^2|metros cuadrados|metros)/);
  if (!match) return null;
  return Number(match[1].replace(',', '.'));
}

function redondearCentenas(valor) {
  return Math.round(valor / 100) * 100;
}

function formatearEuros(valor) {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0
  }).format(valor);
}

function getTemaIdDesdeTexto(texto) {
  if (incluye(texto, [/empresa|nave|industrial/]) && incluye(texto, [/solar|fotovoltaica|placas|paneles/])) return 'precio_solar_empresa';
  if (incluye(texto, [/solar|fotovoltaica|placas|paneles|autoconsumo/])) return 'precio_solar_residencial';
  if (incluye(texto, [/cuadro|magnetotermic|diferencial|protecciones/])) return 'precio_cuadro_electrico';
  if (incluye(texto, [/cie|boletin|certificado electrico|legalizacion/])) return 'precio_cie';
  if (incluye(texto, [/local|tienda|bar|restaurante|oficina/])) return 'precio_local_comercial';
  if (incluye(texto, [/mantenimiento|averia|urgencia|preventivo|correctivo/])) return 'precio_mantenimiento';
  if (incluye(texto, [/\bmi casa\b|\bmi vivienda\b|\bmi piso\b|\bvivienda habitual\b|\bcasa unifamiliar\b|\bvivienda unifamiliar\b|\bhogar\b|\bcasa\b|reforma electrica/])) return 'precio_vivienda';
  return null;
}

function obtenerTemaActivo({ preguntaActual, preguntaAnalizada, historialUsuario = [], resultados = [], knowledgeBase = [] }) {
  const actual = normalizarTextoPlano(preguntaActual);
  const analizada = normalizarTextoPlano(preguntaAnalizada);
  const historialNormalizado = historialUsuario.map((texto) => normalizarTextoPlano(texto));
  const temaHistorial = [...historialNormalizado]
    .reverse()
    .map((texto) => getTemaIdDesdeTexto(texto))
    .find(Boolean);
  const temaSolarHistorial = [...historialNormalizado]
    .reverse()
    .map((texto) => getTemaIdDesdeTexto(texto))
    .find((tema) => /^precio_solar/.test(tema || ''));

  const idActual = getTemaIdDesdeTexto(actual);
  if (temaSolarHistorial && incluye(actual, [/baterias|cubierta|tejado|plana|inclinada|zonas comunes|vecinos|repartir|mi casa|mi vivienda|mi piso|vivienda habitual|alguna recomendacion|que me recomiendas|ambas opciones|las dos|merece la pena|recomendarias/])) {
    return temaSolarHistorial;
  }

  if (temaHistorial === 'precio_cuadro_electrico' && incluye(actual, [/cableado|cie|circuitos|adaptar|sustituir|cuadro|merece.*la pena|recomendarias/])) {
    return 'precio_cuadro_electrico';
  }

  if (idActual) return idActual;

  if (temaHistorial) return temaHistorial;

  const idAnalizada = getTemaIdDesdeTexto(analizada);
  if (idAnalizada) return idAnalizada;

  const entradaPrecio = resultados.find((r) => r.entrada && r.entrada.categoria === 'precios')?.entrada;
  if (entradaPrecio?.id) return entradaPrecio.id;

  return knowledgeBase.find((entrada) => entrada && entrada.categoria === 'precios')?.id || null;
}

function obtenerEntradaPorTema({ temaId, resultados = [], knowledgeBase = [] }) {
  if (!temaId) return null;
  return resultados.find((r) => r.entrada && r.entrada.id === temaId)?.entrada ||
    knowledgeBase.find((entrada) => entrada && entrada.id === temaId) ||
    null;
}

function pideComparativaOpciones(texto) {
  return incluye(texto, [/ambas opciones|las dos opciones|ambos casos|con y sin|precio de ambas|precio de los dos|las dos|ambas/]);
}

function esPreguntaRecomendacion(pregunta) {
  const texto = normalizarTextoPlano(pregunta);
  return incluye(texto, [/alguna recomendacion|que me recomiendas|tu que recomiendas|que opcion recomiendas|que harias|que opcion ves mejor|merece.*la pena|merecer.*la pena|recomendarias/]);
}

function esTemaPrecioActualEnergia(pregunta) {
  const texto = normalizarTextoPlano(pregunta);
  const mencionaKwh = /\bkwh\b|kilovatio hora/.test(texto);
  const pideDatoActual = /hoy|ahora|actual|actualmente|manana|esta hoy|a cuanto esta|cuanto esta/.test(texto);
  return /precio.*kwh|kwh.*precio|precio de la luz|\bpvpc\b|mercado mayorista|\bomie\b|tarifa actual|tarifa de luz hoy|precio hoy|precio manana|pool electrico/.test(texto) ||
    (mencionaKwh && pideDatoActual);
}

const RESPUESTA_PRECIO_ACTUAL_ENERGIA = 'Ahora mismo no puedo decirte el precio de hoy del kWh porque ese dato cambia y este asistente no se actualiza en tiempo real. Si quieres, si puedo ayudarte con instalaciones, tramites y precios orientativos del sector.';

function construirRespuestaBaseDesdeEntrada(entrada) {
  if (!entrada?.respuesta_orientativa) return null;
  return entrada.pregunta_ajuste
    ? `${entrada.respuesta_orientativa} ${entrada.pregunta_ajuste}`
    : entrada.respuesta_orientativa;
}

function construirRespuestaCuadro(textoActual) {
  const soloSustitucion = /solo|sin tocar el resto|sustituir el cuadro|solo cambiar el cuadro/.test(textoActual);
  const adaptarMas = /adaptar cableado|cableado|sacar cie|emitir cie|legalizacion|circuitos/.test(textoActual);

  if (soloSustitucion) {
    return 'Si es solo sustituir el cuadro y dejar el resto como esta, hablamos del caso mas sencillo y el baremo suele quedar bastante mas contenido, siempre sin IVA. Si quieres, dime si el cuadro actual es antiguo o si ya da problemas con diferenciales o magnetotermicos y te lo afino un poco mas.';
  }

  if (adaptarMas) {
    return 'Si ademas hay que adaptar cableado, ampliar circuitos o emitir CIE, el trabajo ya sube claramente respecto a un simple cambio de cuadro, siempre sin IVA. En ese caso conviene separar la parte de cuadro de la parte de adecuacion para orientar mejor el coste.';
  }

  return 'Como baremo inicial, un cambio sencillo de cuadro suele ser bastante mas economico que una reforma con ampliacion de circuitos o legalizacion completa. Si me dices si es solo sustitucion del cuadro o si tambien hay que adaptar cableado, CIE o circuitos, te lo ajusto mejor.';
}

function construirRespuestaCIE(textoActual) {
  const instalacionAntigua = /antigua|vieja|funciona|la luz funciona|instalacion antigua/.test(textoActual);
  const arreglarDefectos = /defectos|arreglar|corregir|adaptar|rehacer/.test(textoActual);
  const diferencia = /diferencia|separar|tramitar.*cie|adaptar.*instalacion/.test(textoActual);

  if (diferencia) {
    return 'Tramitar el CIE es certificar una instalacion que ya esta en condiciones, mientras que adaptar la instalacion implica corregir defectos o actualizar parte del sistema antes de poder certificar. Por eso una cosa es el coste de certificacion y otra el de adecuacion previa.';
  }

  if (instalacionAntigua) {
    return 'Si la instalacion es antigua pero la luz funciona, no significa automaticamente que este lista para certificar: puede hacer falta revisar cuadro, derivaciones o protecciones antes de emitir el CIE. En ese escenario conviene contar con una posible parte de adecuacion ademas del tramite.';
  }

  if (arreglarDefectos) {
    return 'Si antes hay que arreglar defectos, el coste total ya no es solo el del boletin: primero hay que adecuar la instalacion y despues certificarla. Normalmente compensa separar esas dos partes para entender bien el baremo.';
  }

  return 'Con el CIE conviene separar una cosa de otra: no cuesta lo mismo tramitar un boletin de una instalacion ya correcta que tener que corregir defectos antes de certificar. Si me dices si la instalacion ya esta al dia o si habria que revisar cuadro, derivaciones o defectos, te lo explico mucho mejor.';
}

function construirRespuestaLocal(textoActual, superficieM2) {
  if (/oficina/.test(textoActual)) {
    return superficieM2
      ? `Para un local de unos ${superficieM2} m2 usado como oficina sencilla, el baremo suele quedar en la parte mas contenida dentro de un local comercial, siempre sin IVA. Normalmente pesa menos que en un bar o restaurante porque la carga y los requisitos especiales suelen ser menores.`
      : 'Si es una oficina sencilla, el baremo suele quedar en la parte mas contenida dentro de un local comercial, siempre sin IVA. Suele pesar menos que en un bar o restaurante porque la carga y los requisitos especiales acostumbran a ser menores.';
  }

  if (/bar|restaurante|cocina|camaras/.test(textoActual)) {
    return superficieM2
      ? `Para un local de unos ${superficieM2} m2 tipo bar o restaurante, el baremo ya sube bastante respecto a una oficina o tienda ligera, siempre sin IVA. Aqui pesan mucho mas la cocina, la climatizacion, el alumbrado de emergencia y posibles equipos especiales.`
      : 'Si fuera un bar o restaurante, el baremo ya sube bastante respecto a una oficina o tienda ligera, siempre sin IVA. Aqui pesan mucho mas la cocina, la climatizacion, el alumbrado de emergencia y otros equipos especiales.';
  }

  if (/metros|m2|actividad|influye mas/.test(textoActual)) {
    return 'En un local comercial suele influir mas la actividad que los metros por si solos, porque no exige lo mismo una oficina que un bar o un local con cocina y camaras. Los metros ayudan a orientar, pero el uso real manda mucho mas.';
  }

  return superficieM2
    ? `En un local comercial de unos ${superficieM2} m2 te puedo dar un baremo general, pero cambia bastante segun el uso: una oficina sencilla no se parece en coste a un bar, una tienda o un local con cocina y camaras. Si me dices el tipo de actividad, te lo oriento mucho mejor.`
    : 'En un local comercial te puedo dar un baremo muy general, pero cambia bastante segun el uso: una oficina sencilla no se parece en coste a un bar, una tienda o un local con cocina y camaras. Si me dices los m2 y el tipo de actividad del local, te oriento mucho mejor.';
}

function construirRespuestaMantenimiento(textoActual) {
  if (/preventivo|mensual|periodico/.test(textoActual)) {
    return 'Si hablas de un mantenimiento preventivo mensual, ya estamos en un escenario mas ordenado y previsible que una actuacion puntual, asi que el baremo suele definirse mejor cuando se concreta frecuencia, alcance y tipo de instalacion. En una nave normalmente conviene fijar bien revisiones, protecciones y posibles puntos criticos.';
  }

  if (/urgencias|averias puntuales|puntuales|urgencia/.test(textoActual)) {
    return 'Si fuera solo para urgencias o averias puntuales, el planteamiento cambia bastante frente a un mantenimiento preventivo, porque pesa mas la disponibilidad y la incidencia concreta. Normalmente es menos previsible y puede salir peor a medio plazo que llevar un preventivo minimo.';
  }

  if (/recomendarias|recomiendas|no ir siempre a urgencias/.test(textoActual)) {
    return 'Como recomendacion general, si la instalacion va a seguir en uso durante tiempo suele merecer mas la pena estudiar un mantenimiento preventivo minimo que ir solo a urgencias. A medio plazo suele dar mas control y menos sorpresas.';
  }

  return 'En mantenimiento y averias el baremo cambia mucho segun si hablas de una actuacion puntual, una urgencia o un contrato preventivo. Aun asi, si me cuentas el tipo de instalacion y la frecuencia que buscarias, te doy una orientacion bastante mas clara.';
}

function construirRespuestaVivienda(textoActual, superficieM2) {
  const esParcial = /parcial/.test(textoActual);
  const esIntegral = /integral|completa/.test(textoActual);

  if (superficieM2 && esParcial) {
    return `Si hablamos de una vivienda de unos ${superficieM2} m2 y una reforma parcial, lo normal es pensar en el tramo bajo de unos pocos miles de euros, siempre sin IVA. Si quieres, dime si tambien habria que tocar cuadro electrico o legalizacion y te lo afino un poco mas.`;
  }

  if (superficieM2 && esIntegral) {
    return `Para una vivienda de unos ${superficieM2} m2 con reforma integral, el baremo ya se mueve claramente por encima de una actuacion sencilla y puede subir bastante segun cuadro, rozas y legalizacion, siempre sin IVA. Si me dices si la vivienda esta antigua o ya tiene parte reformada, te lo acoto mejor.`;
  }

  if (/recomiendas|que harias|merece la pena/.test(textoActual)) {
    return 'Como orientacion general en vivienda, si no hace falta rehacerlo todo suele ser mejor empezar por una reforma parcial bien medida y dejar la integral solo para casos con instalacion antigua o muy limitada. Si quieres, dime el estado actual de la vivienda y te digo que enfoque veria mas razonable.';
  }

  return null;
}

function construirRespuestaSolarDesdeContexto(contexto) {
  const {
    temaId,
    textoActual,
    textoCompleto,
    superficieM2,
    mencionaViviendaIndividual,
    esCasoColectivo,
    mencionaZonasComunes,
    mencionaReparto,
    niegaReparto,
    mencionaBaterias,
    quiereAmbasOpciones,
    cubiertaInclinada,
    cubiertaPlana,
    preguntaQueEsCubierta
  } = contexto;

  if (!/^precio_solar/.test(temaId || '')) return null;

  if (esCasoColectivo) {
    if (!superficieM2) {
      return 'Puedo orientarte mejor, pero en un edificio me faltan m2 utiles de cubierta, saber si seria solo para zonas comunes o para repartir entre viviendas y si llevaria baterias. Con esos datos te doy un baremo inicial sin IVA; de momento solo puedo decirte que la potencia, la cubierta y la tramitacion cambian bastante el precio.';
    }

    if (niegaReparto || (mencionaZonasComunes && !mencionaReparto)) {
      if (quiereAmbasOpciones) {
        const precioSinMin = redondearCentenas(superficieM2 * 140);
        const precioSinMax = redondearCentenas(superficieM2 * 180);
        const precioConMin = redondearCentenas(precioSinMin + 5000);
        const precioConMax = redondearCentenas(precioSinMax + 10000);
        return `Si quieres comparar las dos opciones, para ${superficieM2} m2 utiles en zonas comunes yo tomaria como baremo inicial unos ${formatearEuros(precioSinMin)} a ${formatearEuros(precioSinMax)} sin baterias y una franja mas abierta de unos ${formatearEuros(precioConMin)} a ${formatearEuros(precioConMax)} con baterias, siempre sin IVA. La parte con baterias la dejo mas abierta porque depende mucho de la capacidad de almacenamiento que se quiera montar; si me dices cuantos kWh te planteas, te la afino mejor.`;
      }

      if (!mencionaBaterias) {
        const precioMin = redondearCentenas(superficieM2 * 130);
        const precioMax = redondearCentenas(superficieM2 * 210);
        return `Con unos ${superficieM2} m2 utiles para zonas comunes ya puedo darte un baremo muy inicial de entre ${formatearEuros(precioMin)} y ${formatearEuros(precioMax)} sin IVA. Si me confirmas si iria sin baterias o con baterias, te lo ajusto un poco mas porque ese dato cambia bastante la inversion.`;
      }

      return 'En un caso de autoconsumo para zonas comunes, lo normal es afinar el baremo cuando tengamos claro si entrarian baterias o no y como seria la cubierta real. Si quieres, dame esos dos datos y te lo concreto mejor.';
    }

    if (mencionaReparto) {
      return `Si quereis repartirlo entre vecinos, ya estamos hablando de autoconsumo colectivo y el baremo depende bastante de la potencia util, el criterio de reparto y la tramitacion. Con unos ${superficieM2} m2 se puede orientar, pero aqui conviene diferenciar bien entre zonas comunes y reparto entre viviendas antes de cerrar una horquilla.`;
    }

    if (!mencionaZonasComunes && !mencionaReparto) {
      return `Con unos ${superficieM2} m2 utiles ya se puede afinar bastante mejor, pero me falta saber si la instalacion seria solo para zonas comunes o para repartir entre las viviendas. Si me dices eso y si llevaria baterias, te doy una orientacion bastante mas util, siempre como rango aproximado y sin IVA.`;
    }

    return 'En un caso de autoconsumo colectivo como este, lo normal es afinar el baremo cuando tengamos claro si seria para zonas comunes, para reparto entre viviendas y si entrarian baterias o no. Si quieres, dame esos dos datos y te lo concreto mejor.';
  }

  if (mencionaViviendaIndividual && !superficieM2) {
    if (cubiertaInclinada || cubiertaPlana || mencionaBaterias) {
      return 'Para una vivienda como la que comentas ya solo me faltaria la superficie util aproximada en m2 para darte un baremo inicial mas util, siempre orientativo y sin IVA.';
    }

    return 'Puedo orientarte mejor si me das la superficie util aproximada en m2 y me confirmas si la cubierta es plana o inclinada y si quieres baterias o no. En vivienda esos tres datos cambian bastante el baremo.';
  }

  if (mencionaViviendaIndividual && superficieM2) {
    const factorMin = cubiertaInclinada ? 130 : cubiertaPlana ? 115 : 120;
    const factorMax = cubiertaInclinada ? 180 : cubiertaPlana ? 165 : 170;
    const extraBateriaMin = cubiertaInclinada ? 4500 : cubiertaPlana ? 3500 : 4000;
    const extraBateriaMax = cubiertaInclinada ? 9500 : cubiertaPlana ? 8500 : 9000;
    const precioSinMin = redondearCentenas(superficieM2 * factorMin);
    const precioSinMax = redondearCentenas(superficieM2 * factorMax);
    const precioConMin = redondearCentenas(precioSinMin + extraBateriaMin);
    const precioConMax = redondearCentenas(precioSinMax + extraBateriaMax);

    let cierre = '';
    if (preguntaQueEsCubierta) {
      cierre = ' Y cuando te hablo de cubierta me refiero al tipo de tejado o superficie donde iria la instalacion, por ejemplo si es plana o inclinada, porque eso tambien influye en el montaje.';
    } else if (cubiertaInclinada) {
      cierre = ' Al ser una cubierta inclinada, el baremo lo he movido un poco al alza respecto a una plana.';
    } else if (cubiertaPlana) {
      cierre = ' Al ser una cubierta plana, el montaje suele quedar algo mas contenido que en una inclinada.';
    }

    return `Para una vivienda con unos ${superficieM2} m2 utiles, yo tomaria como baremo inicial unos ${formatearEuros(precioSinMin)} a ${formatearEuros(precioSinMax)} sin baterias y una franja mas abierta de unos ${formatearEuros(precioConMin)} a ${formatearEuros(precioConMax)} con baterias, siempre sin IVA.${cierre}`;
  }

  if (esPreguntaRecomendacion(textoActual) || /recomiendas|que harias|merece la pena/.test(textoActual)) {
    return 'Como orientacion general en solar, si todavia no tienes clara la necesidad de baterias suele tener sentido empezar comparando primero la opcion sin baterias, porque es la referencia mas contenida. Si luego buscas mas autonomia o cubrir consumo fuera de horas solares, ya merece la pena estudiar almacenamiento.';
  }

  if (superficieM2) {
    return `Con unos ${superficieM2} m2 ya se puede preparar una orientacion mejor, pero para darte un rango util me faltaria saber el tipo de cubierta, si habria baterias y si buscas cubrir una vivienda, un local o varias viviendas. Si me das esos datos, te doy una orientacion mas razonable, siempre como rango aproximado y sin IVA.`;
  }

  return 'Puedo orientarte mejor si me das la superficie util, el tipo de cubierta y si quieres baterias o no. En instalaciones solares el coste depende sobre todo de la potencia, la estructura y la tramitacion, asi que los importes deben entenderse como orientativos y sin IVA.';
}

function construirRecomendacionPrecio({ temaId, textoActual, superficieM2, esCasoColectivo, mencionaZonasComunes }) {
  if (/^precio_solar/.test(temaId || '')) {
    if (esCasoColectivo && mencionaZonasComunes) {
      return superficieM2
        ? `Como orientacion general, con unos ${superficieM2} m2 para zonas comunes suele tener mas sentido estudiar primero la opcion sin baterias, porque la inversion inicial es mas contenida y ya puedes valorar el ahorro real. Si despues veis que os interesa cubrir mas consumo nocturno o ganar respaldo, entonces si merece la pena revisar baterias con mas detalle.`
        : 'Como orientacion general, si todavia no teneis claro el uso real de baterias, suele tener mas sentido empezar valorando la opcion sin baterias porque la inversion inicial es mas contenida. Si despues veis que quereis cubrir mas consumo nocturno o ganar respaldo, entonces ya compensa estudiar baterias con mas detalle.';
    }

    return 'Como orientacion general en solar, si todavia no tienes clara la necesidad de baterias suele tener sentido empezar comparando primero la opcion sin baterias, porque es la referencia mas contenida. Si luego buscas mas autonomia o cubrir consumo fuera de horas solares, ya merece la pena estudiar almacenamiento.';
  }

  if (temaId === 'precio_vivienda') {
    return 'Como orientacion general en vivienda, si no hace falta rehacerlo todo suele ser mejor empezar por una reforma parcial bien medida y dejar la integral solo para casos con instalacion antigua o muy limitada. Si quieres, dime el estado actual de la vivienda y te digo que enfoque veria mas razonable.';
  }

  if (temaId === 'precio_cuadro_electrico') {
    return 'Como recomendacion general, si el problema se resuelve con sustituir solo el cuadro y dejar la instalacion segura, suele ser la opcion mas razonable. Si ademas hay defectos en cableado o falta legalizacion, entonces conviene plantearlo mas completo para no quedarse a medias.';
  }

  if (temaId === 'precio_local_comercial') {
    return 'Como orientacion general en locales, lo mas importante es definir bien la actividad antes de cerrar un baremo, porque el uso manda mucho mas que los metros. Si todavia estais en una fase inicial, merece la pena pedir una orientacion basica y no dar por bueno un precio por m2 sin mas.';
  }

  if (temaId === 'precio_mantenimiento') {
    return 'Como recomendacion general, si la instalacion va a seguir en uso durante tiempo suele merecer mas la pena estudiar un mantenimiento preventivo minimo que ir solo a urgencias. A medio plazo suele dar mas control y menos sorpresas.';
  }

  return 'Como recomendacion general, lo mejor es tomar estos importes como baremo y afinar la opcion final cuando tengamos un poco mas de alcance real.';
}

function construirRespuestaPrecio(params) {
  const {
    preguntaActual,
    preguntaAnalizada,
    historialUsuario = [],
    resultados = [],
    knowledgeBase = []
  } = params;

  const textoActual = normalizarTextoPlano(preguntaActual);
  const textoCompleto = normalizarTextoPlano(preguntaAnalizada);
  const superficieM2 = extraerSuperficieM2(preguntaActual) || extraerSuperficieM2(preguntaAnalizada);
  const temaId = obtenerTemaActivo({ preguntaActual, preguntaAnalizada, historialUsuario, resultados, knowledgeBase });
  const entrada = obtenerEntradaPorTema({ temaId, resultados, knowledgeBase });

  const mencionaViviendaIndividual = incluye(textoActual, [/mi casa|mi vivienda|mi piso|para mi casa|para mi vivienda|vivienda habitual|vivienda unifamiliar|casa unifamiliar|\bcasa\b/]) ||
    incluye(textoCompleto, [/mi casa|mi vivienda|mi piso|para mi casa|para mi vivienda|vivienda habitual|vivienda unifamiliar|casa unifamiliar|\bcasa\b/]);
  const esCasoColectivo = !mencionaViviendaIndividual && (
    incluye(textoCompleto, [/edificio|comunidad|vecinos|bloque|autoconsumo colectivo|zonas comunes|repartir entre viviendas|reparto entre viviendas/]) ||
    /\b\d+\s*plantas?\b/.test(textoCompleto)
  );
  // niegaReparto y mencionaReparto usan solo textoActual para no contaminar
  // la intención actual con mensajes anteriores del compound histórico
  const niegaReparto = incluye(textoActual, [/no para repartir|no repartir|solo para zonas comunes|solo zonas comunes/]);
  const mencionaZonasComunes = !mencionaViviendaIndividual && (
    incluye(textoActual, [/zonas comunes|comunes|portal|ascensor|escalera|solo para zonas comunes|solo zonas comunes/]) ||
    incluye(textoCompleto, [/zonas comunes|comunes|portal|ascensor|escalera|solo para zonas comunes|solo zonas comunes/])
  );
  const mencionaReparto = !mencionaViviendaIndividual && !niegaReparto && (
    incluye(textoActual, [/repartir|vecinos|autoconsumo colectivo/])
  );
  const mencionaBaterias = incluye(textoCompleto, [/baterias|sin baterias|con baterias/]);
  const quiereAmbasOpciones = pideComparativaOpciones(textoActual) || incluye(textoActual, [/no se si poner baterias|no lo se aun|no lo se todavia/]);
  const cubiertaInclinada = incluye(textoActual, [/inclina(da|do)|tejado inclina/]) || incluye(textoCompleto, [/inclina(da|do)|tejado inclina/]);
  const cubiertaPlana = incluye(textoActual, [/plana|tejado plano|cubierta plana/]) || incluye(textoCompleto, [/plana|tejado plano|cubierta plana/]);
  const preguntaQueEsCubierta = incluye(textoActual, [/que es la cubierta|que es cubierta|a que te refieres con cubierta|que significa cubierta/]);

  if (esPreguntaRecomendacion(preguntaActual)) {
    return construirRecomendacionPrecio({
      temaId,
      textoActual,
      superficieM2,
      esCasoColectivo,
      mencionaZonasComunes
    });
  }

  if (temaId === 'precio_cie') {
    return construirRespuestaCIE(textoActual);
  }

  if (temaId === 'precio_cuadro_electrico') {
    return construirRespuestaCuadro(textoActual);
  }

  if (temaId === 'precio_local_comercial') {
    return construirRespuestaLocal(textoActual, superficieM2);
  }

  if (temaId === 'precio_mantenimiento') {
    return construirRespuestaMantenimiento(textoActual);
  }

  if (/^precio_solar/.test(temaId || '')) {
    return construirRespuestaSolarDesdeContexto({
      temaId,
      textoActual,
      textoCompleto,
      superficieM2,
      mencionaViviendaIndividual,
      esCasoColectivo,
      mencionaZonasComunes,
      mencionaReparto,
      niegaReparto,
      mencionaBaterias,
      quiereAmbasOpciones,
      cubiertaInclinada,
      cubiertaPlana,
      preguntaQueEsCubierta
    });
  }

  const respuestaVivienda = construirRespuestaVivienda(textoActual, superficieM2);
  if (temaId === 'precio_vivienda' && respuestaVivienda) {
    return respuestaVivienda;
  }

  const base = construirRespuestaBaseDesdeEntrada(entrada);
  if (base) return base;

  return 'Te puedo dar solo un baremo muy general con la informacion actual, siempre orientativo y sin IVA. Si me dices el tipo de trabajo y el alcance aproximado, te lo acoto mucho mejor.';
}

module.exports = {
  construirRespuestaPrecio,
  esPreguntaRecomendacion,
  esTemaPrecioActualEnergia,
  RESPUESTA_PRECIO_ACTUAL_ENERGIA
};
