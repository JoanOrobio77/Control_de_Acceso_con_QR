const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin.controller');

// Dashboard - Obtener datos estadísticos
router.get('/dashboard', adminController.getDashboardData);

// Actividad reciente - Últimos registros de acceso
router.get('/actividad-reciente', adminController.getActividadReciente);

// Crear instructor
router.post('/instructores', adminController.crearInstructor);

// Crear funcionario
router.post('/funcionarios', adminController.crearFuncionario);

// CRUD Fichas
router.post('/fichas', adminController.crearFicha);
router.put('/fichas/:id', adminController.editarFicha);
router.delete('/fichas/:id', adminController.eliminarFicha);

// Listar usuarios por rol
router.get('/usuarios', adminController.listarUsuariosPorRol);

// Importación masiva
router.post('/importar', adminController.uploadExcel, adminController.importarDatosMasivos);
router.post('/importar/guardar', adminController.guardarImportacion);

module.exports = router;

