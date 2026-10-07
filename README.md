# IRIS-I — Integrated River Information System (DAS Tallo)

Prototipe **aplikasi warga** untuk monitoring masyarakat & mitigasi banjir di
Daerah Aliran Sungai (DAS) Tallo, Makassar.

> **Sudah pakai login PIN sungguhan + database bersama (Cloudflare D1).** Laporan
> & komentar warga A benar-benar terlihat di HP warga B — bukan lagi tersimpan
> lokal per-perangkat. Foto sungai (JPEG/PNG/HEIC, atau **RAW kamera CR2 Canon**
> dkk.) diunggah ke Cloudflare R2 lewat endpoint yang kini wajib login. Lihat
> [bagian "Login & database bersama"](#login--database-bersama--cloudflare-d1).

Dibangun mengikuti *Dokumen Struktur Produk IRIS-I* — 4 jangkar desain:

1. **Impact terlihat < 5 detik setelah upload** — laporan langsung muncul di feed.
2. **Warna & ikon dulu, teks belakangan** — status pakai *traffic light* 🟢🟡🔴.
3. **1 layar = 1 keputusan** — alur lapor dipecah jadi 4 langkah.
4. **Feed = bukti sosial** — struktur "ala Facebook" yang disederhanakan.

> Target pengguna: warga dengan pendidikan SD–SMA, HP Android, sinyal kadang lemah.
> Karena itu: tombol besar, font ≥ 15px, opsi rekam suara, mode offline, onboarding 3 layar.

---

## Menjalankan

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # bundel produksi ke dist/
npm run preview  # pratinjau hasil build
```

Butuh Node 18+ (diuji pada Node 24).

### Deploy (Firebase Hosting)

Sudah di-*deploy* ke **https://iris-i-tallo.web.app** (proyek Firebase `iris-i-tallo`,
akun akademikomunitaspesantrenhijau). Untuk deploy ulang setelah ada perubahan:

```bash
npm run build
firebase deploy --only hosting
```

Konfigurasi ada di `firebase.json` / `.firebaserc`. `HashRouter` dipakai jadi tidak
perlu aturan rewrite server khusus per-route.

### Panel Demo (peninjau)

Di layar lebar (≥ 1280px) muncul **Panel Demo** di kanan telepon — *bukan bagian
aplikasi*, hanya untuk peninjau:

- **Akun** — login cepat pakai 3 akun demo (PIN sungguhan, lihat bagian login di
  bawah) tanpa perlu mengetik manual, plus tombol **Keluar**.
- **Rotasi 40 hari** — geser "Hari ke-N" untuk melihat kondisi saat giliran Anda
  vs. bukan giliran. Tombol *"Jadikan hari giliran saya"* menyetel hari = nomor
  urut Anda.
- **Bahasa** — Indonesia / Mangkasara (label status & istilah kunci).
- **Kondisi lapangan** — simulasikan sinyal mati, GPS mati, atau izin kamera
  ditolak, untuk meninjau jalur selain "semua berjalan mulus".
- **Reset data contoh** — juga mengeluarkan Anda dari akun (kembali ke layar login).

---

## Peta layar → Dokumen Struktur Produk

| Layar (`src/screens/`) | Bagian dokumen | Isi |
|---|---|---|
| `Onboarding.tsx` | §8 | 3 layar pengenalan + info insentif 40 hari |
| `Beranda.tsx` | §3A, §6.1 | Kartu status wilayah, peringatan dini personal, baris titik pantau, feed laporan, FAB "Lapor" (aktif hanya saat giliran) |
| `Lapor.tsx` | §3B, §5 | 4 langkah: foto → pilih status (3 tombol besar) → rekam suara 10 dtk (opsional) → periksa & kirim. Gerbang giliran + tombol **Lapor Darurat** |
| `Rekomendasi.tsx` | §3C | Arahan konkret dari peneliti, bahasa sehari-hari, per level bahaya |
| `Peta.tsx` | §3D | Peta DAS Tallo sederhana (SVG), 10 titik pantau berwarna, toggle Hari ini / Kemarin, bottom-sheet detail titik |
| `Diskusi.tsx` | §3E | Thread komentar per laporan, badge **Peneliti**, komentar **Rekomendasi Resmi** disematkan, tandai warga (@) |
| `Profil.tsx` | §3F, §6.3–6.5 | Poin & progres 40 hari, lencana, papan peringkat kelurahan, statistik dampak, tren tinggi air, riwayat, pengaturan bahasa/offline |
| `Notifikasi.tsx` | §5, §6.1 | Peringatan bahaya, "besok giliran Anda", laporan terverifikasi, komentar |

Struktur data laporan (`src/lib/types.ts` → `Laporan`) mengikuti **§7** dokumen dan
siap dipetakan ke backend (Firebase / Supabase) maupun spreadsheet riset.

---

## Foto sungguhan — RAW (CR2)

Langkah 1 di `Lapor.tsx` punya dua jalur input nyata (bukan simulasi):

- **"Ambil Foto"** — buka kamera HP langsung (`<input type="file" capture="environment">`).
- **"Pilih File (termasuk RAW/CR2)"** — buka galeri/file picker, menerima JPEG/PNG/HEIC
  maupun file RAW kamera.

Alurnya (`src/lib/rawPhoto.ts`):

1. **Deteksi RAW** dari ekstensi file (`.cr2`, `.cr3`, `.nef`, `.arw`, `.dng`, `.raf`, `.rw2`, `.orf`).
2. **File RAW** → file kamera CR2 dkk sebetulnya adalah kontainer **TIFF**; browser tidak
   bisa menampilkannya langsung. Kita ambil **pratinjau JPEG yang sudah disisipkan kamera
   di dalam file itu sendiri** lewat [`exifr`](https://www.npmjs.com/package/exifr)
   (`exifr.thumbnailUrl`), bukan men-decode sensor RAW mentah (itu butuh pustaka native/berat
   seperti LibRaw yang tidak jalan di browser).
3. **File gambar biasa** → dipakai langsung kualitas penuh.
4. Hasilnya di-*downscale* ke maks. 1280px sisi terpanjang & dikompresi JPEG kualitas 0.78
   lewat `<canvas>`, lalu disimpan sebagai *data URL* di `laporan.fotoUrl` — konsisten dengan
   prinsip "hemat kuota" (§10 dokumen).
5. **GPS dari EXIF** dicoba diekstrak juga (`exifr.gps`) — kalau ada (umum di foto HP, jarang
   di DSLR tanpa modul GPS), dipakai sebagai koordinat laporan; kalau tidak, jatuh ke
   koordinat titik pantau tetap.
6. Kalau ekstraksi pratinjau gagal (file RAW rusak / format tidak didukung), pesan error
   jelas ditampilkan dan warga diminta coba file lain — tidak diam-diam gagal.

**Keterbatasan yang perlu diketahui:**

- exifr dipakai dalam varian **`full`** (bukan `lite`/`mini`) khusus demi keandalan baca
  CR2 — `lite`/`mini` di dokumentasinya hanya menjamin dukungan "JPEG dan HEIC". Konsekuensinya
  bundle JS sedikit lebih besar (~112 kB gzip). Belum sempat diuji dengan file CR2 asli di
  lingkungan ini (tidak ada sampel) — sudah diuji penuh dengan JPEG asli (end-to-end: upload →
  kompresi → unggah ke server → tampil di feed), dan penanganan error untuk RAW yang gagal
  dibaca sudah ada sebagai jaring pengaman.

---

## Login & database bersama — Cloudflare D1

```
Browser                         Worker iris-i-tallo-upload (Cloudflare)
  │  POST /auth/login               │
  │  { noUrut, pin } ──────────────▶│── cocokkan pin_hash di D1 (warga_auth)
  │ ◀──────── { token, warga } ─────│── token = HMAC-SHA256, 30 hari
  │                                  │
  │  GET /laporan, /komentar ───────▶│── baca D1 (publik, tanpa token)
  │                                  │
  │  POST /laporan, /komentar,      │
  │  /laporan/:id/suka,             │   wajib header
  │  /upload (foto) ────────────────▶│   Authorization: Bearer <token>
  │                                  │── tulis D1 / R2, identitas warga
  │ ◀──────────── hasil ─────────────│   diambil dari token, BUKAN dari body
```

**Login PIN** — tiap responden (warga/peneliti) login dengan *nomor urut* + PIN
di layar `Login.tsx` sebelum bisa memakai aplikasi. Token sesi (HMAC, 30 hari)
disimpan di `localStorage`, dikirim sebagai `Authorization: Bearer` di setiap
permintaan yang mengubah data. Identitas pengirim laporan/komentar **selalu
diambil dari token yang diverifikasi server**, bukan dari apa pun yang dikirim
klien — jadi warga tidak bisa mengaku jadi warga lain atau peneliti.

**Database bersama (D1)** — `laporan` dan `komentar` kini disimpan di satu
database (`iris-i-tallo-db`), bukan `localStorage` per-HP. Saat aplikasi dibuka,
`store.tsx` mengambil `GET /laporan` + `GET /komentar` dan menggabungkannya
dengan metadata warga lokal (nama/warna/inisial dari `src/data/seed.ts`) lewat
`enrichLaporan`/`enrichKomentar`. **Sudah diuji**: login sebagai warga A, kirim
laporan + foto, lalu login sebagai warga B di sesi terpisah — laporan & foto A
langsung terlihat di akun B, dan komentar yang ditulis B tercatat dengan
`warga_id` B yang benar (bukan bisa dipalsukan).

**Foto (R2)** tetap lewat jalur yang sama seperti sebelumnya (`POST /upload` →
`GET /foto/:key`), hanya sekarang **`/upload` juga wajib token** — endpoint yang
sebelumnya terbuka untuk siapa saja kini tertutup untuk yang belum login.

**Mode offline tetap berfungsi penuh**: kalau submit laporan gagal (sinyal
lemah/Worker tak terjangkau/mode offline disimulasikan), laporan & fotonya
tersimpan lokal dulu (`offline: true`, badge "📴 Tersimpan di HP"), lalu banner
di Beranda punya tombol **Kirim** yang mencoba lagi — unggah fotonya ke R2 dulu
kalau belum, baru kirim datanya ke `/laporan`.

- **`worker-upload/src/index.ts`** — satu Worker untuk semuanya: `/auth/login`,
  `/laporan` (GET publik, POST+suka perlu token), `/komentar` (GET publik, POST
  perlu token), `/upload` + `/foto/:key` (keduanya perlu token/publik baca).
- **`worker-upload/schema.sql`** — skema D1 (`warga_auth`, `laporan`, `komentar`,
  `suka_laporan`, `login_attempts`) + migrasi data contoh dari `seed.ts` lama,
  supaya feed tidak kosong saat pertama kali tersambung ke database sungguhan.
- **`worker-upload/migration-3-akun-admin.sql`** — profil akun pindah ke D1
  (nama, inisial, warna, kelurahan, titik), kolom `username`, `aktif`,
  `token_versi`, `login_terakhir`, plus akun admin pertama.
- **Kredensial demo** (ganti sebelum pakai ke 40 responden asli):
  - Masyarakat: `1000 + nomor_urut` (mis. no. 7 → PIN `1007`)
  - Peneliti (`amaliah`, `rifky`) & admin (`admin`): kata sandi awal **tidak
    ditulis di repo** — minta ke pengelola proyek, atau buat baru lewat Panel → Reset.
  Dibatasi 5 percobaan gagal / 15 menit per nomor urut atau username (tabel
  `login_attempts`) untuk memperlambat tebak-PIN.

### Tiga jenis akun

| Peran | Masuk lewat | Endpoint | Bisa apa |
|---|---|---|---|
| **Masyarakat** (warga responden) | Aplikasi → tab *Masyarakat*: nomor urut + PIN | `POST /auth/masyarakat` (alias lama `/auth/login`) | Lapor, komentar, suka |
| **Peneliti** | Aplikasi → tab *Peneliti*, atau Panel → *Peneliti*: username/email + kata sandi | `POST /auth/peneliti` | Semua yang warga bisa + verifikasi laporan, tulis rekomendasi, sematkan komentar (Panel) |
| **Admin** | Panel → *Admin*: username/email + kata sandi | `POST /auth/admin` | Semua yang peneliti bisa + kelola akun, hapus laporan/komentar |

Tiap pintu hanya menerima perannya sendiri (akun peneliti ditolak di `/auth/admin`).
PIN & kata sandi baru di-hash **PBKDF2-SHA256** (100.000 iterasi); hash sha256 lama
dari `schema.sql` tetap diterima dan otomatis di-upgrade saat login pertama.
Setiap permintaan ber-token dicek ulang ke D1, jadi **reset PIN atau menonaktifkan
akun langsung mengeluarkan semua sesinya** (kolom `token_versi`), tanpa menunggu
token 30 hari habis. Aplikasi warga juga memanggil `GET /auth/saya` saat dibuka.

### Panel admin & peneliti (`#/panel`)

Halaman web penuh (di luar bingkai HP) — https://iris-i-tallo.web.app/#/panel:

- **Ringkasan** — laporan menunggu verifikasi, laporan darurat, laporan & status
  bahaya 24 jam, akun aktif, status terkini per titik pantau.
- **Laporan & Verifikasi** — antrian (Menunggu / Darurat / Sudah diverifikasi /
  Semua), filter titik & nama. Review 3 langkah: status pelapor → *Sesuai* atau
  *Perlu dikoreksi* (pilih status baru) → teks rekomendasi (ada templat per status),
  opsional disematkan sebagai komentar "Rekomendasi Resmi". Nama reviewer diambil
  dari token, bukan dari input. Admin juga bisa menghapus laporan (+ foto R2 &
  komentarnya).
- **Komentar** — sematkan/lepas (peneliti & admin), hapus (admin).
- **Pengguna** (admin saja) — tambah akun masyarakat/peneliti/admin, ubah data,
  **ganti peran** (mis. masyarakat → peneliti; kredensial baru dibuat & sesi lama
  dicabut, admin tidak bisa mengubah peran dirinya sendiri),
  reset PIN/kata sandi, nonaktifkan/aktifkan. PIN (6 digit) & kata sandi dibuat
  acak oleh server dan **hanya ditampilkan sekali**. Juga menunjukkan nomor urut
  rotasi 1–40 yang belum punya responden.

Endpoint baru di Worker: `GET /auth/saya`, `GET /warga` (direktori publik tanpa
kredensial), `GET /panel/ringkasan`, `POST /laporan/:id/verifikasi`,
`POST /komentar/:id/sematkan`, `GET|POST /admin/akun`, `PATCH /admin/akun/:id`,
`POST /admin/akun/:id/reset`, `DELETE /admin/laporan/:id`, `DELETE /admin/komentar/:id`.
`GET /laporan` kini menerima `?limit=` (maks 2000) untuk antrian Panel.

### Deploy ulang

**Urutannya penting**: migrasi D1 dulu → Worker → frontend. Worker baru membaca
kolom `aktif`/`token_versi`; tanpa migrasi semua login gagal. Frontend baru
memanggil `/auth/masyarakat`; tanpa Worker baru login di aplikasi gagal.

```bash
cd worker-upload
npm install
# 1. Migrasi (SEKALI saja — ALTER TABLE gagal kalau kolomnya sudah ada):
CLOUDFLARE_API_TOKEN=<token> CLOUDFLARE_ACCOUNT_ID=<account id> \
  npx wrangler d1 execute iris-i-tallo-db --remote --file=migration-3-akun-admin.sql
#    Login admin pakai email sendiri (opsional; email tidak ditulis di repo):
CLOUDFLARE_API_TOKEN=<token> CLOUDFLARE_ACCOUNT_ID=<account id>   npx wrangler d1 execute iris-i-tallo-db --remote   --command "UPDATE warga_auth SET username = '<email-admin>' WHERE id = 'adm-01'"
# 2. Worker:
CLOUDFLARE_API_TOKEN=<token> CLOUDFLARE_ACCOUNT_ID=<account id> npx wrangler deploy
# 3. Frontend (dari root proyek):
cd .. && npm run build && firebase deploy --only hosting
```

Database baru dari nol: `schema.sql` → `migration-2-login-attempts.sql` →
`migration-3-akun-admin.sql`.

Uji lokal tanpa menyentuh database produksi:

```bash
cd worker-upload
for f in schema.sql migration-2-login-attempts.sql migration-3-akun-admin.sql; do
  npx wrangler d1 execute iris-i-tallo-db --local --file=$f; done
npx wrangler dev --local --var AUTH_TOKEN_SECRET:rahasia-lokal   # :8787
# terminal lain, di root proyek:
VITE_UPLOAD_URL=http://127.0.0.1:8787 npm run dev
```

**Catatan jujur yang masih perlu diketahui:**

- **Rate-limit login sederhana** (D1-based, bukan Cloudflare's managed rate
  limiting) — cukup untuk pilot 40 orang, belum teruji untuk skala/serangan lebih besar.
- Batas ukuran file di Worker: 8MB per unggahan (longgar untuk JPEG hasil kompresi klien yang
  biasanya <300KB).
- **Notifikasi dan papan peringkat desa masih data contoh lokal**
  (`src/data/seed.ts`). Layar *Rekomendasi* di aplikasi juga masih dari seed — hasil
  verifikasi Panel sudah tampil di kartu laporan/feed (`rekomendasiTeks`,
  `statusTerverifikasi`) dan sebagai komentar tersemat, tapi belum ke daftar
  Rekomendasi tersendiri.
- PIN demo warga **ditulis di kode sumber** (`schema.sql`, `DemoPanel.tsx`) dan
  repo ini publik — reset semuanya
  dari Panel (Pengguna → Reset) sebelum distribusi sungguhan ke 40 responden.
- Belum ada fitur ganti kata sandi sendiri; peneliti/admin minta admin lain menekan *Reset*.

---

## Arsitektur

```
src/
├── main.tsx / App.tsx        Router (HashRouter) + kerangka telepon
├── store/store.tsx           State global (useReducer + Context)
│                             persist sebagian ke localStorage (kontribusi baru,
│                             preferensi, suka) — data contoh tetap segar tiap sesi
├── data/seed.ts              Titik pantau, warga, laporan, komentar, rekomendasi,
│                             notifikasi, papan peringkat (mock)
├── lib/
│   ├── types.ts              Tipe domain (≙ §7 dokumen)
│   ├── status.ts             Sistem traffic-light + glosarium Mangkasara
│   ├── rotasi.ts             Logika rotasi 40 responden × 40 hari (§5)
│   ├── rawPhoto.ts           Upload foto sungguhan: ekstraksi pratinjau RAW (CR2 dkk),
│   │                         downscale & kompresi JPEG, GPS dari EXIF
│   ├── uploadFoto.ts         Kirim foto terkompresi ke Worker (butuh token login)
│   ├── api.ts                Klien REST ke Worker: login, laporan, komentar, suka
│   ├── useMediaQuery.ts      Hook layar sempit (HP asli) vs lebar (peninjau)
│   └── format.ts             Waktu relatif & angka berbahasa Indonesia
├── components/
│   ├── RiverScene.tsx        Ilustrasi sungai prosedural (SVG) — fallback untuk data contoh
│   ├── FotoLaporan.tsx       Foto sungguhan (fotoUrl) atau fallback RiverScene per laporan
│   ├── PhoneFrame.tsx        Bezel perangkat mock-up (mode peninjau desktop saja)
│   ├── BottomNav.tsx         4 tab + FAB "Lapor" di tengah
│   ├── PostCard.tsx          Kartu laporan di feed
│   ├── StatusPill / Avatar / Sheet / Segmented / Sparkline / Toast / AppBar / Logo
│   └── DemoPanel.tsx         Kontrol peninjau (di luar aplikasi) + login cepat akun demo
├── panel/                    Panel web admin & peneliti (#/panel) — sesi terpisah dari aplikasi
│   ├── PanelApp.tsx          Kerangka + navigasi; usePanel.tsx = sesi & data
│   ├── PanelLogin.tsx        Masuk sebagai Peneliti / Admin
│   └── Tab*.tsx              Ringkasan, Laporan & Verifikasi, Komentar, Pengguna
└── screens/
    ├── Login.tsx             Gerbang masuk: Masyarakat (nomor urut + PIN) / Peneliti (username + sandi)
    └── ...                   7 layar lain di tabel atas

worker-upload/                 Proyek terpisah: backend Cloudflare (Worker + D1 + R2)
├── wrangler.toml               → R2 bucket + binding D1 (lihat "Login & database bersama")
├── schema.sql                  Skema D1 + migrasi data contoh + PIN demo
├── migration-2-login-attempts.sql
├── migration-3-akun-admin.sql  Profil akun di D1, peran admin, username, nonaktif/reset
└── src/index.ts                 /auth/login, /laporan, /komentar, /upload, /foto/:key
```

### Keputusan teknis

- **Vite + React 18 + TypeScript + Tailwind 3** — satu basis kode web, cepat
  diiterasi, mudah dilanjutkan ke React Native / PWA.
- **HashRouter** — prototipe bisa dibuka dari `file://` atau static host mana pun.
- **Foto sungguhan untuk laporan baru** (lihat bagian "Foto sungguhan" di atas); ilustrasi
  sungai prosedural (SVG) tetap dipakai sebagai *fallback* khusus untuk data contoh/demo di
  `src/data/seed.ts` yang memang tidak punya foto asli.
- **Mode penuh layar responsif** (`App.tsx` + `useIsMobile`) — di HP asli (< 768px) aplikasi
  tampil penuh layar tanpa bingkai; bingkai mock-up HP + Panel Demo hanya muncul untuk
  peninjau di layar lebar (desktop/tablet).
- **Peta versi sederhana** digambar sebagai SVG skematik alur sungai (hulu → muara)
  dengan pin berwarna — bukan tile map — agar ringan & jalan offline.
- **Tanpa emoji-only untuk makna** — setiap status selalu punya warna + label teks
  (emoji hanya penguat visual).

### Sistem desain (`tailwind.config.js`)

Palet earth/eco dari `refDesign/`: kertas hangat (`bone`), hijau hutan (`forest`),
aksen *lime*, biru air (`river`), dan status `aman` / `waspada` / `bahaya`
(masing-masing `DEFAULT` / `ink` / `wash`). Radius besar (`card` 24px, `pill`),
bayangan lembut, font **Plus Jakarta Sans** (fallback system-ui).

---

## Catatan & langkah berikut

- **Istilah Bahasa Makassar** pada `src/lib/status.ts` masih perlu **divalidasi
  penutur asli / tim desa** (ditandai `TODO`). Untuk sekarang hanya istilah
  status utama yang diterjemahkan — sisa antarmuka tetap Bahasa Indonesia,
  dengan catatan kecil di Profil/Beranda saat mode Mangkasara aktif.
- **Badge "Peneliti" di Diskusi sekarang aman** — diambil dari `komentar.peran`
  yang di-*enrich* dari direktori warga lokal berdasarkan `warga_id` HASIL
  VERIFIKASI TOKEN server (lihat "Login & database bersama"), bukan dari input
  klien. Satu-satunya cara jadi "Peneliti" adalah login dengan akun yang memang
  terdaftar `peran = 'peneliti'` di tabel `warga_auth`.
- **Panel peneliti & admin** (`#/panel`) sudah ada: antrian verifikasi, form review
  3 langkah, kelola akun. Yang belum dari Tahap 3 dokumen: peta agregat & grafik tren.
- **Foto + laporan + komentar sudah sungguhan** (R2 + D1, lihat bagian "Login &
  database bersama") dan **sudah diuji lintas-akun**. Yang *belum* dipindah ke
  database: rekomendasi, notifikasi, dan papan peringkat desa — masih data
  contoh lokal di `src/data/seed.ts`. Belum ada push notification sungguhan
  (notifikasi di layar Notifikasi masih statis/mock).
- Direktori warga (nama, warna, inisial, kelurahan, titik pantau) kini bersumber
  dari D1 (`GET /warga`) — menambah responden cukup lewat Panel → Pengguna. Poin,
  lencana, dan jumlah hari melapor di Profil masih dari `src/data/seed.ts` (akun
  baru mulai dari 0).
