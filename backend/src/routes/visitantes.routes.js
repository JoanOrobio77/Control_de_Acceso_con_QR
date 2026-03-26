const express = require("express");

const router = express.Router();

const visitanteController = require("../controllers/visitantes.controller");



// Crear visitante

router.post("/", visitanteController.crearVisitante);



// Obtener todos los visitantes

router.get("/", visitanteController.getVisitantes);



// Actualizar visitante

router.put("/:id", visitanteController.updateVisitante);



// Eliminar visitante

router.delete("/:id", visitanteController.deleteVisitante);



module.exports = router;

