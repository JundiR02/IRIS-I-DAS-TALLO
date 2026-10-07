import { useState, type FormEvent } from 'react'
import { KeyRound, CheckCircle2 } from 'lucide-react'
import { ApiError } from '../lib/api'

interface Props {
  /** 'pin' untuk masyarakat (angka), 'sandi' untuk peneliti/admin */
  jenis: 'pin' | 'sandi'
  kirim: (lama: string, baru: string) => Promise<void>
  onSelesai: () => void
}

const INPUT =
  'w-full rounded-xl border-2 border-bone-200 bg-white px-3.5 py-2.5 text-base text-ink outline-none placeholder:text-ink-faint focus:border-forest'

/** Form ganti PIN/kata sandi sendiri — dipakai di Profil (aplikasi) dan Panel. */
export default function FormGantiSandi({ jenis, kirim, onSelesai }: Props) {
  const pin = jenis === 'pin'
  const nama = pin ? 'PIN' : 'kata sandi'
  const [lama, setLama] = useState('')
  const [baru, setBaru] = useState('')
  const [ulang, setUlang] = useState('')
  const [memuat, setMemuat] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [berhasil, setBerhasil] = useState(false)

  const saring = (v: string) => (pin ? v.replace(/[^0-9]/g, '').slice(0, 8) : v)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!lama || !baru) return setError(`Isi ${nama} lama dan ${nama} baru.`)
    if (pin && !/^\d{6,8}$/.test(baru)) return setError('PIN baru harus 6–8 angka.')
    if (!pin && baru.length < 8) return setError('Kata sandi baru minimal 8 karakter.')
    if (baru !== ulang) return setError(`Ulangi ${nama} baru — keduanya belum sama.`)
    setMemuat(true)
    try {
      await kirim(lama, baru)
      setBerhasil(true)
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Tidak bisa terhubung ke server. Periksa sinyal internet Anda.')
    } finally {
      setMemuat(false)
    }
  }

  if (berhasil) {
    return (
      <div className="text-center">
        <CheckCircle2 size={40} className="mx-auto text-aman" />
        <p className="mt-2 font-extrabold text-ink">{pin ? 'PIN' : 'Kata sandi'} berhasil diganti</p>
        <p className="mt-1 text-[13px] text-ink-muted">
          Pakai {nama} baru saat masuk berikutnya. Perangkat lain yang masih masuk dengan akun ini sudah dikeluarkan.
        </p>
        <button onClick={onSelesai} className="mt-4 w-full rounded-pill bg-forest py-3 font-extrabold text-white">
          Selesai
        </button>
      </div>
    )
  }

  const props = pin
    ? ({ type: 'password', inputMode: 'numeric', autoComplete: 'off' } as const)
    : ({ type: 'password' } as const)

  return (
    <form onSubmit={submit} className="space-y-3">
      <div>
        <label htmlFor="gs-lama" className="mb-1 block text-[12px] font-bold text-ink-soft">
          {pin ? 'PIN' : 'Kata sandi'} lama
        </label>
        <input id="gs-lama" {...props} autoComplete={pin ? 'off' : 'current-password'} value={lama} onChange={(e) => setLama(saring(e.target.value))} className={INPUT} />
      </div>
      <div>
        <label htmlFor="gs-baru" className="mb-1 block text-[12px] font-bold text-ink-soft">
          {pin ? 'PIN' : 'Kata sandi'} baru
        </label>
        <input id="gs-baru" {...props} autoComplete={pin ? 'off' : 'new-password'} value={baru} onChange={(e) => setBaru(saring(e.target.value))} className={INPUT} />
        <p className="mt-1 text-[11.5px] text-ink-muted">
          {pin ? '6–8 angka. Jangan pakai tanggal lahir atau angka berurutan (123456).' : 'Minimal 8 karakter. Jangan sama dengan email/username.'}
        </p>
      </div>
      <div>
        <label htmlFor="gs-ulang" className="mb-1 block text-[12px] font-bold text-ink-soft">
          Ulangi {nama} baru
        </label>
        <input id="gs-ulang" {...props} autoComplete={pin ? 'off' : 'new-password'} value={ulang} onChange={(e) => setUlang(saring(e.target.value))} className={INPUT} />
      </div>
      {error && <p className="rounded-xl bg-bahaya-wash px-3 py-2 text-[12.5px] font-semibold text-bahaya-ink">{error}</p>}
      <button
        type="submit"
        disabled={memuat}
        className="flex w-full items-center justify-center gap-2 rounded-pill bg-forest py-3 font-extrabold text-white disabled:opacity-60"
      >
        <KeyRound size={16} /> {memuat ? 'Menyimpan…' : `Simpan ${nama} baru`}
      </button>
    </form>
  )
}
