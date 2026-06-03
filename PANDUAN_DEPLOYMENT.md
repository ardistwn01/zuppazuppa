# 📋 PANDUAN DEPLOYMENT ZUPPAZUPPA
## VSCode + XAMPP (Windows)

---

## 🗂️ STRUKTUR FOLDER PROYEK

```
zuppazuppa/
├── frontend/
│   ├── pages/
│   │   ├── index.html          ← Landing Page (Home)
│   │   ├── menu.html           ← Halaman Menu
│   │   ├── about.html          ← Halaman About Us
│   │   ├── login.html          ← Halaman Login CMS
│   │   ├── dashboard-admin.html
│   │   └── dashboard-staff.html
│   ├── css/
│   │   ├── style.css
│   │   └── dashboard.css
│   ├── js/
│   │   ├── main.js
│   │   └── dashboard.js
│   └── assets/                 ← Simpan gambar statis di sini
└── backend/
    ├── config/
    │   └── db.js
    ├── middleware/
    │   └── auth.js
    ├── routes/
    │   └── api.js
    ├── uploads/                ← Gambar upload (auto dibuat)
    ├── server.js
    ├── generate-hash.js
    ├── package.json
    ├── .env
    └── .gitignore
```

---

## ⚙️ LANGKAH 1 – INSTALL NODE.JS

1. Buka browser, pergi ke https://nodejs.org
2. Download versi **LTS** (misal: 20.x.x LTS)
3. Install dengan klik Next → Next → Finish
4. Verifikasi di terminal VSCode:
   ```
   node --version    → harus muncul v20.x.x
   npm --version     → harus muncul 10.x.x
   ```

---

## 🐬 LANGKAH 2 – SETUP XAMPP & DATABASE

### 2.1 Jalankan XAMPP
1. Buka **XAMPP Control Panel**
2. Klik **Start** pada **Apache** → tunggu hijau
3. Klik **Start** pada **MySQL** → tunggu hijau

### 2.2 Buat Database
1. Buka browser → pergi ke http://localhost/phpmyadmin
2. Klik **"New"** di panel kiri
3. Isi nama database: `zuppazuppa_db`
4. Pilih Collation: **utf8mb4_unicode_ci**
5. Klik **Create**

### 2.3 Import Struktur Database
1. Klik database `zuppazuppa_db` di panel kiri
2. Klik tab **Import** di bagian atas
3. Klik **Choose File** → pilih file `zuppazuppa_database.sql`
4. ⚠️ **TAPI JANGAN IMPORT DULU** – baca Langkah 3 dahulu
   (karena password di SQL masih placeholder)

---

## 🔐 LANGKAH 3 – GENERATE HASH PASSWORD (PENTING!)

> Inilah penjelasan tentang "Password di seeder masih placeholder":
> 
> File SQL yang kita buat berisi:
> ```sql
> '$2b$12$PLACEHOLDER_HASH_ADMIN'
> ```
> Ini bukan hash bcrypt yang valid. Jika langsung diimport,
> login akan selalu GAGAL karena hash-nya tidak terbaca oleh bcrypt.
> 
> Bcrypt adalah algoritma enkripsi satu arah – password tidak bisa 
> dikembalikan ke bentuk aslinya. Kita harus generate hash yang benar
> menggunakan Node.js sebelum dimasukkan ke database.

### Cara generate hash yang benar:

**Buka terminal di VSCode** (Ctrl + ` atau Terminal → New Terminal)

```bash
# Masuk ke folder backend
cd zuppazuppa/backend

# Install dependencies dulu
npm install

# Jalankan script generate hash
node generate-hash.js
```

Output yang akan muncul di terminal:
```
=== GENERATE HASH BCRYPT ===

  Username : admin
  Password : Admin@2025  ← ingat password ini!
  Hash     : $2b$12$AbCdEf1234...  (hash panjang)
  Kode     : ZUPPA2025

  Username : staff_mkt_1
  Password : Staff1@2025
  Hash     : $2b$12$XyZaBc5678...

--- COPY SQL INI KE DATABASE ---

INSERT INTO pengguna (username, password, role, kode_khusus) VALUES
  ('admin', '$2b$12$AbCdEf...', 'admin', 'ZUPPA2025'),
  ('staff_mkt_1', '$2b$12$XyZaBc...', 'staff_marketing', NULL),
  ('staff_mkt_2', '$2b$12$PqRsTu...', 'staff_marketing', NULL);
```

### 3.1 Update file SQL

1. Buka file `zuppazuppa_database.sql` di VSCode
2. Cari bagian:
   ```sql
   INSERT INTO pengguna (username, password, role, kode_khusus) VALUES
     ('admin',        '$2b$12$PLACEHOLDER_HASH_ADMIN', ...),
   ```
3. **Ganti seluruh blok INSERT pengguna** dengan SQL yang dihasilkan script tadi
4. Simpan file (Ctrl + S)

---

## 📥 LANGKAH 4 – IMPORT DATABASE

Sekarang baru import ke phpMyAdmin:

1. Buka http://localhost/phpmyadmin
2. Klik database `zuppazuppa_db`
3. Klik tab **Import**
4. Pilih file `zuppazuppa_database.sql` yang sudah diupdate
5. Klik **Go / Import**
6. Harus muncul pesan hijau: **"Import has been successfully finished"**

### Verifikasi:
Klik tab **SQL** dan jalankan:
```sql
SELECT id_user, username, role FROM pengguna;
```
Harus muncul 3 baris: admin, staff_mkt_1, staff_mkt_2.

---

## 📝 LANGKAH 5 – KONFIGURASI FILE .env

Buka file `zuppazuppa/backend/.env` di VSCode:

```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=           ← kosongkan jika XAMPP default (tanpa password)
DB_NAME=zuppazuppa_db

JWT_SECRET=zuppazuppa_ganti_dengan_string_acak_minimal_32_karakter_ini

JWT_EXPIRES_IN=8h
PORT=3000
UPLOAD_DIR=uploads
```

> **Catatan DB_PASSWORD:**  
> XAMPP default: user=root, password=kosong  
> Jika kamu sudah set password MySQL: isi sesuai password kamu

> **Cara buat JWT_SECRET yang aman:**  
> Buka terminal VSCode, ketik:
> ```
> node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
> ```
> Copy hasil outputnya ke JWT_SECRET

---

## 📦 LANGKAH 6 – INSTALL DEPENDENCIES NODE.JS

Di terminal VSCode:

```bash
# Pastikan berada di folder backend
cd zuppazuppa/backend

# Install semua package
npm install
```

Tunggu hingga selesai. Akan muncul folder `node_modules/`.
Packages yang diinstall:
- **express** – web framework
- **mysql2** – koneksi database MySQL
- **bcrypt** – enkripsi password
- **jsonwebtoken** – autentikasi JWT
- **multer** – upload file/gambar
- **dotenv** – baca file .env
- **cors** – izin akses dari browser
- **nodemon** – auto-restart saat development

---

## 🚀 LANGKAH 7 – JALANKAN SERVER

```bash
# Mode development (auto-restart jika ada perubahan kode)
npm run dev

# ATAU mode biasa
npm start
```

Jika berhasil, terminal akan menampilkan:
```
╔══════════════════════════════════════╗
║    ZuppaZuppa Backend – RUNNING      ║
║    http://localhost:3000             ║
╚══════════════════════════════════════╝

  Halaman utama  → http://localhost:3000
  Menu           → http://localhost:3000/menu.html
  Login CMS      → http://localhost:3000/login.html
```

Dan:
```
✅ Database terhubung: zuppazuppa_db
```

---

## 🌐 LANGKAH 8 – TEST DI BROWSER

Buka browser dan akses:

| Halaman | URL |
|---------|-----|
| Home | http://localhost:3000 |
| Menu | http://localhost:3000/menu.html |
| About | http://localhost:3000/about.html |
| Login | http://localhost:3000/login.html |
| Dashboard Admin | http://localhost:3000/dashboard-admin.html |
| Dashboard Staff | http://localhost:3000/dashboard-staff.html |

### Test Login:
1. Buka http://localhost:3000/login.html
2. **Login sebagai Staff Marketing:**
   - Username: `staff_mkt_1`
   - Password: `Staff1@2025`
   - Centang: ❌ (jangan centang Admin)
3. **Login sebagai Admin:**
   - Username: `admin`
   - Password: `Admin@2025`
   - Centang: ✅ Login sebagai Admin
   - Kode Khusus: `ZUPPA2025`

---

## 🔧 TIPS PENGEMBANGAN DI VSCODE

### Extension VSCode yang direkomendasikan:
- **ESLint** – cek error JavaScript
- **Prettier** – format kode otomatis
- **REST Client** – test API tanpa Postman
- **Live Server** – (opsional, tidak perlu jika pakai Node.js)
- **MySQL** – lihat database langsung dari VSCode

### Cara install extension:
`Ctrl + Shift + X` → cari nama extension → Install

---

## ❓ TROUBLESHOOTING

### Error: "Cannot find module 'express'"
```bash
cd zuppazuppa/backend
npm install
```

### Error: "Database terhubung gagal" / ER_ACCESS_DENIED
- Pastikan XAMPP MySQL sudah **Start** (hijau)
- Cek file `.env`: `DB_PASSWORD=` (kosong untuk default XAMPP)
- Cek nama database: `DB_NAME=zuppazuppa_db`

### Error: "EADDRINUSE port 3000"
Port 3000 sudah dipakai aplikasi lain. Ganti port di `.env`:
```env
PORT=3001
```
Lalu akses http://localhost:3001

### Login selalu gagal meski password benar
- Pastikan sudah menjalankan `node generate-hash.js`
- Pastikan SQL INSERT pengguna sudah diupdate dengan hash baru
- Re-import database di phpMyAdmin

### Gambar tidak muncul setelah upload
- Cek folder `backend/uploads/` sudah ada
- Cek permission folder (klik kanan → Properties)
- Pastikan server masih berjalan saat mengakses gambar

### CORS error di browser console
- Pastikan mengakses via `http://localhost:3000` bukan membuka file HTML langsung
- Jangan buka file HTML dengan double-click (file:// tidak didukung)

---

## 📌 CATATAN KEAMANAN SEBELUM PRODUCTION

Jika suatu saat website ini di-deploy ke hosting sungguhan:

1. **Ganti semua password default** (admin, staff)
2. **Ganti JWT_SECRET** dengan string acak yang lebih panjang
3. **Ganti Kode Khusus Admin** (`ZUPPA2025`) dengan yang lebih aman
4. **Aktifkan HTTPS** di server hosting
5. **Batasi CORS** hanya ke domain resmi di `server.js`
6. **Jangan upload file `.env`** ke Git/GitHub

---

*Dokumentasi ini dibuat untuk proyek Tugas Akhir ZuppaZuppa – UMKM Company Profile Website*
