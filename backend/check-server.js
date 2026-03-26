#!/usr/bin/env node

/**
 * Script para verificar si el servidor está corriendo
 */

const http = require('http');

const PORT = process.env.PORT || 4000;
const HOST = 'localhost';

console.log(`🔍 Verificando servidor en http://${HOST}:${PORT}...\n`);

const options = {
  hostname: HOST,
  port: PORT,
  path: '/health',
  method: 'GET',
  timeout: 2000,
};

const req = http.request(options, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    if (res.statusCode === 200) {
      console.log('✅ Servidor está corriendo correctamente');
      console.log(`📡 Respuesta: ${data}`);
      process.exit(0);
    } else {
      console.log(`⚠ Servidor respondió con código: ${res.statusCode}`);
      process.exit(1);
    }
  });
});

req.on('error', (error) => {
  console.error('❌ Error al conectar con el servidor:');
  console.error(`   ${error.message}\n`);
  console.log('💡 El servidor no está corriendo o no es accesible.');
  console.log('   Inicia el servidor con: npm run dev');
  process.exit(1);
});

req.on('timeout', () => {
  console.error('⏱ Timeout: El servidor no respondió a tiempo');
  req.destroy();
  process.exit(1);
});

req.end();

