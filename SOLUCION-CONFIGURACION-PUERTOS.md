# 🔧 Solución: Configuración de Puertos y Redirección

## Problemas Identificados

1. **Conflicto de Puertos**: Vite y el backend estaban ambos en el puerto 3000
2. **Error 404**: El frontend intentaba conectarse al puerto incorrecto
3. **WebSocket Errors**: Vite intentaba conectarse al puerto 3000 que estaba ocupado

## Soluciones Aplicadas

### 1. Configuración de Puertos

**Frontend (Vite):**
- Cambiado de puerto 3000 → **5173** (puerto por defecto de Vite)
- Archivo: `vite.config.ts`

**Backend (Express):**
- Mantiene puerto **4000** (o el definido en `.env`)
- Archivo: `backend/server.js`

**Frontend API Config:**
- Actualizado para apuntar a `http://localhost:4000/api`
- Archivo: `frontend/src/config/api.js`

### 2. Redirección por Roles

El sistema ya tiene la lógica de redirección implementada:

- **Guarda** → `GuardScreen` (primera imagen)
- **Instructor** → `InstructorPanel` (segunda imagen)  
- **Admin** → `AdminDashboardNew` (tercera imagen)

## Pasos para Probar

### 1. Reiniciar el Backend (si está corriendo)

```bash
cd backend
npm run dev
```

Debería mostrar:
```
✅ Servidor iniciado correctamente
📍 Endpoints disponibles:
   - Login: http://localhost:4000/api/auth/login
```

### 2. Reiniciar el Frontend

```bash
cd frontend
npm run dev
```

Debería abrir en: `http://localhost:5173`

### 3. Probar Login

1. **Guarda:**
   - Correo: `guarda@correo.com`
   - Contraseña: `Guarda123*`
   - Debe redirigir a `GuardScreen`

2. **Instructor:**
   - Correo: `instructor@correo.com`
   - Contraseña: `Instructor123*`
   - Debe redirigir a `InstructorPanel`

3. **Admin:**
   - Correo: `admin@correo.com`
   - Contraseña: `Admin123*`
   - Debe redirigir a `AdminDashboardNew`

## Archivos Modificados

1. `vite.config.ts` - Puerto cambiado a 5173
2. `frontend/src/config/api.js` - URL del backend actualizada a puerto 4000
3. `backend/server.js` - Comentario agregado sobre puerto 4000

## Verificación

Para verificar que todo funciona:

```bash
# Verificar backend
curl http://localhost:4000/health

# Verificar frontend
# Abre http://localhost:5173 en el navegador
```

