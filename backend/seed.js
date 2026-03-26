require('dotenv').config();
const { seedUsers } = require('./src/utils/seedUsers');
const { sequelize } = require('./src/models');

/**
 * Script ejecutable para seedear usuarios iniciales
 */
const runSeed = async () => {
  try {
    await seedUsers();
    
    // Cerrar conexión a la base de datos
    await sequelize.close();
    console.log('✓ Conexión cerrada');
    process.exit(0);
  } catch (error) {
    console.error('✗ Error fatal en seed:', error);
    await sequelize.close();
    process.exit(1);
  }
};

// Ejecutar seed
runSeed();

