const express = require('express');
const router = express.Router();
const guardaController = require('../controllers/guarda.controller');

// Buscar persona por documento (sin registrar acceso)
router.post('/buscar-persona', guardaController.buscarPersona);

// Registro automático (entrada/salida según último registro)
router.post('/registro-automatico', guardaController.registroAutomatico);

// Ingreso manual por cédula
router.post('/ingreso-manual', guardaController.ingresoManual);

// Ingreso por QR
router.post('/ingreso-qr', guardaController.ingresoQR);

// Registrar nuevo visitante
router.post('/registrar-visitante', guardaController.registrarVisitante);

// Obtener áreas disponibles
router.get('/areas', guardaController.getAreas);

// Obtener registros de hoy
router.get('/registros-hoy', guardaController.getRegistrosHoy);

module.exports = router;

