import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Award,
  Gift,
  Trophy,
  Sprout,
  Languages,
  WifiOff,
  BookOpen,
  ChevronRight,
  TrendingUp,
  Info,
  KeyRound,
  LogOut,
} from 'lucide-react'
import { useApp } from '../store/store'
import { titikById } from '../data/seed'
import type { Status } from '../lib/types'
import { STATUS } from '../lib/status'
import { TOTAL_HARI } from '../lib/rotasi'
import { waktuRelatif } from '../lib/format'
import AppBar from '../components/AppBar'
import Avatar from '../components/Avatar'
import StatusPill from '../components/StatusPill'
import FotoLaporan from '../components/FotoLaporan'
import Sheet from '../components/Sheet'
import FormGantiSandi from '../components/FormGantiSandi'

const RINCIAN_POIN = [
  { label: 'Laporan diverifikasi peneliti', poin: '+50' },
  { label: 'Laporan tepat waktu (sesuai giliran)', poin: '+10' },
  { label: 'Lencana baru diraih', poin: '+100' },
  { label: 'Ajak tetangga ikut melapor', poin: '+20' },
]

const SEMUA_BADGE = [
  { nama: 'Pelapor Baru', ikon: '🌱' },
  { nama: 'Sigap 3 Hari', ikon: '⚡' },
  { nama: 'Pelapor Rajin', ikon: '🏅' },
  { nama: 'Sigap Banjir', ikon: '🌊' },
  { nama: 'Penggerak Warga', ikon: '📣' },
  { nama: '40 Hari Penuh', ikon: '🏆' },
]

export default function Profil() {
  const navigate = useNavigate()
  const { me, state, actions, masuk } = useApp()
  const titik = titikById(me.titikId)
  const [infoPoinOpen, setInfoPoinOpen] = useState(false)
  const [gantiSandiOpen, setGantiSandiOpen] = useState(false)
  const pakaiPin = state.auth?.peran !== 'peneliti'

  const riwayat = useMemo(
    () =>
      state.laporan
        .filter((l) => l.wargaId === me.id)
        .sort((a, b) => +new Date(b.waktuUpload) - +new Date(a.waktuUpload)),
    [state.laporan, me.id],
  )

  // Semua angka di bawah dihitung dari laporan sungguhan (D1), bukan data contoh.
  const hariMelapor = useMemo(() => new Set(riwayat.map((l) => l.waktuUpload.slice(0, 10))).size, [riwayat])
  const poin = useMemo(
    () => riwayat.reduce((n, l) => n + 10 + (l.statusVerifikasi !== 'menunggu' ? 50 : 0), 0),
    [riwayat],
  )
  const badgeSaya = useMemo(() => {
    const b: string[] = []
    if (riwayat.length >= 1) b.push('Pelapor Baru')
    if (hariMelapor >= 3) b.push('Sigap 3 Hari')
    if (hariMelapor >= 7) b.push('Pelapor Rajin')
    if (riwayat.some((l) => l.statusTerverifikasi === 'bahaya')) b.push('Sigap Banjir')
    if (hariMelapor >= TOTAL_HARI) b.push('40 Hari Penuh')
    return b
  }, [riwayat, hariMelapor])
  const progres = Math.min(100, Math.round((hariMelapor / TOTAL_HARI) * 100))

  // Papan peringkat: laporan 30 hari terakhir per kelurahan; partisipasi =
  // pelapor unik ÷ responden terdaftar di kelurahan itu.
  const peringkat = useMemo(() => {
    const batas = Date.now() - 30 * 86_400_000
    const per = new Map<string, { laporan: number; pelapor: Set<string> }>()
    for (const l of state.laporan) {
      if (l.offline || +new Date(l.waktuUpload) < batas) continue
      const kel = titikById(l.titikId)?.kelurahan ?? l.kelurahan
      const d = per.get(kel) ?? { laporan: 0, pelapor: new Set<string>() }
      d.laporan++
      d.pelapor.add(l.wargaId)
      per.set(kel, d)
    }
    return [...per.entries()]
      .map(([kelurahan, d]) => {
        const terdaftar = state.direktori.filter((w) => w.peran === 'warga' && w.kelurahan === kelurahan).length
        return {
          kelurahan,
          laporan: d.laporan,
          partisipasi: terdaftar ? Math.min(100, Math.round((d.pelapor.size / terdaftar) * 100)) : 100,
        }
      })
      .sort((a, b) => b.laporan - a.laporan)
  }, [state.laporan, state.direktori])

  const dampak = useMemo(() => {
    const masuk = state.laporan.filter((l) => !l.offline)
    return {
      dicek: masuk.filter((l) => l.statusVerifikasi !== 'menunggu').length,
      titik: new Set(masuk.map((l) => l.titikId)).size,
      pelapor: new Set(masuk.map((l) => l.wargaId)).size,
      total: masuk.length,
    }
  }, [state.laporan])

  // 7 hari terakhir di titik saya: status laporan terakhir tiap hari.
  const tujuhHari = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date()
      d.setDate(d.getDate() - (6 - i))
      const kunci = d.toDateString()
      const hariItu = state.laporan
        .filter((l) => l.titikId === me.titikId && new Date(l.waktuUpload).toDateString() === kunci)
        .sort((a, b) => +new Date(b.waktuUpload) - +new Date(a.waktuUpload))[0]
      return {
        label: d.toLocaleDateString('id-ID', { weekday: 'short' }),
        status: (hariItu ? (hariItu.statusTerverifikasi ?? hariItu.statusPelapor) : undefined) as Status | undefined,
      }
    })
  }, [state.laporan, me.titikId])

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <AppBar title="Profil Saya" />
      <div className="app-scroll flex-1 space-y-4 overflow-y-auto px-4 pb-28 pt-4">
        {/* Identitas */}
        <div className="flex items-center gap-3.5 rounded-card bg-white p-4 shadow-card">
          <Avatar nama={me.nama} inisial={me.inisial} warna={me.warna} foto={me.fotoUrl} size={58} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-lg font-extrabold text-ink">{me.nama}</p>
            <p className="text-[12px] text-ink-muted">
              Titik {titik.nama} · Kel. {titik.kelurahan}
            </p>
            <span className="mt-1 inline-block rounded-pill bg-forest/10 px-2 py-0.5 text-[11px] font-bold text-forest">
              Responden no. {me.noUrut} dari {TOTAL_HARI}
            </span>
          </div>
        </div>

        {/* Poin & progres 40 hari (bagian 6.3) */}
        <div className="rounded-card bg-forest p-4 text-white shadow-card">
          <div className="flex items-end justify-between">
            <div>
              <p className="flex items-center gap-1.5 text-[12px] font-semibold text-lime">
                Poin kontribusi
                <button
                  onClick={() => setInfoPoinOpen(true)}
                  aria-label="Cara kerja poin"
                  className="-my-1.5 grid h-7 w-7 place-items-center rounded-full bg-white/20 active:bg-white/30"
                >
                  <Info size={13} />
                </button>
              </p>
              <p className="text-3xl font-extrabold">{poin}</p>
            </div>
            <div className="flex items-center gap-1.5 rounded-pill bg-white/10 px-2.5 py-1 text-[11px] font-bold">
              <Gift size={13} /> {hariMelapor}/{TOTAL_HARI} hari
            </div>
          </div>
          <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-white/15">
            <div className="h-full rounded-full bg-lime" style={{ width: `${progres}%` }} />
          </div>
          <p className="mt-2 text-[12px] text-white/85">
            {Math.max(0, TOTAL_HARI - hariMelapor)} hari lagi melapor untuk menyelesaikan 1 siklus & menukar
            poin jadi pulsa/token lewat program desa.
          </p>
        </div>

        {/* Badge */}
        <section className="rounded-card bg-white p-4 shadow-card">
          <p className="mb-3 flex items-center gap-1.5 text-[13px] font-extrabold text-ink">
            <Award size={15} className="text-forest" /> Lencana
          </p>
          <div className="grid grid-cols-3 gap-2.5">
            {SEMUA_BADGE.map((b) => {
              const punya = badgeSaya.includes(b.nama)
              return (
                <div
                  key={b.nama}
                  className={`flex flex-col items-center gap-1 rounded-2xl px-2 py-3 text-center ${
                    punya ? 'bg-lime/20' : 'bg-bone-100 opacity-50'
                  }`}
                >
                  <span className={`text-2xl ${punya ? '' : 'grayscale'}`}>{b.ikon}</span>
                  <span className="text-[10px] font-bold leading-tight text-ink-soft">{b.nama}</span>
                </div>
              )
            })}
          </div>
        </section>

        {/* Papan peringkat desa (bagian 6.4) */}
        <section className="rounded-card bg-white p-4 shadow-card">
          <p className="mb-3 flex items-center gap-1.5 text-[13px] font-extrabold text-ink">
            <Trophy size={15} className="text-forest" /> Papan Peringkat Kelurahan
          </p>
          <div className="space-y-2">
            {peringkat.length === 0 && (
              <p className="rounded-2xl bg-bone-100 px-3 py-4 text-center text-[12px] text-ink-muted">
                Belum ada laporan bulan ini. Kelurahan pertama yang melapor akan memimpin.
              </p>
            )}
            {peringkat.map((d, i) => {
              const saya = d.kelurahan === titik.kelurahan
              return (
                <div
                  key={d.kelurahan}
                  className={`flex items-center gap-3 rounded-2xl px-3 py-2 ${
                    saya ? 'bg-forest/8 ring-1 ring-forest/30' : ''
                  }`}
                >
                  <span
                    className={`grid h-6 w-6 shrink-0 place-items-center rounded-full text-[11px] font-extrabold ${
                      i === 0 ? 'bg-lime text-forest-deep' : 'bg-bone-200 text-ink-soft'
                    }`}
                  >
                    {i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] font-bold text-ink">
                      {d.kelurahan} {saya && <span className="text-forest">(Anda)</span>}
                    </p>
                    <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-bone-200">
                      <div
                        className="h-full rounded-full bg-forest-soft"
                        style={{ width: `${d.partisipasi}%` }}
                      />
                    </div>
                  </div>
                  <span className="shrink-0 text-[12px] font-extrabold text-ink-soft">
                    {d.laporan}
                  </span>
                </div>
              )
            })}
          </div>
          <p className="mt-2 text-[11px] text-ink-faint">
            Jumlah laporan 30 hari terakhir. Garis = persentase responden kelurahan yang ikut melapor.
          </p>
        </section>

        {/* Dampak nyata (bagian 6.5) */}
        <section className="rounded-card bg-river/10 p-4">
          <p className="flex items-center gap-1.5 text-[13px] font-extrabold text-river-deep">
            <Sprout size={15} /> Laporan warga benar-benar dipakai
          </p>
          <p className="mt-1.5 text-[13px] text-ink-soft">
            {dampak.dicek > 0 ? (
              <>
                <b className="text-river-deep">{dampak.dicek} laporan warga</b> sudah dicek Tim Peneliti dan
                dijadikan arahan untuk warga DAS Tallo.
              </>
            ) : (
              'Belum ada laporan yang dicek peneliti. Laporan Anda akan jadi yang pertama.'
            )}
          </p>
          <div className="mt-3 grid grid-cols-3 gap-2 text-center">
            {[
              { n: dampak.total, l: 'laporan masuk' },
              { n: `${dampak.titik}/10`, l: 'titik terpantau' },
              { n: dampak.pelapor, l: 'warga melapor' },
            ].map((s) => (
              <div key={s.l} className="rounded-2xl bg-white/70 py-2">
                <p className="text-base font-extrabold text-river-deep">{s.n}</p>
                <p className="text-[10px] font-semibold text-ink-muted">{s.l}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Tren wilayah */}
        <section className="rounded-card bg-white p-4 shadow-card">
          <div className="flex items-center justify-between">
            <p className="flex items-center gap-1.5 text-[13px] font-extrabold text-ink">
              <TrendingUp size={15} className="text-forest" /> Status titik {titik.nama}
            </p>
            <span className="text-[11px] font-semibold text-ink-faint">7 hari</span>
          </div>
          <div className="mt-3 grid grid-cols-7 gap-1.5 text-center">
            {tujuhHari.map((h, i) => (
              <div key={i}>
                <span
                  className={`mx-auto block h-7 w-7 rounded-full ${h.status ? STATUS[h.status].dot : 'bg-bone-200'}`}
                  title={h.status ? STATUS[h.status].id : 'Tidak ada laporan'}
                />
                <span className="mt-1 block text-[10px] font-semibold text-ink-muted">{h.label}</span>
              </div>
            ))}
          </div>
          <p className="mt-2 text-[11px] text-ink-faint">
            Warna = status laporan terakhir hari itu (hijau aman, kuning waspada, merah bahaya). Abu-abu = belum ada laporan.
          </p>
        </section>

        {/* Riwayat laporan */}
        <section>
          <p className="mb-2 px-1 text-[13px] font-extrabold text-ink">Riwayat laporan saya</p>
          <div className="space-y-2">
            {riwayat.length === 0 && (
              <p className="rounded-card bg-white px-4 py-6 text-center text-[13px] text-ink-muted shadow-soft">
                Belum ada. Laporan pertama Anda akan muncul di sini.
              </p>
            )}
            {riwayat.map((l) => (
              <button
                key={l.id}
                onClick={() => navigate(`/diskusi/${l.id}`)}
                className="flex w-full items-center gap-3 rounded-card bg-white p-2.5 text-left shadow-soft"
              >
                <span className="h-14 w-16 shrink-0 overflow-hidden rounded-xl">
                  <FotoLaporan laporan={l} className="h-full w-full" tiang={false} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2">
                    <StatusPill status={l.statusTerverifikasi ?? l.statusPelapor} lang={state.lang} size="sm" />
                    {l.offline && (
                      <span className="text-[10px] font-bold text-waspada-ink">menunggu sinyal</span>
                    )}
                  </span>
                  <span className="mt-1 block text-[12px] text-ink-muted">
                    Hari ke-{l.noUrutHari} · {waktuRelatif(l.waktuUpload)} ·{' '}
                    {l.statusVerifikasi === 'menunggu' ? 'menunggu ulasan' : 'sudah dicek'}
                  </span>
                </span>
                <ChevronRight size={16} className="shrink-0 text-ink-faint" />
              </button>
            ))}
          </div>
        </section>

        {/* Pengaturan */}
        <section className="rounded-card bg-white p-4 shadow-card">
          <p className="mb-3 text-[13px] font-extrabold text-ink">Pengaturan</p>

          <div className="py-2.5">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-[13px] font-semibold text-ink-soft">
                <Languages size={16} /> Bahasa
              </span>
              <div className="flex rounded-pill bg-bone-200 p-1">
                {(['id', 'mks'] as const).map((l) => (
                  <button
                    key={l}
                    onClick={() => actions.setLang(l)}
                    className={`rounded-pill px-3 py-1 text-[11px] font-bold ${
                      state.lang === l ? 'bg-white text-ink shadow-soft' : 'text-ink-muted'
                    }`}
                  >
                    {l === 'id' ? 'Indonesia' : 'Mangkasara'}
                  </button>
                ))}
              </div>
            </div>
            {state.lang === 'mks' && (
              <p className="mt-2 text-[11px] leading-relaxed text-ink-faint">
                Mode Mangkasara baru menerjemahkan istilah status utama (Aman/Waspada/Bahaya).
                Bagian lain masih Bahasa Indonesia — menyusul setelah divalidasi penutur asli.
              </p>
            )}
          </div>

          <div className="flex items-center justify-between border-t border-bone-100 py-2.5">
            <span className="flex items-center gap-2 text-[13px] font-semibold text-ink-soft">
              <WifiOff size={16} /> Mode offline
            </span>
            <button
              onClick={() => actions.setOffline(!state.offline)}
              className={`h-6 w-11 rounded-full p-0.5 transition-colors ${
                state.offline ? 'bg-forest' : 'bg-bone-300'
              }`}
              aria-pressed={state.offline}
            >
              <span
                className={`block h-5 w-5 rounded-full bg-white transition-transform ${
                  state.offline ? 'translate-x-5' : ''
                }`}
              />
            </button>
          </div>

          <button
            onClick={() => navigate('/onboarding')}
            className="flex w-full items-center justify-between border-t border-bone-100 py-2.5 text-[13px] font-semibold text-ink-soft"
          >
            <span className="flex items-center gap-2">
              <BookOpen size={16} /> Ulangi panduan
            </span>
            <ChevronRight size={16} className="text-ink-faint" />
          </button>

          {masuk && (
            <>
              <button
                onClick={() => setGantiSandiOpen(true)}
                className="flex w-full items-center justify-between border-t border-bone-100 py-2.5 text-[13px] font-semibold text-ink-soft"
              >
                <span className="flex items-center gap-2">
                  <KeyRound size={16} /> {pakaiPin ? 'Ganti PIN' : 'Ganti kata sandi'}
                </span>
                <ChevronRight size={16} className="text-ink-faint" />
              </button>
              <button
                onClick={() => actions.logout()}
                className="flex w-full items-center gap-2 border-t border-bone-100 py-2.5 text-[13px] font-semibold text-bahaya-ink"
              >
                <LogOut size={16} /> Keluar dari akun
              </button>
            </>
          )}
        </section>

        <p className="pb-2 text-center text-[10px] text-ink-faint">
          IRIS-I · Prototipe sisi warga · Sungai Tallo, Makassar
        </p>
      </div>

      <Sheet
        open={gantiSandiOpen}
        onClose={() => setGantiSandiOpen(false)}
        title={pakaiPin ? 'Ganti PIN' : 'Ganti kata sandi'}
      >
        {gantiSandiOpen && (
          <FormGantiSandi
            jenis={pakaiPin ? 'pin' : 'sandi'}
            kirim={actions.gantiRahasia}
            onSelesai={() => setGantiSandiOpen(false)}
          />
        )}
      </Sheet>

      <Sheet open={infoPoinOpen} onClose={() => setInfoPoinOpen(false)} title="Cara kerja poin">
        <div className="space-y-2">
          {RINCIAN_POIN.map((r) => (
            <div key={r.label} className="flex items-center justify-between rounded-2xl bg-bone-100 px-3.5 py-2.5">
              <span className="text-[13px] text-ink-soft">{r.label}</span>
              <span className="text-sm font-extrabold text-forest">{r.poin}</span>
            </div>
          ))}
        </div>
        <div className="mt-3 rounded-2xl bg-lime/20 px-3.5 py-3">
          <p className="text-[13px] font-bold text-forest-deep">500 poin ≈ Rp 25.000 pulsa/token</p>
          <p className="mt-1 text-[12px] text-ink-soft">
            Contoh ilustrasi — nilai tukar sebenarnya mengikuti kesepakatan program desa/CSR
            setempat, diumumkan sebelum siklus 40 hari dimulai.
          </p>
        </div>
      </Sheet>
    </div>
  )
}
