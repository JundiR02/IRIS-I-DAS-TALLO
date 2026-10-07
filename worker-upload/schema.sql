-- IRIS-I — skema D1: identitas warga (untuk login PIN) + data kolaboratif
-- (laporan & komentar) supaya laporan warga A benar-benar terlihat di HP
-- warga B, bukan cuma tersimpan lokal di tiap perangkat.

DROP TABLE IF EXISTS warga_auth;
DROP TABLE IF EXISTS laporan;
DROP TABLE IF EXISTS komentar;
DROP TABLE IF EXISTS suka_laporan;

CREATE TABLE warga_auth (
  id TEXT PRIMARY KEY,
  no_urut INTEGER NOT NULL,
  peran TEXT NOT NULL DEFAULT 'warga',
  pin_hash TEXT NOT NULL
);
CREATE UNIQUE INDEX idx_warga_auth_no_urut_peran ON warga_auth (no_urut, peran);

CREATE TABLE laporan (
  id TEXT PRIMARY KEY,
  warga_id TEXT NOT NULL,
  titik_id TEXT NOT NULL,
  no_urut_hari INTEGER NOT NULL,
  foto_url TEXT,
  foto_asli_nama TEXT,
  foto_dari_raw INTEGER NOT NULL DEFAULT 0,
  lat REAL NOT NULL,
  lng REAL NOT NULL,
  koordinat_dari_exif INTEGER NOT NULL DEFAULT 0,
  waktu_upload TEXT NOT NULL,
  status_pelapor TEXT NOT NULL,
  status_verifikasi TEXT NOT NULL DEFAULT 'menunggu',
  status_terverifikasi TEXT,
  catatan_suara_detik INTEGER,
  rekomendasi_teks TEXT,
  reviewer_nama TEXT,
  waktu_review TEXT,
  jumlah_suka INTEGER NOT NULL DEFAULT 0,
  jumlah_komentar INTEGER NOT NULL DEFAULT 0,
  darurat INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX idx_laporan_waktu ON laporan (waktu_upload DESC);
CREATE INDEX idx_laporan_titik ON laporan (titik_id);

CREATE TABLE komentar (
  id TEXT PRIMARY KEY,
  laporan_id TEXT NOT NULL,
  warga_id TEXT NOT NULL,
  teks TEXT NOT NULL,
  waktu TEXT NOT NULL,
  suka INTEGER NOT NULL DEFAULT 0,
  disematkan INTEGER NOT NULL DEFAULT 0,
  mention TEXT
);
CREATE INDEX idx_komentar_laporan ON komentar (laporan_id);

CREATE TABLE suka_laporan (
  laporan_id TEXT NOT NULL,
  warga_id TEXT NOT NULL,
  PRIMARY KEY (laporan_id, warga_id)
);

-- --------------------------------------------------------------------------
-- Identitas login (PIN = 1000 + no_urut untuk warga; 9001/9002 untuk peneliti).
-- Ganti pin_hash ini sebelum pakai sungguhan ke 40 responden asli — ini PIN
-- demo supaya alur login bisa langsung diuji. pin_hash = sha256(`${id}:${pin}`).
-- --------------------------------------------------------------------------
INSERT INTO warga_auth (id, no_urut, peran, pin_hash) VALUES
  ('w-me', 7,  'warga',    '2a687d9eb3afadd3e1ea8c5440fbfdd3c5d2c2facb60273a051c5e2809728ee0'),
  ('w-02', 6,  'warga',    '51c18ca867bac4581b03ca0ab82cf427a19b512146b2c30032aa98d90eb28ed6'),
  ('w-03', 4,  'warga',    '38c4e50e6b91df8e02c9c86e8df1d5aa6219e931fb65648efea48e5c09172860'),
  ('w-04', 3,  'warga',    'b54a0e659ac2e65b08396f88099e1a5ea363c2f5266bd79f2936c0a17f34a58c'),
  ('w-05', 5,  'warga',    'd7616a2e561cde2a72311299dead1c4c6d4b80c055b1f56036802b9a8fddb54a'),
  ('w-06', 27, 'warga',    '56add6e71e6b95896e09ec47a89491ab99f463cc42fafee193c47b08556bf639'),
  ('w-07', 8,  'warga',    'd0b79a992b16d95f89a4a7f6a60c5d3e4c36c563d2eff179888914d1bd6ab6c8'),
  ('w-08', 9,  'warga',    '5bece426ea1d85fb1857b70bd89b532d3a987f3fe3da60598a8dfbbddd34a113'),
  ('w-09', 1,  'warga',    '622b1a1c233d09aa5307cb38205dceaa0215c25ad52843de3a7ff118f2e1681b'),
  ('w-10', 2,  'warga',    '53b18c272b28da6b1b8772e09df776c992da367acf8e45c2fca0984c58594623'),
  ('p-01', 9001, 'peneliti', '2ff9429bbb57f9d3d2a718f81e612f4b0b56d8b578b5eb5f04b851c607759823'),
  ('p-02', 9002, 'peneliti', '26bd24905ef38c886251a2b971212b47e00e60e9ddac5516536aaa646fe3e753');

-- --------------------------------------------------------------------------
-- Data contoh awal (dipindah dari src/data/seed.ts) supaya feed tidak kosong
-- saat pertama kali tersambung ke database sungguhan.
-- --------------------------------------------------------------------------
INSERT INTO laporan (id, warga_id, titik_id, no_urut_hari, foto_url, foto_asli_nama, foto_dari_raw, lat, lng, koordinat_dari_exif, waktu_upload, status_pelapor, status_verifikasi, status_terverifikasi, catatan_suara_detik, rekomendasi_teks, reviewer_nama, waktu_review, jumlah_suka, jumlah_komentar, darurat) VALUES
  ('lp-101', 'w-05', 'tp-05', 5, NULL, NULL, 0, -5.145, 119.49,  0, '2026-10-07T09:13:09.135Z', 'bahaya',  'sama',      'bahaya',  9, 'Air di titik Anda naik 20cm dari kemarin. Pindahkan barang berharga ke tempat lebih tinggi malam ini.', 'Dr. Amaliah', '2026-10-07T09:37:09.135Z', 34, 3, 0),
  ('lp-100', 'w-07', 'tp-08', 8, NULL, NULL, 0, -5.116, 119.451, 0, '2026-10-07T07:51:09.135Z', 'waspada', 'sama',      'waspada', NULL, 'Air mulai keruh dan naik sedikit. Pantau terus, siapkan tas siaga.', 'Rifky', '2026-10-07T08:51:09.135Z', 19, 1, 0),
  ('lp-099', 'w-02', 'tp-06', 6, NULL, NULL, 0, -5.14,  119.475, 0, '2026-10-07T04:51:09.135Z', 'waspada', 'dikoreksi', 'aman',    6, 'Setelah dicek foto, air masih batas normal. Status kami sesuaikan ke Aman. Terima kasih laporannya, lanjutkan pemantauan besok.', 'Dr. Amaliah', '2026-10-07T05:51:09.135Z', 12, 0, 0),
  ('lp-098', 'w-03', 'tp-04', 4, NULL, NULL, 0, -5.155, 119.505, 0, '2026-10-07T00:51:09.135Z', 'aman',    'sama',      'aman',    NULL, 'Kondisi aman, lanjutkan pemantauan besok.', 'Rifky', '2026-10-07T01:51:09.135Z', 8, 0, 0),
  ('lp-097', 'w-09', 'tp-01', 1, NULL, NULL, 0, -5.083, 119.55,  0, '2026-10-06T21:51:09.135Z', 'aman',    'sama',      'aman',    NULL, 'Kondisi aman, lanjutkan pemantauan besok.', 'Rifky', '2026-10-06T22:51:09.135Z', 5, 0, 0),
  ('lp-096', 'w-me', 'tp-07', 7, NULL, NULL, 0, -5.128, 119.462, 0, '2026-10-06T07:51:09.135Z', 'waspada', 'sama',      'waspada', 8, 'Air di titik Anda naik 20cm dari kemarin. Pindahkan barang berharga ke tempat lebih tinggi malam ini.', 'Dr. Amaliah', '2026-10-06T09:51:09.135Z', 21, 1, 0),
  ('lp-095', 'w-08', 'tp-09', 9, NULL, NULL, 0, -5.108, 119.443, 0, '2026-10-06T03:51:09.135Z', 'aman',    'sama',      'aman',    NULL, 'Kondisi aman, lanjutkan pemantauan besok.', 'Rifky', '2026-10-06T04:51:09.135Z', 6, 0, 0);

INSERT INTO komentar (id, laporan_id, warga_id, teks, waktu, suka, disematkan, mention) VALUES
  ('km-01', 'lp-101', 'p-01', 'Rekomendasi Resmi: air naik 20 cm dari kemarin di titik Bitowa. Warga radius 300 m harap amankan barang berharga & dokumen ke tempat tinggi malam ini. Hindari menyeberang sungai.', '2026-10-07T09:31:09.135Z', 28, 1, NULL),
  ('km-02', 'lp-101', 'w-06', 'Sudah saya umumkan di masjid. Warga RT 03 sedang naikkan perabot.', '2026-10-07T09:35:09.135Z', 11, 0, NULL),
  ('km-03', 'lp-101', 'w-07', 'Di Kaluku Bodoa juga mulai naik. Bu RT, sungai depan rumah ibu bagaimana?', '2026-10-07T09:38:09.135Z', 4, 0, 'Darmawati (Bu RT)'),
  ('km-10', 'lp-100', 'p-02', 'Rekomendasi Resmi: status Waspada. Siapkan tas siaga (dokumen, obat, senter, air). Pantau tiap 3 jam.', '2026-10-07T08:51:09.135Z', 9, 1, NULL),
  ('km-11', 'lp-100', 'w-08', 'Terima kasih infonya. Anak-anak sudah saya larang main dekat sungai.', '2026-10-07T09:11:09.135Z', 3, 0, NULL),
  ('km-20', 'lp-096', 'w-06', 'Pak Yusuf, foto jembatan Pampang jelas sekali. Terima kasih sudah lapor tepat waktu.', '2026-10-06T08:51:09.135Z', 7, 0, NULL);
