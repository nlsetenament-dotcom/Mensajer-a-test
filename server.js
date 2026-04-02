require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const path    = require('path');
const connectDB = require('./src/config/database');

connectDB();

const app = express();

// ── Middlewares ───────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Archivos subidos (avatares)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ── Frontend estático ─────────────────────────────────────────────────────────
app.use(express.static(path.join(__dirname, 'public')));

// ── API Routes ────────────────────────────────────────────────────────────────
app.use('/api/auth',    require('./src/routes/authRoutes'));
app.use('/api/users',   require('./src/routes/userRoutes'));
app.use('/api/chats',   require('./src/routes/chatRoutes'));
app.use('/api/groups',  require('./src/routes/groupRoutes'));
app.use('/api/stories', require('./src/routes/storyRoutes'));
app.use('/api/notes',   require('./src/routes/noteRoutes'));

// ── Rutas HTML ────────────────────────────────────────────────────────────────
// / → login
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));
// /app → app principal (después de login)
app.get('/app.html', (req, res) => res.sendFile(path.join(__dirname, 'public', 'app.html')));

// ── 404 ───────────────────────────────────────────────────────────────────────
app.use((req, res) => res.status(404).json({ message: `Ruta ${req.originalUrl} no encontrada.` }));

// ── Error global ──────────────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({ message: err.message || 'Error interno.' });
});

// ── Start ─────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 http://localhost:${PORT}`));

module.exports = app; // Para Vercel
