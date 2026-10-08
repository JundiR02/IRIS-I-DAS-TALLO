// Struktur data — mengikuti Dokumen Struktur Produk IRIS-I bagian 7.
// Semua tipe di sini bisa dipetakan langsung ke tabel backend (Firebase/Supabase).

export type Status = 'aman' | 'waspada' | 'bahaya'

export type Lang = 'id' | 'mks'

export interface LatLng {
  lat: number
  lng: number
}

/** Titik pantau tetap di sepanjang DAS Tallo (lokasi 40 responden). */
export interface TitikPantau {
  id: string
  nama: string
  kelurahan: string
  /** posisi 0..1 sepanjang alur sungai pada peta sederhana (hulu → hilir) */
  t: number
  /** geser tegak lurus alur, -1..1, untuk sebar pin */
  offset: number
  koordinat: LatLng
}

export interface Warga {
  id: string
  nama: string
  inisial: string
  /** warna avatar (fallback tanpa foto) */
  warna: string
  kelurahan: string
  titikId: string
  /** nomor urut dalam rotasi 40 hari (1..40) */
  noUrut: number
  /** total hari melapor sampai hari ini */
  hariMelapor: number
  poin: number
  badge: string[]
  peran: 'warga' | 'peneliti'
  /** foto profil (R2), opsional */
  fotoUrl?: string
}

export interface Komentar {
  id: string
  laporanId: string
  wargaId: string
  nama: string
  inisial: string
  warna: string
  peran: 'warga' | 'peneliti'
  teks: string
  waktu: string // ISO
  suka: number
  /** disematkan peneliti sebagai "Rekomendasi Resmi" */
  disematkan?: boolean
  /** menandai warga lain, mis. "Bu RT" */
  mention?: string
}

export type StatusVerifikasi = 'menunggu' | 'sama' | 'dikoreksi'

export interface Laporan {
  id: string
  wargaId: string
  nama: string
  inisial: string
  warna: string
  kelurahan: string
  titikId: string
  noUrutHari: number // 1..40
  /** Seed ilustrasi prosedural — fallback untuk data contoh tanpa foto asli.
      Opsional: laporan dari API tidak membawa ini, FotoLaporan menurunkannya dari `id`. */
  fotoSeed?: number
  /** Foto sungai sungguhan (data URL JPEG terkompresi). Kosong = pakai ilustrasi fotoSeed. */
  fotoUrl?: string
  /** Nama file asli saat diunggah, mis. "IMG_4821.CR2" — untuk konteks di peneliti/riwayat. */
  fotoAsliNama?: string
  /** true kalau sumbernya file RAW kamera (CR2/NEF/ARW/dll), bukan JPEG langsung. */
  fotoDariRaw?: boolean
  koordinat: LatLng
  /** true kalau koordinat diambil dari EXIF foto asli, bukan posisi titik pantau */
  koordinatDariExif?: boolean
  waktuUpload: string // ISO
  statusPelapor: Status // input warga
  statusVerifikasi: StatusVerifikasi // isian peneliti
  statusTerverifikasi?: Status // hasil koreksi peneliti (jika 'dikoreksi')
  catatanSuaraDetik?: number // 0..10, opsional
  rekomendasiTeks?: string
  reviewerNama?: string
  waktuReview?: string // ISO
  jumlahSuka: number
  jumlahKomentar: number
  /** laporan darurat di luar jadwal rotasi */
  darurat?: boolean
  /** belum terkirim (mode offline) */
  offline?: boolean
}

export interface Rekomendasi {
  id: string
  laporanId: string
  titikId: string
  level: Status
  judul: string
  teks: string
  reviewerNama: string
  waktu: string // ISO
  dibaca: boolean
}

export type JenisNotif = 'giliran' | 'terverifikasi' | 'peringatan' | 'komentar' | 'poin'

export interface Notif {
  id: string
  jenis: JenisNotif
  teks: string
  waktu: string // ISO
  dibaca: boolean
  laporanId?: string
}

export interface PeringkatDesa {
  kelurahan: string
  laporan: number
  partisipasi: number // %
}
