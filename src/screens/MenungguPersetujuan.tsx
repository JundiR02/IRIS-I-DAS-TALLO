import { useEffect, useState } from 'react'
import { Hourglass, RefreshCw, LogOut } from 'lucide-react'
import { useApp } from '../store/store'
import Logo from '../components/Logo'

/** Tampil untuk akun daftar sendiri yang belum disetujui admin. */
export default function MenungguPersetujuan() {
  const { state, actions } = useApp()
  const [memuat, setMemuat] = useState(false)
  const [pesan, setPesan] = useState<string | null>(null)

  const cek = async (diam = false) => {
    setMemuat(true)
    setPesan(null)
    try {
      const ok = await actions.cekPersetujuan()
      if (ok) actions.toast('Akun Anda sudah disetujui. Selamat datang!', '🎉')
      else if (!diam) setPesan('Belum disetujui. Coba lagi nanti.')
    } catch {
      if (!diam) setPesan('Tidak bisa terhubung ke server. Periksa sinyal internet Anda.')
    } finally {
      setMemuat(false)
    }
  }

  // Cek otomatis tiap 30 detik selama layar ini terbuka.
  useEffect(() => {
    const t = setInterval(() => void cek(true), 30_000)
    return () => clearInterval(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="flex min-h-0 flex-1 flex-col items-center justify-center bg-bone-50 px-7 text-center">
      <Logo size={44} />
      <span className="mt-8 grid h-16 w-16 place-items-center rounded-full bg-waspada-wash text-waspada-ink">
        <Hourglass size={28} />
      </span>
      <h1 className="mt-4 text-xl font-extrabold text-ink">Menunggu persetujuan</h1>
      <p className="mt-2 text-[14px] leading-relaxed text-ink-soft">
        Halo <b>{state.auth?.nama ?? 'Anda'}</b>, pendaftaran Anda sudah kami terima. Admin IRIS akan memeriksa dan
        menetapkan peran Anda (masyarakat atau peneliti).
      </p>
      <p className="mt-2 text-[12.5px] text-ink-muted">Setelah disetujui, aplikasi akan langsung terbuka di sini.</p>

      {pesan && <p className="mt-4 rounded-xl bg-bone-200 px-3 py-2 text-[12.5px] font-semibold text-ink-soft">{pesan}</p>}

      <button
        onClick={() => void cek()}
        disabled={memuat}
        className="mt-6 flex w-full items-center justify-center gap-2 rounded-pill bg-forest py-3.5 font-extrabold text-white disabled:opacity-60"
      >
        <RefreshCw size={17} className={memuat ? 'animate-spin' : ''} /> {memuat ? 'Memeriksa…' : 'Cek status'}
      </button>
      <button onClick={() => actions.logout()} className="mt-3 flex items-center gap-1.5 text-[13px] font-bold text-ink-muted">
        <LogOut size={14} /> Keluar
      </button>
    </div>
  )
}
