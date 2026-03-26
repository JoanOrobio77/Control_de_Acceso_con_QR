# 💻 Comandos para PowerShell (Windows)

## ⚠️ Importante: PowerShell NO usa `&&`

PowerShell usa `;` en lugar de `&&` para separar comandos.

## ✅ Comandos Correctos para PowerShell

### Iniciar Backend

**Opción 1: En una línea**
```powershell
Set-Location backend; npm run dev
```

**Opción 2: En dos líneas**
```powershell
cd backend
npm run dev
```

**Opción 3: Usar el script**
```powershell
.\start-backend.ps1
```

### Iniciar Frontend

**Opción 1: En una línea**
```powershell
Set-Location frontend; npm run dev
```

**Opción 2: En dos líneas**
```powershell
cd frontend
npm run dev
```

### Verificar Servidor

```powershell
node check-server.js
```

## 📋 Secuencia Completa

### Terminal 1 - Backend:
```powershell
cd backend
npm run dev
```

Espera a ver:
```
✅ Servidor iniciado correctamente
📍 Endpoints disponibles:
   - Login: http://localhost:4000/api/auth/login
```

### Terminal 2 - Frontend:
```powershell
cd frontend
npm run dev
```

Se abrirá en: `http://localhost:5173`

## 🔄 Alternativa: Usar CMD en lugar de PowerShell

Si prefieres usar `&&`, abre **CMD** (no PowerShell):

```cmd
cd backend && npm run dev
```

## 💡 Scripts Disponibles

- `start-backend.bat` - Doble clic para iniciar backend (Windows)
- `start-backend.ps1` - Script PowerShell para iniciar backend
- `check-server.js` - Verificar si el servidor está corriendo

