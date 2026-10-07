import { useState } from 'react'
import { Navigate, useParams } from 'react-router-dom'
import { Pin, Heart, Send, AtSign, ShieldCheck } from 'lucide-react'
import { useApp } from '../store/store'
import { waktuRelatif } from '../lib/format'
import AppBar from '../components/AppBar'
import Avatar from '../components/Avatar'
import PostCard from '../components/PostCard'

export default function Diskusi() {
  const { id = '' } = useParams()
  const { laporanById, komentarByLaporan, sukaKomentar, actions } = useApp()
  const laporan = laporanById(id)
  const [teks, setTeks] = useState('')
  const [mention, setMention] = useState<string | undefined>()

  if (!laporan) return <Navigate to="/" replace />
  const komentar = komentarByLaporan(id)

  const kirim = () => {
    const t = teks.trim()
    if (!t) return
    actions.tambahKomentar(id, t, mention)
    actions.toast('Komentar terkirim', '💬')
    setTeks('')
    setMention(undefined)
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <AppBar title="Diskusi" showBack />

      <div className="app-scroll flex-1 space-y-3 overflow-y-auto bg-bone-100 px-4 pb-4 pt-4">
        <PostCard laporan={laporan} />

        <p className="px-1 pt-1 text-[13px] font-extrabold text-ink">
          {komentar.length} komentar
        </p>

        {komentar.map((k) => {
          const disuka = sukaKomentar(k.id)
          return (
            <div
              key={k.id}
              className={`rounded-card p-3.5 shadow-soft ${
                k.disematkan ? 'border-2 border-lime bg-lime/10' : 'bg-white'
              }`}
            >
              {k.disematkan && (
                <p className="mb-2 flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-wide text-forest">
                  <Pin size={12} /> Rekomendasi Resmi
                </p>
              )}
              <div className="flex gap-2.5">
                <Avatar
                  nama={k.nama}
                  inisial={k.inisial}
                  warna={k.warna}
                  size={34}
                  peneliti={k.peran === 'peneliti'}
                />
                <div className="min-w-0 flex-1">
                  <p className="flex flex-wrap items-center gap-1.5 text-[13px] font-bold text-ink">
                    {k.nama}
                    {k.peran === 'peneliti' && (
                      <span className="inline-flex items-center gap-1 rounded-pill bg-forest px-1.5 py-0.5 text-[9px] font-bold text-white">
                        <ShieldCheck size={9} /> Peneliti
                      </span>
                    )}
                    <span className="font-medium text-ink-faint">· {waktuRelatif(k.waktu)}</span>
                  </p>
                  <p className="mt-1 text-[13.5px] leading-relaxed text-ink-soft">
                    {k.mention && <span className="font-bold text-forest">@{k.mention} </span>}
                    {k.teks}
                  </p>
                  <button
                    onClick={() => actions.toggleSukaKomentar(k.id)}
                    className={`mt-1.5 flex items-center gap-1 text-[12px] font-bold ${
                      disuka ? 'text-bahaya' : 'text-ink-faint'
                    }`}
                  >
                    <Heart size={13} className={disuka ? 'fill-bahaya' : ''} /> {k.suka}
                  </button>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Input komentar */}
      <div className="border-t border-bone-200 bg-bone-50 px-3 py-2.5">
        {mention && (
          <div className="mb-2 flex items-center gap-1.5">
            <span className="flex items-center gap-1 rounded-pill bg-forest/10 px-2 py-1 text-[11px] font-bold text-forest">
              @{mention}
              <button onClick={() => setMention(undefined)} aria-label="Hapus tanda">
                ×
              </button>
            </span>
          </div>
        )}
        <div className="flex items-end gap-2">
          <button
            onClick={() => setMention(mention ? undefined : 'Darmawati (Bu RT)')}
            className={`grid h-10 w-10 shrink-0 place-items-center rounded-full ${
              mention ? 'bg-forest text-white' : 'bg-bone-200 text-ink-soft'
            }`}
            aria-label="Tandai warga"
          >
            <AtSign size={17} />
          </button>
          <textarea
            value={teks}
            onChange={(e) => setTeks(e.target.value)}
            rows={1}
            placeholder="Tulis komentar…"
            className="max-h-24 min-h-[40px] flex-1 resize-none rounded-2xl border border-bone-200 bg-white px-3.5 py-2.5 text-sm text-ink outline-none placeholder:text-ink-faint focus:border-forest"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                kirim()
              }
            }}
          />
          <button
            onClick={kirim}
            disabled={!teks.trim()}
            className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-forest text-white disabled:opacity-40"
            aria-label="Kirim"
          >
            <Send size={17} />
          </button>
        </div>
      </div>
    </div>
  )
}
