require('dotenv').config();
const app = require('./src/app');
const { sequelize } = require('./src/models');

const PORT = process.env.PORT || 4000; // Backend en puerto 4000
const HOST = process.env.HOST || '0.0.0.0'; // Escuchar en todas las interfaces

// Sincronizar base de datos y luego iniciar servidor
const startServer = async () => {
  try {
    console.log('🚀 Iniciando servidor backend...\n');
    
    // Probar conexión a la base de datos
    console.log('📡 Conectando a la base de datos...');
    await sequelize.authenticate();
    console.log('✓ Conexión a la base de datos establecida\n');

    // Mostrar configuración
    console.log('📋 Configuración del servidor:');
    console.log(`   - Puerto: ${PORT}`);
    console.log(`   - Host: ${HOST}`);
    console.log(`   - Ambiente: ${process.env.NODE_ENV || 'development'}`);
    console.log(`   - Base de datos: ${process.env.DB_NAME || 'controlAcceso'}`);
    console.log('');

    // Iniciar servidor
    app.listen(PORT, HOST, () => {
      console.log('✅ Servidor iniciado correctamente\n');
      console.log('📍 Endpoints disponibles:');
      console.log(`   - Health check: http://localhost:${PORT}/health`);
      console.log(`   - API Base: http://localhost:${PORT}/api`);
      console.log(`   - Login: http://localhost:${PORT}/api/auth/login`);
      console.log('');
      console.log('💡 Para detener el servidor, presiona Ctrl+C\n');
    });

    // Manejar errores no capturados
    process.on('unhandledRejection', (error) => {
      console.error('✗ Error no manejado:', error);
    });

    process.on('SIGTERM', async () => {
      console.log('\n⚠ Recibida señal SIGTERM, cerrando servidor...');
      await sequelize.close();
      process.exit(0);
    });

  } catch (error) {
    console.error('✗ Error al iniciar servidor:', error.message);
    console.error('\nDetalles del error:');
    console.error(error);
    
    if (error.name === 'SequelizeConnectionError') {
      console.error('\n💡 Sugerencias:');
      console.error('   1. Verifica que MySQL esté corriendo');
      console.error('   2. Verifica las credenciales en el archivo .env');
      console.error('   3. Verifica que la base de datos exista');
    }
    
    process.exit(1);
  }
};

startServer();

