# 📋 Resumen de Cambios en el Backend

## ✅ Modelos Creados/Actualizados

### 1. **Nuevo Modelo: Personas** (`backend/src/models/Personas.js`)
   - ✅ Creado modelo completo con todos los campos:
     - `id_persona` (PK, autoincrement)
     - `tipo_documento` (VARCHAR(20), NOT NULL)
     - `numero_documento` (VARCHAR(30), NOT NULL, UNIQUE)
     - `nombres` (VARCHAR(100), NOT NULL)
     - `apellidos` (VARCHAR(100), NOT NULL)
     - `foto` (VARCHAR(255), nullable)
     - `telefono` (VARCHAR(20), nullable)
     - `correo` (VARCHAR(100), nullable)
     - `rh` (VARCHAR(5), nullable)
     - `id_ficha` (INTEGER, nullable, FK a Ficha)
     - `id_usuario` (INTEGER, nullable, FK a Usuarios)

### 2. **Modelo Actualizado: Registro_Acceso** (`backend/src/models/Registro_Acceso.js`)
   - ✅ Cambiado `id_usuario` → `id_persona`
   - ✅ Ahora referencia a `Personas` en lugar de `Usuarios`
   - ✅ Mantiene todos los demás campos intactos

### 3. **Modelo Actualizado: Ficha** (`backend/src/models/Ficha.js`)
   - ✅ Agregado campo `programa_formacion` (VARCHAR(150), nullable)
   - ✅ Mantiene todos los demás campos intactos

### 4. **Asociaciones Actualizadas** (`backend/src/models/index.js`)
   - ✅ Agregadas asociaciones:
     - `Personas` ↔ `Registro_Acceso` (uno a muchos)
     - `Ficha` ↔ `Personas` (uno a muchos)
     - `Usuarios` ↔ `Personas` (uno a uno opcional)
   - ✅ Actualizadas asociaciones existentes para usar `id_persona`

---

## 🆕 Endpoints CRUD Completos

### **Personas** (`/api/personas`)

#### `GET /api/personas`
- Obtiene todas las personas con paginación
- **Query params:** `page`, `limit`, `search`, `id_ficha`, `id_usuario`, `tipo_documento`
- **Respuesta:** Lista paginada con relaciones (Ficha, Usuario)

#### `GET /api/personas/:id`
- Obtiene una persona por ID
- **Respuesta:** Persona con relaciones completas

#### `GET /api/personas/documento/:numero`
- Busca persona por número de documento
- **Respuesta:** Persona encontrada

#### `POST /api/personas`
- Crea una nueva persona
- **Body:** `tipo_documento`, `numero_documento`, `nombres`, `apellidos`, `foto?`, `telefono?`, `correo?`, `rh?`, `id_ficha?`, `id_usuario?`
- **Validaciones:** 
  - Campos requeridos validados
  - Verifica duplicados por número de documento
  - Verifica existencia de ficha y usuario si se proporcionan

#### `PUT /api/personas/:id`
- Actualiza una persona existente
- **Body:** Campos opcionales a actualizar
- **Validaciones:** Mismas que POST

#### `DELETE /api/personas/:id`
- Elimina una persona
- **Validación:** Verifica constraints de foreign key

**Autenticación:** ✅ Todas las rutas requieren autenticación JWT

---

## 🔄 Controladores Actualizados

### 1. **registro.controller.js**
   - ✅ `registrarEntrada`: Ahora usa `id_persona` o `numero_documento`
   - ✅ `registrarSalida`: Ahora usa `id_persona` o `numero_documento`
   - ✅ `historialPorUsuario`: Renombrado a `historialPorPersona` (mantiene nombre de función por compatibilidad)
   - ✅ `historialPorFecha`: Actualizado para incluir `Personas` en lugar de `Usuarios`
   - ✅ `getAllRegistros`: Actualizado para incluir `Personas` en lugar de `Usuarios`

### 2. **guarda.controller.js**
   - ✅ `ingresoManual`: Ahora busca por `numero_documento` en `Personas`
   - ✅ `ingresoQR`: Ahora acepta `id_persona` o `numero_documento`
   - ✅ Respuestas incluyen información de `Personas`

### 3. **fichaController.js**
   - ✅ `crearFicha`: Ahora acepta `programa_formacion`
   - ✅ `actualizarFicha`: Ahora actualiza `programa_formacion`

### 4. **admin.controller.js**
   - ✅ `getDashboardData`: Actualizado para contar aprendices desde `Personas`
   - ✅ `crearFicha`: Ahora acepta `programa_formacion`

### 5. **instructor.controller.js**
   - ✅ `getAprendicesDeFicha`: Ahora busca aprendices en `Personas` en lugar de `Usuarios`
   - ✅ Incluye relación con `Usuarios` si existe

---

## 🛣️ Rutas Actualizadas

### **Registro** (`/api/registro`)
- ✅ `GET /api/registro/persona/:id` (antes `/usuario/:id`)
- ✅ Mantiene compatibilidad con endpoints existentes

### **Personas** (`/api/personas`)
- ✅ Nueva ruta agregada en `app.js`
- ✅ Todas las rutas protegidas con autenticación

---

## 📝 Notas Importantes

### **Compatibilidad hacia atrás**
- ✅ Los endpoints existentes siguen funcionando
- ✅ Los cambios son principalmente internos (uso de `Personas` en lugar de `Usuarios` para registros)
- ✅ La estructura de respuestas se mantiene similar, solo cambia `usuario` → `persona` en algunos casos

### **Migración de datos**
- ⚠️ **IMPORTANTE:** Si ya tienes datos en `Registro_Acceso` con `id_usuario`, necesitarás:
  1. Migrar esos registros para usar `id_persona` en lugar de `id_usuario`
  2. Crear registros en `Personas` para los usuarios existentes que necesiten registros de acceso

### **Campos nuevos**
- ✅ `programa_formacion` en `Ficha` es opcional (nullable)
- ✅ Todos los campos nuevos en `Personas` tienen valores por defecto apropiados

---

## 🧪 Pruebas Recomendadas

1. ✅ Crear una persona nueva
2. ✅ Registrar entrada/salida usando `id_persona` o `numero_documento`
3. ✅ Obtener historial de registros por persona
4. ✅ Crear ficha con `programa_formacion`
5. ✅ Obtener aprendices de una ficha (debe usar `Personas`)

---

## 📁 Archivos Modificados

### Nuevos:
- `backend/src/models/Personas.js`
- `backend/src/controllers/personas.controller.js`
- `backend/src/routes/personas.routes.js`

### Actualizados:
- `backend/src/models/Registro_Acceso.js`
- `backend/src/models/Ficha.js`
- `backend/src/models/index.js`
- `backend/src/controllers/registro.controller.js`
- `backend/src/controllers/guarda.controller.js`
- `backend/src/controllers/fichaController.js`
- `backend/src/controllers/admin.controller.js`
- `backend/src/controllers/instructor.controller.js`
- `backend/src/routes/registro.routes.js`
- `backend/src/app.js`

---

## ✅ Estado Final

- ✅ Todos los modelos reflejan la nueva estructura de BD
- ✅ Endpoints CRUD completos para `Personas`
- ✅ Controladores actualizados para usar `Personas`
- ✅ Funcionalidad existente mantenida
- ✅ Sin errores de linting
- ✅ Rutas protegidas con autenticación

El backend está completamente actualizado y listo para usar con la nueva estructura de base de datos. 🚀

