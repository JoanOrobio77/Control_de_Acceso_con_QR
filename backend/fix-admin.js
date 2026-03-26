/**
 * Script para verificar y corregir el usuario administrador
 */

require('dotenv').config();
const bcrypt = require('bcrypt');
const { Usuarios, Roles, sequelize } = require('./src/models');

const SALT_ROUNDS = 10;

async function fixAdmin() {
  try {
    console.log('🔍 Verificando usuario administrador...\n');

    // Buscar rol administrador
    const adminRole = await Roles.findOne({
      where: { nombre_rol: 'administrador' },
    });

    if (!adminRole) {
      console.error('❌ El rol administrador no existe');
      process.exit(1);
    }

    console.log('✓ Rol administrador encontrado\n');

    // Buscar usuario admin
    const adminUser = await Usuarios.findOne({
      where: { correo: 'admin@correo.com' },
      include: [
        {
          model: Roles,
          as: 'rol',
        },
      ],
    });

    if (!adminUser) {
      console.log('⚠ Usuario admin no existe. Creándolo...\n');
      
      // Crear usuario admin
      const hashedPassword = await bcrypt.hash('Admin123*', SALT_ROUNDS);
      
      const newAdmin = await Usuarios.create({
        tipo_usuario: 'administrador',
        correo: 'admin@correo.com',
        password: hashedPassword,
        id_rol: adminRole.id_rol,
      });

      console.log('✅ Usuario administrador creado exitosamente');
      console.log(`   - Correo: admin@correo.com`);
      console.log(`   - Contraseña: Admin123*`);
      console.log(`   - Rol: administrador\n`);
    } else {
      console.log('✓ Usuario admin encontrado\n');
      console.log('📋 Información actual:');
      console.log(`   - ID: ${adminUser.id_usuario}`);
      console.log(`   - Correo: ${adminUser.correo}`);
      console.log(`   - Tipo: ${adminUser.tipo_usuario}`);
      console.log(`   - Rol ID: ${adminUser.id_rol}`);
      console.log(`   - Tiene password: ${!!adminUser.password}\n`);

      // Verificar si la contraseña es correcta
      if (adminUser.password) {
        const passwordMatch = await bcrypt.compare('Admin123*', adminUser.password);
        if (passwordMatch) {
          console.log('✅ La contraseña es correcta\n');
        } else {
          console.log('⚠ La contraseña no coincide. Actualizándola...\n');
          const hashedPassword = await bcrypt.hash('Admin123*', SALT_ROUNDS);
          await adminUser.update({ password: hashedPassword });
          console.log('✅ Contraseña actualizada exitosamente\n');
        }
      } else {
        console.log('⚠ El usuario no tiene contraseña. Agregándola...\n');
        const hashedPassword = await bcrypt.hash('Admin123*', SALT_ROUNDS);
        await adminUser.update({ password: hashedPassword });
        console.log('✅ Contraseña agregada exitosamente\n');
      }

      // Verificar que el rol sea correcto
      if (adminUser.id_rol !== adminRole.id_rol) {
        console.log('⚠ El rol no es correcto. Actualizándolo...\n');
        await adminUser.update({ id_rol: adminRole.id_rol });
        console.log('✅ Rol actualizado exitosamente\n');
      }

      // Verificar que el tipo_usuario sea correcto
      if (adminUser.tipo_usuario !== 'administrador') {
        console.log('⚠ El tipo_usuario no es correcto. Actualizándolo...\n');
        await adminUser.update({ tipo_usuario: 'administrador' });
        console.log('✅ Tipo de usuario actualizado exitosamente\n');
      }
    }

    // Probar el login
    console.log('🧪 Probando login...\n');
    const testUser = await Usuarios.findOne({
      where: { correo: 'admin@correo.com' },
      include: [
        {
          model: Roles,
          as: 'rol',
          attributes: ['id_rol', 'nombre_rol', 'estado', 'permite_login'],
        },
      ],
    });

    if (testUser && testUser.password) {
      const passwordMatch = await bcrypt.compare('Admin123*', testUser.password);
      if (passwordMatch) {
        console.log('✅ Login funciona correctamente!');
        console.log(`   - Usuario: ${testUser.correo}`);
        console.log(`   - Rol: ${testUser.rol?.nombre_rol || 'N/A'}`);
        console.log(`   - Permite login: ${testUser.rol?.permite_login ? 'Sí' : 'No'}\n`);
      } else {
        console.log('❌ La contraseña aún no coincide después de la actualización');
      }
    } else {
      console.log('❌ No se pudo verificar el login');
    }

    console.log('✨ Proceso completado');
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

fixAdmin();

