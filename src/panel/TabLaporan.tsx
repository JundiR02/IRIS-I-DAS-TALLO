import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { CheckCircle2, PencilLine, Trash2, Siren, Mic, MapPin, Search } from 'lucide-react'
import { TITIK, titikById } from '../data/seed'
import type { Status } from '../lib/types'
import { STATUS_ORDER } from '../lib/status'
import { waktuRelatif } from '../lib/format'
import { hapusLaporan, verifikasiLaporan, type LaporanApi } from '../lib/api'
import StatusPill from '../components/StatusPill'
import FotoLaporan from '../components/FotoLaporan'
import { usePanel } from './usePanel'
import { BTN, INPUT, LABEL, Kosong, Modal, tanggalJam } from './ui'

type Filter = 'menunggu' | 'darurat' | 'terverifikasi' | 'semua'

const FILTER: { v: Filter; label: string }[] = [
  { v: 'menunggu', label: 'Menunggu' },
  { v: 'darurat', label: 'Darurat' },
  { v: 'terverifikasi', label: 'Sudah diverifikasi' },
  { v: 'semua', label: 'Semua' },
]

// Kalimat awal rekomendasi — bahasa sehari-hari, bisa diedit sebelum dikirim.
const TEMPLAT: Record<Status, string> = {
  aman: 'Kondisi aman, lanjutkan pemantauan besok.',
  waspada: 'Air mulai naik/keruh. Pantau terus tiap 3 jam dan siapkan tas siaga (dokumen, obat, senter, air).',
  bahaya:
    'Air naik tinggi. Pindahkan barang berharga & dokumen ke tempat lebih tinggi sekarang, dan hindari menyeberang sungai.',
}

const fotoProps = (l: LaporanApi) => ({
  id: l.id,
  fotoUrl: l.fotoUrl ?? undefined,
  statusPelapor: l.statusPelapor as Status,
  statusTerverifikasi: l.statusTerverifikasi as Status | undefined,
})

export default function TabLaporan() {
  const { laporan, profil, isAdmin } = usePanel()
  const [params, setParams] = useSearchParams()
  const filter = (params.get('filter') as Filter) || 'menunggu'
  const [titikId, setTitikId] = useState('')
  const [cari, setCari] = useState('')
  const [dipilih, setDipilih] = useState<LaporanApi | null>(null)
  const [hapus, setHapus] = useState<LaporanApi | null>(null)

  const daftar = useMemo(() => {
    const q = cari.trim().toLowerCase()
    return laporan.filter((l) => {
      if (filter === 'menunggu' && l.statusVerifikasi !== 'menunggu') return false
      if (filter === 'darurat' && !l.darurat) return false
      if (filter === 'terverifikasi' && l.statusVerifikasi === 'menunggu') return false
      if (titikId && l.titikId !== titikId) return false
      if (q && !(profil(l.wargaId)?.nama ?? '').toLowerCase().includes(q)) return false
      return true
    })
  }, [laporan, filter, titikId, cari, profil])

  return (
    <div>
      <h1 className="text-2xl font-extrabold text-ink">Laporan &amp; Verifikasi</h1>
      <p className="text-sm text-ink-muted">
        Tinjau foto & status dari warga, koreksi bila perlu, lalu kirim rekomendasi yang akan tampil di HP mereka.
      </p>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <div className="flex flex-wrap gap-1 rounded-pill bg-bone-200 p-1">
          {FILTER.map((f) => (
            <button
              key={f.v}
              onClick={() => setParams(f.v === 'menunggu' ? {} : { filter: f.v })}
              className={`rounded-pill px-3 py-1.5 text-[12.5px] font-bold ${
                filter === f.v ? 'bg-white text-ink shadow-soft' : 'text-ink-muted'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <select value={titikId} onChange={(e) => setTitikId(e.target.value)} className={`${INPUT} w-auto py-1.5`}>
          <option value="">Semua titik</option>
          {TITIK.map((t) => (
            <option key={t.id} value={t.id}>
              {t.nama}
            </option>
          ))}
        </select>
        <label className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint" />
          <input
            value={cari}
            onChange={(e) => setCari(e.target.value)}
            placeholder="Cari nama pelapor"
            className={`${INPUT} w-52 py-1.5 pl-8`}
          />
        </label>
        <span className="ml-auto text-[12px] text-ink-muted">{daftar.length} laporan</span>
      </div>

      <div className="mt-4 space-y-2.5">
        {daftar.length === 0 && (
          <Kosong>{filter === 'menunggu' ? 'Semua laporan sudah diverifikasi. 🎉' : 'Tidak ada laporan yang cocok.'}</Kosong>
        )}
        {daftar.map((l) => {
          const p = profil(l.wargaId)
          return (
            <article key={l.id} className="flex flex-col gap-3 rounded-card bg-white p-3 shadow-soft sm:flex-row sm:items-center">
              <FotoLaporan laporan={fotoProps(l)} className="h-36 w-full shrink-0 rounded-xl sm:h-20 sm:w-28" tiang={false} />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="font-extrabold text-ink">{p?.nama ?? 'Warga'}</span>
                  {l.darurat && (
                    <span className="inline-flex items-center gap-1 rounded-pill bg-bahaya px-2 py-0.5 text-[11px] font-bold text-white">
                      <Siren size={11} /> Darurat
                    </span>
                  )}
                </div>
                <p className="mt-0.5 flex flex-wrap items-center gap-x-2 text-[12px] text-ink-muted">
                  <span className="inline-flex items-center gap-0.5">
                    <MapPin size={11} /> {titikById(l.titikId)?.nama ?? l.titikId}
                  </span>
                  <span>· {waktuRelatif(l.waktuUpload)}</span>
                  {!!l.catatanSuaraDetik && (
                    <span className="inline-flex items-center gap-0.5">
                      · <Mic size={11} /> {l.catatanSuaraDetik} dtk
                    </span>
                  )}
                </p>
                <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-[12px]">
                  <span className="text-ink-muted">Pelapor:</span>
                  <StatusPill status={l.statusPelapor as Status} size="sm" />
                  {l.statusVerifikasi !== 'menunggu' && l.statusTerverifikasi && (
                    <>
                      <span className="text-ink-muted">→ Peneliti:</span>
                      <StatusPill status={l.statusTerverifikasi as Status} size="sm" variant="solid" />
                      <span className="text-ink-faint">
                        {l.statusVerifikasi === 'dikoreksi' ? 'dikoreksi' : 'sesuai'} oleh {l.reviewerNama}
                      </span>
                    </>
                  )}
                </div>
              </div>
              <div className="flex shrink-0 gap-2">
                <button onClick={() => setDipilih(l)} className={l.statusVerifikasi === 'menunggu' ? BTN.primer : BTN.sekunder}>
                  {l.statusVerifikasi === 'menunggu' ? (
                    <>
                      <CheckCircle2 size={15} /> Verifikasi
                    </>
                  ) : (
                    <>
                      <PencilLine size={15} /> Ubah
                    </>
                  )}
                </button>
                {isAdmin && (
                  <button onClick={() => setHapus(l)} className={BTN.bahaya} aria-label="Hapus laporan">
                    <Trash2 size={15} />
                  </button>
                )}
              </div>
            </article>
          )
        })}
      </div>

      {dipilih && <FormVerifikasi laporan={dipilih} onTutup={() => setDipilih(null)} />}
      {hapus && <KonfirmasiHapus laporan={hapus} onTutup={() => setHapus(null)} />}
    </div>
  )
}

function FormVerifikasi({ laporan: l, onTutup }: { laporan: LaporanApi; onTutup: () => void }) {
  const { profil, jalankan, setLaporan, beriNotif, segarkanRingkasan, muatUlang } = usePanel()
  const pelapor = l.statusPelapor as Status
  const [hasil, setHasil] = useState<'sama' | 'dikoreksi'>(l.statusVerifikasi === 'dikoreksi' ? 'dikoreksi' : 'sama')
  const [koreksi, setKoreksi] = useState<Status>(
    (l.statusVerifikasi === 'dikoreksi' ? (l.statusTerverifikasi as Status) : undefined) ??
      STATUS_ORDER.find((s) => s !== pelapor)!,
  )
  const statusAkhir = hasil === 'sama' ? pelapor : koreksi
  const [teks, setTeks] = useState(l.rekomendasiTeks ?? TEMPLAT[pelapor])
  const [teksDiubah, setTeksDiubah] = useState(!!l.rekomendasiTeks)
  const [semat, setSemat] = useState(l.statusVerifikasi === 'menunggu')
  const [kirim, setKirim] = useState(false)

  // Selama peneliti belum mengetik sendiri, templat ikut status akhir.
  const pilihStatus = (h: 'sama' | 'dikoreksi', k: Status = koreksi) => {
    setHasil(h)
    setKoreksi(k)
    if (!teksDiubah) setTeks(TEMPLAT[h === 'sama' ? pelapor : k])
  }

  const simpan = async () => {
    setKirim(true)
    const baru = await jalankan((token) =>
      verifikasiLaporan(token, l.id, {
        statusVerifikasi: hasil,
        statusTerverifikasi: hasil === 'dikoreksi' ? koreksi : undefined,
        rekomendasiTeks: teks.trim() || undefined,
        sematkanKomentar: semat,
      }),
    )
    setKirim(false)
    if (!baru) return
    setLaporan((xs) => xs.map((x) => (x.id === baru.id ? baru : x)))
    // Komentar tersemat dibuat di server — ambil ulang supaya tab Komentar ikut sinkron.
    if (semat && teks.trim()) void muatUlang()
    else segarkanRingkasan()
    beriNotif('Verifikasi tersimpan — rekomendasi tampil di aplikasi warga.')
    onTutup()
  }

  const p = profil(l.wargaId)
  return (
    <Modal judul="Verifikasi laporan" onTutup={onTutup} lebar="max-w-3xl">
      <div className="grid gap-5 md:grid-cols-[1fr_1.1fr]">
        <div>
          <FotoLaporan laporan={fotoProps(l)} className="aspect-[4/3] w-full rounded-xl" tiang />
          <dl className="mt-3 space-y-1 text-[12.5px]">
            <Baris k="Pelapor" v={`${p?.nama ?? 'Warga'} (no. ${p?.noUrut ?? '?'})`} />
            <Baris k="Titik" v={titikById(l.titikId)?.nama ?? l.titikId} />
            <Baris k="Waktu" v={tanggalJam(l.waktuUpload)} />
            <Baris
              k="Koordinat"
              v={`${l.koordinat.lat.toFixed(4)}, ${l.koordinat.lng.toFixed(4)}${l.koordinatDariExif ? ' (GPS foto)' : ' (titik pantau)'}`}
            />
            {l.fotoAsliNama && <Baris k="File asli" v={`${l.fotoAsliNama}${l.fotoDariRaw ? ' · RAW' : ''}`} />}
            {!!l.catatanSuaraDetik && <Baris k="Catatan suara" v={`${l.catatanSuaraDetik} detik`} />}
          </dl>
        </div>

        <div className="space-y-4">
          <div>
            <p className={LABEL}>1 · Status dari pelapor</p>
            <StatusPill status={pelapor} size="lg" />
          </div>

          <div>
            <p className={LABEL}>2 · Apakah sesuai dengan foto?</p>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => pilihStatus('sama')}
                className={`rounded-xl border-2 px-3 py-2.5 text-sm font-bold ${
                  hasil === 'sama' ? 'border-forest bg-forest/10 text-forest-deep' : 'border-bone-200 bg-white text-ink-soft'
                }`}
              >
                Sesuai
              </button>
              <button
                onClick={() => pilihStatus('dikoreksi')}
                className={`rounded-xl border-2 px-3 py-2.5 text-sm font-bold ${
                  hasil === 'dikoreksi' ? 'border-forest bg-forest/10 text-forest-deep' : 'border-bone-200 bg-white text-ink-soft'
                }`}
              >
                Perlu dikoreksi
              </button>
            </div>
            {hasil === 'dikoreksi' && (
              <div className="mt-2 flex gap-2">
                {STATUS_ORDER.filter((s) => s !== pelapor).map((s) => (
                  <button
                    key={s}
                    onClick={() => pilihStatus('dikoreksi', s)}
                    className={`rounded-pill ring-2 ring-offset-2 ${koreksi === s ? 'ring-forest' : 'ring-transparent'}`}
                  >
                    <StatusPill status={s} size="lg" variant={koreksi === s ? 'solid' : 'soft'} />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div>
            <label htmlFor="rek" className={LABEL}>
              3 · Rekomendasi untuk warga <span className="font-normal text-ink-faint">(status akhir: {statusAkhir})</span>
            </label>
            <textarea
              id="rek"
              rows={4}
              value={teks}
              onChange={(e) => {
                setTeks(e.target.value)
                setTeksDiubah(true)
              }}
              className={`${INPUT} resize-y leading-relaxed`}
            />
            <p className="mt-1 text-[11.5px] text-ink-muted">Pakai kalimat sehari-hari & tindakan konkret — dibaca warga SD–SMA.</p>
            <label className="mt-2 flex items-center gap-2 text-[13px] font-semibold text-ink-soft">
              <input type="checkbox" checked={semat} onChange={(e) => setSemat(e.target.checked)} className="h-4 w-4 accent-forest" />
              Sematkan juga sebagai komentar "Rekomendasi Resmi" di diskusi
            </label>
          </div>

          <div className="flex justify-end gap-2 border-t border-bone-200 pt-4">
            <button onClick={onTutup} className={BTN.sekunder}>
              Batal
            </button>
            <button onClick={simpan} disabled={kirim} className={BTN.primer}>
              <CheckCircle2 size={15} /> {kirim ? 'Menyimpan…' : 'Simpan verifikasi'}
            </button>
          </div>
        </div>
      </div>
    </Modal>
  )
}

function KonfirmasiHapus({ laporan: l, onTutup }: { laporan: LaporanApi; onTutup: () => void }) {
  const { profil, jalankan, setLaporan, setKomentar, beriNotif, segarkanRingkasan } = usePanel()
  const [kirim, setKirim] = useState(false)
  const hapus = async () => {
    setKirim(true)
    const ok = await jalankan((token) => hapusLaporan(token, l.id))
    setKirim(false)
    if (!ok) return
    setLaporan((xs) => xs.filter((x) => x.id !== l.id))
    setKomentar((xs) => xs.filter((k) => k.laporanId !== l.id))
    segarkanRingkasan()
    beriNotif('Laporan dihapus.')
    onTutup()
  }
  return (
    <Modal judul="Hapus laporan?" onTutup={onTutup}>
      <p className="text-sm text-ink-soft">
        Laporan dari <b>{profil(l.wargaId)?.nama ?? 'Warga'}</b> ({tanggalJam(l.waktuUpload)}) beserta fotonya,{' '}
        {l.jumlahKomentar} komentar, dan {l.jumlahSuka} suka akan dihapus permanen. Tindakan ini tidak bisa dibatalkan.
      </p>
      <div className="mt-5 flex justify-end gap-2">
        <button onClick={onTutup} className={BTN.sekunder}>
          Batal
        </button>
        <button onClick={hapus} disabled={kirim} className={BTN.bahaya}>
          <Trash2 size={15} /> {kirim ? 'Menghapus…' : 'Hapus permanen'}
        </button>
      </div>
    </Modal>
  )
}

function Baris({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex gap-2">
      <dt className="w-28 shrink-0 text-ink-muted">{k}</dt>
      <dd className="font-semibold text-ink">{v}</dd>
    </div>
  )
}
