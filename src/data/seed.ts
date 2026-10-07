import type {
  Komentar,
  Laporan,
  Notif,
  PeringkatDesa,
  Rekomendasi,
  TitikPantau,
  Warga,
} from '../lib/types'

// ----------------------------------------------------------------------------
// Data contoh (mock). Di produksi ini datang dari backend / spreadsheet riset.
// ----------------------------------------------------------------------------

const now = Date.now()
const H = (jam: number) => new Date(now - jam * 3_600_000).toISOString()
const M = (menit: number) => new Date(now - menit * 60_000).toISOString()

// Titik pantau sepanjang DAS Tallo, hulu (t=0) → hilir/muara (t=1).
export const TITIK: TitikPantau[] = [
  { id: 'tp-01', nama: 'Moncongloe', kelurahan: 'Moncongloe', t: 0.04, offset: 0.15, koordinat: { lat: -5.083, lng: 119.55 } },
  { id: 'tp-02', nama: 'Bangkala Hulu', kelurahan: 'Bangkala', t: 0.16, offset: -0.35, koordinat: { lat: -5.098, lng: 119.53 } },
  { id: 'tp-03', nama: 'Tamangapa', kelurahan: 'Tamangapa', t: 0.29, offset: 0.4, koordinat: { lat: -5.135, lng: 119.515 } },
  { id: 'tp-04', nama: 'Antang', kelurahan: 'Antang', t: 0.4, offset: -0.15, koordinat: { lat: -5.155, lng: 119.505 } },
  { id: 'tp-05', nama: 'Bitowa', kelurahan: 'Bitowa', t: 0.52, offset: 0.3, koordinat: { lat: -5.145, lng: 119.49 } },
  { id: 'tp-06', nama: 'Tello Baru', kelurahan: 'Tello Baru', t: 0.63, offset: -0.4, koordinat: { lat: -5.14, lng: 119.475 } },
  { id: 'tp-07', nama: 'Pampang', kelurahan: 'Pampang', t: 0.72, offset: 0.24, koordinat: { lat: -5.128, lng: 119.462 } },
  { id: 'tp-08', nama: 'Kaluku Bodoa', kelurahan: 'Kaluku Bodoa', t: 0.85, offset: -0.32, koordinat: { lat: -5.116, lng: 119.451 } },
  { id: 'tp-09', nama: 'Rappokalling', kelurahan: 'Rappokalling', t: 0.93, offset: -0.34, koordinat: { lat: -5.108, lng: 119.443 } },
  { id: 'tp-10', nama: 'Muara Tallo', kelurahan: 'Tallo', t: 0.985, offset: -0.05, koordinat: { lat: -5.096, lng: 119.436 } },
]

export const titikById = (id: string) => TITIK.find((x) => x.id === id)!

// Palet avatar (fallback tanpa foto)
const C = {
  green: '#2F5D3A',
  clay: '#B0623B',
  blue: '#2C5F91',
  plum: '#6C4A70',
  gold: '#B98A2E',
  teal: '#2E7D74',
  rose: '#A8455B',
  slate: '#4A5560',
}

export const WARGA: Warga[] = [
  { id: 'w-me', nama: 'Yusuf Dg. Ngalle', inisial: 'YN', warna: C.green, kelurahan: 'Pampang', titikId: 'tp-07', noUrut: 7, hariMelapor: 5, poin: 260, badge: ['Pelapor Baru', 'Sigap 3 Hari'], peran: 'warga' },
  { id: 'w-02', nama: 'Hj. Sanniasa', inisial: 'HS', warna: C.rose, kelurahan: 'Tello Baru', titikId: 'tp-06', noUrut: 6, hariMelapor: 6, poin: 320, badge: ['Pelapor Rajin'], peran: 'warga' },
  { id: 'w-03', nama: 'Muh. Ridwan', inisial: 'MR', warna: C.blue, kelurahan: 'Antang', titikId: 'tp-04', noUrut: 4, hariMelapor: 4, poin: 210, badge: [], peran: 'warga' },
  { id: 'w-04', nama: 'Sitti Aminah', inisial: 'SA', warna: C.plum, kelurahan: 'Tamangapa', titikId: 'tp-03', noUrut: 3, hariMelapor: 3, poin: 180, badge: [], peran: 'warga' },
  { id: 'w-05', nama: 'Abd. Rahman', inisial: 'AR', warna: C.gold, kelurahan: 'Bitowa', titikId: 'tp-05', noUrut: 5, hariMelapor: 5, poin: 250, badge: ['Sigap Banjir'], peran: 'warga' },
  { id: 'w-06', nama: 'Darmawati (Bu RT)', inisial: 'DW', warna: C.teal, kelurahan: 'Pampang', titikId: 'tp-07', noUrut: 27, hariMelapor: 7, poin: 360, badge: ['Pelapor Rajin', 'Penggerak Warga'], peran: 'warga' },
  { id: 'w-07', nama: 'Rappe Dg. Tutu', inisial: 'RT', warna: C.clay, kelurahan: 'Kaluku Bodoa', titikId: 'tp-08', noUrut: 8, hariMelapor: 6, poin: 300, badge: ['Pelapor Rajin'], peran: 'warga' },
  { id: 'w-08', nama: 'Nurbaya', inisial: 'NB', warna: C.slate, kelurahan: 'Rappokalling', titikId: 'tp-09', noUrut: 9, hariMelapor: 4, poin: 200, badge: [], peran: 'warga' },
  { id: 'w-09', nama: 'Sahrul', inisial: 'SH', warna: C.blue, kelurahan: 'Moncongloe', titikId: 'tp-01', noUrut: 1, hariMelapor: 5, poin: 240, badge: [], peran: 'warga' },
  { id: 'w-10', nama: 'Hasnah', inisial: 'HA', warna: C.rose, kelurahan: 'Bangkala', titikId: 'tp-02', noUrut: 2, hariMelapor: 5, poin: 245, badge: [], peran: 'warga' },
  // Tim peneliti / reviewer
  { id: 'p-01', nama: 'Dr. Amaliah — Tim IRIS', inisial: 'DA', warna: C.green, kelurahan: 'Tim IRIS', titikId: 'tp-07', noUrut: 0, hariMelapor: 0, poin: 0, badge: [], peran: 'peneliti' },
  { id: 'p-02', nama: 'Rifky — Peneliti IRIS', inisial: 'RF', warna: C.teal, kelurahan: 'Tim IRIS', titikId: 'tp-04', noUrut: 0, hariMelapor: 0, poin: 0, badge: [], peran: 'peneliti' },
]

export const wargaById = (id: string) => WARGA.find((x) => x.id === id)!
export const CURRENT_USER_ID = 'w-me'

// --- Laporan (feed) ---------------------------------------------------------
// Urut terbaru → terlama saat ditampilkan.
export const LAPORAN: Laporan[] = [
  {
    id: 'lp-101',
    wargaId: 'w-05',
    nama: 'Abd. Rahman',
    inisial: 'AR',
    warna: C.gold,
    kelurahan: 'Bitowa',
    titikId: 'tp-05',
    noUrutHari: 5,
    fotoSeed: 71,
    koordinat: titikById('tp-05').koordinat,
    waktuUpload: M(38),
    statusPelapor: 'bahaya',
    statusVerifikasi: 'sama',
    statusTerverifikasi: 'bahaya',
    catatanSuaraDetik: 9,
    rekomendasiTeks:
      'Air di titik Anda naik 20cm dari kemarin. Pindahkan barang berharga ke tempat lebih tinggi malam ini.',
    reviewerNama: 'Dr. Amaliah',
    waktuReview: M(12),
    jumlahSuka: 34,
    jumlahKomentar: 5,
  },
  {
    id: 'lp-100',
    wargaId: 'w-07',
    nama: 'Rappe Dg. Tutu',
    inisial: 'RT',
    warna: C.clay,
    kelurahan: 'Kaluku Bodoa',
    titikId: 'tp-08',
    noUrutHari: 8,
    fotoSeed: 22,
    koordinat: titikById('tp-08').koordinat,
    waktuUpload: H(2),
    statusPelapor: 'waspada',
    statusVerifikasi: 'sama',
    statusTerverifikasi: 'waspada',
    rekomendasiTeks: 'Air mulai keruh dan naik sedikit. Pantau terus, siapkan tas siaga.',
    reviewerNama: 'Rifky',
    waktuReview: H(1),
    jumlahSuka: 19,
    jumlahKomentar: 3,
  },
  {
    id: 'lp-099',
    wargaId: 'w-02',
    nama: 'Hj. Sanniasa',
    inisial: 'HS',
    warna: C.rose,
    kelurahan: 'Tello Baru',
    titikId: 'tp-06',
    noUrutHari: 6,
    fotoSeed: 9,
    koordinat: titikById('tp-06').koordinat,
    waktuUpload: H(5),
    statusPelapor: 'waspada',
    statusVerifikasi: 'dikoreksi',
    statusTerverifikasi: 'aman',
    catatanSuaraDetik: 6,
    rekomendasiTeks:
      'Setelah dicek foto, air masih batas normal. Status kami sesuaikan ke Aman. Terima kasih laporannya, lanjutkan pemantauan besok.',
    reviewerNama: 'Dr. Amaliah',
    waktuReview: H(4),
    jumlahSuka: 12,
    jumlahKomentar: 2,
  },
  {
    id: 'lp-098',
    wargaId: 'w-03',
    nama: 'Muh. Ridwan',
    inisial: 'MR',
    warna: C.blue,
    kelurahan: 'Antang',
    titikId: 'tp-04',
    noUrutHari: 4,
    fotoSeed: 45,
    koordinat: titikById('tp-04').koordinat,
    waktuUpload: H(9),
    statusPelapor: 'aman',
    statusVerifikasi: 'sama',
    statusTerverifikasi: 'aman',
    rekomendasiTeks: 'Kondisi aman, lanjutkan pemantauan besok.',
    reviewerNama: 'Rifky',
    waktuReview: H(8),
    jumlahSuka: 8,
    jumlahKomentar: 1,
  },
  {
    id: 'lp-097',
    wargaId: 'w-09',
    nama: 'Sahrul',
    inisial: 'SH',
    warna: C.blue,
    kelurahan: 'Moncongloe',
    titikId: 'tp-01',
    noUrutHari: 1,
    fotoSeed: 63,
    koordinat: titikById('tp-01').koordinat,
    waktuUpload: H(12),
    statusPelapor: 'aman',
    statusVerifikasi: 'sama',
    statusTerverifikasi: 'aman',
    rekomendasiTeks: 'Kondisi aman, lanjutkan pemantauan besok.',
    reviewerNama: 'Rifky',
    waktuReview: H(11),
    jumlahSuka: 5,
    jumlahKomentar: 0,
  },
  {
    id: 'lp-096',
    wargaId: 'w-me',
    nama: 'Yusuf Dg. Ngalle',
    inisial: 'YN',
    warna: C.green,
    kelurahan: 'Pampang',
    titikId: 'tp-07',
    noUrutHari: 7,
    fotoSeed: 30,
    koordinat: titikById('tp-07').koordinat,
    waktuUpload: H(26),
    statusPelapor: 'waspada',
    statusVerifikasi: 'sama',
    statusTerverifikasi: 'waspada',
    catatanSuaraDetik: 8,
    rekomendasiTeks:
      'Air di titik Anda naik 20cm dari kemarin. Pindahkan barang berharga ke tempat lebih tinggi malam ini.',
    reviewerNama: 'Dr. Amaliah',
    waktuReview: H(24),
    jumlahSuka: 21,
    jumlahKomentar: 4,
  },
  {
    id: 'lp-095',
    wargaId: 'w-08',
    nama: 'Nurbaya',
    inisial: 'NB',
    warna: C.slate,
    kelurahan: 'Rappokalling',
    titikId: 'tp-09',
    noUrutHari: 9,
    fotoSeed: 88,
    koordinat: titikById('tp-09').koordinat,
    waktuUpload: H(30),
    statusPelapor: 'aman',
    statusVerifikasi: 'sama',
    statusTerverifikasi: 'aman',
    rekomendasiTeks: 'Kondisi aman, lanjutkan pemantauan besok.',
    reviewerNama: 'Rifky',
    waktuReview: H(29),
    jumlahSuka: 6,
    jumlahKomentar: 1,
  },
]

// --- Komentar per laporan -------------------------------------------------
export const KOMENTAR: Komentar[] = [
  {
    id: 'km-01',
    laporanId: 'lp-101',
    wargaId: 'p-01',
    nama: 'Dr. Amaliah',
    inisial: 'DA',
    warna: C.green,
    peran: 'peneliti',
    teks:
      'Rekomendasi Resmi: air naik 20 cm dari kemarin di titik Bitowa. Warga radius 300 m harap amankan barang berharga & dokumen ke tempat tinggi malam ini. Hindari menyeberang sungai.',
    waktu: M(10),
    suka: 28,
    disematkan: true,
  },
  {
    id: 'km-02',
    laporanId: 'lp-101',
    wargaId: 'w-06',
    nama: 'Darmawati (Bu RT)',
    inisial: 'DW',
    warna: C.teal,
    peran: 'warga',
    teks: 'Sudah saya umumkan di masjid. Warga RT 03 sedang naikkan perabot.',
    waktu: M(6),
    suka: 11,
  },
  {
    id: 'km-03',
    laporanId: 'lp-101',
    wargaId: 'w-07',
    nama: 'Rappe Dg. Tutu',
    inisial: 'RT',
    warna: C.clay,
    peran: 'warga',
    teks: 'Di Kaluku Bodoa juga mulai naik. Bu RT, sungai depan rumah ibu bagaimana?',
    waktu: M(3),
    suka: 4,
    mention: 'Darmawati (Bu RT)',
  },
  {
    id: 'km-10',
    laporanId: 'lp-100',
    wargaId: 'p-02',
    nama: 'Rifky',
    inisial: 'RF',
    warna: C.teal,
    peran: 'peneliti',
    teks: 'Rekomendasi Resmi: status Waspada. Siapkan tas siaga (dokumen, obat, senter, air). Pantau tiap 3 jam.',
    waktu: H(1),
    suka: 9,
    disematkan: true,
  },
  {
    id: 'km-11',
    laporanId: 'lp-100',
    wargaId: 'w-08',
    nama: 'Nurbaya',
    inisial: 'NB',
    warna: C.slate,
    peran: 'warga',
    teks: 'Terima kasih infonya. Anak-anak sudah saya larang main dekat sungai.',
    waktu: M(40),
    suka: 3,
  },
  {
    id: 'km-20',
    laporanId: 'lp-096',
    wargaId: 'w-06',
    nama: 'Darmawati (Bu RT)',
    inisial: 'DW',
    warna: C.teal,
    peran: 'warga',
    teks: 'Pak Yusuf, foto jembatan Pampang jelas sekali. Terima kasih sudah lapor tepat waktu.',
    waktu: H(23),
    suka: 7,
  },
]

// --- Rekomendasi untuk warga saat ini -----------------------------------
export const REKOMENDASI: Rekomendasi[] = [
  {
    id: 'rk-01',
    laporanId: 'lp-096',
    titikId: 'tp-07',
    level: 'waspada',
    judul: 'Amankan barang malam ini',
    teks:
      'Air di titik Anda (Pampang) naik 20 cm dari kemarin. Pindahkan barang berharga & dokumen ke tempat lebih tinggi malam ini. Jangan menyeberang sungai.',
    reviewerNama: 'Dr. Amaliah',
    waktu: H(24),
    dibaca: false,
  },
  {
    id: 'rk-02',
    laporanId: 'lp-095b',
    titikId: 'tp-07',
    level: 'aman',
    judul: 'Kondisi aman',
    teks: 'Kondisi aman, lanjutkan pemantauan besok. Simpan nomor darurat RT di HP Anda.',
    reviewerNama: 'Rifky',
    waktu: H(50),
    dibaca: true,
  },
  {
    id: 'rk-03',
    laporanId: 'lp-095c',
    titikId: 'tp-07',
    level: 'aman',
    judul: 'Terima kasih laporannya',
    teks:
      'Foto Anda dipakai untuk memperbarui peta titik Pampang. Kondisi aman. Lanjutkan besok, cukup 1 foto dari sisi jembatan.',
    reviewerNama: 'Rifky',
    waktu: H(74),
    dibaca: true,
  },
]

// --- Notifikasi ---------------------------------------------------------
export const NOTIF: Notif[] = [
  {
    id: 'nt-01',
    jenis: 'peringatan',
    teks: '⚠️ Titik Bitowa naik ke BAHAYA. Warga sekitar Pampang & Tello, amankan barang berharga malam ini.',
    waktu: M(9),
    dibaca: false,
    laporanId: 'lp-101',
  },
  {
    id: 'nt-02',
    jenis: 'terverifikasi',
    teks: 'Laporan Anda 24 jam lalu sudah dicek Tim Peneliti ✅. Ada rekomendasi baru untuk Anda.',
    waktu: H(24),
    dibaca: false,
    laporanId: 'lp-096',
  },
  {
    id: 'nt-03',
    jenis: 'giliran',
    teks: 'Besok giliran Anda melapor 🙋. Siapkan foto sungai dari sisi jembatan Pampang pagi hari.',
    waktu: H(20),
    dibaca: true,
  },
  {
    id: 'nt-04',
    jenis: 'komentar',
    teks: 'Darmawati (Bu RT) mengomentari laporan Anda.',
    waktu: H(23),
    dibaca: true,
    laporanId: 'lp-096',
  },
  {
    id: 'nt-05',
    jenis: 'poin',
    teks: 'Anda mendapat lencana baru: Sigap 3 Hari 🏅 (+50 poin).',
    waktu: H(70),
    dibaca: true,
  },
]

// --- Papan peringkat kontribusi desa (bagian 6.4) ----------------------
export const PERINGKAT_DESA: PeringkatDesa[] = [
  { kelurahan: 'Tello Baru', laporan: 38, partisipasi: 95 },
  { kelurahan: 'Bitowa', laporan: 36, partisipasi: 90 },
  { kelurahan: 'Pampang', laporan: 33, partisipasi: 82 },
  { kelurahan: 'Kaluku Bodoa', laporan: 31, partisipasi: 78 },
  { kelurahan: 'Antang', laporan: 28, partisipasi: 70 },
  { kelurahan: 'Rappokalling', laporan: 24, partisipasi: 60 },
]

// Statistik dampak (bagian 6.5)
export const IMPACT = {
  laporanDipakai: 214,
  titikDipetakan: 10,
  hariBerjalan: 12,
  wargaAktif: 37,
}

// Riwayat status 7 hari untuk titik Pampang (mini-tren di Peta & Profil)
export const TREN_PAMPANG: { hari: string; nilai: number; status: 'aman' | 'waspada' | 'bahaya' }[] = [
  { hari: 'Sen', nilai: 30, status: 'aman' },
  { hari: 'Sel', nilai: 34, status: 'aman' },
  { hari: 'Rab', nilai: 42, status: 'aman' },
  { hari: 'Kam', nilai: 55, status: 'waspada' },
  { hari: 'Jum', nilai: 61, status: 'waspada' },
  { hari: 'Sab', nilai: 58, status: 'waspada' },
  { hari: 'Min', nilai: 72, status: 'waspada' },
]
