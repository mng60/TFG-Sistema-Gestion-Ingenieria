const router = require('express').Router();
const { preguntar, estado } = require('../controllers/asistente.controller');

router.post('/preguntar', preguntar);
router.get('/estado', estado);

module.exports = router;
