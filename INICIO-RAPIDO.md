# 🚀 Inicio Rápido - Solución ERR_CONNECTION_REFUSED

## ⚠️ Problema Actual

El backend **NO está corriendo**. Por eso ves `ERR_CONNECTION_REFUSED`.

## ✅ Solución Rápida

### Opción 1: Usar el Script Automático (Windows)

**Doble clic en:** `start-backend.bat`

O desde PowerShell:
```powershell
.\start-backend.ps1
```

### Opción 2: Iniciar Manualmente

**Abre una terminal nueva** y ejecuta:

```bash
cd backend
npm run dev
```

**Deberías ver:**
```
🚀 Iniciando servidor backend...
📡 Conectando a la base de datos...
✓ Conexión a la base de datos establecida
✅ Servidor iniciado correctamente
📍 Endpoints disponibles:
   - Login: http://localhost:4000/api/auth/login
```

## 🔍 Verificar que el Servidor Está Corriendo

En **otra terminal**, ejecuta:

```bash
node check-server.js
```

Deberías ver:
```
✅ Servidor backend encontrado en puerto 4000!
```

## 📋 Configuración de Puertos

| Servicio | Puerto | Estado |
|----------|--------|--------|
| **Backend** | **4000** | ⚠️ **DEBE estar corriendo** |
| Frontend | 5173 | Se inicia con `npm run dev` en frontend |

## 🎯 Pasos Completos

1. **Terminal 1 - Backend:**
   ```bash
   cd backend
   npm run dev
   ```
   ⏳ Espera a ver: `✅ Servidor iniciado correctamente`

2. **Terminal 2 - Frontend:**
   ```bash
   cd frontend
   npm run dev
   ```
   ⏳ Se abrirá en: `http://localhost:5173`

3. **Probar Login:**
   - Abre `http://localhost:5173` en el navegador
   - Usa las credenciales:
     - Guarda: `guarda@correo.com` / `Guarda123*`
     - Instructor: `instructor@correo.com` / `Instructor123*`
     - Admin: `admin@correo.com` / `Admin123*`

## ❌ Si el Backend No Inicia

### Error: "Cannot connect to database"

1. Verifica que MySQL esté corriendo
2. Verifica el archivo `backend/.env`:
   ```env
   DB_HOST=localhost
   DB_PORT=3306
   DB_NAME=controlAcceso
   DB_USER=root
   DB_PASSWORD=tu_contraseña
   ```

### Error: "Port 4000 already in use"

1. Encuentra el proceso:
   ```bash
   netstat -ano | findstr :4000
   ```
2. Termina el proceso o cambia el puerto en `backend/.env`:
   ```env
   PORT=4001
   ```

## ✅ Estado Esperado

Cuando todo funcione correctamente:

- ✅ Backend corriendo en `http://localhost:4000`
- ✅ Frontend corriendo en `http://localhost:5173`
- ✅ Login funciona sin errores
- ✅ Redirección automática según rol

