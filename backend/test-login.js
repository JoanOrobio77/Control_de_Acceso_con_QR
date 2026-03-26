/**
 * Script para probar el login directamente
 */

require('dotenv').config();
const authService = require('./src/services/auth.service');

async function testLogin() {
  console.log('🧪 Probando login...\n');
  
  const testCases = [
    { correo: 'admin@correo.com', password: 'Admin123*', nombre: 'Administrador' },
    { correo: 'guarda@correo.com', password: 'Guarda123*', nombre: 'Guarda' },
    { correo: 'instructor@correo.com', password: 'Instructor123*', nombre: 'Instructor' },
  ];

  for (const testCase of testCases) {
    try {
      console.log(`📧 Probando: ${testCase.correo}...`);
      const user = await authService.login(testCase.correo, testCase.password);
      console.log(`✅ Login exitoso para ${testCase.nombre}!`);
      console.log(`   - ID: ${user.id_usuario}`);
      console.log(`   - Tipo: ${user.tipo_usuario}`);
      console.log(`   - Rol: ${user.rol?.nombre_rol || 'N/A'}\n`);
    } catch (error) {
      console.log(`❌ Error para ${testCase.nombre}:`);
      console.log(`   - Mensaje: ${error.message}`);
      console.log(`   - Status: ${error.statusCode || 'N/A'}\n`);
    }
  }
  
  process.exit(0);
}

testLogin().catch(error => {
  console.error('Error fatal:', error);
  process.exit(1);
});

