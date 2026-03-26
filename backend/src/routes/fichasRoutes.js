const express = require('express');
const {
  obtenerFichas,
  crearFicha,
  actualizarFicha,
  eliminarFicha,
} = require('../controllers/fichaController');

const router = express.Router();

// GET /api/fichas - Listar todas las fichas
router.get('/', obtenerFichas);

// POST /api/fichas - Crear una ficha
router.post('/', crearFicha);

// PUT /api/fichas/:id - Actualizar una ficha
router.put('/:id', actualizarFicha);

// DELETE /api/fichas/:id - Eliminar una ficha
router.delete('/:id', eliminarFicha);

module.exports = router;

