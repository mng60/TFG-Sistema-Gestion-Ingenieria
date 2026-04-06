const assert = require('assert');
const { construirRespuestaPrecio } = require('../src/controllers/helpers/asistentePrecio.helper');

function respuestaPrecio({ preguntaActual, preguntaAnalizada, historialUsuario = [] }) {
  return construirRespuestaPrecio({
    preguntaActual,
    preguntaAnalizada,
    historialUsuario,
    resultados: [],
    knowledgeBase: []
  });
}

function testSeguimientoViviendaNoSeConvierteEnEdificio() {
  const primeraPregunta = 'hola, cuanto costaria colocar placas solares con baterias en el techo inclinado de una casa en el campo';
  const seguimiento = 'la cubierta es inclinada y lleva baterias';
  const preguntaAnalizada = `${primeraPregunta}. ${seguimiento}`;

  const respuesta = respuestaPrecio({
    preguntaActual: seguimiento,
    preguntaAnalizada,
    historialUsuario: [primeraPregunta]
  });

  assert.match(respuesta, /superficie util aproximada en m2/i);
  assert.doesNotMatch(respuesta, /en un edificio/i);
}

function testSolarViviendaConMetrosMantieneBaremo() {
  const pregunta = 'Quiero instalar placas solares en mi casa de Murcia y tengo unos 35 m2 utiles, cuanto costaria?';
  const respuesta = respuestaPrecio({
    preguntaActual: pregunta,
    preguntaAnalizada: pregunta
  });

  assert.match(respuesta, /35 m2 utiles/i);
  assert.match(respuesta, /sin baterias/i);
  assert.match(respuesta, /con baterias/i);
}

function testSolarComunidadSigueComoCasoColectivo() {
  const pregunta = 'Cuanto costaria poner placas solares para zonas comunes en un edificio de 4 plantas?';
  const respuesta = respuestaPrecio({
    preguntaActual: pregunta,
    preguntaAnalizada: pregunta
  });

  assert.match(respuesta, /en un edificio me faltan m2 utiles/i);
}

testSeguimientoViviendaNoSeConvierteEnEdificio();
testSolarViviendaConMetrosMantieneBaremo();
testSolarComunidadSigueComoCasoColectivo();

console.log('asistentePrecio.test.js: OK');
