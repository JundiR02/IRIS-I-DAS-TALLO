import { useState, type FormEvent } from 'react'
import { LogIn, ShieldCheck, Users, FlaskConical, UserPlus, ArrowLeft } from 'lucide-react'
import { useApp } from '../store/store'
import { ApiError } from '../lib/api'
import Logo from '../components/Logo'

type Jenis = 'masyarakat' | 'peneliti'

const INPUT =
  'w-full rounded-pill border-2 border-bone-200 bg-white px-4 py-3.5 text-lg font-bold text-ink outline-none placeholder:text-ink-faint placeholder:font-normal focus:border-forest'
const LABEL = 'mb-1.5 block text-[12px] font-bold text-ink-soft'

function pesanGalat(e: unknown): string {
  return e instanceof ApiError ? e.message : 'Tidak bisa terhubung ke server. Periksa sinyal internet Anda.'
}

function PilihJenis({ nilai, ubah, label }: { nilai: Jenis; ubah: (j: Jenis) => void; label?: string }) {
  return (
    <div className="grid w-full grid-cols-2 gap-1 rounded-pill bg-bone-200 p-1" role="tablist" aria-label={label}>
      {(
        [
          { v: 'masyarakat', label: 'Masyarakat', Ikon: Users },
          { v: 'peneliti', label: 'Peneliti', Ikon: FlaskConical },
        ] as const
      ).map(({ v, label, Ikon }) => (
        <button
          key={v}
          type="button"
          role="tab"
          aria-selected={nilai === v}
          onClick={() => ubah(v)}
          className={`flex items-center justify-center gap-1.5 rounded-pill py-2.5 text-sm font-extrabold transition-colors ${
            nilai === v ? 'bg-white text-ink shadow-soft' : 'text-ink-muted'
          }`}
        >
          <Ikon size={15} /> {label}
        </button>
      ))}
    </div>
  )
}

export default function Login() {
  const [mode, setMode] = useState<'masuk' | 'daftar'>('masuk')
  return (
    <div className="app-scroll flex min-h-0 flex-1 flex-col items-center justify-center overflow-y-auto bg-bone-50 px-7 py-8">
      <Logo size={48} />
      {mode === 'masuk' ? <FormMasuk keDaftar={() => setMode('daftar')} /> : <FormDaftar keMasuk={() => setMode('masuk')} />}
    </div>
  )
}

function FormMasuk({ keDaftar }: { keDaftar: () => void }) {
  const { actions } = useApp()
  const [jenis, setJenis] = useState<Jenis>('masyarakat')
  const [identitas, setIdentitas] = useState('')
  const [rahasia, setRahasia] = useState('')
  const [memuat, setMemuat] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!identitas.trim() || !rahasia) {
      setError(jenis === 'masyarakat' ? 'Isi nomor urut / email / no. HP dan PIN / kata sandi.' : 'Isi username/email dan kata sandi.')
      return
    }
    setMemuat(true)
    try {
      if (jenis === 'masyarakat') await actions.loginMasyarakat(identitas, rahasia)
      else await actions.loginPeneliti(identitas.trim(), rahasia)
    } catch (e) {
      setError(pesanGalat(e))
    } finally {
      setMemuat(false)
    }
  }

  return (
    <>
      <h1 className="mt-6 text-center text-xl font-extrabold text-ink">Masuk ke IRIS-I</h1>
      <div className="mt-5 w-full">
        <PilihJenis
          nilai={jenis}
          ubah={(j) => {
            setJenis(j)
            setError(null)
          }}
        />
      </div>

      <form onSubmit={submit} className="mt-5 w-full space-y-3">
        <div>
          <label htmlFor="identitas" className={LABEL}>
            {jenis === 'masyarakat' ? 'Nomor urut, email, atau no. HP' : 'Username atau email'}
          </label>
          <input
            id="identitas"
            type="text"
            autoCapitalize="none"
            autoComplete="username"
            placeholder={jenis === 'masyarakat' ? 'mis. 7 atau 0812…' : 'mis. nama@gmail.com'}
            value={identitas}
            onChange={(e) => setIdentitas(e.target.value)}
            className={INPUT}
          />
        </div>
        <div>
          <label htmlFor="rahasia" className={LABEL}>
            {jenis === 'masyarakat' ? 'PIN atau kata sandi' : 'Kata sandi'}
          </label>
          <input
            id="rahasia"
            type="password"
            autoComplete="current-password"
            placeholder="••••••"
            value={rahasia}
            onChange={(e) => setRahasia(e.target.value)}
            className={INPUT}
          />
        </div>

        {error && (
          <p className="rounded-xl bg-bahaya-wash px-3.5 py-2.5 text-[12.5px] font-semibold text-bahaya-ink">{error}</p>
        )}

        <button
          type="submit"
          disabled={memuat}
          className="flex w-full items-center justify-center gap-2 rounded-pill bg-forest py-4 text-base font-extrabold text-white shadow-fab active:scale-[0.98] disabled:opacity-60"
        >
          <LogIn size={18} /> {memuat ? 'Memeriksa…' : 'Masuk'}
        </button>
      </form>

      <button
        onClick={keDaftar}
        className="mt-4 flex w-full items-center justify-center gap-2 rounded-pill border-2 border-forest py-3 text-sm font-extrabold text-forest"
      >
        <UserPlus size={16} /> Belum punya akun? Daftar
      </button>

      {jenis === 'masyarakat' ? (
        <p className="mt-5 flex items-center gap-1.5 text-center text-[11px] text-ink-faint">
          <ShieldCheck size={13} /> Lupa PIN? Hubungi tim IRIS atau pengurus RT/RW Anda.
        </p>
      ) : (
        <p className="mt-5 text-center text-[11px] leading-relaxed text-ink-faint">
          Verifikasi laporan & rekomendasi dilakukan di{' '}
          <a href="#/panel" className="font-bold text-forest underline">
            Panel IRIS
          </a>{' '}
          (lebih nyaman di komputer).
        </p>
      )}
    </>
  )
}

function FormDaftar({ keMasuk }: { keMasuk: () => void }) {
  const { actions } = useApp()
  const [jenis, setJenis] = useState<Jenis>('masyarakat')
  const [nama, setNama] = useState('')
  const [kontak, setKontak] = useState('')
  const [kelurahan, setKelurahan] = useState('')
  const [sandi, setSandi] = useState('')
  const [ulang, setUlang] = useState('')
  const [memuat, setMemuat] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    if (nama.trim().length < 2) return setError('Isi nama lengkap Anda.')
    if (!kontak.trim()) return setError('Isi email atau nomor HP — dipakai untuk masuk.')
    if (sandi.length < 8) return setError('Kata sandi minimal 8 karakter.')
    if (sandi !== ulang) return setError('Ulangi kata sandi — keduanya belum sama.')
    setMemuat(true)
    try {
      await actions.daftar({
        nama: nama.trim(),
        kontak: kontak.trim(),
        sandi,
        peranDiminta: jenis === 'peneliti' ? 'peneliti' : 'warga',
        kelurahan: kelurahan.trim() || undefined,
      })
    } catch (e) {
      setError(pesanGalat(e))
    } finally {
      setMemuat(false)
    }
  }

  return (
    <>
      <h1 className="mt-6 text-center text-xl font-extrabold text-ink">Daftar akun IRIS-I</h1>
      <p className="mt-1.5 text-center text-[13px] leading-relaxed text-ink-muted">
        Setelah mendaftar, admin IRIS akan memeriksa dan menetapkan peran Anda.
      </p>

      <form onSubmit={submit} className="mt-5 w-full space-y-3">
        <div>
          <p className={LABEL}>Saya mendaftar sebagai</p>
          <PilihJenis nilai={jenis} ubah={setJenis} label="Mendaftar sebagai" />
        </div>
        <div>
          <label htmlFor="d-nama" className={LABEL}>
            Nama lengkap
          </label>
          <input id="d-nama" autoComplete="name" value={nama} maxLength={60} onChange={(e) => setNama(e.target.value)} className={INPUT} />
        </div>
        <div>
          <label htmlFor="d-kontak" className={LABEL}>
            Email atau nomor HP
          </label>
          <input
            id="d-kontak"
            autoCapitalize="none"
            autoComplete="username"
            placeholder="0812… atau nama@gmail.com"
            value={kontak}
            onChange={(e) => setKontak(e.target.value)}
            className={INPUT}
          />
        </div>
        <div>
          <label htmlFor="d-kel" className={LABEL}>
            {jenis === 'masyarakat' ? 'Kelurahan tempat tinggal' : 'Instansi / unit'}{' '}
            <span className="font-normal text-ink-faint">(boleh dikosongkan)</span>
          </label>
          <input
            id="d-kel"
            value={kelurahan}
            maxLength={60}
            placeholder={jenis === 'masyarakat' ? 'mis. Pampang' : 'mis. Universitas Hasanuddin'}
            onChange={(e) => setKelurahan(e.target.value)}
            className={INPUT}
          />
        </div>
        <div>
          <label htmlFor="d-sandi" className={LABEL}>
            Buat kata sandi
          </label>
          <input id="d-sandi" type="password" autoComplete="new-password" value={sandi} onChange={(e) => setSandi(e.target.value)} className={INPUT} />
          <p className="mt-1 px-1 text-[11.5px] text-ink-muted">Minimal 8 karakter. Hanya Anda yang tahu — admin pun tidak.</p>
        </div>
        <div>
          <label htmlFor="d-ulang" className={LABEL}>
            Ulangi kata sandi
          </label>
          <input id="d-ulang" type="password" autoComplete="new-password" value={ulang} onChange={(e) => setUlang(e.target.value)} className={INPUT} />
        </div>

        {error && (
          <p className="rounded-xl bg-bahaya-wash px-3.5 py-2.5 text-[12.5px] font-semibold text-bahaya-ink">{error}</p>
        )}

        <button
          type="submit"
          disabled={memuat}
          className="flex w-full items-center justify-center gap-2 rounded-pill bg-forest py-4 text-base font-extrabold text-white shadow-fab active:scale-[0.98] disabled:opacity-60"
        >
          <UserPlus size={18} /> {memuat ? 'Mendaftarkan…' : 'Daftar'}
        </button>
      </form>

      <button onClick={keMasuk} className="mt-4 flex items-center gap-1.5 text-[13px] font-bold text-ink-muted">
        <ArrowLeft size={14} /> Sudah punya akun? Masuk
      </button>
    </>
  )
}
