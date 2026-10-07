import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  type ReactNode,
} from 'react'
import type { Komentar, Laporan, Lang, Notif, Rekomendasi, Status, StatusVerifikasi, Warga } from '../lib/types'
import {
  CURRENT_USER_ID,
  KOMENTAR,
  LAPORAN,
  NOTIF,
  REKOMENDASI,
  TITIK,
  WARGA,
} from '../data/seed'
import { noUrutHariIni } from '../lib/rotasi'
import { unggahFotoKeServer } from '../lib/uploadFoto'
import {
  ApiError,
  ambilKomentar,
  ambilLaporan,
  buatKomentar,
  buatLaporan,
  ambilDirektori,
  ambilSaya,
  loginDenganUsername,
  loginMasyarakat,
  toggleSukaLaporanApi,
  type KomentarApi,
  type LaporanApi,
  type ProfilApi,
  type SesiWarga as SesiApi,
} from '../lib/api'

// ---------------------------------------------------------------------------
// Laporan & komentar sekarang tersimpan di database bersama (D1, lewat Worker
// — lihat worker-upload/), bukan cuma lokal per-HP: laporan warga A benar-
// benar terlihat di HP warga B. Yang tetap disimpan lokal cuma preferensi +
// kontribusi yang GAGAL terkirim (mode offline, §8) sampai berhasil disinkron.
// ---------------------------------------------------------------------------

const STORAGE_KEY = 'iris-i-tallo.v1'

export interface SesiWarga {
  id: string
  noUrut: number
  peran: 'warga' | 'peneliti'
  nama?: string
  token: string
}

interface Persisted {
  auth: SesiWarga | null
  /** Direktori nama/avatar warga & peneliti — dari GET /warga, disimpan supaya tetap tampil saat offline. */
  direktori: Warga[]
  laporanBaru: Laporan[]
  komentarBaru: Komentar[]
  lang: Lang
  offline: boolean
  hariKe: number
  sukaLaporan: string[]
  sukaKomentar: string[]
  rekomendasiDibaca: string[]
  arahanDitindak: string[]
  notifDibaca: string[]
  onboardingSelesai: boolean
  // Simulasi kondisi lapangan DAS Tallo (sinyal, GPS, izin kamera) — supaya
  // kondisi "tidak semua berjalan mulus" bisa ditinjau, bukan cuma jalur mulus.
  gpsMati: boolean
  kameraDitolak: boolean
}

interface State extends Persisted {
  laporanServer: Laporan[]
  komentarServer: Komentar[]
  laporan: Laporan[]
  komentar: Komentar[]
  rekomendasi: Rekomendasi[]
  notif: Notif[]
  memuatData: boolean
  toast: { id: number; teks: string; ikon?: string } | null
}

const DEFAULT_PERSISTED: Persisted = {
  auth: null,
  direktori: WARGA,
  laporanBaru: [],
  komentarBaru: [],
  lang: 'id',
  offline: false,
  hariKe: 12,
  sukaLaporan: [],
  sukaKomentar: [],
  rekomendasiDibaca: [],
  arahanDitindak: [],
  notifDibaca: [],
  onboardingSelesai: false,
  gpsMati: false,
  kameraDitolak: false,
}

function loadPersisted(): Persisted {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return DEFAULT_PERSISTED
    return { ...DEFAULT_PERSISTED, ...(JSON.parse(raw) as Partial<Persisted>) }
  } catch {
    return DEFAULT_PERSISTED
  }
}

// --- Pemetaan baris API (camelCase, wargaId saja) → bentuk lokal
//     (ikut menyisipkan nama/inisial/warna dari direktori warga lokal,
//     supaya seluruh UI yang sudah ada tidak perlu berubah). ------------------

function enrichLaporan(api: LaporanApi, direktori: Warga[]): Laporan {
  const w = direktori.find((x) => x.id === api.wargaId)
  return {
    id: api.id,
    wargaId: api.wargaId,
    nama: w?.nama ?? 'Warga',
    inisial: w?.inisial ?? '?',
    warna: w?.warna ?? '#6B7770',
    kelurahan: w?.kelurahan ?? '-',
    titikId: api.titikId,
    noUrutHari: api.noUrutHari,
    fotoUrl: api.fotoUrl ?? undefined,
    fotoAsliNama: api.fotoAsliNama ?? undefined,
    fotoDariRaw: api.fotoDariRaw,
    koordinat: api.koordinat,
    koordinatDariExif: api.koordinatDariExif,
    waktuUpload: api.waktuUpload,
    statusPelapor: api.statusPelapor as Status,
    statusVerifikasi: api.statusVerifikasi as StatusVerifikasi,
    statusTerverifikasi: api.statusTerverifikasi as Status | undefined,
    catatanSuaraDetik: api.catatanSuaraDetik,
    rekomendasiTeks: api.rekomendasiTeks,
    reviewerNama: api.reviewerNama,
    waktuReview: api.waktuReview,
    jumlahSuka: api.jumlahSuka,
    jumlahKomentar: api.jumlahKomentar,
    darurat: api.darurat,
  }
}

function enrichKomentar(api: KomentarApi, direktori: Warga[]): Komentar {
  const w = direktori.find((x) => x.id === api.wargaId)
  return {
    id: api.id,
    laporanId: api.laporanId,
    wargaId: api.wargaId,
    nama: w?.nama ?? 'Warga',
    inisial: w?.inisial ?? '?',
    warna: w?.warna ?? '#6B7770',
    peran: w?.peran ?? 'warga',
    teks: api.teks,
    waktu: api.waktu,
    suka: api.suka,
    disematkan: api.disematkan,
    mention: api.mention,
  }
}

/** Profil dari server menimpa data lokal; statistik poin/lencana (belum ada
    di server) tetap diambil dari seed kalau ada. Entri seed yang tidak dikenal
    server tetap disimpan supaya data contoh lama masih punya nama. */
function gabungDirektori(profil: ProfilApi[]): Warga[] {
  const dariServer: Warga[] = profil
    .filter((p) => p.peran !== 'admin')
    .map((p) => {
      const lokal = WARGA.find((w) => w.id === p.id)
      return {
        id: p.id,
        nama: p.nama,
        inisial: p.inisial,
        warna: p.warna,
        kelurahan: p.kelurahan,
        titikId: TITIK.some((t) => t.id === p.titikId) ? p.titikId! : (lokal?.titikId ?? TITIK[0].id),
        noUrut: p.noUrut,
        hariMelapor: lokal?.hariMelapor ?? 0,
        poin: lokal?.poin ?? 0,
        badge: lokal?.badge ?? [],
        peran: p.peran === 'peneliti' ? 'peneliti' : 'warga',
      }
    })
  return [...dariServer, ...WARGA.filter((w) => !dariServer.some((s) => s.id === w.id))]
}

/** Profil pengganti kalau akun yang login belum ada di direktori lokal (mis. akun baru, data belum termuat). */
function wargaDariSesi(sesi: SesiWarga): Warga {
  return {
    id: sesi.id,
    nama: sesi.nama ?? 'Warga',
    inisial: (sesi.nama ?? '?').slice(0, 2).toUpperCase(),
    warna: '#6B7770',
    kelurahan: '-',
    titikId: TITIK[0].id,
    noUrut: sesi.noUrut,
    hariMelapor: 0,
    poin: 0,
    badge: [],
    peran: sesi.peran,
  }
}

function cariMe(state: Pick<State, 'auth' | 'direktori'>): Warga {
  if (!state.auth) return state.direktori.find((w) => w.id === CURRENT_USER_ID) ?? WARGA[0]
  return state.direktori.find((w) => w.id === state.auth!.id) ?? wargaDariSesi(state.auth)
}

function buildState(p: Persisted): State {
  return {
    ...p,
    laporanServer: LAPORAN,
    komentarServer: KOMENTAR,
    laporan: [...p.laporanBaru, ...LAPORAN],
    komentar: [...KOMENTAR, ...p.komentarBaru],
    rekomendasi: REKOMENDASI,
    notif: NOTIF,
    memuatData: false,
    toast: null,
  }
}

function gabungkanData(state: State): State {
  return {
    ...state,
    laporan: [...state.laporanBaru, ...state.laporanServer],
    komentar: [...state.komentarServer, ...state.komentarBaru],
  }
}

function keSesi(api: SesiApi): SesiWarga {
  return {
    id: api.warga.id,
    noUrut: api.warga.noUrut,
    peran: api.warga.peran === 'peneliti' ? 'peneliti' : 'warga',
    nama: api.warga.nama,
    token: api.token,
  }
}

// --- Actions ---------------------------------------------------------------

export interface DraftLaporan {
  /** Foto sungai sungguhan — data URL lokal, atau URL dari server kalau sudah sempat diunggah. */
  fotoUrl: string
  fotoAsliNama?: string
  fotoDariRaw?: boolean
  /** true kalau fotoUrl sudah berupa URL server (R2) hasil unggah sukses, bukan data URL lokal. */
  fotoTersinkron?: boolean
  /** Koordinat dari EXIF foto, kalau kamera/HP-nya menyimpannya (jarang pada DSLR). */
  gps?: { latitude: number; longitude: number }
  status: Status
  catatanSuaraDetik?: number
  darurat?: boolean
}

type Action =
  | { type: 'LOGIN_BERHASIL'; sesi: SesiWarga }
  | { type: 'LOGOUT' }
  | { type: 'MULAI_MUAT_DATA' }
  | { type: 'DATA_SERVER_DIMUAT'; laporan: Laporan[]; komentar: Komentar[]; direktori?: Warga[] }
  | { type: 'TAMBAH_LAPORAN_LOKAL'; draft: DraftLaporan }
  | { type: 'LAPORAN_SERVER_BARU'; laporan: Laporan }
  | { type: 'PINDAHKAN_LAPORAN_KE_SERVER'; idLokal: string; laporan: Laporan }
  | { type: 'TAMBAH_KOMENTAR_LOKAL'; laporanId: string; teks: string; mention?: string }
  | { type: 'KOMENTAR_SERVER_BARU'; komentar: Komentar }
  | { type: 'TOGGLE_SUKA_LAPORAN'; id: string }
  | { type: 'SET_JUMLAH_SUKA'; id: string; jumlahSuka: number }
  | { type: 'TOGGLE_SUKA_KOMENTAR'; id: string }
  | { type: 'BACA_REKOMENDASI'; id: string }
  | { type: 'TINDAK_ARAHAN'; id: string }
  | { type: 'BACA_NOTIF'; id?: string }
  | { type: 'SET_LANG'; lang: Lang }
  | { type: 'SET_OFFLINE'; offline: boolean }
  | { type: 'SET_GPS_MATI'; mati: boolean }
  | { type: 'SET_KAMERA_DITOLAK'; ditolak: boolean }
  | { type: 'SET_HARI'; hariKe: number }
  | { type: 'SELESAI_ONBOARDING' }
  | { type: 'TOAST'; teks: string; ikon?: string }
  | { type: 'TUTUP_TOAST' }
  | { type: 'RESET' }

function buatLaporanLokal(state: State, me: Warga, draft: DraftLaporan): Laporan {
  return {
    id: `lp-usr-${Date.now()}`,
    wargaId: me.id,
    nama: me.nama,
    inisial: me.inisial,
    warna: me.warna,
    kelurahan: me.kelurahan,
    titikId: me.titikId,
    noUrutHari: noUrutHariIni(state.hariKe),
    fotoUrl: draft.fotoUrl,
    fotoAsliNama: draft.fotoAsliNama,
    fotoDariRaw: draft.fotoDariRaw,
    koordinat: draft.gps
      ? { lat: draft.gps.latitude, lng: draft.gps.longitude }
      : TITIK.find((x) => x.id === me.titikId)!.koordinat,
    koordinatDariExif: !!draft.gps,
    waktuUpload: new Date().toISOString(),
    statusPelapor: draft.status,
    statusVerifikasi: 'menunggu',
    catatanSuaraDetik: draft.catatanSuaraDetik,
    jumlahSuka: 0,
    jumlahKomentar: 0,
    darurat: draft.darurat,
    // Offline kalau mode offline disengaja AKTIF, atau fotonya/laporannya belum
    // sempat terkirim ke server (gagal/tidak dicoba) — keduanya sama-sama
    // berarti "masih nunggu sinyal" dari sudut pandang warga.
    offline: true,
  }
}

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'LOGIN_BERHASIL':
      return { ...state, auth: action.sesi }
    case 'LOGOUT':
      return {
        ...state,
        auth: null,
        laporanBaru: [],
        komentarBaru: [],
        sukaLaporan: [],
        sukaKomentar: [],
        laporan: state.laporanServer,
        komentar: state.komentarServer,
      }
    case 'MULAI_MUAT_DATA':
      return { ...state, memuatData: true }
    case 'DATA_SERVER_DIMUAT':
      return gabungkanData({
        ...state,
        laporanServer: action.laporan,
        komentarServer: action.komentar,
        direktori: action.direktori ?? state.direktori,
        memuatData: false,
      })
    case 'TAMBAH_LAPORAN_LOKAL': {
      const me = cariMe(state)
      const laporan = buatLaporanLokal(state, me, action.draft)
      return gabungkanData({ ...state, laporanBaru: [laporan, ...state.laporanBaru] })
    }
    case 'LAPORAN_SERVER_BARU':
      return gabungkanData({ ...state, laporanServer: [action.laporan, ...state.laporanServer] })
    case 'PINDAHKAN_LAPORAN_KE_SERVER':
      return gabungkanData({
        ...state,
        laporanBaru: state.laporanBaru.filter((l) => l.id !== action.idLokal),
        laporanServer: [action.laporan, ...state.laporanServer],
      })
    case 'TAMBAH_KOMENTAR_LOKAL': {
      const me = cariMe(state)
      const k: Komentar = {
        id: `km-usr-${Date.now()}`,
        laporanId: action.laporanId,
        wargaId: me.id,
        nama: me.nama,
        inisial: me.inisial,
        warna: me.warna,
        peran: me.peran,
        teks: action.teks,
        waktu: new Date().toISOString(),
        suka: 0,
        mention: action.mention,
      }
      const bump = (l: Laporan) =>
        l.id === action.laporanId ? { ...l, jumlahKomentar: l.jumlahKomentar + 1 } : l
      return gabungkanData({
        ...state,
        komentarBaru: [...state.komentarBaru, k],
        laporanServer: state.laporanServer.map(bump),
        laporanBaru: state.laporanBaru.map(bump),
      })
    }
    case 'KOMENTAR_SERVER_BARU': {
      const bump = (l: Laporan) =>
        l.id === action.komentar.laporanId ? { ...l, jumlahKomentar: l.jumlahKomentar + 1 } : l
      return gabungkanData({
        ...state,
        komentarServer: [...state.komentarServer, action.komentar],
        laporanServer: state.laporanServer.map(bump),
        laporanBaru: state.laporanBaru.map(bump),
      })
    }
    case 'TOGGLE_SUKA_LAPORAN': {
      const on = state.sukaLaporan.includes(action.id)
      const delta = on ? -1 : 1
      const apply = (l: Laporan) =>
        l.id === action.id ? { ...l, jumlahSuka: l.jumlahSuka + delta } : l
      return gabungkanData({
        ...state,
        sukaLaporan: on
          ? state.sukaLaporan.filter((x) => x !== action.id)
          : [...state.sukaLaporan, action.id],
        laporanServer: state.laporanServer.map(apply),
        laporanBaru: state.laporanBaru.map(apply),
      })
    }
    case 'SET_JUMLAH_SUKA': {
      const apply = (l: Laporan) => (l.id === action.id ? { ...l, jumlahSuka: action.jumlahSuka } : l)
      return gabungkanData({
        ...state,
        laporanServer: state.laporanServer.map(apply),
        laporanBaru: state.laporanBaru.map(apply),
      })
    }
    case 'TOGGLE_SUKA_KOMENTAR': {
      const on = state.sukaKomentar.includes(action.id)
      const delta = on ? -1 : 1
      const apply = (k: Komentar) => (k.id === action.id ? { ...k, suka: k.suka + delta } : k)
      return {
        ...state,
        sukaKomentar: on
          ? state.sukaKomentar.filter((x) => x !== action.id)
          : [...state.sukaKomentar, action.id],
        komentar: state.komentar.map(apply),
        komentarServer: state.komentarServer.map(apply),
        komentarBaru: state.komentarBaru.map(apply),
      }
    }
    case 'BACA_REKOMENDASI':
      return {
        ...state,
        rekomendasiDibaca: state.rekomendasiDibaca.includes(action.id)
          ? state.rekomendasiDibaca
          : [...state.rekomendasiDibaca, action.id],
      }
    case 'TINDAK_ARAHAN':
      return {
        ...state,
        arahanDitindak: state.arahanDitindak.includes(action.id)
          ? state.arahanDitindak.filter((x) => x !== action.id)
          : [...state.arahanDitindak, action.id],
      }
    case 'BACA_NOTIF':
      return {
        ...state,
        notifDibaca: action.id
          ? [...new Set([...state.notifDibaca, action.id])]
          : state.notif.map((n) => n.id),
      }
    case 'SET_LANG':
      return { ...state, lang: action.lang }
    case 'SET_OFFLINE':
      return { ...state, offline: action.offline }
    case 'SET_GPS_MATI':
      return { ...state, gpsMati: action.mati }
    case 'SET_KAMERA_DITOLAK':
      return { ...state, kameraDitolak: action.ditolak }
    case 'SET_HARI':
      return { ...state, hariKe: ((action.hariKe - 1 + 40) % 40) + 1 }
    case 'SELESAI_ONBOARDING':
      return { ...state, onboardingSelesai: true }
    case 'TOAST':
      return { ...state, toast: { id: Date.now(), teks: action.teks, ikon: action.ikon } }
    case 'TUTUP_TOAST':
      return { ...state, toast: null }
    case 'RESET':
      localStorage.removeItem(STORAGE_KEY)
      return buildState(DEFAULT_PERSISTED)
    default:
      return state
  }
}

// --- Context -------------------------------------------------------------

interface StoreValue {
  state: State
  me: Warga
  masuk: boolean
  giliranHariIni: boolean
  noUrutHariIni: number
  statusWilayah: Status
  laporanTerakhirWilayah: Laporan | undefined
  peringatanTerdekat: Laporan | undefined
  peringatanJarak: { titikNama: string; jumlahTitik: number; arah: 'hulu' | 'hilir' } | undefined
  rekomendasiSaya: (Rekomendasi & { ditindak: boolean })[]
  notifBelumDibaca: number
  laporanById: (id: string) => Laporan | undefined
  komentarByLaporan: (id: string) => Komentar[]
  sukaLaporan: (id: string) => boolean
  sukaKomentar: (id: string) => boolean
  actions: {
    /** Masyarakat (warga responden): nomor urut + PIN. */
    loginMasyarakat: (noUrut: number, pin: string) => Promise<void>
    /** Peneliti: username + kata sandi. */
    loginPeneliti: (username: string, password: string) => Promise<void>
    logout: () => void
    tambahLaporan: (draft: DraftLaporan) => void
    /** Coba kirim ulang laporan yang masih tersimpan lokal (offline) ke server. */
    sinkronkan: () => Promise<{ berhasil: number; gagal: number }>
    tambahKomentar: (laporanId: string, teks: string, mention?: string) => void
    toggleSukaLaporan: (id: string) => void
    toggleSukaKomentar: (id: string) => void
    bacaRekomendasi: (id: string) => void
    tindakArahan: (id: string) => void
    bacaNotif: (id?: string) => void
    setLang: (lang: Lang) => void
    setOffline: (offline: boolean) => void
    setGpsMati: (mati: boolean) => void
    setKameraDitolak: (ditolak: boolean) => void
    setHari: (hariKe: number) => void
    selesaiOnboarding: () => void
    toast: (teks: string, ikon?: string) => void
    tutupToast: () => void
    reset: () => void
  }
}

const StoreCtx = createContext<StoreValue | null>(null)

export function AppStoreProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, () => buildState(loadPersisted()))
  const pernahPeringatkanKuota = useRef(false)

  // Persist hanya bagian yang bisa berubah (bukan cache data server).
  useEffect(() => {
    const p: Persisted = {
      auth: state.auth,
      direktori: state.direktori,
      laporanBaru: state.laporanBaru,
      komentarBaru: state.komentarBaru,
      lang: state.lang,
      offline: state.offline,
      hariKe: state.hariKe,
      sukaLaporan: state.sukaLaporan,
      sukaKomentar: state.sukaKomentar,
      rekomendasiDibaca: state.rekomendasiDibaca,
      arahanDitindak: state.arahanDitindak,
      notifDibaca: state.notifDibaca,
      onboardingSelesai: state.onboardingSelesai,
      gpsMati: state.gpsMati,
      kameraDitolak: state.kameraDitolak,
    }
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(p))
    } catch (err) {
      console.warn('Gagal menyimpan data ke penyimpanan lokal:', err)
      if (!pernahPeringatkanKuota.current) {
        pernahPeringatkanKuota.current = true
        dispatch({
          type: 'TOAST',
          teks: 'Penyimpanan HP penuh — laporan terbaru mungkin hilang setelah tutup aplikasi.',
          ikon: '⚠️',
        })
      }
    }
  }, [state])

  // Ambil data bersama (laporan + komentar) sekali setelah login.
  const tokenUntukMuat = state.auth?.token
  useEffect(() => {
    if (!tokenUntukMuat) return
    let batal = false
    dispatch({ type: 'MULAI_MUAT_DATA' })
    // Sesi dicek terpisah: token yang dicabut admin (PIN direset / akun
    // dinonaktifkan) langsung mengeluarkan pengguna. Gagal jaringan = abaikan,
    // supaya mode offline tetap jalan.
    ambilSaya(tokenUntukMuat).catch((e) => {
      if (batal || !(e instanceof ApiError) || (e.status !== 401 && e.status !== 403)) return
      dispatch({ type: 'LOGOUT' })
      dispatch({ type: 'TOAST', teks: 'Sesi Anda berakhir. Silakan masuk lagi.', ikon: '🔒' })
    })
    Promise.all([ambilLaporan(), ambilKomentar(), ambilDirektori().catch(() => null)])
      .then(([apiLaporan, apiKomentar, apiDirektori]) => {
        if (batal) return
        const direktori = apiDirektori ? gabungDirektori(apiDirektori) : state.direktori
        dispatch({
          type: 'DATA_SERVER_DIMUAT',
          laporan: apiLaporan.map((l) => enrichLaporan(l, direktori)),
          komentar: apiKomentar.map((k) => enrichKomentar(k, direktori)),
          direktori,
        })
      })
      .catch(() => {
        if (batal) return
        // Matikan indikator muat tanpa mengganti data — tetap pakai data lama/seed.
        dispatch({ type: 'DATA_SERVER_DIMUAT', laporan: state.laporanServer, komentar: state.komentarServer })
        dispatch({ type: 'TOAST', teks: 'Gagal memuat data terbaru — menampilkan data tersimpan.', ikon: '⚠️' })
      })
    return () => {
      batal = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tokenUntukMuat])

  // Auto-tutup toast
  useEffect(() => {
    if (!state.toast) return
    const id = setTimeout(() => dispatch({ type: 'TUTUP_TOAST' }), 2600)
    return () => clearTimeout(id)
  }, [state.toast])

  const me = cariMe(state)
  const myTitikIdx = TITIK.findIndex((x) => x.id === me.titikId)

  const value = useMemo<StoreValue>(() => {
    const laporanById = (id: string) => state.laporan.find((l) => l.id === id)
    const komentarByLaporan = (id: string) =>
      state.komentar
        .filter((k) => k.laporanId === id)
        .sort((a, b) => {
          if (!!a.disematkan !== !!b.disematkan) return a.disematkan ? -1 : 1
          return +new Date(a.waktu) - +new Date(b.waktu)
        })

    const laporanWilayah = state.laporan
      .filter((l) => l.titikId === me.titikId)
      .sort((a, b) => +new Date(b.waktuUpload) - +new Date(a.waktuUpload))
    const laporanTerakhirWilayah = laporanWilayah[0]
    const statusWilayah: Status =
      laporanTerakhirWilayah?.statusTerverifikasi ??
      laporanTerakhirWilayah?.statusPelapor ??
      'aman'

    // Peringatan personal: titik tetangga (±2 titik) yang berstatus BAHAYA (bagian 6.1).
    // Bukan titik sendiri — supaya tidak salah dibaca sebagai status wilayah sendiri.
    const peringatanTerdekat = state.laporan
      .filter((l) => {
        const idx = TITIK.findIndex((x) => x.id === l.titikId)
        const efektif = l.statusTerverifikasi ?? l.statusPelapor
        return efektif === 'bahaya' && idx !== myTitikIdx && Math.abs(idx - myTitikIdx) <= 2
      })
      .sort((a, b) => +new Date(b.waktuUpload) - +new Date(a.waktuUpload))[0]

    const peringatanJarak = peringatanTerdekat
      ? (() => {
          const idx = TITIK.findIndex((x) => x.id === peringatanTerdekat.titikId)
          return {
            titikNama: TITIK[idx].nama,
            jumlahTitik: Math.abs(idx - myTitikIdx),
            arah: (idx < myTitikIdx ? 'hulu' : 'hilir') as 'hulu' | 'hilir',
          }
        })()
      : undefined

    const rekomendasiSaya = [...state.rekomendasi]
      .map((r) => ({
        ...r,
        dibaca: r.dibaca || state.rekomendasiDibaca.includes(r.id),
        ditindak: state.arahanDitindak.includes(r.id),
      }))
      .sort((a, b) => +new Date(b.waktu) - +new Date(a.waktu))

    const notifBelumDibaca = state.notif.filter(
      (n) => !n.dibaca && !state.notifDibaca.includes(n.id),
    ).length

    return {
      state,
      me,
      masuk: !!state.auth,
      giliranHariIni: noUrutHariIni(state.hariKe) === me.noUrut,
      noUrutHariIni: noUrutHariIni(state.hariKe),
      statusWilayah,
      laporanTerakhirWilayah,
      peringatanTerdekat,
      peringatanJarak,
      rekomendasiSaya,
      notifBelumDibaca,
      laporanById,
      komentarByLaporan,
      sukaLaporan: (id) => state.sukaLaporan.includes(id),
      sukaKomentar: (id) => state.sukaKomentar.includes(id),
      actions: {
        loginMasyarakat: async (noUrut, pin) => {
          dispatch({ type: 'LOGIN_BERHASIL', sesi: keSesi(await loginMasyarakat(noUrut, pin)) })
        },
        loginPeneliti: async (username, password) => {
          dispatch({ type: 'LOGIN_BERHASIL', sesi: keSesi(await loginDenganUsername('peneliti', username, password)) })
        },
        logout: () => dispatch({ type: 'LOGOUT' }),
        tambahLaporan: (draft) => {
          const auth = state.auth
          if (!auth || !draft.fotoTersinkron) {
            // Belum login (seharusnya tak terjadi) atau foto belum sempat ke
            // server — simpan lokal dulu, sinkronkan() yang akan unggah fotonya
            // lalu kirim laporannya ke server.
            dispatch({ type: 'TAMBAH_LAPORAN_LOKAL', draft })
            return
          }
          buatLaporan(auth.token, {
            titikId: me.titikId,
            noUrutHari: noUrutHariIni(state.hariKe),
            fotoUrl: draft.fotoUrl,
            fotoAsliNama: draft.fotoAsliNama,
            fotoDariRaw: draft.fotoDariRaw,
            lat: draft.gps?.latitude ?? TITIK.find((x) => x.id === me.titikId)!.koordinat.lat,
            lng: draft.gps?.longitude ?? TITIK.find((x) => x.id === me.titikId)!.koordinat.lng,
            koordinatDariExif: !!draft.gps,
            statusPelapor: draft.status,
            darurat: draft.darurat,
          })
            .then((hasil) => dispatch({ type: 'LAPORAN_SERVER_BARU', laporan: enrichLaporan(hasil, state.direktori) }))
            .catch(() => dispatch({ type: 'TAMBAH_LAPORAN_LOKAL', draft }))
        },
        sinkronkan: async () => {
          const auth = state.auth
          if (!auth) return { berhasil: 0, gagal: 0 }
          const tertunda = state.laporanBaru.filter((l) => l.offline)
          let berhasil = 0
          let gagal = 0
          for (const l of tertunda) {
            try {
              let fotoUrlServer = l.fotoUrl ?? null
              if (fotoUrlServer?.startsWith('data:')) {
                fotoUrlServer = await unggahFotoKeServer(fotoUrlServer, auth.token)
              }
              const hasil = await buatLaporan(auth.token, {
                titikId: l.titikId,
                noUrutHari: l.noUrutHari,
                fotoUrl: fotoUrlServer,
                fotoAsliNama: l.fotoAsliNama,
                fotoDariRaw: l.fotoDariRaw,
                lat: l.koordinat.lat,
                lng: l.koordinat.lng,
                koordinatDariExif: l.koordinatDariExif,
                statusPelapor: l.statusPelapor,
                darurat: l.darurat,
              })
              dispatch({ type: 'PINDAHKAN_LAPORAN_KE_SERVER', idLokal: l.id, laporan: enrichLaporan(hasil, state.direktori) })
              berhasil++
            } catch {
              gagal++ // tetap offline, biar bisa dicoba lagi nanti
            }
          }
          return { berhasil, gagal }
        },
        tambahKomentar: (laporanId, teks, mention) => {
          const auth = state.auth
          if (!auth) return
          buatKomentar(auth.token, laporanId, teks, mention)
            .then((hasil) => dispatch({ type: 'KOMENTAR_SERVER_BARU', komentar: enrichKomentar(hasil, state.direktori) }))
            .catch(() => {
              dispatch({ type: 'TAMBAH_KOMENTAR_LOKAL', laporanId, teks, mention })
              dispatch({ type: 'TOAST', teks: 'Server tak terjangkau — komentar tersimpan lokal saja.', ikon: '⚠️' })
            })
        },
        toggleSukaLaporan: (id) => {
          dispatch({ type: 'TOGGLE_SUKA_LAPORAN', id })
          const auth = state.auth
          if (!auth) return
          toggleSukaLaporanApi(auth.token, id)
            .then((hasil) => dispatch({ type: 'SET_JUMLAH_SUKA', id, jumlahSuka: hasil.jumlahSuka }))
            .catch(() => {})
        },
        toggleSukaKomentar: (id) => dispatch({ type: 'TOGGLE_SUKA_KOMENTAR', id }),
        bacaRekomendasi: (id) => dispatch({ type: 'BACA_REKOMENDASI', id }),
        tindakArahan: (id) => dispatch({ type: 'TINDAK_ARAHAN', id }),
        bacaNotif: (id) => dispatch({ type: 'BACA_NOTIF', id }),
        setLang: (lang) => dispatch({ type: 'SET_LANG', lang }),
        setOffline: (offline) => dispatch({ type: 'SET_OFFLINE', offline }),
        setGpsMati: (mati) => dispatch({ type: 'SET_GPS_MATI', mati }),
        setKameraDitolak: (ditolak) => dispatch({ type: 'SET_KAMERA_DITOLAK', ditolak }),
        setHari: (hariKe) => dispatch({ type: 'SET_HARI', hariKe }),
        selesaiOnboarding: () => dispatch({ type: 'SELESAI_ONBOARDING' }),
        toast: (teks, ikon) => dispatch({ type: 'TOAST', teks, ikon }),
        tutupToast: () => dispatch({ type: 'TUTUP_TOAST' }),
        reset: () => dispatch({ type: 'RESET' }),
      },
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state])

  return <StoreCtx.Provider value={value}>{children}</StoreCtx.Provider>
}

export function useApp(): StoreValue {
  const ctx = useContext(StoreCtx)
  if (!ctx) throw new Error('useApp harus dipakai di dalam <AppStoreProvider>')
  return ctx
}

export { ApiError }
