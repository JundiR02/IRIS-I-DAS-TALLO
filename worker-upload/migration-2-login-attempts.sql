-- Migrasi tambahan: pencatat percobaan login gagal, untuk membatasi tebak-PIN.
CREATE TABLE IF NOT EXISTS login_attempts (
  no_urut INTEGER NOT NULL,
  waktu TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_login_attempts ON login_attempts (no_urut, waktu);
