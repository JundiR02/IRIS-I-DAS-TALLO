import { useMemo, useState, type FormEvent } from 'react'
import { UserPlus, PencilLine, KeyRound, Power, Copy, Check, Search, TriangleAlert, UserCheck, UserX } from 'lucide-react'
import { TITIK, titikById } from '../data/seed'
import { buatAkun, resetRahasiaAkun, tolakPendaftar, ubahAkun, type AkunAdminApi, type Peran } from '../lib/api'
import Avatar from '../components/Avatar'
import { usePanel } from './usePanel'
import { BTN, INPUT, LABEL, BadgePeran, Kosong, Modal, tanggalJam } from './ui'

/** Peran yang bisa ditetapkan admin. */
const TAB: { v: Peran; label: string }[] = [
  { v: 'warga', label: 'Masyarakat' },
  { v: 'peneliti', label: 'Peneliti' },
  { v: 'admin', label: 'Admin' },
]
/** Tab daftar akun — termasuk pendaftar yang menunggu persetujuan. */
const TAB_DAFTAR: { v: Peran; label: string }[] = [{ v: 'pendaftar', label: 'Pendaftar' }, ...TAB]
const labelPeran = (p?: Peran | string) => TAB.find((t) => t.v === p)?.label ?? 'Masyarakat'

const TOTAL_RESPONDEN = 40

/** PIN/kata sandi baru — cuma bisa dilihat sekali, jadi tampilkan dengan jelas. */
interface Kredensial {
  akun: AkunAdminApi
  rahasia: string
  baru: boolean
}

export default function TabPengguna() {
  const { akun, sesi, jalankan, setAkun, beriNotif, muatUlang } = usePanel()
  const [tab, setTab] = useState<Peran>(() => (akun.some((a) => a.peran === 'pendaftar') ? 'pendaftar' : 'warga'))
  const [tolak, setTolak] = useState<AkunAdminApi | null>(null)
  const [cari, setCari] = useState('')
  const [form, setForm] = useState<{ mode: 'baru' } | { mode: 'ubah'; akun: AkunAdminApi } | null>(null)
  const [reset, setReset] = useState<AkunAdminApi | null>(null)
  const [kredensial, setKredensial] = useState<Kredensial | null>(null)
  const [sibuk, setSibuk] = useState<string | null>(null)

  const daftar = useMemo(() => {
    const q = cari.trim().toLowerCase()
    return akun.filter(
      (a) =>
        a.peran === tab &&
        (!q || a.nama.toLowerCase().includes(q) || (a.username ?? '').includes(q) || String(a.noUrut) === q),
    )
  }, [akun, tab, cari])

  const nomorTerpakai = new Set(akun.filter((a) => a.peran === 'warga').map((a) => a.noUrut))
  const nomorKosong = Array.from({ length: TOTAL_RESPONDEN }, (_, i) => i + 1).filter((n) => !nomorTerpakai.has(n))

  const ganti = async (a: AkunAdminApi) => {
    setSibuk(a.id)
    const baru = await jalankan((token) => ubahAkun(token, a.id, { aktif: !a.aktif }))
    setSibuk(null)
    if (!baru) return
    setAkun((xs) => xs.map((x) => (x.id === baru.id ? baru : x)))
    beriNotif(baru.aktif ? `${baru.nama} diaktifkan lagi.` : `${baru.nama} dinonaktifkan — sesinya langsung berakhir.`)
    void muatUlang()
  }

  const konfirmasiTolak = async () => {
    if (!tolak) return
    setSibuk(tolak.id)
    const ok = await jalankan((token) => tolakPendaftar(token, tolak.id))
    setSibuk(null)
    if (!ok) return
    setAkun((xs) => xs.filter((x) => x.id !== tolak.id))
    beriNotif(`Pendaftaran ${tolak.nama} ditolak.`)
    setTolak(null)
    void muatUlang()
  }

  const konfirmasiReset = async () => {
    if (!reset) return
    setSibuk(reset.id)
    const hasil = await jalankan((token) => resetRahasiaAkun(token, reset.id))
    setSibuk(null)
    if (!hasil) return
    setKredensial({ akun: reset, rahasia: hasil.rahasia, baru: false })
    setReset(null)
  }

  return (
    <div>
      <div className="flex flex-wrap items-start gap-3">
        <div className="flex-1">
          <h1 className="text-2xl font-extrabold text-ink">Pengguna</h1>
          <p className="text-sm text-ink-muted">Kelola akun masyarakat (responden), peneliti, dan admin.</p>
        </div>
        <button onClick={() => setForm({ mode: 'baru' })} className={BTN.primer}>
          <UserPlus size={15} /> Tambah akun
        </button>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <div className="flex gap-1 rounded-pill bg-bone-200 p-1">
          {TAB_DAFTAR.map((t) => {
            const n = akun.filter((a) => a.peran === t.v).length
            return (
              <button
                key={t.v}
                onClick={() => setTab(t.v)}
                className={`rounded-pill px-3 py-1.5 text-[12.5px] font-bold ${
                  tab === t.v ? 'bg-white text-ink shadow-soft' : 'text-ink-muted'
                }`}
              >
                {t.label}{' '}
                {t.v === 'pendaftar' && n > 0 ? (
                  <span className="rounded-pill bg-waspada px-1.5 text-white">{n}</span>
                ) : (
                  <span className="text-ink-faint">{n}</span>
                )}
              </button>
            )
          })}
        </div>
        <label className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint" />
          <input value={cari} onChange={(e) => setCari(e.target.value)} placeholder="Cari nama / no. / username" className={`${INPUT} w-60 py-1.5 pl-8`} />
        </label>
      </div>

      {tab === 'pendaftar' && (
        <p className="mt-3 text-[12.5px] text-ink-muted">
          Orang yang mendaftar sendiri dari aplikasi. Tekan <b className="text-ink">Setujui</b> untuk menetapkan perannya
          (masyarakat + nomor urut & titik pantau, atau peneliti). Mereka tetap masuk dengan email/no. HP & kata sandi
          buatan sendiri.
        </p>
      )}

      {tab === 'warga' && (
        <p className="mt-3 text-[12.5px] text-ink-muted">
          Nomor urut rotasi terisi <b className="text-ink">{TOTAL_RESPONDEN - nomorKosong.length}</b> dari {TOTAL_RESPONDEN}.
          {nomorKosong.length > 0 && (
            <>
              {' '}
              Belum ada responden untuk hari ke-{nomorKosong.slice(0, 12).join(', ')}
              {nomorKosong.length > 12 ? ', …' : ''} — hari itu tidak ada yang melapor.
            </>
          )}
        </p>
      )}

      <div className="mt-4 overflow-x-auto rounded-card bg-white shadow-soft">
        {daftar.length === 0 ? (
          <Kosong>{tab === 'pendaftar' ? 'Tidak ada pendaftar yang menunggu.' : 'Belum ada akun di sini.'}</Kosong>
        ) : (
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="border-b border-bone-200 text-[12px] text-ink-muted">
              <tr>
                <th className="px-4 py-3 font-bold">Nama</th>
                <th className="px-3 py-3 font-bold">Login</th>
                <th className="px-3 py-3 font-bold">{tab === 'warga' ? 'Titik pantau' : tab === 'pendaftar' ? 'Ingin sebagai' : 'Unit'}</th>
                <th className="px-3 py-3 font-bold">Status</th>
                <th className="px-3 py-3 font-bold">{tab === 'pendaftar' ? 'Mendaftar' : 'Login terakhir'}</th>
                <th className="px-4 py-3 text-right font-bold">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-bone-100">
              {daftar.map((a) => (
                <tr key={a.id} className={a.aktif ? '' : 'bg-bone-50 text-ink-faint'}>
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-2.5">
                      <Avatar nama={a.nama} inisial={a.inisial} warna={a.aktif ? a.warna : '#9CA599'} foto={a.fotoUrl} size={32} />
                      <span className="font-bold text-ink">{a.nama}</span>
                      {a.id === sesi?.akun.id && <span className="text-[11px] text-ink-faint">(Anda)</span>}
                    </div>
                  </td>
                  <td className="px-3 py-2.5 font-mono text-[12.5px]">
                    {a.peran === 'warga' ? `no. ${a.noUrut}` : a.username ?? '—'}
                    {a.peran === 'warga' && a.username && <span className="block text-[11px] text-ink-faint">{a.username}</span>}
                  </td>
                  <td className="px-3 py-2.5 text-[12.5px]">
                    {a.peran === 'warga'
                      ? `${titikById(a.titikId ?? '')?.nama ?? '—'} · ${a.kelurahan}`
                      : a.peran === 'pendaftar'
                        ? `${labelPeran(a.peranDiminta)}${a.kelurahan && a.kelurahan !== '-' ? ` · ${a.kelurahan}` : ''}`
                        : a.kelurahan}
                  </td>
                  <td className="px-3 py-2.5">
                    {a.peran === 'pendaftar' ? (
                      <span className="rounded-pill bg-waspada-wash px-2 py-0.5 text-[11px] font-bold text-waspada-ink">Menunggu</span>
                    ) : a.aktif ? (
                      <span className="rounded-pill bg-aman-wash px-2 py-0.5 text-[11px] font-bold text-aman-ink">Aktif</span>
                    ) : (
                      <span className="rounded-pill bg-bone-200 px-2 py-0.5 text-[11px] font-bold text-ink-muted">Nonaktif</span>
                    )}
                  </td>
                  <td className="px-3 py-2.5 text-[12.5px]">
                    {a.peran === 'pendaftar' ? tanggalJam(a.dibuat) : a.loginTerakhir ? tanggalJam(a.loginTerakhir) : 'Belum pernah'}
                  </td>
                  <td className="px-4 py-2.5">
                    {a.peran === 'pendaftar' ? (
                      <div className="flex justify-end gap-1.5">
                        <button onClick={() => setForm({ mode: 'ubah', akun: a })} className={`${BTN.kecil} bg-forest text-white hover:bg-forest-deep`}>
                          <UserCheck size={12} /> Setujui
                        </button>
                        <button onClick={() => setTolak(a)} disabled={sibuk === a.id} className={`${BTN.kecil} text-bahaya-ink`}>
                          <UserX size={12} /> Tolak
                        </button>
                      </div>
                    ) : (
                    <div className="flex justify-end gap-1.5">
                      <button onClick={() => setForm({ mode: 'ubah', akun: a })} className={BTN.kecil} title="Ubah data">
                        <PencilLine size={12} /> Ubah
                      </button>
                      <button onClick={() => setReset(a)} className={BTN.kecil} title={a.peran === 'warga' ? 'Reset PIN' : 'Reset kata sandi'}>
                        <KeyRound size={12} /> Reset
                      </button>
                      {a.id !== sesi?.akun.id && (
                        <button onClick={() => ganti(a)} disabled={sibuk === a.id} className={BTN.kecil} title={a.aktif ? 'Nonaktifkan' : 'Aktifkan'}>
                          <Power size={12} /> {a.aktif ? 'Nonaktifkan' : 'Aktifkan'}
                        </button>
                      )}
                    </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {form && (
        <FormAkun
          awal={form.mode === 'ubah' ? form.akun : undefined}
          peranAwal={tab}
          nomorKosong={nomorKosong}
          onTutup={() => setForm(null)}
          onBaru={(k) => {
            setForm(null)
            setKredensial(k)
            setTab(k.akun.peran)
          }}
          onDisetujui={(a) => {
            setForm(null)
            setTab(a.peran)
          }}
        />
      )}

      {tolak && (
        <Modal judul="Tolak pendaftaran?" onTutup={() => setTolak(null)}>
          <p className="text-sm text-ink-soft">
            Akun <b>{tolak.nama}</b> ({tolak.username}) akan dihapus. Mereka bisa mendaftar lagi kalau perlu.
          </p>
          <div className="mt-5 flex justify-end gap-2">
            <button onClick={() => setTolak(null)} className={BTN.sekunder}>
              Batal
            </button>
            <button onClick={konfirmasiTolak} disabled={sibuk === tolak.id} className={BTN.bahaya}>
              <UserX size={15} /> Tolak & hapus
            </button>
          </div>
        </Modal>
      )}

      {reset && (
        <Modal judul={reset.peran === 'warga' ? 'Reset PIN?' : 'Reset kata sandi?'} onTutup={() => setReset(null)}>
          <p className="text-sm text-ink-soft">
            {reset.id === sesi?.akun.id ? (
              <>
                Kata sandi baru akan dibuat untuk akun <b>Anda sendiri</b> dan hanya ditampilkan sekali —{' '}
                <b>catat sebelum menutup jendelanya</b>. Kata sandi lama langsung tidak berlaku.
              </>
            ) : (
              <>
                {reset.peran === 'warga' ? 'PIN' : 'Kata sandi'} baru akan dibuat untuk <b>{reset.nama}</b>. Semua sesi yang
                sedang masuk dengan akun ini (mis. HP yang hilang) akan langsung keluar.
              </>
            )}
          </p>
          <div className="mt-5 flex justify-end gap-2">
            <button onClick={() => setReset(null)} className={BTN.sekunder}>
              Batal
            </button>
            <button onClick={konfirmasiReset} disabled={sibuk === reset.id} className={BTN.primer}>
              <KeyRound size={15} /> Buat yang baru
            </button>
          </div>
        </Modal>
      )}

      {kredensial && <TampilKredensial k={kredensial} onTutup={() => setKredensial(null)} />}
    </div>
  )
}

function FormAkun({
  awal,
  peranAwal,
  nomorKosong,
  onTutup,
  onBaru,
  onDisetujui,
}: {
  awal?: AkunAdminApi
  peranAwal: Peran
  nomorKosong: number[]
  onTutup: () => void
  onBaru: (k: Kredensial) => void
  onDisetujui: (a: AkunAdminApi) => void
}) {
  const { jalankan, setAkun, beriNotif, muatUlang, sesi } = usePanel()
  const bolehGantiPeran = !awal || awal.id !== sesi?.akun.id
  const menyetujui = awal?.peran === 'pendaftar'
  const [peran, setPeran] = useState<Peran>(
    menyetujui ? (awal!.peranDiminta ?? 'warga') : (awal?.peran ?? (peranAwal === 'pendaftar' ? 'warga' : peranAwal)),
  )
  const [nama, setNama] = useState(awal?.nama ?? '')
  const [noUrut, setNoUrut] = useState(String(awal?.peran === 'warga' ? awal.noUrut : (nomorKosong[0] ?? '')))
  const [username, setUsername] = useState(awal?.username ?? '')
  const [titikId, setTitikId] = useState(awal?.titikId ?? '')
  const [kelurahan, setKelurahan] = useState(awal?.kelurahan === '-' ? '' : (awal?.kelurahan ?? ''))
  const [kirim, setKirim] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const warga = peran === 'warga'
  const gantiPeran = !!awal && peran !== awal.peran
  // Username hanya bisa diisi saat akun belum punya (baru, atau naik dari masyarakat).
  const usernameTerkunci = !!awal?.username

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!nama.trim()) return setError('Nama wajib diisi.')
    if (warga && !titikId) return setError('Pilih titik pantau responden.')
    if (warga && !(Number(noUrut) >= 1 && Number(noUrut) <= 40)) return setError('Nomor urut harus 1–40.')
    if (!warga && !usernameTerkunci && !/^[a-z0-9._+@-]{3,64}$/.test(username.trim().toLowerCase())) {
      return setError('Username/email 3–64 karakter: huruf kecil, angka, titik, strip, @.')
    }
    setKirim(true)
    if (awal) {
      const baru = await jalankan((token) =>
        ubahAkun(token, awal.id, {
          nama: nama.trim(),
          kelurahan: kelurahan.trim(),
          ...(gantiPeran ? { peran } : {}),
          ...(warga ? { noUrut: Number(noUrut), titikId } : usernameTerkunci ? {} : { username: username.trim().toLowerCase() }),
        }),
      )
      setKirim(false)
      if (!baru) return
      const { rahasiaBaru, ...akunBaru } = baru
      setAkun((xs) => xs.map((x) => (x.id === akunBaru.id ? akunBaru : x)))
      void muatUlang()
      if (rahasiaBaru) {
        // Akun lama tanpa username naik jadi peneliti/admin → perlu kata sandi baru.
        onBaru({ akun: akunBaru, rahasia: rahasiaBaru, baru: false })
      } else if (menyetujui) {
        beriNotif(`${akunBaru.nama} disetujui sebagai ${labelPeran(akunBaru.peran)}.`)
        onDisetujui(akunBaru)
      } else {
        beriNotif('Data akun disimpan.')
        onTutup()
      }
    } else {
      const hasil = await jalankan((token) =>
        buatAkun(token, {
          peran,
          nama: nama.trim(),
          kelurahan: kelurahan.trim() || undefined,
          ...(warga ? { noUrut: Number(noUrut), titikId } : { username: username.trim().toLowerCase() }),
        }),
      )
      setKirim(false)
      if (!hasil) return
      setAkun((xs) => [...xs, hasil.akun])
      void muatUlang()
      onBaru({ akun: hasil.akun, rahasia: hasil.rahasia, baru: true })
    }
  }

  return (
    <Modal judul={menyetujui ? `Setujui ${awal!.nama}` : awal ? `Ubah ${awal.nama}` : 'Tambah akun'} onTutup={onTutup}>
      <form onSubmit={submit} className="space-y-3">
        {bolehGantiPeran && (
          <div>
            <p className={LABEL}>
              {menyetujui ? 'Tetapkan peran' : 'Peran'}
              {menyetujui && awal?.peranDiminta && (
                <span className="font-normal text-ink-faint"> — pendaftar memilih: {labelPeran(awal.peranDiminta)}</span>
              )}
            </p>
            <div className="grid grid-cols-3 gap-1 rounded-pill bg-bone-200 p-1">
              {TAB.map((t) => (
                <button
                  key={t.v}
                  type="button"
                  onClick={() => setPeran(t.v)}
                  className={`rounded-pill py-1.5 text-[12.5px] font-bold ${peran === t.v ? 'bg-white text-ink shadow-soft' : 'text-ink-muted'}`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>
        )}
        <div>
          <label htmlFor="f-nama" className={LABEL}>
            Nama lengkap
          </label>
          <input id="f-nama" value={nama} onChange={(e) => setNama(e.target.value)} className={INPUT} placeholder="mis. Hj. Sanniasa" />
        </div>

        {warga ? (
          <>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="f-no" className={LABEL}>
                  Nomor urut (hari rotasi)
                </label>
                <input
                  id="f-no"
                  inputMode="numeric"
                  value={noUrut}
                  onChange={(e) => setNoUrut(e.target.value.replace(/[^0-9]/g, ''))}
                  className={INPUT}
                />
              </div>
              <div>
                <label htmlFor="f-titik" className={LABEL}>
                  Titik pantau
                </label>
                <select
                  id="f-titik"
                  value={titikId}
                  onChange={(e) => {
                    setTitikId(e.target.value)
                    if (!kelurahan) setKelurahan(titikById(e.target.value)?.kelurahan ?? '')
                  }}
                  className={INPUT}
                >
                  <option value="">Pilih…</option>
                  {TITIK.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.nama}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            {!awal && nomorKosong.length > 0 && (
              <p className="text-[11.5px] text-ink-muted">Nomor yang masih kosong: {nomorKosong.slice(0, 15).join(', ')}{nomorKosong.length > 15 ? ', …' : ''}</p>
            )}
          </>
        ) : (
          <div>
            <label htmlFor="f-user" className={LABEL}>
              Username atau email {usernameTerkunci && <span className="font-normal text-ink-faint">(tidak bisa diubah)</span>}
            </label>
            <input
              id="f-user"
              value={username}
              disabled={usernameTerkunci}
              autoCapitalize="none"
              onChange={(e) => setUsername(e.target.value.toLowerCase())}
              className={`${INPUT} font-mono disabled:bg-bone-100`}
              placeholder="mis. rifky atau nama@gmail.com"
            />
          </div>
        )}

        <div>
          <label htmlFor="f-kel" className={LABEL}>
            {warga ? 'Kelurahan' : 'Unit / instansi'}
          </label>
          <input
            id="f-kel"
            value={kelurahan}
            onChange={(e) => setKelurahan(e.target.value)}
            className={INPUT}
            placeholder={warga ? 'otomatis dari titik pantau' : 'Tim IRIS'}
          />
        </div>

        {menyetujui ? (
          <p className="rounded-xl bg-aman-wash px-3 py-2 text-[12px] text-aman-ink">
            Akun langsung aktif sebagai <b>{labelPeran(peran)}</b>. {awal!.nama} tetap masuk dengan{' '}
            <b>{awal!.username}</b> & kata sandinya sendiri{warga ? ' (atau nomor urut + kata sandi yang sama)' : ''}.
          </p>
        ) : (
          gantiPeran && (
            <p className="rounded-xl bg-waspada-wash px-3 py-2 text-[12px] text-waspada-ink">
              Peran berubah dari <b>{labelPeran(awal!.peran)}</b> ke <b>{labelPeran(peran)}</b>.{' '}
              {awal!.username || warga
                ? 'Akun tetap memakai sandinya sendiri; sesi yang sedang berjalan dikeluarkan supaya masuk ulang dengan peran baru.'
                : 'Akun ini belum punya username, jadi kata sandi baru dibuat dan ditampilkan sekali.'}
            </p>
          )
        )}
        {!awal && (
          <p className="rounded-xl bg-river-mist px-3 py-2 text-[12px] text-river-deep">
            {warga ? 'PIN 6 digit' : 'Kata sandi'} dibuat otomatis dan hanya ditampilkan sekali sesudah akun disimpan.
          </p>
        )}
        {error && <p className="rounded-xl bg-bahaya-wash px-3 py-2 text-[12.5px] font-semibold text-bahaya-ink">{error}</p>}

        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onTutup} className={BTN.sekunder}>
            Batal
          </button>
          <button type="submit" disabled={kirim} className={BTN.primer}>
            {kirim
              ? 'Menyimpan…'
              : menyetujui
                ? `Setujui sebagai ${labelPeran(peran)}`
                : awal
                  ? gantiPeran
                    ? 'Simpan & ganti peran'
                    : 'Simpan'
                  : 'Buat akun'}
          </button>
        </div>
      </form>
    </Modal>
  )
}

function TampilKredensial({ k, onTutup }: { k: Kredensial; onTutup: () => void }) {
  const [tersalin, setTersalin] = useState(false)
  const warga = k.akun.peran === 'warga'
  const login = warga ? `Nomor urut: ${k.akun.noUrut}` : `Username: ${k.akun.username}`
  const teksSalin = `IRIS-I — ${k.akun.nama}\n${login}\n${warga ? 'PIN' : 'Kata sandi'}: ${k.rahasia}`

  const salin = async () => {
    try {
      await navigator.clipboard.writeText(teksSalin)
      setTersalin(true)
    } catch {
      /* clipboard ditolak — pengguna tetap bisa mencatat manual */
    }
  }

  return (
    <Modal judul={k.baru ? 'Akun dibuat' : warga ? 'PIN baru' : 'Kata sandi baru'} onTutup={onTutup}>
      <div className="flex items-center gap-2">
        <span className="font-extrabold text-ink">{k.akun.nama}</span>
        <BadgePeran peran={k.akun.peran} />
      </div>
      <dl className="mt-3 space-y-2 rounded-xl bg-white p-4 shadow-soft">
        <div className="flex justify-between gap-3">
          <dt className="text-sm text-ink-muted">{warga ? 'Nomor urut' : 'Username'}</dt>
          <dd className="font-mono font-bold text-ink">{warga ? k.akun.noUrut : k.akun.username}</dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-sm text-ink-muted">{warga ? 'PIN' : 'Kata sandi'}</dt>
          <dd className="font-mono text-xl font-extrabold tracking-wider text-forest-deep">{k.rahasia}</dd>
        </div>
      </dl>
      <p className="mt-3 flex gap-2 rounded-xl bg-waspada-wash px-3 py-2 text-[12.5px] text-waspada-ink">
        <TriangleAlert size={15} className="mt-0.5 shrink-0" />
        Catat atau salin sekarang — {warga ? 'PIN' : 'kata sandi'} ini tidak bisa dilihat lagi. Kalau lupa, gunakan Reset.
        Berikan langsung ke {warga ? 'responden' : 'pemilik akun'}, jangan lewat grup.
      </p>
      <div className="mt-5 flex justify-end gap-2">
        <button onClick={salin} className={BTN.sekunder}>
          {tersalin ? <Check size={15} /> : <Copy size={15} />} {tersalin ? 'Tersalin' : 'Salin'}
        </button>
        <button onClick={onTutup} className={BTN.primer}>
          Selesai
        </button>
      </div>
    </Modal>
  )
}
