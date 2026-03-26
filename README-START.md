# 🚀 Guía de Inicio Rápido

## Inicio Rápido

### 1. Verificar que el Backend esté corriendo

Desde la raíz del proyecto:
```bash
node check-server.js
```

O desde la carpeta backend:
```bash
cd backend
npm run check
```

### 2. Iniciar el Backend

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

Deberías ver:
```
🚀 Iniciando servidor backend...
✓ Conexión a la base de datos establecida
✅ Servidor iniciado correctamente
📍 Endpoints disponibles:
   - Login: http://localhost:4000/api/auth/login
```

### 3. Iniciar el Frontend

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

### 4. Verificar que todo funciona

1. Abre tu navegador en la URL que muestra Vite (normalmente `http://localhost:5173`)
2. Intenta iniciar sesión con:
   - **Admin:** `admin@correo.com` / `Admin123*`
   - **Guarda:** `guarda@correo.com` / `Guarda123*`
   - **Instructor:** `instructor@correo.com` / `Instructor123*`

## Solución de Problemas

### Error: "ERR_CONNECTION_REFUSED"

**Causa:** El servidor backend no está corriendo.

**Solución:**
1. Verifica que el backend esté corriendo: `node check-server.js`
2. Si no está corriendo, inícialo: `cd backend && npm run dev`
3. Espera a ver el mensaje "✅ Servidor iniciado correctamente"

### Error: "Cannot connect to database"

**Causa:** MySQL no está corriendo o las credenciales son incorrectas.

**Solución:**
1. Verifica que MySQL esté corriendo
2. Verifica el archivo `backend/.env` con las credenciales correctas
3. Verifica que la base de datos `controlAcceso` exista

### Error: "Port already in use"

**Causa:** El puerto 4000 ya está en uso.

**Solución:**
1. Cambia el puerto en `backend/.env`: `PORT=4001`
2. O termina el proceso que usa el puerto 4000

## Scripts Útiles

- `node check-server.js` - Verificar si el backend está corriendo (desde raíz)
- `cd backend && npm run check` - Verificar si el backend está corriendo (desde backend)
- `cd backend && npm run dev` - Iniciar backend en modo desarrollo
- `cd backend && npm run seed` - Crear usuarios iniciales en la base de datos

