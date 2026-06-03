// backend/config/db.js
const mysql = require('mysql2/promise');
require('dotenv').config();

// BUG-010 FIX: connectionLimit dibaca dari environment variable
// Support Railway MySQL variable names (MYSQLHOST, etc.) AND custom DB_* names
const pool = mysql.createPool({
  host:               process.env.DB_HOST     || process.env.MYSQLHOST     || 'localhost',
  port:               parseInt(process.env.DB_PORT || process.env.MYSQLPORT) || 3306,
  user:               process.env.DB_USER     || process.env.MYSQLUSER     || 'root',
  password:           process.env.DB_PASSWORD || process.env.MYSQLPASSWORD || '',
  database:           process.env.DB_NAME     || process.env.MYSQLDATABASE || 'zuppazuppa_db',
  waitForConnections: true,
  connectionLimit:    parseInt(process.env.DB_CONNECTION_LIMIT) || 10,
  queueLimit:         0,
  connectTimeout:     parseInt(process.env.DB_CONNECT_TIMEOUT)  || 10000,
  timezone:           '+07:00',
});

// BUG-009 FIX: Event listener untuk error pada pool (reconnect otomatis ditangani
// oleh mysql2 connection pool secara internal; listener ini untuk logging dan awareness)
pool.pool.on('error', (err) => {
  console.error('❌ DB pool error:', err.message);
  if (err.code === 'PROTOCOL_CONNECTION_LOST' || err.code === 'ECONNRESET') {
    console.warn('  ⚠️  Koneksi database terputus. Pool akan mencoba reconnect otomatis...');
  }
});

// Test koneksi saat startup
pool.getConnection()
  .then(conn => {
    console.log('✅ Database terhubung:', process.env.DB_NAME);
    conn.release();
  })
  .catch(err => {
    console.error('❌ Gagal terhubung ke database:', err.message);
    console.error('   Pastikan XAMPP MySQL sudah berjalan dan database sudah dibuat.');
  });

module.exports = pool;

