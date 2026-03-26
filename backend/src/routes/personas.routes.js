const express = require('express');
const router = express.Router();
const personasController = require('../controllers/personas.controller');
const authMiddleware = require('../middlewares/auth.middleware');

// Aplicar autenticación a todas las rutas
router.use(authMiddleware.authenticate);

/**
 * GET /api/personas
 * Obtener todas las personas con filtros opcionales
 * Query params: page, limit, search, id_rol, tipo_documento
 */
router.get('/', personasController.getAllPersonas);

/**
 * GET /api/personas/documento/:numero
 * Buscar persona por número de documento
 */
router.get('/documento/:numero', personasController.getPersonaByDocumento);

/**
 * GET /api/personas/:id
 * Obtener una persona por ID
 */
router.get('/:id', personasController.getPersonaById);

/**
 * POST /api/personas
 * Crear una nueva persona
 * Body: tipo_documento, numero_documento, nombres, apellidos, id_rol?, nombre_rol?, foto?, telefono?, correo?, rh?
 */
router.post('/', personasController.createPersona);

/**
 * PUT /api/personas/:id
 * Actualizar una persona
 * Body: campos opcionales a actualizar
 */
router.put('/:id', personasController.updatePersona);

/**
 * DELETE /api/personas/:id
 * Eliminar una persona
 */
router.delete('/:id', personasController.deletePersona);

module.exports = router;

