import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRight, Siren } from 'lucide-react'
import { TITIK } from '../data/seed'
import type { Status } from '../lib/types'
import { waktuRelatif } from '../lib/format'
import StatusPill from '../components/StatusPill'
import { usePanel } from './usePanel'
import { BTN, KartuAngka } from './ui'

export default function TabRingkasan() {
  const { sesi, ringkasan: r, laporan, profil, isAdmin } = usePanel()
  const navigate = useNavigate()

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

  const darurat = laporan.filter((l) => l.darurat && l.statusVerifikasi === 'menunggu')

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-extrabold text-ink">Halo, {sesi!.akun.nama.split(' — ')[0]}</h1>
        <p className="text-sm text-ink-muted">
          {isAdmin ? 'Ringkasan sistem IRIS-I DAS Tallo.' : 'Ringkasan laporan warga yang perlu ditinjau.'}
        </p>
      </header>

      {darurat.length > 0 && (
        <button
          onClick={() => navigate('/panel/laporan?filter=darurat')}
          className="flex w-full items-center gap-3 rounded-card bg-bahaya px-5 py-4 text-left text-white shadow-lift"
        >
          <Siren size={22} />
          <span className="flex-1">
            <span className="block font-extrabold">{darurat.length} laporan darurat belum diverifikasi</span>
            <span className="block text-[13px] text-white/80">
              Terbaru: {profil(darurat[0].wargaId)?.nama ?? 'Warga'} · {waktuRelatif(darurat[0].waktuUpload)}
            </span>
          </span>
          <ArrowRight size={18} />
        </button>
      )}

      <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <KartuAngka
          label="Menunggu verifikasi"
          nilai={r?.laporanMenunggu ?? '–'}
          nada={r?.laporanMenunggu ? 'waspada' : 'netral'}
          catatan="Klik untuk mulai meninjau"
          onClick={() => navigate('/panel/laporan?filter=menunggu')}
        />
        <KartuAngka label="Laporan 24 jam" nilai={r?.laporan24Jam ?? '–'} catatan={`${r?.laporanTotal ?? 0} total`} />
        <KartuAngka label="Bahaya 24 jam" nilai={r?.bahaya24Jam ?? '–'} nada={r?.bahaya24Jam ? 'bahaya' : 'netral'} />
        <KartuAngka label="Komentar" nilai={r?.komentarTotal ?? '–'} onClick={() => navigate('/panel/komentar')} />
        <KartuAngka label="Masyarakat aktif" nilai={r?.wargaAktif ?? '–'} catatan="dari 40 responden" />
        <KartuAngka label="Peneliti aktif" nilai={r?.penelitiAktif ?? '–'} />
        {isAdmin && (
          <KartuAngka
            label="Pendaftar baru"
            nilai={r?.pendaftarMenunggu ?? '–'}
            nada={r?.pendaftarMenunggu ? 'waspada' : 'netral'}
            catatan="Menunggu persetujuan Anda"
            onClick={() => navigate('/panel/pengguna')}
          />
        )}
        {isAdmin && (
          <KartuAngka
            label="Akun nonaktif"
            nilai={r?.akunNonaktif ?? '–'}
            onClick={() => navigate('/panel/pengguna')}
          />
        )}
      </section>

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
        <button onClick={() => navigate('/panel/laporan')} className={`${BTN.sekunder} mt-3`}>
          Lihat semua laporan <ArrowRight size={14} />
        </button>
      </section>
    </div>
  )
}
