const request = require('supertest');
const app = require('../src/app');
const { Usuarios, Roles, Areas, Registro_Acceso } = require('../src/models');
const { signToken } = require('../utils/jwt');
const bcrypt = require('bcrypt');

describe('Registro de Acceso API', () => {
  let testUserId;
  let testRoleId;
  let testAreaId;
  let authToken;
  let testQRToken;

  beforeAll(async () => {
    // Crear rol de prueba
    const role = await Roles.findOrCreate({
      where: { nombre_rol: 'aprendiz' },
      defaults: { estado: true },
    });
    testRoleId = role[0].id_rol;

    // Crear área de prueba
    const area = await Areas.findOrCreate({
      where: { descripcion: 'Área de Prueba' },
      defaults: { descripcion: 'Área de Prueba' },
    });
    testAreaId = area[0].id_area;

    // Crear usuario de prueba
    const hashedPassword = await bcrypt.hash('testpassword123', 10);
    const user = await Usuarios.create({
      nombre: 'Usuario Test Registro',
      identificacion: `TEST${Date.now()}`,
      correo: `testregistro${Date.now()}@test.com`,
      password: hashedPassword,
      id_rol: testRoleId,
    });
    testUserId = user.id_usuario;

    // Crear token QR para el usuario
    testQRToken = signToken({
      id_usuario: testUserId,
      nombre: user.nombre,
      id_rol: testRoleId,
    });

    // Crear usuario guarda para autenticación
    const guardaRole = await Roles.findOrCreate({
      where: { nombre_rol: 'guarda' },
      defaults: { estado: true },
    });

    const guardaUser = await Usuarios.create({
      nombre: 'Guarda Test',
      identificacion: `GUARDA${Date.now()}`,
      correo: `guarda${Date.now()}@test.com`,
      password: hashedPassword,
      id_rol: guardaRole[0].id_rol,
    });

    // Token de autenticación para el guarda
    authToken = signToken({
      id_usuario: guardaUser.id_usuario,
      nombre: guardaUser.nombre,
      id_rol: guardaUser.id_rol,
    });
  });

  afterAll(async () => {
    // Limpiar registros de prueba
    await Registro_Acceso.destroy({ where: { id_usuario: testUserId } });
    await Usuarios.destroy({ where: { id_usuario: testUserId } });
  });

  describe('POST /api/registro/scan', () => {
    it('debería registrar entrada exitosamente con QR válido', async () => {
      const response = await request(app)
        .post('/api/registro/scan')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          qr: testQRToken,
          tipo: 'entrada',
          areaId: testAreaId,
        })
        .expect(200);

      expect(response.body).toHaveProperty('registered', true);
      expect(response.body).toHaveProperty('user');
      expect(response.body).toHaveProperty('attendance');
      expect(response.body.attendance.tipo_acceso).toBe('entrada');
      expect(response.body.attendance.hora_entrada).toBeDefined();
    });

    it('debería retornar usuario no registrado con QR inválido', async () => {
      const response = await request(app)
        .post('/api/registro/scan')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          qr: 'QR_INVALIDO_12345',
          tipo: 'entrada',
        })
        .expect(200);

      expect(response.body).toHaveProperty('registered', false);
      expect(response.body).toHaveProperty('message', 'Usuario no registrado');
    });

    it('debería requerir autenticación', async () => {
      const response = await request(app)
        .post('/api/registro/scan')
        .send({
          qr: testQRToken,
          tipo: 'entrada',
        })
        .expect(401);
    });

    it('debería validar que el QR sea requerido', async () => {
      const response = await request(app)
        .post('/api/registro/scan')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          tipo: 'entrada',
        })
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('POST /api/registro/manual', () => {
    it('debería registrar entrada manualmente con identificación válida', async () => {
      const user = await Usuarios.findByPk(testUserId);

      const response = await request(app)
        .post('/api/registro/manual')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          identificacion: user.identificacion,
          tipo: 'entrada',
          areaId: testAreaId,
        })
        .expect(200);

      expect(response.body).toHaveProperty('registered', true);
      expect(response.body).toHaveProperty('user');
      expect(response.body).toHaveProperty('attendance');
    });

    it('debería retornar 404 con identificación inexistente', async () => {
      const response = await request(app)
        .post('/api/registro/manual')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          identificacion: 'IDENTIFICACION_INEXISTENTE_999',
          tipo: 'entrada',
        })
        .expect(404);

      expect(response.body).toHaveProperty('error', 'Usuario no encontrado');
    });

    it('debería validar que la identificación sea requerida', async () => {
      const response = await request(app)
        .post('/api/registro/manual')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          tipo: 'entrada',
        })
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('GET /api/registro', () => {
    it('debería listar registros con autenticación', async () => {
      const response = await request(app)
        .get('/api/registro')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ page: 1, size: 10 })
        .expect(200);

      expect(response.body).toHaveProperty('total');
      expect(response.body).toHaveProperty('page', 1);
      expect(response.body).toHaveProperty('size', 10);
      expect(response.body).toHaveProperty('data');
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('debería filtrar por userId', async () => {
      const response = await request(app)
        .get('/api/registro')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ userId: testUserId })
        .expect(200);

      expect(response.body).toHaveProperty('data');
      if (response.body.data.length > 0) {
        expect(response.body.data[0].usuario.id_usuario).toBe(testUserId);
      }
    });

    it('debería requerir autenticación', async () => {
      const response = await request(app)
        .get('/api/registro')
        .expect(401);
    });
  });

  describe('GET /api/registro/last/:usuarioId', () => {
    it('debería obtener último estado del usuario', async () => {
      const response = await request(app)
        .get(`/api/registro/last/${testUserId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Puede ser null o un objeto con el último registro
      if (response.body) {
        expect(response.body).toHaveProperty('id_registro');
        expect(response.body).toHaveProperty('usuario');
        expect(response.body).toHaveProperty('area');
      }
    });

    it('debería retornar null si no hay registros', async () => {
      // Crear usuario sin registros
      const nuevoUsuario = await Usuarios.create({
        nombre: 'Usuario Sin Registros',
        identificacion: `SINREG${Date.now()}`,
        correo: `sinreg${Date.now()}@test.com`,
        id_rol: testRoleId,
      });

      const response = await request(app)
        .get(`/api/registro/last/${nuevoUsuario.id_usuario}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Limpiar
      await Usuarios.destroy({ where: { id_usuario: nuevoUsuario.id_usuario } });
    });
  });
});

