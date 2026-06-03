// backend/routes/api.js
// Semua route API ZuppaZuppa dalam satu file
const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const db = require('../config/db');
const { authMiddleware, adminOnly, staffOrAdmin, blacklistToken } = require('../middleware/auth');
const ROLES = require('../constants/roles');

// BUG-014 FIX: Rate limiter sederhana untuk endpoint login (tanpa library tambahan)
// Menggunakan Map in-memory: { ip -> { count, resetAt } }
const loginAttempts = new Map();
const LOGIN_MAX_ATTEMPTS = 5;
const LOGIN_WINDOW_MS = 15 * 60 * 1000; // 15 menit

function loginRateLimiter(req, res, next) {
  const ip = req.ip || req.connection.remoteAddress || 'unknown';
  const now = Date.now();
  let rec = loginAttempts.get(ip);

  if (!rec || now > rec.resetAt) {
    rec = { count: 0, resetAt: now + LOGIN_WINDOW_MS };
    loginAttempts.set(ip, rec);
  }

  if (rec.count >= LOGIN_MAX_ATTEMPTS) {
    const wait = Math.ceil((rec.resetAt - now) / 1000 / 60);
    return res.status(429).json({
      message: `Terlalu banyak percobaan login. Coba lagi dalam ${wait} menit.`,
    });
  }

  // Simpan referensi rec di req agar bisa di-reset saat login berhasil
  req._loginRec = rec;
  next();
}

// BUG-017 FIX: Platform testimoni yang diizinkan (sesuai SRS FR-CMS3)
const ALLOWED_PLATFORMS = ['Google Maps', 'GoFood', 'GrabFood', 'Lainnya'];

const router = express.Router();

// ---- Helper: simpan log aktivitas ----
async function saveLog(id_user, aktivitas, ip) {
  try {
    await db.execute(
      'INSERT INTO log_aktivitas (id_user, aktivitas, ip_address) VALUES (?,?,?)',
      [id_user, aktivitas, ip || null]
    );
  } catch (e) { /* non-blocking */ }
}

// ---- Multer: upload gambar ----
const uploadDir = path.join(__dirname, '..', process.env.UPLOAD_DIR || 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const name = Date.now() + '-' + Math.round(Math.random() * 1e9) + ext;
    cb(null, name);
  },
});
const fileFilter = (req, file, cb) => {
  const allowed = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
  const ext = path.extname(file.originalname).toLowerCase();
  cb(null, allowed.includes(ext));
};
// BUG-003 FIX: fileSize limit dibaca dari environment variable (MAX_FILE_SIZE)
const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024 },
});

// =================================================================
// AUTH – POST /api/auth/login
// BUG-014 FIX: Terapkan rate limiter pada endpoint login
// =================================================================
router.post('/auth/login', loginRateLimiter, async (req, res) => {
  try {
    const { username, password, kode_khusus } = req.body;
    if (!username || !password) return res.status(400).json({ message: 'Username dan password wajib diisi.' });

    const [rows] = await db.execute('SELECT * FROM pengguna WHERE username = ?', [username]);
    if (!rows.length) {
      // Catat percobaan gagal (BUG-014)
      if (req._loginRec) req._loginRec.count++;
      return res.status(401).json({ message: 'Username atau password salah.' });
    }

    const user = rows[0];
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      // Catat percobaan gagal (BUG-014)
      if (req._loginRec) req._loginRec.count++;
      return res.status(401).json({ message: 'Username atau password salah.' });
    }

    // Jika user mencoba login sebagai admin (kirim kode_khusus)
    // tapi role di database bukan admin → tolak
    if (kode_khusus && !((user.level === 1) || user.role === ROLES.ADMIN)) {
      if (req._loginRec) req._loginRec.count++;
      return res.status(401).json({ message: 'Akun ini bukan Admin. Login sebagai Admin tidak diizinkan.' });
    }

    // Admin harus menyertakan kode_khusus
    // BUG-011 FIX: Tandai kode khusus sudah diverifikasi di payload JWT
    let specialCodeVerified = false;
    if ((user.level === 1) || user.role === ROLES.ADMIN) {
      if (!kode_khusus) return res.status(401).json({ message: 'Kode khusus wajib diisi untuk Admin.' });
      if (kode_khusus !== user.kode_khusus) {
        if (req._loginRec) req._loginRec.count++;
        return res.status(401).json({ message: 'Kode khusus salah.' });
      }
      specialCodeVerified = true;
    }

    // Reset login attempt counter setelah berhasil (BUG-014)
    if (req._loginRec) { req._loginRec.count = 0; }

    const token = jwt.sign(
      // BUG-011 FIX: Sertakan specialCodeVerified dalam JWT payload
      { id_user: user.id_user, username: user.username, role: user.role, level: (user.level || (user.role === 'admin' ? 1 : 2)), specialCodeVerified },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '8h' }
    );

    await saveLog(user.id_user, `Login berhasil (role: ${user.role})`, req.ip);
    res.json({ token, role: user.role, username: user.username, message: 'Login berhasil.' });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Terjadi kesalahan server.' });
  }
});

// =================================================================
// AUTH – POST /api/auth/logout
// BUG-008 FIX: Blacklist token saat logout agar tidak bisa digunakan lagi
// =================================================================
router.post('/auth/logout', authMiddleware, async (req, res) => {
  try {
    blacklistToken(req.token);
    await saveLog(req.user.id_user, 'Logout', req.ip);
    res.json({ message: 'Logout berhasil.' });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Terjadi kesalahan server.' });
  }
});

// =================================================================
// PRODUK
// =================================================================

// GET /api/produk  – publik
router.get('/produk', async (req, res) => {
  try {
    const { is_aktif, is_top_menu, kategori } = req.query;
    let sql = 'SELECT p.*, u.username FROM produk p LEFT JOIN pengguna u ON p.id_user = u.id_user WHERE 1=1';
    const args = [];
    if (is_aktif !== undefined) { sql += ' AND p.is_aktif = ?'; args.push(parseInt(is_aktif)); }
    if (is_top_menu !== undefined) { sql += ' AND p.is_top_menu = ?'; args.push(parseInt(is_top_menu)); }
    if (kategori) { sql += ' AND p.kategori = ?'; args.push(kategori); }
    sql += ' ORDER BY p.is_top_menu DESC, p.id_produk ASC';
    const [rows] = await db.execute(sql, args);
    res.json({ data: rows });
  } catch (e) { console.error(e); res.status(500).json({ message: 'Server error.' }); }
});

// GET /api/produk/:id
router.get('/produk/:id', async (req, res) => {
  try {
    const [rows] = await db.execute('SELECT * FROM produk WHERE id_produk = ?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ message: 'Produk tidak ditemukan.' });
    res.json({ data: rows[0] });
  } catch (e) { res.status(500).json({ message: 'Server error.' }); }
});

// POST /api/produk – Staff Marketing & Admin
router.post('/produk', authMiddleware, staffOrAdmin, upload.single('gambar'), async (req, res) => {
  try {
    const { nama, deskripsi, harga, kategori, is_top_menu } = req.body;
    if (!nama || !harga) return res.status(400).json({ message: 'Nama dan harga wajib diisi.' });
    // BUG-006: Validasi harga harus lebih dari 0
    const parsedHarga = parseFloat(harga);
    if (isNaN(parsedHarga) || parsedHarga <= 0) {
      return res.status(400).json({ message: 'Harga tidak valid. Harga harus berupa angka lebih dari 0.' });
    }
    const gambar = req.file ? req.file.filename : null;
    const [result] = await db.execute(
      'INSERT INTO produk (nama, deskripsi, gambar, harga, kategori, is_top_menu, id_user) VALUES (?,?,?,?,?,?,?)',
      [nama, deskripsi || null, gambar, parsedHarga, kategori || 'Lainnya', is_top_menu || 0, req.user.id_user]
    );
    await saveLog(req.user.id_user, `Tambah produk: ${nama}`, req.ip);
    res.status(201).json({ message: 'Produk berhasil ditambahkan.', id: result.insertId });
  } catch (e) { console.error(e); res.status(500).json({ message: 'Server error.' }); }
});

// PUT /api/produk/:id
router.put('/produk/:id', authMiddleware, staffOrAdmin, upload.single('gambar'), async (req, res) => {
  try {
    const { nama, deskripsi, harga, kategori, is_top_menu, is_aktif } = req.body;
    const [exist] = await db.execute('SELECT * FROM produk WHERE id_produk = ?', [req.params.id]);
    if (!exist.length) return res.status(404).json({ message: 'Produk tidak ditemukan.' });
    // BUG-006: Validasi harga jika dikirim
    let parsedHarga = exist[0].harga;
    if (harga !== undefined && harga !== '') {
      parsedHarga = parseFloat(harga);
      if (isNaN(parsedHarga) || parsedHarga <= 0) {
        return res.status(400).json({ message: 'Harga tidak valid. Harga harus berupa angka lebih dari 0.' });
      }
    }
    const gambar = req.file ? req.file.filename : exist[0].gambar;
    await db.execute(
      'UPDATE produk SET nama=?, deskripsi=?, gambar=?, harga=?, kategori=?, is_top_menu=?, is_aktif=? WHERE id_produk=?',
      [nama || exist[0].nama, deskripsi ?? exist[0].deskripsi, gambar,
        parsedHarga, kategori || exist[0].kategori,
      is_top_menu !== undefined ? parseInt(is_top_menu) : exist[0].is_top_menu,
      is_aktif !== undefined ? parseInt(is_aktif) : exist[0].is_aktif,
      req.params.id]
    );
    await saveLog(req.user.id_user, `Update produk: ${nama || exist[0].nama}`, req.ip);
    res.json({ message: 'Produk berhasil diperbarui.' });
  } catch (e) { console.error(e); res.status(500).json({ message: 'Server error.' }); }
});

// DELETE /api/produk/:id
router.delete('/produk/:id', authMiddleware, staffOrAdmin, async (req, res) => {
  try {
    const [rows] = await db.execute('SELECT * FROM produk WHERE id_produk = ?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ message: 'Produk tidak ditemukan.' });
    // BUG-004: Hapus file gambar dari disk jika ada
    if (rows[0].gambar) {
      const filePath = path.join(__dirname, '..', 'uploads', rows[0].gambar);
      if (fs.existsSync(filePath)) { try { fs.unlinkSync(filePath); } catch (_) { } }
    }
    await db.execute('DELETE FROM produk WHERE id_produk = ?', [req.params.id]);
    await saveLog(req.user.id_user, `Hapus produk: ${rows[0].nama}`, req.ip);
    res.json({ message: 'Produk berhasil dihapus.' });
  } catch (e) { console.error(e); res.status(500).json({ message: 'Server error.' }); }
});

// =================================================================
// KONTEN
// =================================================================

// GET /api/konten – publik
router.get('/konten', async (req, res) => {
  try {
    const { tipe } = req.query;
    let sql = 'SELECT * FROM konten WHERE is_aktif = 1';
    const args = [];
    if (tipe) { sql += ' AND tipe = ?'; args.push(tipe); }
    sql += ' ORDER BY id_konten ASC';
    const [rows] = await db.execute(sql, args);
    res.json({ data: rows });
  } catch (e) { res.status(500).json({ message: 'Server error.' }); }
});

// GET /api/konten (all, auth) – Staff & Admin bisa lihat yg tidak aktif juga
router.get('/konten/all', authMiddleware, staffOrAdmin, async (req, res) => {
  try {
    const [rows] = await db.execute('SELECT * FROM konten ORDER BY id_konten ASC');
    res.json({ data: rows });
  } catch (e) { res.status(500).json({ message: 'Server error.' }); }
});

// POST /api/konten
router.post('/konten', authMiddleware, staffOrAdmin, upload.single('gambar'), async (req, res) => {
  try {
    const { judul, isi, tipe, is_aktif } = req.body;
    if (!judul) return res.status(400).json({ message: 'Judul wajib diisi.' });
    const gambar = req.file ? req.file.filename : null;
    // BUG-FIX: Sertakan is_aktif saat INSERT agar checkbox "Tampilkan di website" berfungsi
    const aktif = is_aktif !== undefined ? parseInt(is_aktif) : 1;
    const [result] = await db.execute(
      'INSERT INTO konten (judul, isi, gambar, tipe, is_aktif, id_user) VALUES (?,?,?,?,?,?)',
      [judul, isi || null, gambar, tipe || 'info', aktif, req.user.id_user]
    );
    await saveLog(req.user.id_user, `Tambah konten: ${judul}`, req.ip);
    res.status(201).json({ message: 'Konten berhasil ditambahkan.', id: result.insertId });
  } catch (e) { console.error(e); res.status(500).json({ message: 'Server error.' }); }
});

// PUT /api/konten/:id
router.put('/konten/:id', authMiddleware, staffOrAdmin, upload.single('gambar'), async (req, res) => {
  try {
    const [exist] = await db.execute('SELECT * FROM konten WHERE id_konten = ?', [req.params.id]);
    if (!exist.length) return res.status(404).json({ message: 'Konten tidak ditemukan.' });
    const { judul, isi, tipe, is_aktif } = req.body;
    const gambar = req.file ? req.file.filename : exist[0].gambar;
    await db.execute(
      'UPDATE konten SET judul=?, isi=?, gambar=?, tipe=?, is_aktif=? WHERE id_konten=?',
      [judul || exist[0].judul, isi ?? exist[0].isi, gambar, tipe || exist[0].tipe,
      is_aktif !== undefined ? parseInt(is_aktif) : exist[0].is_aktif, req.params.id]
    );
    await saveLog(req.user.id_user, `Update konten: ${judul || exist[0].judul}`, req.ip);
    res.json({ message: 'Konten berhasil diperbarui.' });
  } catch (e) { console.error(e); res.status(500).json({ message: 'Server error.' }); }
});

// DELETE /api/konten/:id
router.delete('/konten/:id', authMiddleware, staffOrAdmin, async (req, res) => {
  try {
    const [rows] = await db.execute('SELECT * FROM konten WHERE id_konten = ?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ message: 'Konten tidak ditemukan.' });
    // BUG-004: Hapus file gambar dari disk jika ada
    if (rows[0].gambar) {
      const filePath = path.join(__dirname, '..', 'uploads', rows[0].gambar);
      if (fs.existsSync(filePath)) { try { fs.unlinkSync(filePath); } catch (_) { } }
    }
    await db.execute('DELETE FROM konten WHERE id_konten = ?', [req.params.id]);
    await saveLog(req.user.id_user, `Hapus konten: ${rows[0].judul}`, req.ip);
    res.json({ message: 'Konten berhasil dihapus.' });
  } catch (e) { res.status(500).json({ message: 'Server error.' }); }
});

// =================================================================
// TESTIMONI
// =================================================================

// GET /api/testimoni/all – Admin lihat semua testimoni tanpa filter status
router.get('/testimoni/all', authMiddleware, adminOnly, async (req, res) => {
  try {
    const [rows] = await db.execute(
      'SELECT * FROM testimoni ORDER BY tanggal DESC'
    );
    res.json({ data: rows });
  } catch (e) { res.status(500).json({ message: 'Server error.' }); }
});

// GET /api/testimoni – publik
router.get('/testimoni', async (req, res) => {
  try {
    const [rows] = await db.execute(
      'SELECT * FROM testimoni ORDER BY tanggal DESC'
    );
    res.json({ data: rows });
  } catch (e) { res.status(500).json({ message: 'Server error.' }); }
});

// POST /api/testimoni/admin – Admin tambah testimoni manual dari GMaps/GoFood/GrabFood
// BUG-017 FIX: Validasi field platform hanya boleh dari ALLOWED_PLATFORMS
router.post('/testimoni/admin', authMiddleware, adminOnly, async (req, res) => {
  try {
    const { nama, isi, bintang, platform } = req.body;
    if (!nama || !isi) return res.status(400).json({ message: 'Nama dan ulasan wajib diisi.' });
    // BUG-017 FIX: Tolak platform yang tidak valid
    if (!platform || !ALLOWED_PLATFORMS.includes(platform)) {
      return res.status(400).json({
        message: `Platform tidak valid. Gunakan salah satu dari: ${ALLOWED_PLATFORMS.join(', ')}.`,
      });
    }
    const [result] = await db.execute(
      'INSERT INTO testimoni (nama, isi, bintang, platform, id_user) VALUES (?,?,?,?,?)',
      [nama.trim(), isi.trim(), Math.min(5, Math.max(1, parseInt(bintang) || 5)),
        platform, req.user.id_user]
    );
    await saveLog(req.user.id_user, `Tambah testimoni manual (${platform}): ${nama}`, req.ip);
    res.status(201).json({ message: 'Testimoni berhasil ditambahkan.', id: result.insertId });
  } catch (e) { console.error(e); res.status(500).json({ message: 'Server error.' }); }
});


// PUT /api/testimoni/:id – Admin edit testimoni
// BUG-017 FIX: Validasi platform jika disertakan
router.put('/testimoni/:id', authMiddleware, adminOnly, async (req, res) => {
  try {
    const [rows] = await db.execute('SELECT * FROM testimoni WHERE id_testimoni = ?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ message: 'Testimoni tidak ditemukan.' });
    const { nama, isi, bintang, platform } = req.body;
    // BUG-017 FIX: Validasi platform jika dikirimkan
    const finalPlatform = platform || rows[0].platform || 'Google Maps';
    if (platform && !ALLOWED_PLATFORMS.includes(platform)) {
      return res.status(400).json({
        message: `Platform tidak valid. Gunakan salah satu dari: ${ALLOWED_PLATFORMS.join(', ')}.`,
      });
    }
    await db.execute(
      'UPDATE testimoni SET nama=?, isi=?, bintang=?, platform=?, id_user=? WHERE id_testimoni=?',
      [nama || rows[0].nama, isi || rows[0].isi,
      Math.min(5, Math.max(1, parseInt(bintang) || rows[0].bintang)),
        finalPlatform, req.user.id_user, req.params.id]
    );
    await saveLog(req.user.id_user, `Edit testimoni ID ${req.params.id}`, req.ip);
    res.json({ message: 'Testimoni berhasil diperbarui.' });
  } catch (e) { console.error(e); res.status(500).json({ message: 'Server error.' }); }
});

// DELETE /api/testimoni/:id – Admin only
router.delete('/testimoni/:id', authMiddleware, adminOnly, async (req, res) => {
  try {
    await db.execute('DELETE FROM testimoni WHERE id_testimoni = ?', [req.params.id]);
    await saveLog(req.user.id_user, `Hapus testimoni ID ${req.params.id}`, req.ip);
    res.json({ message: 'Testimoni dihapus.' });
  } catch (e) { res.status(500).json({ message: 'Server error.' }); }
});

// =================================================================
// PESANAN
// =================================================================

// =================================================================
// PENGGUNA (User Management) – Admin only
// =================================================================

// GET /api/pengguna
router.get('/pengguna', authMiddleware, adminOnly, async (req, res) => {
  try {
    const [rows] = await db.execute(
      'SELECT id_user, username, role, created_at FROM pengguna ORDER BY id_user ASC'
    );
    res.json({ data: rows });
  } catch (e) { res.status(500).json({ message: 'Server error.' }); }
});

// POST /api/pengguna
router.post('/pengguna', authMiddleware, adminOnly, async (req, res) => {
  try {
    const { username, password, role } = req.body;
    if (!username || !password || !role)
      return res.status(400).json({ message: 'Username, password, dan role wajib diisi.' });
    const [exist] = await db.execute('SELECT id_user FROM pengguna WHERE username = ?', [username]);
    if (exist.length) return res.status(409).json({ message: 'Username sudah digunakan.' });
    const hash = await bcrypt.hash(password, 12);
    const [result] = await db.execute(
      'INSERT INTO pengguna (username, password, role) VALUES (?,?,?)',
      [username, hash, role]
    );
    await saveLog(req.user.id_user, `Tambah pengguna: ${username} (${role})`, req.ip);
    res.status(201).json({ message: 'Pengguna berhasil ditambahkan.', id: result.insertId });
  } catch (e) { console.error(e); res.status(500).json({ message: 'Server error.' }); }
});

// PUT /api/pengguna/:id
router.put('/pengguna/:id', authMiddleware, adminOnly, async (req, res) => {
  try {
    const [exist] = await db.execute('SELECT * FROM pengguna WHERE id_user = ?', [req.params.id]);
    if (!exist.length) return res.status(404).json({ message: 'Pengguna tidak ditemukan.' });
    const { username, password, role } = req.body;
    let newPass = exist[0].password;
    if (password) newPass = await bcrypt.hash(password, 12);
    await db.execute(
      'UPDATE pengguna SET username=?, password=?, role=? WHERE id_user=?',
      [username || exist[0].username, newPass, role || exist[0].role, req.params.id]
    );
    await saveLog(req.user.id_user, `Update pengguna: ${username || exist[0].username}`, req.ip);
    res.json({ message: 'Pengguna berhasil diperbarui.' });
  } catch (e) { console.error(e); res.status(500).json({ message: 'Server error.' }); }
});

// DELETE /api/pengguna/:id
router.delete('/pengguna/:id', authMiddleware, adminOnly, async (req, res) => {
  try {
    if (parseInt(req.params.id) === req.user.id_user)
      return res.status(400).json({ message: 'Tidak dapat menghapus akun sendiri.' });
    const [rows] = await db.execute('SELECT * FROM pengguna WHERE id_user = ?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ message: 'Pengguna tidak ditemukan.' });
    await db.execute('DELETE FROM pengguna WHERE id_user = ?', [req.params.id]);
    await saveLog(req.user.id_user, `Hapus pengguna: ${rows[0].username}`, req.ip);
    res.json({ message: 'Pengguna berhasil dihapus.' });
  } catch (e) { res.status(500).json({ message: 'Server error.' }); }
});

// =================================================================
// LOG AKTIVITAS – Admin only
// =================================================================
router.get('/log', authMiddleware, adminOnly, async (req, res) => {
  try {
    const { tanggal } = req.query;
    let sql = `SELECT l.*, p.username FROM log_aktivitas l 
                LEFT JOIN pengguna p ON l.id_user = p.id_user WHERE 1=1`;
    const args = [];
    if (tanggal) { sql += ' AND DATE(l.waktu) = ?'; args.push(tanggal); }
    sql += ' ORDER BY l.waktu DESC LIMIT 200';
    const [rows] = await db.execute(sql, args);
    res.json({ data: rows });
  } catch (e) { res.status(500).json({ message: 'Server error.' }); }
});

module.exports = router;

