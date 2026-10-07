// Klien untuk Worker backend IRIS-I (lihat worker-upload/) — login PIN warga,
// serta laporan & komentar yang kini tersimpan di D1 (bukan cuma lokal di HP),
// supaya laporan satu warga benar-benar terlihat di HP warga lain.

const API_URL =
  (import.meta.env.VITE_UPLOAD_URL as string | undefined) ||
  'https://iris-i-tallo-upload.mrv-nexus.workers.dev'

export class ApiError extends Error {
  constructor(public status: number, pesan: string) {
    super(pesan)
  }
}

async function permintaan<T>(path: string, opsi: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...opsi,
    headers: { 'Content-Type': 'application/json', ...opsi.headers },
  })
  if (!res.ok) {
    const info: { error?: string } | null = await res.json().catch(() => null)
    throw new ApiError(res.status, info?.error ?? `Permintaan gagal (HTTP ${res.status})`)
  }
  return res.json() as Promise<T>
}

function withAuth(token: string): HeadersInit {
  return { Authorization: `Bearer ${token}` }
}

// --- Auth --------------------------------------------------------------
// Tiga pintu masuk terpisah: masyarakat (nomor urut + PIN), peneliti dan
// admin (username + kata sandi). Lihat worker-upload/src/index.ts.

export type Peran = 'warga' | 'peneliti' | 'admin'

/** Profil publik satu akun, sumbernya tabel warga_auth di D1. */
export interface ProfilApi {
  id: string
  noUrut: number
  peran: Peran
  nama: string
  inisial: string
  warna: string
  kelurahan: string
  titikId?: string
  aktif: boolean
}

export interface SesiWarga {
  token: string
  warga: ProfilApi
}

export function loginMasyarakat(noUrut: number, pin: string): Promise<SesiWarga> {
  return permintaan<SesiWarga>('/auth/masyarakat', {
    method: 'POST',
    body: JSON.stringify({ noUrut, pin }),
  })
}

export function loginDenganUsername(
  peran: 'peneliti' | 'admin',
  username: string,
  password: string,
): Promise<SesiWarga> {
  return permintaan<SesiWarga>(`/auth/${peran}`, {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  })
}

export function ambilSaya(token: string): Promise<ProfilApi> {
  return permintaan<ProfilApi>('/auth/saya', { headers: withAuth(token) })
}

export function ambilDirektori(): Promise<ProfilApi[]> {
  return permintaan<ProfilApi[]>('/warga')
}

// --- Laporan -------------------------------------------------------------

export interface LaporanApi {
  id: string
  wargaId: string
  titikId: string
  noUrutHari: number
  fotoUrl: string | null
  fotoAsliNama: string | null
  fotoDariRaw: boolean
  koordinat: { lat: number; lng: number }
  koordinatDariExif: boolean
  waktuUpload: string
  statusPelapor: string
  statusVerifikasi: string
  statusTerverifikasi?: string
  catatanSuaraDetik?: number
  rekomendasiTeks?: string
  reviewerNama?: string
  waktuReview?: string
  jumlahSuka: number
  jumlahKomentar: number
  darurat: boolean
}

/** Default 200 laporan terbaru (aplikasi warga); Panel minta lebih banyak supaya antrian verifikasi lengkap. */
export function ambilLaporan(opsi: { limit?: number } = {}): Promise<LaporanApi[]> {
  return permintaan<LaporanApi[]>(opsi.limit ? `/laporan?limit=${opsi.limit}` : '/laporan')
}

export interface DraftLaporanApi {
  titikId: string
  noUrutHari: number
  fotoUrl: string | null
  fotoAsliNama?: string
  fotoDariRaw?: boolean
  lat: number
  lng: number
  koordinatDariExif?: boolean
  statusPelapor: string
  darurat?: boolean
}

export function buatLaporan(token: string, draft: DraftLaporanApi): Promise<LaporanApi> {
  return permintaan<LaporanApi>('/laporan', {
    method: 'POST',
    headers: withAuth(token),
    body: JSON.stringify(draft),
  })
}

export function toggleSukaLaporanApi(
  token: string,
  laporanId: string,
): Promise<{ sukaSaya: boolean; jumlahSuka: number }> {
  return permintaan(`/laporan/${encodeURIComponent(laporanId)}/suka`, {
    method: 'POST',
    headers: withAuth(token),
  })
}

// --- Komentar -------------------------------------------------------------

export interface KomentarApi {
  id: string
  laporanId: string
  wargaId: string
  teks: string
  waktu: string
  suka: number
  disematkan: boolean
  mention?: string
}

export function ambilKomentar(): Promise<KomentarApi[]> {
  return permintaan<KomentarApi[]>('/komentar')
}

export function buatKomentar(
  token: string,
  laporanId: string,
  teks: string,
  mention?: string,
): Promise<KomentarApi> {
  return permintaan<KomentarApi>('/komentar', {
    method: 'POST',
    headers: withAuth(token),
    body: JSON.stringify({ laporanId, teks, mention }),
  })
}

// --- Panel: peneliti + admin ----------------------------------------------

export interface RingkasanPanel {
  laporanTotal: number
  laporanMenunggu: number
  laporan24Jam: number
  bahaya24Jam: number
  daruratMenunggu: number
  wargaAktif: number
  penelitiAktif: number
  akunNonaktif: number
  komentarTotal: number
}

export function ambilRingkasan(token: string): Promise<RingkasanPanel> {
  return permintaan<RingkasanPanel>('/panel/ringkasan', { headers: withAuth(token) })
}

export interface VerifikasiApi {
  statusVerifikasi: 'sama' | 'dikoreksi'
  statusTerverifikasi?: string
  rekomendasiTeks?: string
  /** ikut tampilkan rekomendasi sebagai komentar "Rekomendasi Resmi" tersemat */
  sematkanKomentar?: boolean
}

export function verifikasiLaporan(token: string, laporanId: string, data: VerifikasiApi): Promise<LaporanApi> {
  return permintaan<LaporanApi>(`/laporan/${encodeURIComponent(laporanId)}/verifikasi`, {
    method: 'POST',
    headers: withAuth(token),
    body: JSON.stringify(data),
  })
}

export function toggleSematKomentar(token: string, komentarId: string): Promise<KomentarApi> {
  return permintaan<KomentarApi>(`/komentar/${encodeURIComponent(komentarId)}/sematkan`, {
    method: 'POST',
    headers: withAuth(token),
  })
}

// --- Admin: kelola akun & moderasi -----------------------------------------

export interface AkunAdminApi extends ProfilApi {
  username?: string
  dibuat?: string
  loginTerakhir?: string
}

export interface DraftAkunApi {
  peran: Peran
  nama: string
  /** warga saja, 1..40 */
  noUrut?: number
  /** peneliti/admin saja */
  username?: string
  kelurahan?: string
  titikId?: string
}

export function daftarAkun(token: string): Promise<AkunAdminApi[]> {
  return permintaan<AkunAdminApi[]>('/admin/akun', { headers: withAuth(token) })
}

/** `rahasia` = PIN/kata sandi awal — cuma dikembalikan sekali ini. */
export function buatAkun(token: string, draft: DraftAkunApi): Promise<{ akun: AkunAdminApi; rahasia: string }> {
  return permintaan('/admin/akun', { method: 'POST', headers: withAuth(token), body: JSON.stringify(draft) })
}

export function ubahAkun(
  token: string,
  id: string,
  data: Partial<Pick<AkunAdminApi, 'nama' | 'noUrut' | 'kelurahan' | 'titikId' | 'aktif' | 'peran' | 'username'>>,
): Promise<AkunAdminApi & { rahasiaBaru?: string }> {
  return permintaan(`/admin/akun/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    headers: withAuth(token),
    body: JSON.stringify(data),
  })
}

export function resetRahasiaAkun(token: string, id: string): Promise<{ rahasia: string }> {
  return permintaan(`/admin/akun/${encodeURIComponent(id)}/reset`, { method: 'POST', headers: withAuth(token) })
}

export function hapusLaporan(token: string, id: string): Promise<{ ok: true }> {
  return permintaan(`/admin/laporan/${encodeURIComponent(id)}`, { method: 'DELETE', headers: withAuth(token) })
}

export function hapusKomentar(token: string, id: string): Promise<{ ok: true }> {
  return permintaan(`/admin/komentar/${encodeURIComponent(id)}`, { method: 'DELETE', headers: withAuth(token) })
}
