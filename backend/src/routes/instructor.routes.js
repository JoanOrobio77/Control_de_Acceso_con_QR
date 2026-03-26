const express = require('express');

const router = express.Router();

const instructorController = require('../controllers/instructor.controller');

const { authenticate } = require('../middlewares/auth.middleware');



// Todas requieren autenticación

router.use(authenticate);



// Perfil del instructor

router.get('/perfil', instructorController.getPerfilInstructor);



// Fichas asociadas al instructor

router.get('/fichas', instructorController.getFichasPorInstructor);



// Aprendices de una ficha
router.get('/fichas/:idFicha/aprendices', instructorController.getAprendicesDeFicha);

// Aprendices con su último acceso
router.get('/fichas/:idFicha/aprendices-acceso', instructorController.getAprendicesConAcceso);

// Registros de acceso de una ficha
router.get('/fichas/:idFicha/registros', instructorController.getRegistrosAccesoFicha);

module.exports = router;

