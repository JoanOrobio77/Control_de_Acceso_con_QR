# ✅ Solución: Backend en Puerto 3000

## 🔍 Problema Detectado

El backend está corriendo en el **puerto 3000** (según tu archivo `.env`), pero el frontend estaba intentando conectarse al puerto 4000.

## ✅ Solución Aplicada

He actualizado `frontend/src/config/api.js` para que se conecte al puerto **3000**.

## 🎯 Estado Actual

- ✅ **Backend:** Puerto 3000 (ya está corriendo)
- ✅ **Frontend:** Puerto 5173
- ✅ **Frontend API:** `http://localhost:3000/api` (actualizado)

## 🚀 Próximos Pasos

1. **El backend ya está corriendo** en el puerto 3000 ✅

2. **Reinicia el frontend** para que tome los cambios:
   ```powershell
   cd frontend
   npm run dev
   ```

3. **Prueba el login:**
   - Abre `http://localhost:5173`
   - Usa las credenciales:
     - Guarda: `guarda@correo.com` / `Guarda123*`
     - Instructor: `instructor@correo.com` / `Instructor123*`
     - Admin: `admin@correo.com` / `Admin123*`

## 🔄 Si Quieres Cambiar el Puerto del Backend a 4000

1. Edita `backend/.env`:
   ```env
   PORT=4000
   ```

2. Reinicia el backend

3. Actualiza `frontend/src/config/api.js` a:
   ```javascript
   return 'http://localhost:4000/api';
   ```

## ✅ Verificación

El login ahora debería funcionar correctamente. El error `ERR_CONNECTION_REFUSED` debería desaparecer.

