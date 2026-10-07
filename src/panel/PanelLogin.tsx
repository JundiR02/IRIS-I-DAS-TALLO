import { useState, type FormEvent } from 'react'
import { LogIn, ShieldCheck, FlaskConical, ArrowLeft } from 'lucide-react'
import { ApiError, loginDenganUsername } from '../lib/api'
import Logo from '../components/Logo'
import { usePanel } from './usePanel'
import { INPUT, LABEL } from './ui'

type Peran = 'admin' | 'peneliti'

export default function PanelLogin() {
  const { masuk, pesanKeluar } = usePanel()
  const [peran, setPeran] = useState<Peran>('peneliti')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [memuat, setMemuat] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!username.trim() || !password) {
      setError('Isi username dan kata sandi.')
      return
    }
    setMemuat(true)
    try {
      const sesi = await loginDenganUsername(peran, username.trim(), password)
      masuk({ token: sesi.token, akun: sesi.warga })
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Tidak bisa terhubung ke server.')
    } finally {
      setMemuat(false)
    }
  }

  return (
    <div className="flex min-h-full items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm rounded-card bg-bone-50 p-7 shadow-lift">
        <Logo size={40} />
        <h1 className="mt-5 text-xl font-extrabold text-ink">Panel IRIS-I</h1>
        <p className="mt-1 text-[13px] text-ink-muted">Verifikasi laporan, rekomendasi, dan pengelolaan akun.</p>

        <div className="mt-5 grid grid-cols-2 gap-1 rounded-pill bg-bone-200 p-1" role="tablist">
          {(
            [
              { v: 'peneliti', label: 'Peneliti', Ikon: FlaskConical },
              { v: 'admin', label: 'Admin', Ikon: ShieldCheck },
            ] as const
          ).map(({ v, label, Ikon }) => (
            <button
              key={v}
              type="button"
              role="tab"
              aria-selected={peran === v}
              onClick={() => {
                setPeran(v)
                setError(null)
              }}
              className={`flex items-center justify-center gap-1.5 rounded-pill py-2 text-sm font-extrabold ${
                peran === v ? 'bg-white text-ink shadow-soft' : 'text-ink-muted'
              }`}
            >
              <Ikon size={15} /> {label}
            </button>
          ))}
        </div>

        {pesanKeluar && !error && (
          <p className="mt-4 rounded-xl bg-waspada-wash px-3 py-2 text-[12.5px] font-semibold text-waspada-ink">{pesanKeluar}</p>
        )}

        <form onSubmit={submit} className="mt-4 space-y-3">
          <div>
            <label htmlFor="p-username" className={LABEL}>
              Username
            </label>
            <input
              id="p-username"
              autoComplete="username"
              autoCapitalize="none"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className={INPUT}
            />
          </div>
          <div>
            <label htmlFor="p-password" className={LABEL}>
              Kata sandi
            </label>
            <input
              id="p-password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={INPUT}
            />
          </div>
          {error && (
            <p className="rounded-xl bg-bahaya-wash px-3 py-2 text-[12.5px] font-semibold text-bahaya-ink">{error}</p>
          )}
          <button
            type="submit"
            disabled={memuat}
            className="flex w-full items-center justify-center gap-2 rounded-pill bg-forest py-3 font-extrabold text-white disabled:opacity-60"
          >
            <LogIn size={17} /> {memuat ? 'Memeriksa…' : `Masuk sebagai ${peran === 'admin' ? 'Admin' : 'Peneliti'}`}
          </button>
        </form>

        <a href="#/" className="mt-5 inline-flex items-center gap-1 text-[12px] font-bold text-ink-muted hover:text-ink">
          <ArrowLeft size={13} /> Ke aplikasi warga
        </a>
      </div>
    </div>
  )
}
