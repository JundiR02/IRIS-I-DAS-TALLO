-- Migrasi 4: foto profil akun (URL ke R2, prefix profil/). Jalankan sekali.
ALTER TABLE warga_auth ADD COLUMN foto_url TEXT;
