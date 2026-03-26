# 🚀 Guía de Inicio del Backend

## Requisitos Previos

1. **Node.js** instalado (v14 o superior)
2. **MySQL** corriendo y accesible
3. **Base de datos** `controlAcceso` creada

## Configuración

1. Copia el archivo `.env.example` a `.env` (si existe) o crea uno con:

```env
# Servidor
PORT=4000
HOST=0.0.0.0
NODE_ENV=development

# Base de datos
DB_HOST=localhost
DB_PORT=3306
DB_NAME=controlAcceso
DB_USER=root
DB_PASSWORD=tu_contraseña

# JWT
JWT_SECRET=tu_secret_key_super_segura_aqui
```

## Iniciar el Servidor

### Opción 1: Modo Desarrollo (con auto-reload)
```bash
cd backend
npm run dev
```

### Opción 2: Modo Producción
```bash
cd backend
npm start
```

## Verificar que el Servidor Está Corriendo

Una vez iniciado, deberías ver:
```
🚀 Iniciando servidor backend...

📡 Conectando a la base de datos...
✓ Conexión a la base de datos establecida

📋 Configuración del servidor:
   - Puerto: 4000
   - Host: 0.0.0.0
   - Ambiente: development
   - Base de datos: controlAcceso

✅ Servidor iniciado correctamente

📍 Endpoints disponibles:
   - Health check: http://localhost:4000/health
   - API Base: http://localhost:4000/api
   - Login: http://localhost:4000/api/auth/login
```

## Probar el Endpoint de Login

Puedes probar con curl o Postman:

```bash
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"correo":"admin@correo.com","password":"Admin123*"}'
```

## Solución de Problemas

### Error: "Cannot connect to database"
- Verifica que MySQL esté corriendo
- Verifica las credenciales en `.env`
- Verifica que la base de datos exista

### Error: "Port already in use"
- Cambia el puerto en `.env` o termina el proceso que usa el puerto 4000

### Error: "ERR_CONNECTION_REFUSED" desde el frontend
- Asegúrate de que el servidor backend esté corriendo
- Verifica que el puerto sea 4000
- Verifica que CORS esté configurado correctamente

