const express = require('express');
const router = express.Router();

const estadosController = require('../controllers/estados.controller');
const authMiddleware = require('../middlewares/auth.middleware');

router.use(authMiddleware.authenticate);

router.get('/', estadosController.listarTodos);
router.get('/:tipo_aplica', estadosController.listarPorTipo);

module.exports = router;


