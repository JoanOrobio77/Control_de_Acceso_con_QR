const express = require("express");

const router = express.Router();

const multer = require("multer");



// Configurar multer (sube Excel a memoria, no a disco)

const upload = multer({ storage: multer.memoryStorage() });



const {

  cargarExcel,

  guardarMasivo,

  guardarInstructoresMasivo,

} = require("../controllers/importacion.controller");



// Cargar archivo Excel y generar previsualización

router.post("/upload", upload.single("file"), cargarExcel);



// Guardar aprendices en base de datos

router.post("/guardar", guardarMasivo);

// Guardar instructores en base de datos

router.post("/guardar-instructores", guardarInstructoresMasivo);



module.exports = router;

