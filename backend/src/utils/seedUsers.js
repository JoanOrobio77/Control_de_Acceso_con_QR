const bcrypt = require('bcrypt');
const { Usuarios, Roles, Areas, Estados, sequelize } = require('../models');

const SALT_ROUNDS = 10;

/**
 * Crea los estados necesarios si no existen
 * @returns {Promise<void>}
 */
const createEstados = async () => {
  const estadosToCreate = [
    // Estados para aprendiz
    { nombre_estado: 'En formación', tipo_aplica: 'aprendiz' },
    { nombre_estado: 'Condicionado', tipo_aplica: 'aprendiz' },
    { nombre_estado: 'Cancelado', tipo_aplica: 'aprendiz' },
    { nombre_estado: 'Certificado', tipo_aplica: 'aprendiz' },
    { nombre_estado: 'Retiro voluntario', tipo_aplica: 'aprendiz' },
    // Estados para instructor
    { nombre_estado: 'Planta', tipo_aplica: 'instructor' },
    { nombre_estado: 'Contratista', tipo_aplica: 'instructor' },
    // Estados para funcionario
    { nombre_estado: 'Planta', tipo_aplica: 'funcionario' },
    { nombre_estado: 'Contratista', tipo_aplica: 'funcionario' },
    // Estados para visitante (opcional)
    { nombre_estado: 'Activo', tipo_aplica: 'visitante' },
  ];

  console.log('🏷️  Verificando estados...');
  
  for (const estadoData of estadosToCreate) {
    let estado = await Estados.findOne({
      where: { 
        nombre_estado: estadoData.nombre_estado,
        tipo_aplica: estadoData.tipo_aplica,
      },
    });

    if (!estado) {
      estado = await Estados.create(estadoData);
      console.log(`✓ Estado creado: ${estadoData.nombre_estado} (${estadoData.tipo_aplica})`);
    } else {
      console.log(`✓ Estado ya existe: ${estadoData.nombre_estado} (${estadoData.tipo_aplica})`);
    }
  }
  console.log('');
};

/**
 * Crea las áreas necesarias si no existen
 * @returns {Promise<void>}
 */
const createAreas = async () => {
  const areasToCreate = [
    { descripcion: 'Entrada Principal' },
    { descripcion: 'General' },
    { descripcion: 'Laboratorios' },
    { descripcion: 'Biblioteca' },
    { descripcion: 'Cafetería' },
    { descripcion: 'Talleres' },
    { descripcion: 'Administración' },
  ];

  console.log('📍 Verificando áreas...');
  
  for (const areaData of areasToCreate) {
    let area = await Areas.findOne({
      where: { descripcion: areaData.descripcion },
    });

    if (!area) {
      area = await Areas.create(areaData);
      console.log(`✓ Área creada: ${areaData.descripcion}`);
    } else {
      console.log(`✓ Área ya existe: ${areaData.descripcion}`);
    }
  }
  console.log('');
};

/**
 * Crea los roles necesarios si no existen
 * @returns {Promise<Object>} Objeto con los roles creados o encontrados
 */
const createRoles = async () => {
  const rolesToCreate = [
    { nombre_rol: 'administrador', estado: true, permite_login: true },
    { nombre_rol: 'guarda', estado: true, permite_login: true },
    { nombre_rol: 'instructor', estado: true, permite_login: false },
    { nombre_rol: 'funcionario', estado: true, permite_login: false },
    { nombre_rol: 'visitante', estado: true, permite_login: false },
    { nombre_rol: 'aprendiz', estado: true, permite_login: false },
  ];

  const createdRoles = {};

  for (const roleData of rolesToCreate) {
    let role = await Roles.findOne({
      where: { nombre_rol: roleData.nombre_rol },
    });

    if (!role) {
      role = await Roles.create(roleData);
      console.log(`✓ Rol creado: ${roleData.nombre_rol}`);
    } else {
      // Actualizar permite_login si no está configurado
      if (role.permite_login !== roleData.permite_login) {
        await role.update({ permite_login: roleData.permite_login });
        console.log(`✓ Rol actualizado: ${roleData.nombre_rol} (permite_login: ${roleData.permite_login})`);
      } else {
        console.log(`✓ Rol ya existe: ${roleData.nombre_rol}`);
      }
    }

    createdRoles[roleData.nombre_rol] = role;
  }

  return createdRoles;
};

/**
 * Crea un usuario si no existe
 * @param {Object} userData - Datos del usuario
 * @param {Object} role - Rol del usuario
 * @returns {Promise<Object|null>} Usuario creado o null si ya existe
 */
const createUser = async (userData, role) => {
  // Verificar si el usuario ya existe por correo
  try {
    const results = await sequelize.query(
      `SELECT id_usuario, correo, tipo_usuario FROM Usuarios WHERE correo = :correo LIMIT 1`,
      {
        replacements: { correo: userData.correo },
        type: sequelize.QueryTypes.SELECT,
      }
    );

    if (results && results.length > 0) {
      console.log(`⚠ Usuario ya existe: ${userData.tipo_usuario} (${userData.correo})`);
      return null;
    }
  } catch (error) {
    // Si hay error, intentar con Sequelize normal
    try {
      const existingUser = await Usuarios.findOne({
        where: { correo: userData.correo },
        attributes: ['id_usuario', 'correo', 'tipo_usuario'],
      });

      if (existingUser) {
        console.log(`⚠ Usuario ya existe: ${userData.tipo_usuario} (${userData.correo})`);
        return null;
      }
    } catch (err) {
      console.log(`⚠ Advertencia al verificar usuario existente: ${err.message}`);
    }
  }

  // Encriptar contraseña
  const hashedPassword = await bcrypt.hash(userData.password, SALT_ROUNDS);

  // Preparar datos del usuario según la nueva estructura
  const userDataToCreate = {
    tipo_usuario: userData.tipo_usuario,
    correo: userData.correo,
    password: hashedPassword,
    id_rol: role.id_rol,
  };

  // Crear usuario
  const newUser = await Usuarios.create(userDataToCreate);

  console.log(`✓ Usuario creado: ${userData.tipo_usuario} (${userData.correo}) - Rol: ${role.nombre_rol} - Contraseña: ${userData.password}`);
  
  return newUser;
};

/**
 * Función principal para seedear usuarios iniciales
 * @returns {Promise<void>}
 */
const seedUsers = async () => {
  try {
    console.log('🌱 Iniciando seed de usuarios...\n');

    // Conectar a la base de datos
    await sequelize.authenticate();
    console.log('✓ Conexión a la base de datos establecida\n');

    // Crear estados
    await createEstados();

    // Crear áreas
    await createAreas();

    // Crear roles
    console.log('📋 Verificando roles...');
    const roles = await createRoles();
    console.log('');

    // Definir usuarios a crear
    const usersToCreate = [
      {
        tipo_usuario: 'administrador',
        correo: 'admin@correo.com',
        password: 'Admin123*',
        rolKey: 'administrador',
      },
      {
        tipo_usuario: 'guarda',
        correo: 'guarda@correo.com',
        password: 'Guarda123*',
        rolKey: 'guarda',
      },
      {
        tipo_usuario: 'instructor',
        correo: 'instructor@correo.com',
        password: 'Instructor123*',
        rolKey: 'instructor',
      },
    ];

    // Crear usuarios
    console.log('👥 Creando usuarios...');
    const createdUsers = [];

    for (const userData of usersToCreate) {
      const role = roles[userData.rolKey];
      if (!role) {
        console.error(`✗ Error: Rol '${userData.rolKey}' no encontrado`);
        continue;
      }

      const user = await createUser(userData, role);
      if (user) {
        createdUsers.push({
          tipo_usuario: userData.tipo_usuario,
          correo: userData.correo,
          password: userData.password,
          rol: role.nombre_rol,
        });
      }
    }

    console.log('');
    console.log('📊 Resumen:');
    console.log(`   - Roles verificados/creados: ${Object.keys(roles).length}`);
    console.log(`   - Usuarios creados: ${createdUsers.length}`);
    console.log(`   - Usuarios ya existentes: ${usersToCreate.length - createdUsers.length}`);
    console.log('');

    if (createdUsers.length > 0) {
      console.log('✅ Usuarios creados exitosamente:');
      createdUsers.forEach((user, index) => {
        console.log(`   ${index + 1}. ${user.tipo_usuario}`);
        console.log(`      - Correo: ${user.correo}`);
        console.log(`      - Rol: ${user.rol}`);
        console.log(`      - Contraseña: ${user.password}`);
        console.log('');
      });
    }

    console.log('✨ Seed completado exitosamente');
  } catch (error) {
    console.error('✗ Error al ejecutar seed:', error);
    throw error;
  }
};

module.exports = { seedUsers };
