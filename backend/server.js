// backend/server.js – Entry point ZuppaZuppa Backend
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const compression = require('compression'); // BUG-018 FIX: kompresi response gzip/brotli

const app = express();
const PORT = process.env.PORT || 3000;

// ---- BUG-018 FIX: Aktifkan kompresi gzip ----
app.use(compression());

// ---- Middleware ----
app.use(cors({
  origin: [
    'https://zuppazuppa.vercel.app',
    'http://localhost:3000',
    'http://127.0.0.1:3000'
  ],
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ---- Static: Upload gambar ----
const uploadDir = path.join(__dirname, process.env.UPLOAD_DIR || 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
// BUG-018 FIX: Tambahkan caching header untuk file upload
app.use('/uploads', express.static(uploadDir, { maxAge: '1d', etag: true }));

// ---- Static: Frontend HTML ----
const frontendDir = path.join(__dirname, '..', 'frontend');
// BUG-018 FIX: Tambahkan caching header untuk asset statis frontend
app.use(express.static(frontendDir, { maxAge: '1h', etag: true }));

// Sajikan file dari folder pages/ tanpa prefix /pages/
app.use('/', express.static(path.join(frontendDir, 'pages'), { maxAge: '1h', etag: true }));

// ---- BUG-009 FIX: Health check endpoint ----
const db = require('./config/db');
app.get('/api/health', async (req, res) => {
  try {
    await db.execute('SELECT 1');
    res.json({ status: 'ok', database: 'connected', timestamp: new Date().toISOString() });
  } catch (e) {
    res.status(503).json({ status: 'error', database: 'disconnected', message: e.message });
  }
});

// ---- API Routes ----
const apiRoutes = require('./routes/api');
app.use('/api', apiRoutes);

// ---- 404 fallback ----
app.use((req, res) => {
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ message: 'Endpoint tidak ditemukan.' });
  }
  // Redirect ke halaman utama jika bukan API
  res.sendFile(path.join(frontendDir, 'pages', 'index.html'));
});

// ---- Error handler ----
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ message: 'Terjadi kesalahan server.' });
});

// ---- Auto-migration: pastikan enum tipe konten sudah include about_us ----
async function runMigrations() {
  try {
    // Cek apakah kolom tipe sudah support about_us
    const [cols] = await db.execute("SHOW COLUMNS FROM konten LIKE 'tipe'");
    if (cols.length && !cols[0].Type.includes('about_us')) {
      await db.execute(
        "ALTER TABLE konten MODIFY tipe ENUM('hero','promo','info','why_us','about_us') NOT NULL DEFAULT 'info'"
      );
      console.log('  ✅ Migration: tambah about_us ke enum konten.tipe');
    }
  } catch (e) {
    console.warn('  ⚠️  Migration skip:', e.message);
  }
}
runMigrations();

// ---- Start server ----
app.listen(PORT, () => {
  console.log('');
  console.log('╔══════════════════════════════════════╗');
  console.log('║    ZuppaZuppa Backend – RUNNING      ║');
  console.log(`║    http://localhost:${PORT}             ║`);
  console.log('╚══════════════════════════════════════╝');
  console.log('');
  console.log('  Halaman utama  → http://localhost:' + PORT);
  console.log('  Menu           → http://localhost:' + PORT + '/menu.html');
  console.log('  Login CMS      → http://localhost:' + PORT + '/login.html');
  console.log('');
});

