# Sistema de Control de Acceso

[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18+-blue.svg)](https://reactjs.org/)
[![MySQL](https://img.shields.io/badge/MySQL-8+-orange.svg)](https://www.mysql.com/)
[![Express](https://img.shields.io/badge/Express-5+-lightgrey.svg)](https://expressjs.com/)

Un sistema completo de control de acceso diseñado para instituciones educativas, con gestión de usuarios, registros de acceso y paneles administrativos.

## 📋 Características

- **Autenticación JWT**: Sistema seguro de login con tokens JWT
- **Roles de Usuario**: Admin, Guarda, Instructor, Estudiante y Visitante
- **Gestión de Áreas**: Control de acceso por áreas específicas
- **Registros de Acceso**: Historial completo de entradas y salidas
- **Panel Administrativo**: Dashboard completo para gestión del sistema
- **API RESTful**: Backend robusto con validaciones
- **Interfaz Moderna**: Frontend responsive con React y componentes UI
- **Base de Datos MySQL**: Persistencia de datos con Sequelize ORM
- **Importación de Datos**: Soporte para importar usuarios desde Excel
- **Códigos QR**: Generación y escaneo de códigos QR para acceso rápido

## 🛠️ Tecnologías Utilizadas

### Backend
- **Node.js** - Runtime de JavaScript
- **Express.js** - Framework web
- **MySQL2** - Driver de base de datos
- **Sequelize** - ORM para base de datos
- **JWT** - Autenticación de tokens
- **bcrypt** - Encriptación de contraseñas
- **express-validator** - Validación de datos
- **multer** - Manejo de archivos
- **xlsx** - Procesamiento de archivos Excel

### Frontend
- **React 18** - Biblioteca de UI
- **Vite** - Build tool y dev server
- **TypeScript** - Tipado estático
- **Radix UI** - Componentes primitivos
- **Tailwind CSS** - Framework de estilos
- **Axios** - Cliente HTTP
- **React Router** - Enrutamiento
- **Lucide React** - Iconos

### Desarrollo
- **Jest** - Testing framework
- **Supertest** - Testing de API
- **Nodemon** - Auto-restart en desarrollo

## 🚀 Instalación

### Prerrequisitos

- Node.js 18+
- MySQL 8+
- npm o yarn

### 1. Clonar el repositorio

```bash
git clone https://github.com/tu-usuario/control-acceso.git
cd control-acceso
```

### 2. Instalar dependencias

```bash
# Instalar dependencias del proyecto principal
npm install

# Instalar dependencias del backend
cd backend
npm install
cd ..

# Instalar dependencias del frontend (si existe package.json)
cd frontend
npm install
cd ..
```

### 3. Configurar la base de datos

1. Crear una base de datos MySQL llamada `control_acceso`
2. Configurar las variables de entorno en `backend/.env`:

```env
DB_HOST=localhost
DB_USER=tu_usuario
DB_PASSWORD=tu_contraseña
DB_NAME=control_acceso
JWT_SECRET=tu_jwt_secret
PORT=4000
```

### 4. Ejecutar migraciones y seeders

```bash
cd backend
npm run seed
```

## 📖 Uso

### Iniciar el Backend

```bash
cd backend
npm run dev
```

El servidor estará disponible en `http://localhost:4000`

### Iniciar el Frontend

```bash
cd frontend
npm run dev
```

La aplicación estará disponible en `http://localhost:5173`

### Verificar el Servidor

```bash
node check-server.js
```

### Cuentas de Prueba

- **Admin**: `admin@correo.com` / `Admin123*`
- **Guarda**: `guarda@correo.com` / `Guarda123*`
- **Instructor**: `instructor@correo.com` / `Instructor123*`

## 📡 API Endpoints Principales

### Autenticación
- `POST /api/auth/login` - Iniciar sesión
- `POST /api/auth/register` - Registrar usuario

### Registros
- `GET /api/registro` - Obtener registros de acceso
- `POST /api/registro` - Crear nuevo registro

### Usuarios
- `GET /api/personas` - Listar personas
- `POST /api/personas` - Crear persona

### Áreas
- `GET /api/areas` - Listar áreas
- `POST /api/areas` - Crear área

## 🧪 Testing

```bash
cd backend
npm test
```

## 📁 Estructura del Proyecto

```
control-acceso/
├── backend/                 # API del servidor
│   ├── src/
│   │   ├── controllers/     # Controladores de la API
│   │   ├── models/          # Modelos de base de datos
│   │   ├── routes/          # Definición de rutas
│   │   ├── middlewares/     # Middlewares personalizados
│   │   ├── services/        # Lógica de negocio
│   │   └── utils/           # Utilidades
│   ├── tests/               # Tests del backend
│   └── package.json
├── frontend/                # Aplicación React
│   ├── src/
│   │   ├── components/      # Componentes React
│   │   ├── api/             # Cliente API
│   │   └── ...
│   └── package.json
├── package.json             # Dependencias del proyecto
└── README.md
```

## 🤝 Contribución

1. Fork el proyecto
2. Crea tu rama de feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📝 Licencia

Este proyecto está bajo la Licencia ISC. Ver el archivo `LICENSE` para más detalles.

## 👥 Autores

- **Tu Nombre** - *Desarrollo inicial* - [tu-github](https://github.com/tu-usuario)

## 🙏 Agradecimientos

- Radix UI por los componentes primitivos
- La comunidad de React por la inspiración
- Todos los contribuidores del proyecto

---

⭐ Si este proyecto te resulta útil, ¡dale una estrella en GitHub!</content>
<parameter name="filePath">c:\Users\pc\Downloads\controlAcceso\README.md