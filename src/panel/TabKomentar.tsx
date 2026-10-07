import { useMemo, useState } from 'react'
import { Pin, PinOff, Trash2, Search } from 'lucide-react'
import { titikById } from '../data/seed'
import { waktuRelatif } from '../lib/format'
import { hapusKomentar, toggleSematKomentar, type KomentarApi } from '../lib/api'
import Avatar from '../components/Avatar'
import { usePanel } from './usePanel'
import { BTN, INPUT, Kosong, Modal } from './ui'

type Filter = 'semua' | 'disematkan' | 'warga'

export default function TabKomentar() {
  const { komentar, laporan, profil, isAdmin, jalankan, setKomentar, setLaporan, beriNotif, segarkanRingkasan } = usePanel()
  const [filter, setFilter] = useState<Filter>('semua')
  const [cari, setCari] = useState('')
  const [hapus, setHapus] = useState<KomentarApi | null>(null)
  const [sibuk, setSibuk] = useState<string | null>(null)

  const daftar = useMemo(() => {
    const q = cari.trim().toLowerCase()
    return [...komentar]
      .sort((a, b) => +new Date(b.waktu) - +new Date(a.waktu))
      .filter((k) => {
        if (filter === 'disematkan' && !k.disematkan) return false
        if (filter === 'warga' && profil(k.wargaId)?.peran !== 'warga') return false
        if (q && !k.teks.toLowerCase().includes(q) && !(profil(k.wargaId)?.nama ?? '').toLowerCase().includes(q)) return false
        return true
      })
  }, [komentar, filter, cari, profil])

  const semat = async (k: KomentarApi) => {
    setSibuk(k.id)
    const baru = await jalankan((token) => toggleSematKomentar(token, k.id))
    setSibuk(null)
    if (!baru) return
    setKomentar((xs) => xs.map((x) => (x.id === baru.id ? baru : x)))
    beriNotif(baru.disematkan ? 'Komentar disematkan.' : 'Sematan dilepas.')
  }

  const konfirmasiHapus = async () => {
    if (!hapus) return
    setSibuk(hapus.id)
    const ok = await jalankan((token) => hapusKomentar(token, hapus.id))
    setSibuk(null)
    if (!ok) return
    setKomentar((xs) => xs.filter((x) => x.id !== hapus.id))
    setLaporan((xs) =>
      xs.map((l) => (l.id === hapus.laporanId ? { ...l, jumlahKomentar: Math.max(0, l.jumlahKomentar - 1) } : l)),
    )
    segarkanRingkasan()
    beriNotif('Komentar dihapus.')
    setHapus(null)
  }

  return (
    <div>
      <h1 className="text-2xl font-extrabold text-ink">Komentar</h1>
      <p className="text-sm text-ink-muted">
        Sematkan komentar penting sebagai rujukan di atas diskusi{isAdmin ? ', atau hapus komentar yang tidak pantas' : ''}.
      </p>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <div className="flex gap-1 rounded-pill bg-bone-200 p-1">
          {(
            [
              ['semua', 'Semua'],
              ['warga', 'Dari masyarakat'],
              ['disematkan', 'Disematkan'],
            ] as const
          ).map(([v, label]) => (
            <button
              key={v}
              onClick={() => setFilter(v)}
              className={`rounded-pill px-3 py-1.5 text-[12.5px] font-bold ${
                filter === v ? 'bg-white text-ink shadow-soft' : 'text-ink-muted'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <label className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint" />
          <input value={cari} onChange={(e) => setCari(e.target.value)} placeholder="Cari isi / nama" className={`${INPUT} w-52 py-1.5 pl-8`} />
        </label>
        <span className="ml-auto text-[12px] text-ink-muted">{daftar.length} komentar</span>
      </div>

      <ul className="mt-4 space-y-2.5">
        {daftar.length === 0 && <Kosong>Tidak ada komentar yang cocok.</Kosong>}
        {daftar.map((k) => {
          const p = profil(k.wargaId)
          const lap = laporan.find((l) => l.id === k.laporanId)
          return (
            <li key={k.id} className={`flex gap-3 rounded-card bg-white p-4 shadow-soft ${k.disematkan ? 'ring-2 ring-lime' : ''}`}>
              <Avatar
                nama={p?.nama ?? 'Warga'}
                inisial={p?.inisial ?? '?'}
                warna={p?.warna ?? '#6B7770'}
                size={36}
                peneliti={p?.peran === 'peneliti'}
              />
              <div className="min-w-0 flex-1">
                <p className="flex flex-wrap items-center gap-x-2 text-[12.5px]">
                  <b className="text-ink">{p?.nama ?? 'Warga'}</b>
                  {p?.peran === 'peneliti' && <span className="font-bold text-forest">Peneliti</span>}
                  {k.disematkan && (
                    <span className="inline-flex items-center gap-0.5 font-bold text-lime-deep">
                      <Pin size={11} /> Disematkan
                    </span>
                  )}
                  <span className="text-ink-faint">{waktuRelatif(k.waktu)}</span>
                </p>
                <p className="mt-1 whitespace-pre-line text-sm text-ink-soft">
                  {k.mention && <span className="font-bold text-river-deep">@{k.mention} </span>}
                  {k.teks}
                </p>
                <p className="mt-1.5 text-[11.5px] text-ink-faint">
                  Pada laporan {lap ? `${profil(lap.wargaId)?.nama ?? 'Warga'} · ${titikById(lap.titikId)?.nama ?? lap.titikId}` : k.laporanId}
                </p>
              </div>
              <div className="flex shrink-0 flex-col gap-1.5">
                <button onClick={() => semat(k)} disabled={sibuk === k.id} className={BTN.kecil}>
                  {k.disematkan ? (
                    <>
                      <PinOff size={12} /> Lepas
                    </>
                  ) : (
                    <>
                      <Pin size={12} /> Sematkan
                    </>
                  )}
                </button>
                {isAdmin && (
                  <button onClick={() => setHapus(k)} disabled={sibuk === k.id} className={`${BTN.kecil} text-bahaya-ink`}>
                    <Trash2 size={12} /> Hapus
                  </button>
                )}
              </div>
            </li>
          )
        })}
      </ul>

      {hapus && (
        <Modal judul="Hapus komentar?" onTutup={() => setHapus(null)}>
          <blockquote className="rounded-xl bg-bone-100 px-3 py-2 text-sm text-ink-soft">{hapus.teks}</blockquote>
          <p className="mt-3 text-sm text-ink-muted">Komentar akan hilang dari diskusi di semua HP. Tidak bisa dibatalkan.</p>
          <div className="mt-5 flex justify-end gap-2">
            <button onClick={() => setHapus(null)} className={BTN.sekunder}>
              Batal
            </button>
            <button onClick={konfirmasiHapus} disabled={sibuk === hapus.id} className={BTN.bahaya}>
              <Trash2 size={15} /> Hapus
            </button>
          </div>
        </Modal>
      )}
    </div>
  )
}
