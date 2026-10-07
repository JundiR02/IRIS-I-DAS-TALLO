import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from 'react'
import {
  ApiError,
  ambilDirektori,
  ambilKomentar,
  ambilLaporan,
  ambilRingkasan,
  ambilSaya,
  daftarAkun,
  type AkunAdminApi,
  type KomentarApi,
  type LaporanApi,
  type ProfilApi,
  type RingkasanPanel,
} from '../lib/api'

// Sesi & data Panel — terpisah dari store aplikasi warga (store/store.tsx):
// admin/peneliti bisa masuk Panel di komputer tanpa mengganggu sesi HP.

const STORAGE_KEY = 'iris-i-tallo.panel.v1'

export interface SesiPanel {
  token: string
  akun: ProfilApi
}

function muatSesi(): SesiPanel | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as SesiPanel) : null
  } catch {
    return null
  }
}

interface PanelValue {
  sesi: SesiPanel | null
  isAdmin: boolean
  masuk: (sesi: SesiPanel) => void
  keluar: (pesan?: string) => void
  pesanKeluar: string | null
  laporan: LaporanApi[]
  komentar: KomentarApi[]
  direktori: ProfilApi[]
  akun: AkunAdminApi[]
  ringkasan: RingkasanPanel | null
  memuat: boolean
  galat: string | null
  muatUlang: () => Promise<void>
  /** Hitung ulang angka ringkasan sesudah verifikasi/hapus/ubah akun. */
  segarkanRingkasan: () => void
  profil: (id: string) => ProfilApi | undefined
  /** Jalankan aksi ber-token; 401 → keluar otomatis. Mengembalikan null kalau gagal (pesan sudah ditampilkan). */
  jalankan: <T>(aksi: (token: string) => Promise<T>) => Promise<T | null>
  setLaporan: Dispatch<SetStateAction<LaporanApi[]>>
  setKomentar: Dispatch<SetStateAction<KomentarApi[]>>
  setAkun: Dispatch<SetStateAction<AkunAdminApi[]>>
  notif: { id: number; teks: string; jenis: 'ok' | 'galat' } | null
  beriNotif: (teks: string, jenis?: 'ok' | 'galat') => void
}

const Ctx = createContext<PanelValue | null>(null)

export function PanelProvider({ children }: { children: ReactNode }) {
  const [sesi, setSesi] = useState<SesiPanel | null>(muatSesi)
  const [pesanKeluar, setPesanKeluar] = useState<string | null>(null)
  const [laporan, setLaporan] = useState<LaporanApi[]>([])
  const [komentar, setKomentar] = useState<KomentarApi[]>([])
  const [direktori, setDirektori] = useState<ProfilApi[]>([])
  const [akun, setAkun] = useState<AkunAdminApi[]>([])
  const [ringkasan, setRingkasan] = useState<RingkasanPanel | null>(null)
  const [memuat, setMemuat] = useState(false)
  const [galat, setGalat] = useState<string | null>(null)
  const [notif, setNotif] = useState<PanelValue['notif']>(null)

  const isAdmin = sesi?.akun.peran === 'admin'

  const masuk = useCallback((s: SesiPanel) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(s))
    } catch {
      /* sesi tetap jalan di memori */
    }
    setPesanKeluar(null)
    setSesi(s)
  }, [])

  const keluar = useCallback((pesan?: string) => {
    try {
      localStorage.removeItem(STORAGE_KEY)
    } catch {
      /* abaikan */
    }
    setSesi(null)
    setPesanKeluar(pesan ?? null)
    setLaporan([])
    setKomentar([])
    setAkun([])
    setRingkasan(null)
  }, [])

  const beriNotif = useCallback((teks: string, jenis: 'ok' | 'galat' = 'ok') => {
    setNotif({ id: Date.now(), teks, jenis })
  }, [])

  useEffect(() => {
    if (!notif) return
    const t = setTimeout(() => setNotif(null), 3200)
    return () => clearTimeout(t)
  }, [notif])

  const tanganiGalat = useCallback(
    (e: unknown): string => {
      if (e instanceof ApiError && e.status === 401) {
        keluar('Sesi berakhir. Silakan masuk lagi.')
        return 'Sesi berakhir.'
      }
      return e instanceof ApiError ? e.message : 'Tidak bisa terhubung ke server.'
    },
    [keluar],
  )

  const muatUlang = useCallback(async () => {
    if (!sesi) return
    setMemuat(true)
    setGalat(null)
    try {
      const [saya, lap, kom, dir, ring, daftar] = await Promise.all([
        ambilSaya(sesi.token),
        ambilLaporan({ limit: 1000 }),
        ambilKomentar(),
        ambilDirektori(),
        ambilRingkasan(sesi.token),
        sesi.akun.peran === 'admin' ? daftarAkun(sesi.token) : Promise.resolve([] as AkunAdminApi[]),
      ])
      if (saya.peran !== sesi.akun.peran) {
        keluar('Peran akun Anda berubah. Silakan masuk lagi.')
        return
      }
      setLaporan(lap)
      setKomentar(kom)
      setDirektori(dir)
      setRingkasan(ring)
      setAkun(daftar)
    } catch (e) {
      setGalat(tanganiGalat(e))
    } finally {
      setMemuat(false)
    }
  }, [sesi, keluar, tanganiGalat])

  useEffect(() => {
    void muatUlang()
  }, [muatUlang])

  const segarkanRingkasan = useCallback(() => {
    if (!sesi) return
    ambilRingkasan(sesi.token).then(setRingkasan).catch(() => {})
  }, [sesi])

  const jalankan = useCallback(
    async <T,>(aksi: (token: string) => Promise<T>): Promise<T | null> => {
      if (!sesi) return null
      try {
        return await aksi(sesi.token)
      } catch (e) {
        beriNotif(tanganiGalat(e), 'galat')
        return null
      }
    },
    [sesi, beriNotif, tanganiGalat],
  )

  const value = useMemo<PanelValue>(() => {
    const peta = new Map(direktori.map((p) => [p.id, p]))
    return {
      sesi,
      isAdmin,
      masuk,
      keluar,
      pesanKeluar,
      laporan,
      komentar,
      direktori,
      akun,
      ringkasan,
      memuat,
      galat,
      muatUlang,
      segarkanRingkasan,
      profil: (id) => peta.get(id),
      jalankan,
      setLaporan,
      setKomentar,
      setAkun,
      notif,
      beriNotif,
    }
  }, [sesi, isAdmin, masuk, keluar, pesanKeluar, laporan, komentar, direktori, akun, ringkasan, memuat, galat, muatUlang, segarkanRingkasan, jalankan, notif, beriNotif])

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function usePanel(): PanelValue {
  const v = useContext(Ctx)
  if (!v) throw new Error('usePanel harus dipakai di dalam <PanelProvider>')
  return v
}
