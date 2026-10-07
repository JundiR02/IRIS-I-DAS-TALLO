import { useState, type FormEvent } from 'react'
import { LogIn, ShieldCheck, Users, FlaskConical } from 'lucide-react'
import { useApp } from '../store/store'
import { ApiError } from '../lib/api'
import Logo from '../components/Logo'

type Jenis = 'masyarakat' | 'peneliti'

const INPUT =
  'w-full rounded-pill border-2 border-bone-200 bg-white px-4 py-3.5 text-lg font-bold text-ink outline-none placeholder:text-ink-faint placeholder:font-normal focus:border-forest'

export default function Login() {
  const { actions } = useApp()
  const [jenis, setJenis] = useState<Jenis>('masyarakat')
  const [noUrut, setNoUrut] = useState('')
  const [pin, setPin] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [memuat, setMemuat] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const gantiJenis = (j: Jenis) => {
    setJenis(j)
    setError(null)
  }

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    if (jenis === 'masyarakat') {
      const n = Number(noUrut)
      if (!noUrut || Number.isNaN(n) || !pin) {
        setError('Isi nomor urut dan PIN Anda.')
        return
      }
    } else if (!username.trim() || !password) {
      setError('Isi username dan kata sandi Anda.')
      return
    }
    setMemuat(true)
    try {
      if (jenis === 'masyarakat') await actions.loginMasyarakat(Number(noUrut), pin)
      else await actions.loginPeneliti(username.trim(), password)
    } catch (e) {
      setError(
        e instanceof ApiError
          ? e.message
          : 'Tidak bisa terhubung ke server. Periksa sinyal internet Anda.',
      )
    } finally {
      setMemuat(false)
    }
  }

  return (
    <div className="app-scroll flex min-h-0 flex-1 flex-col items-center justify-center overflow-y-auto bg-bone-50 px-7 py-8">
      <Logo size={48} />
      <h1 className="mt-6 text-center text-xl font-extrabold text-ink">Masuk ke IRIS-I</h1>

      {/* Pilih jenis akun — dua pintu masuk yang berbeda */}
      <div className="mt-5 grid w-full grid-cols-2 gap-1 rounded-pill bg-bone-200 p-1" role="tablist">
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
            aria-selected={jenis === v}
            onClick={() => gantiJenis(v)}
            className={`flex items-center justify-center gap-1.5 rounded-pill py-2.5 text-sm font-extrabold transition-colors ${
              jenis === v ? 'bg-white text-ink shadow-soft' : 'text-ink-muted'
            }`}
          >
            <Ikon size={15} /> {label}
          </button>
        ))}
      </div>

      <p className="mt-3 text-center text-[13px] leading-relaxed text-ink-muted">
        {jenis === 'masyarakat'
          ? 'Pakai nomor urut responden & PIN yang sudah diberikan tim IRIS.'
          : 'Pakai username & kata sandi peneliti dari admin IRIS.'}
      </p>

      <form onSubmit={submit} className="mt-5 w-full space-y-3">
        {jenis === 'masyarakat' ? (
          <>
            <div>
              <label htmlFor="noUrut" className="mb-1.5 block text-[12px] font-bold text-ink-soft">
                Nomor urut responden
              </label>
              <input
                id="noUrut"
                type="tel"
                inputMode="numeric"
                autoComplete="off"
                placeholder="mis. 7"
                value={noUrut}
                onChange={(e) => setNoUrut(e.target.value.replace(/[^0-9]/g, ''))}
                className={INPUT}
              />
            </div>
            <div>
              <label htmlFor="pin" className="mb-1.5 block text-[12px] font-bold text-ink-soft">
                PIN
              </label>
              <input
                id="pin"
                type="password"
                inputMode="numeric"
                autoComplete="off"
                placeholder="••••"
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/[^0-9]/g, ''))}
                className={`${INPUT} tracking-[0.3em] placeholder:tracking-normal`}
              />
            </div>
          </>
        ) : (
          <>
            <div>
              <label htmlFor="username" className="mb-1.5 block text-[12px] font-bold text-ink-soft">
                Username
              </label>
              <input
                id="username"
                type="text"
                autoCapitalize="none"
                autoComplete="username"
                placeholder="mis. amaliah"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className={INPUT}
              />
            </div>
            <div>
              <label htmlFor="password" className="mb-1.5 block text-[12px] font-bold text-ink-soft">
                Kata sandi
              </label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={INPUT}
              />
            </div>
          </>
        )}

        {error && (
          <p className="rounded-xl bg-bahaya-wash px-3.5 py-2.5 text-[12.5px] font-semibold text-bahaya-ink">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={memuat}
          className="flex w-full items-center justify-center gap-2 rounded-pill bg-forest py-4 text-base font-extrabold text-white shadow-fab active:scale-[0.98] disabled:opacity-60"
        >
          <LogIn size={18} /> {memuat ? 'Memeriksa…' : 'Masuk'}
        </button>
      </form>

      {jenis === 'masyarakat' ? (
        <p className="mt-6 flex items-center gap-1.5 text-center text-[11px] text-ink-faint">
          <ShieldCheck size={13} /> Lupa PIN? Hubungi tim IRIS atau pengurus RT/RW Anda.
        </p>
      ) : (
        <p className="mt-6 text-center text-[11px] leading-relaxed text-ink-faint">
          Verifikasi laporan & rekomendasi dilakukan di{' '}
          <a href="#/panel" className="font-bold text-forest underline">
            Panel IRIS
          </a>{' '}
          (lebih nyaman di komputer).
        </p>
      )}
    </div>
  )
}
