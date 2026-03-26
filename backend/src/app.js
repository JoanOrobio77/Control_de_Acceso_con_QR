const express = require('express');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/auth.routes');

const app = express();

// Middlewares
const corsOptions = {
  origin: function (origin, callback) {
    // Permitir requests sin origin (como mobile apps o curl)
    if (!origin) return callback(null, true);
    
    // Permitir localhost en cualquier puerto para desarrollo
    if (origin.match(/^http:\/\/localhost:\d+$/) || origin.match(/^http:\/\/127\.0\.0\.1:\d+$/)) {
      return callback(null, true);
    }
    
    // En producción, agregar aquí los dominios permitidos
    callback(null, true);
  },
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
  credentials: true,
  allowedHeaders: ["Content-Type", "Authorization"],
};
app.use(cors(corsOptions));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/areas', require('./routes/areas.routes'));
app.use('/api/registro', require('./routes/registro.routes'));
app.use('/api/visitantes', require('./routes/visitantes.routes'));
app.use('/api/roles', require('./routes/roles.routes'));
app.use('/api/estados', require('./routes/estados.routes'));
app.use('/api/instructor', require('./routes/instructor.routes'));
app.use('/api/admin', require('./routes/admin.routes'));
app.use('/api/guarda', require('./routes/guarda.routes'));
app.use('/api/importacion', require('./routes/importacion.routes'));
app.use('/api/personas', require('./routes/personas.routes'));
app.use('/api/estudiantes', require('./routes/estudianteRoutes'));
app.use('/api/fichas', require('./routes/fichasRoutes'));




// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Ruta no encontrada',
    path: req.originalUrl,
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Error interno del servidor',
  });
});

module.exports = app;

