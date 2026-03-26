const request = require('supertest');
const app = require('../src/app');
const { Usuarios, Roles } = require('../src/models');
const bcrypt = require('bcrypt');

describe('Auth API', () => {
  let testAdminId;
  let testRoleId;

  beforeAll(async () => {
    // Crear rol de administrador si no existe
    const adminRole = await Roles.findOrCreate({
      where: { nombre_rol: 'administrador' },
      defaults: { estado: true },
    });
    testRoleId = adminRole[0].id_rol;
  });

  afterAll(async () => {
    // Limpiar usuario de prueba si existe
    if (testAdminId) {
      await Usuarios.destroy({ where: { id_usuario: testAdminId } });
    }
  });

  describe('POST /api/auth/register-admin', () => {
    it('debería registrar un nuevo administrador exitosamente', async () => {
      const timestamp = Date.now();
      const userData = {
        nombre: `Admin Test ${timestamp}`,
        correo: `admin${timestamp}@test.com`,
        password: 'password123',
        identificacion: `TEST${timestamp}`,
      };

      const response = await request(app)
        .post('/api/auth/register-admin')
        .send(userData)
        .expect(201);

      expect(response.body).toHaveProperty('user');
      expect(response.body.user).toHaveProperty('id_usuario');
      expect(response.body.user).toHaveProperty('nombre', userData.nombre);
      expect(response.body.user).toHaveProperty('correo', userData.correo);
      expect(response.body.user).toHaveProperty('id_rol');
      expect(response.body.user).not.toHaveProperty('password');

      testAdminId = response.body.user.id_usuario;
    });

    it('debería retornar 409 si el correo ya existe', async () => {
      const timestamp = Date.now();
      const userData = {
        nombre: `Admin Test ${timestamp}`,
        correo: `duplicate${timestamp}@test.com`,
        password: 'password123',
        identificacion: `DUP${timestamp}`,
      };

      // Crear primer usuario
      await request(app)
        .post('/api/auth/register-admin')
        .send(userData)
        .expect(201);

      // Intentar crear otro con el mismo correo
      const response = await request(app)
        .post('/api/auth/register-admin')
        .send(userData)
        .expect(409);

      expect(response.body).toHaveProperty('error');
    });

    it('debería retornar 400 si faltan campos requeridos', async () => {
      const response = await request(app)
        .post('/api/auth/register-admin')
        .send({
          nombre: 'Test Admin',
          // Falta correo y password
        })
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('debería retornar 400 si la contraseña es muy corta', async () => {
      const response = await request(app)
        .post('/api/auth/register-admin')
        .send({
          nombre: 'Test Admin',
          correo: 'test@test.com',
          password: '123', // Menos de 8 caracteres
        })
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('POST /api/auth/login', () => {
    let testUser;

    beforeAll(async () => {
      // Crear usuario de prueba para login
      const timestamp = Date.now();
      const hashedPassword = await bcrypt.hash('testpassword123', 10);

      testUser = await Usuarios.create({
        nombre: `Login Test ${timestamp}`,
        correo: `login${timestamp}@test.com`,
        password: hashedPassword,
        identificacion: `LOGIN${timestamp}`,
        id_rol: testRoleId,
      });
    });

    afterAll(async () => {
      if (testUser) {
        await Usuarios.destroy({ where: { id_usuario: testUser.id_usuario } });
      }
    });

    it('debería hacer login exitosamente con credenciales válidas', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          correo: testUser.correo,
          password: 'testpassword123',
        })
        .expect(200);

      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user).toHaveProperty('id_usuario');
      expect(response.body.user).toHaveProperty('nombre');
      expect(response.body.user).toHaveProperty('correo', testUser.correo);
      expect(response.body.user).not.toHaveProperty('password');
    });

    it('debería retornar 401 con credenciales incorrectas', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          correo: testUser.correo,
          password: 'wrongpassword',
        })
        .expect(401);

      expect(response.body).toHaveProperty('error');
    });

    it('debería retornar 401 con correo inexistente', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          correo: 'nonexistent@test.com',
          password: 'password123',
        })
        .expect(401);

      expect(response.body).toHaveProperty('error');
    });

    it('debería retornar 400 si faltan campos', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          correo: testUser.correo,
          // Falta password
        })
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('GET /api/auth/me', () => {
    let testUser;
    let authToken;

    beforeAll(async () => {
      // Crear usuario y obtener token
      const timestamp = Date.now();
      const hashedPassword = await bcrypt.hash('testpassword123', 10);

      testUser = await Usuarios.create({
        nombre: `Me Test ${timestamp}`,
        correo: `me${timestamp}@test.com`,
        password: hashedPassword,
        identificacion: `ME${timestamp}`,
        id_rol: testRoleId,
      });

      // Hacer login para obtener token
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          correo: testUser.correo,
          password: 'testpassword123',
        });

      authToken = loginResponse.body.token;
    });

    afterAll(async () => {
      if (testUser) {
        await Usuarios.destroy({ where: { id_usuario: testUser.id_usuario } });
      }
    });

    it('debería retornar información del usuario autenticado', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('user');
      expect(response.body.user).toHaveProperty('id_usuario', testUser.id_usuario);
      expect(response.body.user).toHaveProperty('nombre', testUser.nombre);
      expect(response.body.user).toHaveProperty('correo', testUser.correo);
    });

    it('debería retornar 401 sin token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .expect(401);

      expect(response.body).toHaveProperty('error');
    });

    it('debería retornar 401 con token inválido', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid_token')
        .expect(401);

      expect(response.body).toHaveProperty('error');
    });
  });
});

