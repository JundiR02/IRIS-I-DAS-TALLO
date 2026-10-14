import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRight, Loader2, MapPin, Siren, UserPlus } from 'lucide-react'
import { TITIK, titikById } from '../data/seed'
import type { Status } from '../lib/types'
import { waktuRelatif } from '../lib/format'
import StatusPill from '../components/StatusPill'
import { usePanel } from './usePanel'
import { BTN } from './ui'

const BOBOT: Record<Status, number> = { bahaya: 0, waspada: 1, aman: 2 }
const MAKS_ANTRIAN = 6

/** Ringkasan disusun di sekitar satu pertanyaan peneliti/admin:
    "laporan mana yang harus saya verifikasi sekarang?" — angka lain hanya pelengkap. */
export default function TabRingkasan() {
  const { sesi, ringkasan: r, laporan, profil, isAdmin, memuat } = usePanel()
  const navigate = useNavigate()

  // Darurat dulu, lalu status pelapor paling berbahaya, lalu yang paling lama menunggu.
  const antrian = useMemo(
    () =>
      laporan
        .filter((l) => l.statusVerifikasi === 'menunggu')
        .sort(
          (a, b) =>
            Number(b.darurat) - Number(a.darurat) ||
            BOBOT[a.statusPelapor as Status] - BOBOT[b.statusPelapor as Status] ||
            +new Date(a.waktuUpload) - +new Date(b.waktuUpload),
        ),
    [laporan],
  )

  // Status terkini per titik pantau = laporan terbaru di titik itu
  // (status hasil verifikasi kalau ada, kalau belum ya status pelapor).
  const perTitik = useMemo(
    () =>
      TITIK.map((t) => {
        const terakhir = laporan.find((l) => l.titikId === t.id) // sudah urut terbaru dulu
        return {
          titik: t,
          terakhir,
          status: (terakhir?.statusTerverifikasi ?? terakhir?.statusPelapor) as Status | undefined,
        }
      }),
    [laporan],
  )

  const angka: { label: string; nilai?: number | string; ke?: string }[] = [
    { label: 'Laporan 24 jam', nilai: r?.laporan24Jam },
    { label: 'Bahaya 24 jam', nilai: r?.bahaya24Jam },
    { label: 'Total laporan', nilai: r?.laporanTotal },
    { label: 'Komentar', nilai: r?.komentarTotal, ke: '/panel/komentar' },
    { label: 'Masyarakat aktif', nilai: r ? `${r.wargaAktif}/40` : undefined },
    { label: 'Peneliti aktif', nilai: r?.penelitiAktif },
    ...(isAdmin ? [{ label: 'Akun nonaktif', nilai: r?.akunNonaktif, ke: '/panel/pengguna' }] : []),
  ]

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-extrabold text-ink">Halo, {sesi!.akun.nama.split(' — ')[0]}</h1>
        <p className="text-sm text-ink-muted">
          {antrian.length > 0
            ? `${antrian.length} laporan warga menunggu verifikasi Anda.`
            : 'Tidak ada laporan yang menunggu verifikasi.'}
        </p>
      </header>

      {/* Antrian verifikasi — isi utama halaman ini */}
      <section className="rounded-card bg-white p-5 shadow-soft">
        <div className="mb-2 flex items-baseline justify-between gap-3">
          <h2 className="font-extrabold text-ink">Perlu diverifikasi</h2>
          <span className="text-[12px] text-ink-muted">darurat & bahaya dulu, lalu yang terlama</span>
        </div>

        {antrian.length === 0 ? (
          memuat ? (
            <p role="status" className="flex items-center gap-2 py-6 text-sm text-ink-muted">
              <Loader2 size={15} className="animate-spin" aria-hidden /> Memuat antrian laporan…
            </p>
          ) : (
            <p className="py-6 text-sm text-ink-muted">
              Semua laporan sudah diverifikasi. Laporan baru dari warga akan muncul di sini.
            </p>
          )
        ) : (
          <ul className="divide-y divide-bone-100">
            {antrian.slice(0, MAKS_ANTRIAN).map((l) => (
              <li key={l.id} className="flex flex-wrap items-center gap-x-3 gap-y-2 py-3">
                <div className="min-w-0 flex-1">
                  <p className="flex flex-wrap items-center gap-1.5">
                    <span className="font-bold text-ink">{profil(l.wargaId)?.nama ?? 'Warga'}</span>
                    {l.darurat && (
                      <span className="inline-flex items-center gap-1 rounded-pill bg-bahaya px-2 py-0.5 text-[11px] font-bold text-white">
                        <Siren size={11} aria-hidden /> Darurat
                      </span>
                    )}
                    <StatusPill status={l.statusPelapor as Status} size="sm" />
                  </p>
                  <p className="mt-0.5 flex items-center gap-1 text-[12px] text-ink-muted">
                    <MapPin size={11} aria-hidden /> {titikById(l.titikId)?.nama ?? l.titikId} · menunggu sejak{' '}
                    {waktuRelatif(l.waktuUpload)}
                  </p>
                </div>
                <button onClick={() => navigate(`/panel/laporan?buka=${encodeURIComponent(l.id)}`)} className={BTN.primer}>
                  Verifikasi
                </button>
              </li>
            ))}
          </ul>
        )}

        {antrian.length > MAKS_ANTRIAN && (
          <button onClick={() => navigate('/panel/laporan')} className={`${BTN.sekunder} mt-2`}>
            Lihat semua {antrian.length} laporan menunggu <ArrowRight size={14} aria-hidden />
          </button>
        )}
      </section>

      {isAdmin && !!r?.pendaftarMenunggu && (
        <button
          onClick={() => navigate('/panel/pengguna')}
          className="flex w-full items-center gap-3 rounded-card bg-waspada-wash px-5 py-3.5 text-left"
        >
          <UserPlus size={18} className="shrink-0 text-waspada-ink" aria-hidden />
          <span className="flex-1 text-sm font-bold text-waspada-ink">
            {r.pendaftarMenunggu} pendaftar baru menunggu persetujuan Anda
          </span>
          <ArrowRight size={16} className="text-waspada-ink" aria-hidden />
        </button>
      )}

      {/* Angka pelengkap — satu baris ringkas, bukan deretan kartu */}
      <dl className="flex flex-wrap gap-x-6 gap-y-3 px-1">
        {angka.map((a) => (
          <div key={a.label}>
            <dt className="text-[12px] text-ink-muted">{a.label}</dt>
            <dd className="text-lg font-extrabold tabular-nums text-ink">
              {a.ke ? (
                <button onClick={() => navigate(a.ke!)} className="tap underline decoration-bone-300 underline-offset-4 hover:decoration-ink">
                  {a.nilai ?? '–'}
                </button>
              ) : (
                (a.nilai ?? '–')
              )}
            </dd>
          </div>
        ))}
      </dl>

      <section className="rounded-card bg-white p-5 shadow-soft">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-extrabold text-ink">Status terkini per titik pantau</h2>
          <span className="text-[12px] text-ink-muted">hulu → muara</span>
        </div>
        <ul className="divide-y divide-bone-100">
          {perTitik.map(({ titik, terakhir, status }) => (
            <li key={titik.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 py-2.5">
              <span className="w-40 shrink-0 font-bold text-ink">{titik.nama}</span>
              {status ? <StatusPill status={status} size="sm" /> : <span className="text-[12px] text-ink-faint">Belum ada laporan</span>}
              {terakhir && (
                <span className="text-[12px] text-ink-muted">
                  {profil(terakhir.wargaId)?.nama ?? 'Warga'} · {waktuRelatif(terakhir.waktuUpload)}
                  {terakhir.statusVerifikasi === 'menunggu' && (
                    <span className="ml-1.5 font-bold text-waspada-ink">· belum diverifikasi</span>
                  )}
                </span>
              )}
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}
