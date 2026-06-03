// backend/middleware/auth.js
const jwt   = require('jsonwebtoken');
const db    = require('../config/db');
const ROLES = require('../constants/roles');

// BUG-008 FIX: In-memory token blacklist
// Catatan: untuk produksi gunakan tabel DB (token_blacklist) agar persisten lintas restart.
// Implementasi DB-backed blacklist ada di db.js (tabel token_blacklist).
const tokenBlacklist = new Set();

// Bersihkan token expired dari blacklist in-memory setiap jam
setInterval(() => {
  const now = Math.floor(Date.now() / 1000);
  for (const entry of tokenBlacklist) {
    try {
      // entry: "<exp>:<token>"
      const exp = parseInt(entry.split(':')[0]);
      if (exp < now) tokenBlacklist.delete(entry);
    } catch (_) { tokenBlacklist.delete(entry); }
  }
}, 60 * 60 * 1000);

/**
 * Tambahkan token ke blacklist (dipanggil saat logout).
 */
function blacklistToken(token) {
  try {
    const decoded = jwt.decode(token);
    const exp = decoded && decoded.exp ? decoded.exp : 0;
    tokenBlacklist.add(`${exp}:${token}`);
  } catch (_) {
    tokenBlacklist.add(`0:${token}`);
  }
}

/**
 * Cek apakah token ada di blacklist.
 */
function isBlacklisted(token) {
  for (const entry of tokenBlacklist) {
    if (entry.endsWith(`:${token}`)) return true;
  }
  return false;
}

// Verifikasi token JWT
// BUG-007 FIX: Bedakan pesan error token expired vs token invalid
// BUG-008 FIX: Cek blacklist setelah logout
function authMiddleware(req, res, next) {
  const header = req.headers['authorization'];
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Token tidak ditemukan. Silakan login terlebih dahulu.' });
  }
  const token = header.slice(7);

  // Cek blacklist (BUG-008)
  if (isBlacklisted(token)) {
    return res.status(401).json({ error: 'token_blacklisted', message: 'Sesi telah diakhiri. Silakan login ulang.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user  = decoded; // { id_user, username, role, specialCodeVerified? }
    req.token = token;
    next();
  } catch (e) {
    // BUG-007 FIX: Bedakan TokenExpiredError vs error lainnya
    if (e.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'token_expired', message: 'Sesi habis, silakan login ulang.' });
    }
    return res.status(403).json({ error: 'token_invalid', message: 'Token tidak valid atau telah dimanipulasi.' });
  }
}

// Hanya Admin
// BUG-006 FIX: Gunakan konstanta ROLES.ADMIN
// BUG-011 FIX: Verifikasi claim specialCodeVerified untuk Admin
function adminOnly(req, res, next) {
  if (!req.user || req.user.role !== ROLES.ADMIN) {
    return res.status(403).json({ message: 'Akses ditolak. Hanya Admin yang diizinkan.' });
  }
  // BUG-011 FIX: Pastikan kode khusus sudah diverifikasi saat login
  if (!req.user.specialCodeVerified) {
    return res.status(403).json({ message: 'Akses ditolak. Verifikasi kode khusus diperlukan.' });
  }
  next();
}

// Admin atau Staff Marketing
// BUG-006 FIX: Gunakan konstanta ROLES
function staffOrAdmin(req, res, next) {
  if (!req.user || ![ROLES.ADMIN, ROLES.STAFF_MARKETING].includes(req.user.role)) {
    return res.status(403).json({ message: 'Akses ditolak.' });
  }
  next();
}

module.exports = { authMiddleware, adminOnly, staffOrAdmin, blacklistToken };

