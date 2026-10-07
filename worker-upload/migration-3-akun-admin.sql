-- Migrasi 3: profil akun di D1 + peran admin + login username untuk peneliti/admin.
-- Jalankan SETELAH schema.sql dan migration-2-login-attempts.sql (sekali saja —
-- ALTER TABLE ADD COLUMN akan gagal kalau kolomnya sudah ada).

-- Profil (sebelumnya cuma ada di src/data/seed.ts) + status akun.
ALTER TABLE warga_auth ADD COLUMN nama TEXT;
ALTER TABLE warga_auth ADD COLUMN username TEXT;
ALTER TABLE warga_auth ADD COLUMN inisial TEXT;
ALTER TABLE warga_auth ADD COLUMN warna TEXT;
ALTER TABLE warga_auth ADD COLUMN kelurahan TEXT;
ALTER TABLE warga_auth ADD COLUMN titik_id TEXT;
ALTER TABLE warga_auth ADD COLUMN aktif INTEGER NOT NULL DEFAULT 1;
-- Naik setiap PIN direset / akun dinonaktifkan → token lama otomatis tidak berlaku.
ALTER TABLE warga_auth ADD COLUMN token_versi INTEGER NOT NULL DEFAULT 0;
ALTER TABLE warga_auth ADD COLUMN dibuat TEXT;
ALTER TABLE warga_auth ADD COLUMN login_terakhir TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS idx_warga_auth_username ON warga_auth (username);

-- Pembatas percobaan login kini per "kunci" (no:<nomor urut> atau u:<username>).
ALTER TABLE login_attempts ADD COLUMN kunci TEXT;
CREATE INDEX IF NOT EXISTS idx_login_attempts_kunci ON login_attempts (kunci, waktu);

-- Isi profil akun yang sudah ada (sama dengan src/data/seed.ts).
UPDATE warga_auth SET nama = 'Yusuf Dg. Ngalle',  inisial = 'YN', warna = '#2F5D3A', kelurahan = 'Pampang',      titik_id = 'tp-07' WHERE id = 'w-me';
UPDATE warga_auth SET nama = 'Hj. Sanniasa',      inisial = 'HS', warna = '#A8455B', kelurahan = 'Tello Baru',   titik_id = 'tp-06' WHERE id = 'w-02';
UPDATE warga_auth SET nama = 'Muh. Ridwan',       inisial = 'MR', warna = '#2C5F91', kelurahan = 'Antang',       titik_id = 'tp-04' WHERE id = 'w-03';
UPDATE warga_auth SET nama = 'Sitti Aminah',      inisial = 'SA', warna = '#6C4A70', kelurahan = 'Tamangapa',    titik_id = 'tp-03' WHERE id = 'w-04';
UPDATE warga_auth SET nama = 'Abd. Rahman',       inisial = 'AR', warna = '#B98A2E', kelurahan = 'Bitowa',       titik_id = 'tp-05' WHERE id = 'w-05';
UPDATE warga_auth SET nama = 'Darmawati (Bu RT)', inisial = 'DW', warna = '#2E7D74', kelurahan = 'Pampang',      titik_id = 'tp-07' WHERE id = 'w-06';
UPDATE warga_auth SET nama = 'Rappe Dg. Tutu',    inisial = 'RT', warna = '#B0623B', kelurahan = 'Kaluku Bodoa', titik_id = 'tp-08' WHERE id = 'w-07';
UPDATE warga_auth SET nama = 'Nurbaya',           inisial = 'NB', warna = '#4A5560', kelurahan = 'Rappokalling', titik_id = 'tp-09' WHERE id = 'w-08';
UPDATE warga_auth SET nama = 'Sahrul',            inisial = 'SH', warna = '#2C5F91', kelurahan = 'Moncongloe',   titik_id = 'tp-01' WHERE id = 'w-09';
UPDATE warga_auth SET nama = 'Hasnah',            inisial = 'HA', warna = '#A8455B', kelurahan = 'Bangkala',     titik_id = 'tp-02' WHERE id = 'w-10';

-- Peneliti kini masuk pakai username + kata sandi (bukan nomor urut 9001/9002).
-- Kata sandi awal TIDAK ditulis di repo (repo publik) — diberikan terpisah ke tim.
-- Lupa? Admin bisa membuat yang baru lewat Panel (Pengguna → Reset).
UPDATE warga_auth SET nama = 'Dr. Amaliah — Tim IRIS', username = 'amaliah', inisial = 'DA', warna = '#2F5D3A', kelurahan = 'Tim IRIS', titik_id = 'tp-07',
  pin_hash = 'pbkdf2$100000$LSxOCbxO6g7mhvZLrijGdQ$_AI7CgqHghnvk6ljpg-8EZkz3fZ8HRT3OKMEEFeDsj8' WHERE id = 'p-01';
UPDATE warga_auth SET nama = 'Rifky — Peneliti IRIS',  username = 'rifky',   inisial = 'RF', warna = '#2E7D74', kelurahan = 'Tim IRIS', titik_id = 'tp-04',
  pin_hash = 'pbkdf2$100000$07R0hvCszQyDuZFMbbjl1w$K9YKnz6VRbgTbaaDSClQ9s-ycXUFcY6DeIb8OTDlO6Y' WHERE id = 'p-02';

-- Akun admin pertama (username: admin). Kata sandi awal diberikan terpisah,
-- tidak ditulis di repo.
INSERT INTO warga_auth (id, no_urut, peran, pin_hash, nama, username, inisial, warna, kelurahan, aktif, token_versi, dibuat) VALUES
  ('adm-01', 1, 'admin', 'pbkdf2$100000$phuytBZ8h8_zMXE3fyVLsw$lpy4lTK2glidOFT2_JhmlT55-mFe6zq1L_hMzMjGTO8',
   'Admin IRIS', 'admin', 'AI', '#1F4A3D', 'Tim IRIS', 1, 0, '2026-10-07T00:00:00.000Z');
