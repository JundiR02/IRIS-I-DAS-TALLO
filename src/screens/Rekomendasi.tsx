import { useNavigate } from 'react-router-dom'
import { Lightbulb, ShieldCheck, ChevronRight, CheckCheck, CircleCheckBig } from 'lucide-react'
import { useApp } from '../store/store'
import { STATUS } from '../lib/status'
import { waktuRelatif } from '../lib/format'
import AppBar from '../components/AppBar'
import FotoLaporan from '../components/FotoLaporan'
import StatusPill from '../components/StatusPill'

export default function Rekomendasi() {
  const navigate = useNavigate()
  const { rekomendasiSaya, laporanById, actions } = useApp()

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <AppBar title="Arahan untuk Saya" />
      <div className="app-scroll flex-1 space-y-3 overflow-y-auto px-4 pb-28 pt-4">
        <div className="flex items-start gap-2.5 rounded-card bg-forest/5 px-4 py-3">
          <Lightbulb size={18} className="mt-0.5 shrink-0 text-forest" />
          <p className="text-[13px] leading-snug text-ink-soft">
            Arahan singkat dari Tim Peneliti setelah mengecek laporan di wilayah Anda. Ikuti langkahnya,
            lalu tandai "Sudah dilakukan" — peneliti akan tahu arahannya sampai ke warga.
          </p>
        </div>

        {rekomendasiSaya.length === 0 && (
          <p className="rounded-card bg-white px-4 py-10 text-center text-sm text-ink-muted shadow-soft">
            Belum ada arahan. Arahan muncul setelah laporan Anda dicek peneliti.
          </p>
        )}

        {rekomendasiSaya.map((r) => {
          const meta = STATUS[r.level]
          const lap = laporanById(r.laporanId)
          return (
            <div
              key={r.id}
              className={`overflow-hidden rounded-card bg-white shadow-card ${r.dibaca ? 'opacity-75' : ''}`}
            >
              <button
                onClick={() => {
                  actions.bacaRekomendasi(r.id)
                  if (lap) navigate(`/diskusi/${lap.id}`)
                }}
                className="flex w-full gap-0 text-left"
              >
                <span className={`w-1.5 shrink-0 ${meta.dot}`} />
                <span className="min-w-0 flex-1 p-4">
                  <span className="flex items-center gap-2">
                    <StatusPill status={r.level} size="sm" />
                    {!r.dibaca && (
                      <span className="rounded-pill bg-bahaya/10 px-2 py-0.5 text-[10px] font-bold text-bahaya">
                        Baru
                      </span>
                    )}
                  </span>
                  <span className="mt-2 block text-[15px] font-extrabold text-ink">{r.judul}</span>
                  <span className="mt-1 block text-[13px] leading-relaxed text-ink-soft">{r.teks}</span>
                  <span className="mt-2.5 flex items-center gap-1.5 text-[11px] text-ink-faint">
                    <ShieldCheck size={12} className="text-forest" />
                    {r.reviewerNama} · {waktuRelatif(r.waktu)}
                    {r.dibaca && (
                      <>
                        <span>·</span>
                        <CheckCheck size={12} /> dibaca
                      </>
                    )}
                  </span>
                </span>
                {lap && (
                  <span className="relative m-3 block h-16 w-16 shrink-0 overflow-hidden rounded-xl">
                    <FotoLaporan laporan={lap} className="h-full w-full" tiang={false} />
                  </span>
                )}
                <span className="grid place-items-center pr-3 text-ink-faint">
                  <ChevronRight size={18} />
                </span>
              </button>

              {/* Aksi balik — supaya arahan tidak terasa satu arah (peneliti tahu tingkat kepatuhan). */}
              <div className="flex items-center justify-between gap-2 border-t border-bone-100 px-4 py-2.5">
                <span className="text-[11px] text-ink-faint">
                  {r.ditindak ? 'Ditandai sudah dilakukan' : 'Sudah Anda lakukan?'}
                </span>
                <button
                  onClick={() => {
                    actions.tindakArahan(r.id)
                    if (!r.ditindak) actions.toast('Ditandai sudah dilakukan', '✅')
                  }}
                  className={`flex items-center gap-1.5 rounded-pill px-3 py-1.5 text-xs font-bold ${
                    r.ditindak ? 'bg-aman-wash text-aman-ink' : 'bg-forest text-white'
                  }`}
                >
                  <CircleCheckBig size={13} /> {r.ditindak ? 'Sudah dilakukan' : 'Tandai selesai'}
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
