-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Jun 03, 2026 at 11:58 AM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `zuppazuppa_db`
--

-- --------------------------------------------------------

--
-- Table structure for table `konten`
--

CREATE TABLE `konten` (
  `id_konten` int(11) NOT NULL,
  `judul` varchar(300) NOT NULL,
  `isi` text DEFAULT NULL,
  `gambar` varchar(500) DEFAULT NULL,
  `tipe` enum('hero','promo','info','why_us','about_us') NOT NULL DEFAULT 'info',
  `is_aktif` tinyint(1) NOT NULL DEFAULT 1,
  `id_user` int(11) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `konten`
--

INSERT INTO `konten` (`id_konten`, `judul`, `isi`, `gambar`, `tipe`, `is_aktif`, `id_user`, `created_at`, `updated_at`) VALUES
(1, 'Selamat Datang di ZuppaZuppa', 'Nikmati kelezatan Zuppa Soup terbaik dengan bahan-bahan pilihan berkualitas tinggi. Kami hadir untuk memanjakan lidah Anda.', NULL, 'hero', 1, 1, '2026-05-08 08:07:38', '2026-05-08 08:07:38'),
(2, 'Kualitas Terjamin', 'Bahan-bahan segar dipilih setiap hari untuk menjaga kualitas terbaik.', NULL, 'why_us', 1, 1, '2026-05-08 08:07:38', '2026-05-08 08:07:38'),
(3, 'Harga Terjangkau', 'Menikmati makanan lezat tidak harus mahal. Kami hadir dengan harga yang bersahabat.', NULL, 'why_us', 1, 1, '2026-05-08 08:07:38', '2026-05-08 08:07:38'),
(4, 'Rasa Otentik', 'Resep turun-temurun yang telah teruji dan dicintai banyak pelanggan.', NULL, 'why_us', 1, 1, '2026-05-08 08:07:38', '2026-05-08 08:07:38');

-- --------------------------------------------------------

--
-- Table structure for table `log_aktivitas`
--

CREATE TABLE `log_aktivitas` (
  `id_log` int(11) NOT NULL,
  `id_user` int(11) NOT NULL,
  `aktivitas` varchar(500) NOT NULL,
  `waktu` timestamp NOT NULL DEFAULT current_timestamp(),
  `ip_address` varchar(45) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `log_aktivitas`
--

INSERT INTO `log_aktivitas` (`id_log`, `id_user`, `aktivitas`, `waktu`, `ip_address`) VALUES
(1, 1, 'Login berhasil (role: admin)', '2026-05-08 08:10:09', '::1'),
(2, 0, 'Login berhasil (role: admin)', '2026-06-02 00:49:06', '::1'),
(3, 0, 'Tambah testimoni manual (Google Maps): tolak', '2026-06-02 00:57:11', '::1'),
(4, 0, 'Tambah testimoni manual (Google Maps): aaa', '2026-06-02 00:57:20', '::1'),
(5, 0, 'Tambah testimoni manual (Google Maps): aab', '2026-06-02 01:04:06', '::1'),
(6, 0, 'Tambah testimoni manual (Google Maps): oke', '2026-06-02 01:16:01', '::1'),
(7, 0, 'Login berhasil (role: admin)', '2026-06-02 03:06:34', '::1'),
(8, 0, 'Tambah produk: Wagyu', '2026-06-02 03:07:08', '::1'),
(9, 1, 'Login berhasil (role: admin)', '2026-06-02 03:24:04', '::1'),
(10, 1, 'Tambah produk: asss', '2026-06-02 03:24:27', '::1'),
(11, 1, 'Tambah testimoni manual (Google Maps): oke', '2026-06-02 03:24:39', '::1'),
(12, 1, 'Update produk: asss', '2026-06-02 03:24:51', '::1'),
(13, 1, 'Tambah pengguna: staff_mkt_3 (staff_marketing)', '2026-06-02 03:25:03', '::1'),
(14, 2, 'Login berhasil (role: staff_marketing)', '2026-06-02 03:25:55', '::1'),
(15, 2, 'Update produk: asss', '2026-06-02 03:28:06', '::1'),
(16, 1, 'Login berhasil (role: admin)', '2026-06-03 09:55:19', '::1');

-- --------------------------------------------------------

--
-- Table structure for table `pengguna`
--

CREATE TABLE `pengguna` (
  `id_user` int(11) NOT NULL,
  `username` varchar(100) NOT NULL,
  `password` varchar(255) NOT NULL,
  `role` enum('admin','staff_marketing') NOT NULL,
  `kode_khusus` varchar(100) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `pengguna`
--

INSERT INTO `pengguna` (`id_user`, `username`, `password`, `role`, `kode_khusus`, `created_at`, `updated_at`) VALUES
(1, 'admin', '$2b$12$54KYJhsHhsKVOE9cU8B8T.9.s9bYT5lw7suY3pg3xfytTxG2xI4dW', 'admin', 'ZUPPA2025', '2026-06-02 00:45:10', '2026-06-02 00:45:10'),
(2, 'staff_mkt_1', '$2b$12$uuNbqfFRa1EnWAqsMgQB9OwRPtxY2RBGMQiiA3IIo.X9wzbeQZF3.', 'staff_marketing', NULL, '2026-06-02 00:45:10', '2026-06-02 00:45:10'),
(3, 'staff_mkt_2', '$2b$12$uOI3q9iQG1HM1uUcbvP6NuyphmI.Zk.Yr2j1aKQtjtPcT4mraApa2', 'staff_marketing', NULL, '2026-06-02 00:45:10', '2026-06-02 00:45:10'),
(4, 'staff_mkt_3', '$2b$12$fKug/EBcpqCnJbT6vaJnzeUtRCyh8dp.bVHUEHz8NxDKcz9U9J1ni', 'staff_marketing', NULL, '2026-06-02 03:25:03', '2026-06-02 03:25:03');

-- --------------------------------------------------------

--
-- Table structure for table `pengguna_lama`
--

CREATE TABLE `pengguna_lama` (
  `id_user` int(11) NOT NULL,
  `username` varchar(100) NOT NULL,
  `password` varchar(255) NOT NULL,
  `role` enum('admin','staff_marketing') NOT NULL,
  `kode_khusus` varchar(100) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `pengguna_lama`
--

INSERT INTO `pengguna_lama` (`id_user`, `username`, `password`, `role`, `kode_khusus`, `created_at`, `updated_at`) VALUES
(0, 'admin', '$2b$12$54KYJhsHhsKVOE9cU8B8T.9.s9bYT5lw7suY3pg3xfytTxG2xI4dW', 'admin', 'ZUPPA2025', '2026-06-02 00:45:10', '2026-06-02 00:45:10'),
(0, 'staff_mkt_1', '$2b$12$uuNbqfFRa1EnWAqsMgQB9OwRPtxY2RBGMQiiA3IIo.X9wzbeQZF3.', 'staff_marketing', NULL, '2026-06-02 00:45:10', '2026-06-02 00:45:10'),
(0, 'staff_mkt_2', '$2b$12$uOI3q9iQG1HM1uUcbvP6NuyphmI.Zk.Yr2j1aKQtjtPcT4mraApa2', 'staff_marketing', NULL, '2026-06-02 00:45:10', '2026-06-02 00:45:10');

-- --------------------------------------------------------

--
-- Table structure for table `pesanan`
--

CREATE TABLE `pesanan` (
  `id_pesanan` int(11) NOT NULL,
  `nama_pelanggan` varchar(200) NOT NULL,
  `no_wa` varchar(20) NOT NULL,
  `id_produk` int(11) NOT NULL,
  `jumlah` int(11) NOT NULL DEFAULT 1,
  `total_harga` decimal(12,2) NOT NULL DEFAULT 0.00,
  `status` enum('masuk','diproses','selesai','dibatalkan') NOT NULL DEFAULT 'masuk',
  `catatan` text DEFAULT NULL,
  `tanggal` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `produk`
--

CREATE TABLE `produk` (
  `id_produk` int(11) NOT NULL,
  `nama` varchar(200) NOT NULL,
  `deskripsi` text DEFAULT NULL,
  `gambar` varchar(500) DEFAULT NULL,
  `harga` decimal(12,2) NOT NULL DEFAULT 0.00,
  `kategori` varchar(100) DEFAULT NULL,
  `is_top_menu` tinyint(1) NOT NULL DEFAULT 0,
  `is_aktif` tinyint(1) NOT NULL DEFAULT 1,
  `id_user` int(11) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `produk`
--

INSERT INTO `produk` (`id_produk`, `nama`, `deskripsi`, `gambar`, `harga`, `kategori`, `is_top_menu`, `is_aktif`, `id_user`, `created_at`, `updated_at`) VALUES
(1, 'Zuppa Soup Original', 'Soup Cream dengan Topping Irisan Ayam, Jagung dan Daging Asap Yang Creamy', NULL, 22000.00, 'Soup', 1, 1, 1, '2026-05-08 08:07:38', '2026-05-08 08:07:38'),
(2, 'Zuppa Soup Spesial', 'Soup Cream dengan Topping Irisan Ayam, Jagung dan Daging Asap Yang Creamy', NULL, 25000.00, 'Soup', 1, 1, 1, '2026-05-08 08:07:38', '2026-05-08 08:07:38'),
(3, 'Pasta Carbonara', 'Pasta creamy dengan saus carbonara dan daging asap pilihan', NULL, 28000.00, 'Pasta', 0, 1, 1, '2026-05-08 08:07:38', '2026-05-08 08:07:38'),
(4, 'Pasta Bolognese', 'Pasta dengan saus daging cincang khas Italia yang gurih', NULL, 28000.00, 'Pasta', 0, 1, 1, '2026-05-08 08:07:38', '2026-05-08 08:07:38'),
(5, 'Macaroni Schotel', 'Macaroni panggang dengan isian daging dan keju', NULL, 25000.00, 'Snack', 0, 1, 1, '2026-05-08 08:07:38', '2026-05-08 08:07:38'),
(6, 'Spaghetti Brulee', 'Spaghetti dengan teknik brulee yang unik dan lezat', NULL, 30000.00, 'Pasta', 0, 1, 1, '2026-05-08 08:07:38', '2026-05-08 08:07:38'),
(7, 'Wagyu', 'nana', NULL, 10000.00, 'Soup', 0, 1, 1, '2026-06-02 03:07:08', '2026-06-02 03:23:22'),
(8, 'asss', 'aaa', NULL, 111000.00, 'Soup', 0, 1, 1, '2026-06-02 03:24:27', '2026-06-02 03:28:06');

-- --------------------------------------------------------

--
-- Table structure for table `testimoni`
--

CREATE TABLE `testimoni` (
  `id_testimoni` int(11) NOT NULL,
  `nama` varchar(200) NOT NULL,
  `isi` text NOT NULL,
  `bintang` tinyint(4) NOT NULL DEFAULT 5 CHECK (`bintang` between 1 and 5),
  `platform` varchar(100) NOT NULL DEFAULT 'Google Maps',
  `tanggal` timestamp NOT NULL DEFAULT current_timestamp(),
  `id_user` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `testimoni`
--

INSERT INTO `testimoni` (`id_testimoni`, `nama`, `isi`, `bintang`, `platform`, `tanggal`, `id_user`) VALUES
(1, 'Test', 'Testimoni percobaan', 5, 'Google Maps', '2026-06-02 01:02:32', NULL),
(2, 'aab', 'oke', 5, 'approved', '2026-06-02 01:04:06', 0),
(3, 'oke', 'sup', 5, 'Google Maps', '2026-06-02 01:16:01', 0),
(4, 'oke', 'okw', 5, 'Google Maps', '2026-06-02 03:24:39', 1);

--
-- Indexes for dumped tables
--

--
-- Indexes for table `konten`
--
ALTER TABLE `konten`
  ADD PRIMARY KEY (`id_konten`),
  ADD KEY `fk_konten_user` (`id_user`),
  ADD KEY `idx_konten_tipe` (`tipe`);

--
-- Indexes for table `log_aktivitas`
--
ALTER TABLE `log_aktivitas`
  ADD PRIMARY KEY (`id_log`),
  ADD KEY `idx_log_waktu` (`waktu`),
  ADD KEY `idx_log_user` (`id_user`);

--
-- Indexes for table `pengguna`
--
ALTER TABLE `pengguna`
  ADD PRIMARY KEY (`id_user`),
  ADD UNIQUE KEY `username` (`username`);

--
-- Indexes for table `pesanan`
--
ALTER TABLE `pesanan`
  ADD PRIMARY KEY (`id_pesanan`),
  ADD KEY `fk_pesanan_produk` (`id_produk`),
  ADD KEY `idx_pesanan_status` (`status`);

--
-- Indexes for table `produk`
--
ALTER TABLE `produk`
  ADD PRIMARY KEY (`id_produk`),
  ADD KEY `fk_produk_user` (`id_user`),
  ADD KEY `idx_produk_kategori` (`kategori`),
  ADD KEY `idx_produk_is_aktif` (`is_aktif`),
  ADD KEY `idx_produk_is_top` (`is_top_menu`);

--
-- Indexes for table `testimoni`
--
ALTER TABLE `testimoni`
  ADD PRIMARY KEY (`id_testimoni`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `konten`
--
ALTER TABLE `konten`
  MODIFY `id_konten` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `log_aktivitas`
--
ALTER TABLE `log_aktivitas`
  MODIFY `id_log` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=17;

--
-- AUTO_INCREMENT for table `pengguna`
--
ALTER TABLE `pengguna`
  MODIFY `id_user` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `pesanan`
--
ALTER TABLE `pesanan`
  MODIFY `id_pesanan` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `produk`
--
ALTER TABLE `produk`
  MODIFY `id_produk` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT for table `testimoni`
--
ALTER TABLE `testimoni`
  MODIFY `id_testimoni` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `pesanan`
--
ALTER TABLE `pesanan`
  ADD CONSTRAINT `fk_pesanan_produk` FOREIGN KEY (`id_produk`) REFERENCES `produk` (`id_produk`) ON UPDATE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
