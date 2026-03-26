const express = require('express');
const {
  crearEstudiante,
  obtenerEstudiantes,
  obtenerEstudiantePorId,
  actualizarEstudiante,
  eliminarEstudiante,
} = require('../controllers/estudianteController');

const router = express.Router();

// Crear estudiante
router.post('/', crearEstudiante);

// Obtener todos
router.get('/', obtenerEstudiantes);

// Obtener por ID
router.get('/:id', obtenerEstudiantePorId);

// Actualizar
router.put('/:id', actualizarEstudiante);

// Eliminar
router.delete('/:id', eliminarEstudiante);

module.exports = router;

