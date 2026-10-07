import { useNavigate } from 'react-router-dom'
import { Heart, MessageCircle, MapPin, Play, ShieldCheck, Clock, Siren } from 'lucide-react'
import type { Laporan } from '../lib/types'
import { useApp } from '../store/store'
import { titikById } from '../data/seed'
import { waktuRelatif } from '../lib/format'
import Avatar from './Avatar'
import StatusPill from './StatusPill'
import FotoLaporan from './FotoLaporan'

export default function PostCard({ laporan }: { laporan: Laporan }) {
  const navigate = useNavigate()
  const { state, sukaLaporan, actions, me } = useApp()
  const titik = titikById(laporan.titikId)
  const disukai = sukaLaporan(laporan.id)
  const terverifikasi = laporan.statusVerifikasi !== 'menunggu'
  const dikoreksi = laporan.statusVerifikasi === 'dikoreksi'
  const statusTampil = laporan.statusTerverifikasi ?? laporan.statusPelapor
  const milikSaya = laporan.wargaId === me.id

  return (
    <article className="animate-fade-up overflow-hidden rounded-card bg-white shadow-card">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pb-3 pt-3.5">
        <Avatar nama={laporan.nama} inisial={laporan.inisial} warna={laporan.warna} size={38} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold text-ink">
            {laporan.nama}
            {milikSaya && <span className="ml-1 text-ink-faint">(Anda)</span>}
          </p>
          <p className="flex items-center gap-1 text-[11px] text-ink-muted">
            <MapPin size={11} /> {titik.nama} · Hari ke-{laporan.noUrutHari}
            <span className="text-ink-faint">·</span>
            {waktuRelatif(laporan.waktuUpload)}
          </p>
        </div>
        {laporan.darurat && (
          <span className="flex items-center gap-1 rounded-pill bg-bahaya-wash px-2 py-0.5 text-[10px] font-bold text-bahaya-ink">
            <Siren size={11} /> Darurat
          </span>
        )}
      </div>

      {/* Foto sungai */}
      <button
        onClick={() => navigate(`/diskusi/${laporan.id}`)}
        className="relative block aspect-[16/10] w-full"
      >
        <FotoLaporan laporan={laporan} className="h-full w-full" />
        <div className="absolute left-3 top-3">
          <StatusPill status={statusTampil} lang={state.lang} size="md" variant="solid" />
        </div>
        {laporan.offline && (
          <span className="absolute right-3 top-3 flex items-center gap-1 rounded-pill bg-ink/80 px-2 py-1 text-[10px] font-bold text-white">
            <Clock size={11} /> Menunggu sinyal
          </span>
        )}
        {laporan.catatanSuaraDetik ? (
          <span className="absolute bottom-3 left-3 flex items-center gap-1.5 rounded-pill bg-white/95 px-2.5 py-1 text-[11px] font-bold text-ink">
            <Play size={12} className="fill-ink" /> Catatan suara {laporan.catatanSuaraDetik}s
          </span>
        ) : null}
      </button>

      {/* Status verifikasi */}
      <div className="px-4 pt-3">
        {terverifikasi ? (
          <div className="flex items-start gap-2 rounded-2xl bg-forest/5 px-3 py-2.5">
            <ShieldCheck size={16} className="mt-0.5 shrink-0 text-forest" />
            <div className="text-[12px] leading-snug">
              <p className="font-bold text-forest-deep">
                Sudah dicek Tim Peneliti
                {dikoreksi && (
                  <span className="ml-1 font-semibold text-ink-muted">
                    · status disesuaikan dari {laporan.statusPelapor}
                  </span>
                )}
              </p>
              {laporan.rekomendasiTeks && (
                <p className="mt-0.5 text-ink-soft">{laporan.rekomendasiTeks}</p>
              )}
              {laporan.reviewerNama && (
                <p className="mt-1 text-[11px] text-ink-faint">
                  oleh {laporan.reviewerNama}
                  {laporan.waktuReview ? ` · ${waktuRelatif(laporan.waktuReview)}` : ''}
                </p>
              )}
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2 rounded-2xl bg-waspada-wash px-3 py-2.5 text-[12px] font-semibold text-waspada-ink">
            <Clock size={15} className="shrink-0" />
            Menunggu ulasan peneliti
          </div>
        )}
      </div>

      {/* Aksi */}
      <div className="flex items-center gap-1 px-3 py-2">
        <button
          onClick={() => actions.toggleSukaLaporan(laporan.id)}
          className={`flex items-center gap-1.5 rounded-pill px-3 py-2 text-sm font-bold transition-colors ${
            disukai ? 'text-bahaya' : 'text-ink-muted'
          }`}
        >
          <Heart size={18} className={disukai ? 'fill-bahaya' : ''} />
          {laporan.jumlahSuka}
        </button>
        <button
          onClick={() => navigate(`/diskusi/${laporan.id}`)}
          className="flex items-center gap-1.5 rounded-pill px-3 py-2 text-sm font-bold text-ink-muted"
        >
          <MessageCircle size={18} />
          {laporan.jumlahKomentar}
        </button>
        <button
          onClick={() => navigate(`/diskusi/${laporan.id}`)}
          className="ml-auto rounded-pill bg-bone-100 px-3.5 py-2 text-xs font-bold text-ink-soft"
        >
          Diskusi
        </button>
      </div>
    </article>
  )
}
