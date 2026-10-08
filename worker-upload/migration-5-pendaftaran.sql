-- Migrasi 5: daftar sendiri. Akun baru berperan 'pendaftar' sampai disetujui admin;
-- peran_diminta = pilihan pendaftar (masyarakat/peneliti), keputusan akhir di admin.
ALTER TABLE warga_auth ADD COLUMN peran_diminta TEXT;
