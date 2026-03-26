# ⚡ Solución Inmediata - ERR_CONNECTION_REFUSED

## 🔍 Diagnóstico

El backend **NO está corriendo en el puerto 4000**. Hay un proceso en el puerto 3000, pero el frontend está intentando conectarse al 4000.

## ✅ Solución Rápida (2 Opciones)

### Opción 1: Iniciar Backend en Puerto 4000 (Recomendado)

1. **Detén cualquier proceso en el puerto 3000** (si es el backend anterior)

2. **Abre una terminal nueva** y ejecuta:

```bash
cd backend
npm run dev
```

3. **Verifica que el backend esté en el puerto 4000:**

Deberías ver:
```
✅ Servidor iniciado correctamente
📍 Endpoints disponibles:
   - Login: http://localhost:4000/api/auth/login
```

### Opción 2: Usar el Puerto 3000 (Temporal)

Si el backend ya está corriendo en 3000, puedes cambiar temporalmente el frontend:

1. Crea un archivo `.env` en la carpeta `frontend`:
```env
VITE_API_URL=http://localhost:3000/api
```

2. Reinicia el frontend:
```bash
cd frontend
npm run dev
```

## 🎯 Solución Definitiva

**Asegúrate de que el backend use el puerto 4000:**

1. **Verifica `backend/.env`:**
```env
PORT=4000
```

2. **Si no existe `.env`, créalo con:**
```env
PORT=4000
DB_HOST=localhost
DB_PORT=3306
DB_NAME=controlAcceso
DB_USER=root
DB_PASSWORD=tu_contraseña
JWT_SECRET=tu_secret_key_aqui
```

3. **Inicia el backend:**
```bash
cd backend
npm run dev
```

## ✅ Verificación

Después de iniciar el backend, ejecuta:

```bash
node check-server.js
```

Deberías ver:
```
✅ Servidor backend encontrado en puerto 4000!
```

## 📋 Resumen

- **Backend debe estar en:** Puerto 4000
- **Frontend está en:** Puerto 5173
- **Frontend se conecta a:** `http://localhost:4000/api`

**El problema es que el backend NO está corriendo. Inícialo con `cd backend && npm run dev`**

