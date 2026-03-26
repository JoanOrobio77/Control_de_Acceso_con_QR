#!/usr/bin/env node

/**
 * Script para verificar si el servidor backend está corriendo
 * Ejecutar desde la raíz del proyecto: node check-server.js
 */

const http = require('http');

// Intentar múltiples puertos comunes
const PORTS_TO_CHECK = [
  process.env.PORT ? parseInt(process.env.PORT) : null,
  3000,
  4000,
  5000,
].filter(p => p !== null);

const HOST = 'localhost';

console.log(`🔍 Verificando servidor backend...\n`);

function checkPort(port) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: HOST,
      port: port,
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
          resolve({ port, data });
        } else {
          reject(new Error(`Status code: ${res.statusCode}`));
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Timeout'));
    });

    req.end();
  });
}

// Intentar cada puerto
async function findServer() {
  for (const port of PORTS_TO_CHECK) {
    try {
      console.log(`   Probando puerto ${port}...`);
      const result = await checkPort(port);
      console.log(`\n✅ Servidor backend encontrado en puerto ${result.port}!`);
      console.log(`📡 Respuesta: ${result.data}\n`);
      console.log('📍 Endpoints disponibles:');
      console.log(`   - Health: http://${HOST}:${result.port}/health`);
      console.log(`   - Login: http://${HOST}:${result.port}/api/auth/login\n`);
      console.log(`💡 Nota: El frontend debe apuntar a http://localhost:${result.port}/api\n`);
      process.exit(0);
    } catch (error) {
      // Continuar con el siguiente puerto
      continue;
    }
  }
  
  // Si llegamos aquí, ningún puerto respondió
  console.error('\n❌ No se pudo conectar con el servidor backend en ningún puerto probado.');
  console.error(`   Puertos probados: ${PORTS_TO_CHECK.join(', ')}\n`);
  console.log('💡 El servidor backend no está corriendo o no es accesible.');
  console.log('   Para iniciarlo, ejecuta:\n');
  console.log('   cd backend');
  console.log('   npm run dev\n');
  process.exit(1);
}

findServer();

