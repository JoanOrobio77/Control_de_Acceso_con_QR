# ✅ Instrucciones Finales - Configuración Completada

## 🔧 Cambios Realizados

### 1. Configuración de Puertos

**Frontend (Vite):**
- ✅ Puerto cambiado de **3000** → **5173**
- Archivo: `vite.config.ts`

**Backend (Express):**
- ✅ Puerto configurado en **4000** (o el definido en `.env`)
- Archivo: `backend/server.js`

**Frontend API:**
- ✅ Configurado para conectarse a `http://localhost:4000/api`
- Archivo: `frontend/src/config/api.js`

### 2. Redirección por Roles

La redirección ya está implementada y funcionará automáticamente:

- **Guarda** (`guarda@correo.com`) → `GuardScreen` ✅
- **Instructor** (`instructor@correo.com`) → `InstructorPanel` ✅
- **Admin** (`admin@correo.com`) → `AdminDashboardNew` ✅

## 🚀 Pasos para Iniciar la Aplicación

### Paso 1: Iniciar el Backend

Abre una terminal y ejecuta:

```bash
cd backend
npm run dev
```

**Verifica que veas:**
```
✅ Servidor iniciado correctamente
📍 Endpoints disponibles:
   - Login: http://localhost:4000/api/auth/login
```

### Paso 2: Iniciar el Frontend

Abre **otra terminal** y ejecuta:

```bash
cd frontend
npm run dev
```

**Debería abrir automáticamente en:** `http://localhost:5173`

### Paso 3: Probar el Login

1. **Como Guarda:**
   - Correo: `guarda@correo.com`
   - Contraseña: `Guarda123*`
   - ✅ Debe redirigir a la pantalla de Guarda (primera imagen)

2. **Como Instructor:**
   - Correo: `instructor@correo.com`
   - Contraseña: `Instructor123*`
   - ✅ Debe redirigir al Panel de Instructor (segunda imagen)

3. **Como Admin:**
   - Correo: `admin@correo.com`
   - Contraseña: `Admin123*`
   - ✅ Debe redirigir al Panel de Administración (tercera imagen)

## 🔍 Verificación

Si todo está correcto, deberías ver:

1. ✅ **Sin errores de conexión** en la consola del navegador
2. ✅ **Sin errores de WebSocket** (ya no habrá conflicto de puertos)
3. ✅ **Redirección automática** después del login según el rol
4. ✅ **Pantallas correctas** mostrándose según el rol

## ⚠️ Si Aún Hay Problemas

### Error 404 en `/api/auth/login`

**Causa:** El backend no está corriendo o está en otro puerto.

**Solución:**
1. Verifica que el backend esté corriendo: `node check-server.js`
2. Verifica el puerto en `backend/.env`: `PORT=4000`
3. Reinicia el backend

### Error de WebSocket

**Causa:** Vite aún está intentando usar el puerto 3000.

**Solución:**
1. Detén el servidor de Vite (Ctrl+C)
2. Reinicia: `cd frontend && npm run dev`
3. Debería abrir en `http://localhost:5173`

### No redirige después del login

**Causa:** El rol no coincide exactamente.

**Solución:**
1. Abre la consola del navegador (F12)
2. Verifica qué rol está recibiendo del backend
3. El rol debe ser exactamente: `"GUARDA"`, `"INSTRUCTOR"`, o `"ADMINISTRADOR"`

## 📋 Resumen de Puertos

| Servicio | Puerto | URL |
|----------|--------|-----|
| Frontend (Vite) | 5173 | http://localhost:5173 |
| Backend (Express) | 4000 | http://localhost:4000 |
| API Endpoint | 4000 | http://localhost:4000/api |

## ✅ Estado Final

- ✅ Conflictos de puertos resueltos
- ✅ Configuración de API corregida
- ✅ Redirección por roles implementada
- ✅ Listo para probar el login

