# 🔧 Solución: Error ERR_CONNECTION_REFUSED

## ❌ Problema Identificado

El frontend está intentando conectarse a `http://localhost:3000/api`, pero el backend está configurado para correr en el puerto `4000`.

**Errores:**
- `ERR_CONNECTION_REFUSED` en `/api/auth/login`
- `ERR_CONNECTION_REFUSED` en `/api/auth/me`

## ✅ Solución Aplicada

### 1. **Configuración del Frontend Actualizada**

El archivo `frontend/src/config/api.js` ahora apunta correctamente al puerto `4000`:

```javascript
return 'http://localhost:4000/api';
```

### 2. **Verificar que el Backend Esté Corriendo**

El backend debe estar corriendo en el puerto 4000. Para iniciarlo:

#### Opción A: Usar el script batch (Windows)
```bash
start-backend.bat
```

#### Opción B: Manualmente
```bash
cd backend
npm run dev
```

#### Opción C: Con npm start
```bash
cd backend
npm start
```

### 3. **Verificar el Puerto del Backend**

El backend está configurado para usar el puerto definido en `backend/.env` o el puerto 4000 por defecto.

Si quieres cambiar el puerto del backend a 3000:

1. Edita `backend/.env` y agrega:
   ```
   PORT=3000
   ```

2. O edita `backend/server.js` línea 5:
   ```javascript
   const PORT = process.env.PORT || 3000;
   ```

3. **IMPORTANTE:** Si cambias el puerto del backend, también debes actualizar `frontend/src/config/api.js` para que coincida.

## 🧪 Verificar que Funciona

1. **Inicia el backend:**
   ```bash
   cd backend
   npm run dev
   ```

2. **Deberías ver:**
   ```
   ✅ Servidor iniciado correctamente
   📍 Endpoints disponibles:
      - Health check: http://localhost:4000/health
      - API Base: http://localhost:4000/api
      - Login: http://localhost:4000/api/auth/login
   ```

3. **Prueba el health check:**
   Abre en el navegador: `http://localhost:4000/health`
   
   Deberías ver: `{"status":"ok","message":"Server is running"}`

4. **Inicia el frontend:**
   ```bash
   npm run dev
   ```

5. **Intenta hacer login:**
   El frontend ahora debería conectarse correctamente al backend.

## 🔍 Diagnóstico Adicional

Si aún tienes problemas:

### Verificar que el puerto esté libre:
```bash
netstat -ano | findstr :4000
```

### Verificar que el backend esté escuchando:
```bash
curl http://localhost:4000/health
```

### Verificar la configuración de CORS:
El backend debe tener CORS configurado para aceptar peticiones desde `http://localhost:5173` (frontend).

## ✅ Estado Actual

- ✅ Frontend configurado para puerto 4000
- ✅ Backend configurado para puerto 4000 por defecto
- ✅ Scripts de inicio disponibles

**Siguiente paso:** Inicia el backend con `start-backend.bat` o `npm run dev` desde la carpeta `backend`.

