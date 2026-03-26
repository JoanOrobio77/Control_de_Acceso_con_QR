# ⚠️ IMPORTANTE: Configuración del Puerto del Backend

## Problema Detectado

El servidor backend está corriendo en el **puerto 3000**, pero el frontend está configurado para conectarse al **puerto 4000**.

## Solución Rápida

Tienes dos opciones:

### Opción 1: Cambiar el puerto del backend a 4000 (Recomendado)

1. Edita el archivo `backend/.env`:
   ```env
   PORT=4000
   ```

2. Reinicia el servidor backend:
   ```bash
   cd backend
   npm run dev
   ```

### Opción 2: Cambiar el frontend para usar el puerto 3000

El archivo `frontend/src/config/api.js` ya está actualizado para usar el puerto 3000 por defecto.

## Verificar el Puerto Actual

Ejecuta:
```bash
node check-server.js
```

Este script ahora busca automáticamente en los puertos 3000, 4000 y 5000.

## Configuración Recomendada

Para evitar confusiones, recomiendo usar:
- **Backend:** Puerto 4000
- **Frontend:** Puerto 5173 (Vite por defecto) o 3000

Así evitas conflictos entre el puerto del backend y el frontend.

## Archivos Modificados

1. `check-server.js` - Ahora busca en múltiples puertos
2. `frontend/src/config/api.js` - Actualizado para usar puerto 3000 por defecto

