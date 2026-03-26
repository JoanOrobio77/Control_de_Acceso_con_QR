const express = require("express");

const router = express.Router();

const registroController = require("../controllers/registro.controller");



// Registrar entrada (QR o manual)

router.post("/entrada", registroController.registrarEntrada);



// Registrar salida (QR o manual)

router.post("/salida", registroController.registrarSalida);



// Obtener historial por persona

router.get("/persona/:id", registroController.historialPorUsuario);



// Obtener historial por fecha

router.get("/fecha/:fecha", registroController.historialPorFecha);



// Obtener todos los registros

router.get("/", registroController.getAllRegistros);



module.exports = router;
