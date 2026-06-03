// backend/generate-hash.js
// ============================================================
// Jalankan script ini SEKALI sebelum deployment untuk 
// menghasilkan hash bcrypt yang benar.
//
// Cara pakai:
//   node generate-hash.js
// ============================================================
const bcrypt = require('bcrypt');

const users = [
  { username: 'admin',       password: 'Admin@2025',    role: 'admin',           kode_khusus: 'ZUPPA2025' },
  { username: 'staff_mkt_1', password: 'Staff1@2025',   role: 'staff_marketing', kode_khusus: null },
  { username: 'staff_mkt_2', password: 'Staff2@2025',   role: 'staff_marketing', kode_khusus: null },
];

async function main() {
  console.log('\n=== GENERATE HASH BCRYPT ===\n');
  console.log('Salin SQL INSERT di bawah ini ke file zuppazuppa_database.sql\n');
  console.log('-- Ganti bagian INSERT INTO pengguna dengan SQL di bawah ini:\n');
  console.log('INSERT INTO pengguna (username, password, role, kode_khusus) VALUES');

  const lines = [];
  for (const u of users) {
    const hash = await bcrypt.hash(u.password, 12);
    const kode = u.kode_khusus ? `'${u.kode_khusus}'` : 'NULL';
    lines.push(`  ('${u.username}', '${hash}', '${u.role}', ${kode})`);
    console.log(`\n  Username : ${u.username}`);
    console.log(`  Password : ${u.password}  ← ingat password ini!`);
    console.log(`  Hash     : ${hash}`);
    if (u.kode_khusus) console.log(`  Kode     : ${u.kode_khusus}`);
  }

  console.log('\n\n--- COPY SQL INI KE DATABASE ---\n');
  console.log('INSERT INTO pengguna (username, password, role, kode_khusus) VALUES');
  console.log(lines.join(',\n') + ';');
  console.log('\n=================================\n');
  console.log('SELESAI! Jangan lupa ganti password default setelah login pertama.\n');
}

main().catch(console.error);

