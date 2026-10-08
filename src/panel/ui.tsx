import { useEffect, type ReactNode } from 'react'
import { X } from 'lucide-react'
import type { Peran } from '../lib/api'

export const BTN = {
  primer:
    'inline-flex items-center justify-center gap-1.5 rounded-pill bg-forest px-4 py-2 text-sm font-bold text-white hover:bg-forest-deep disabled:opacity-50',
  sekunder:
    'inline-flex items-center justify-center gap-1.5 rounded-pill bg-bone-200 px-4 py-2 text-sm font-bold text-ink-soft hover:bg-bone-300 disabled:opacity-50',
  bahaya:
    'inline-flex items-center justify-center gap-1.5 rounded-pill bg-bahaya-wash px-4 py-2 text-sm font-bold text-bahaya-ink hover:bg-bahaya hover:text-white disabled:opacity-50',
  kecil:
    'inline-flex items-center gap-1 rounded-pill bg-bone-100 px-2.5 py-1 text-[12px] font-bold text-ink-soft hover:bg-bone-200 disabled:opacity-50',
}

export const INPUT =
  'w-full rounded-xl border-2 border-bone-200 bg-white px-3 py-2 text-sm text-ink outline-none placeholder:text-ink-faint focus:border-forest'

export const LABEL = 'mb-1 block text-[12px] font-bold text-ink-soft'

export function Modal({
  judul,
  onTutup,
  children,
  lebar = 'max-w-lg',
}: {
  judul: string
  onTutup: () => void
  children: ReactNode
  lebar?: string
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onTutup()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onTutup])

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 sm:items-center sm:p-6" onClick={onTutup}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={judul}
        onClick={(e) => e.stopPropagation()}
        className={`flex max-h-[92dvh] w-full ${lebar} animate-scale-in flex-col overflow-hidden rounded-t-card bg-bone-50 shadow-lift sm:rounded-card`}
      >
        <div className="flex items-center gap-3 border-b border-bone-200 px-5 py-3.5">
          <h2 className="flex-1 text-base font-extrabold text-ink">{judul}</h2>
          <button onClick={onTutup} className="grid h-8 w-8 place-items-center rounded-full hover:bg-bone-200" aria-label="Tutup">
            <X size={17} />
          </button>
        </div>
        <div className="overflow-y-auto px-5 py-4">{children}</div>
      </div>
    </div>
  )
}

export function KartuAngka({
  label,
  nilai,
  catatan,
  nada = 'netral',
  onClick,
}: {
  label: string
  nilai: number | string
  catatan?: string
  nada?: 'netral' | 'waspada' | 'bahaya' | 'aman'
  onClick?: () => void
}) {
  const warna = {
    netral: 'bg-white',
    aman: 'bg-aman-wash',
    waspada: 'bg-waspada-wash',
    bahaya: 'bg-bahaya-wash',
  }[nada]
  const Tag = onClick ? 'button' : 'div'
  return (
    <Tag
      onClick={onClick}
      className={`rounded-card ${warna} p-4 text-left shadow-soft ${onClick ? 'transition-transform hover:-translate-y-0.5' : ''}`}
    >
      <p className="text-[12px] font-bold text-ink-muted">{label}</p>
      <p className="mt-1 text-3xl font-extrabold tabular-nums text-ink">{nilai}</p>
      {catatan && <p className="mt-0.5 text-[11.5px] text-ink-muted">{catatan}</p>}
    </Tag>
  )
}

const PERAN_LABEL: Record<Peran, { teks: string; kelas: string }> = {
  warga: { teks: 'Masyarakat', kelas: 'bg-river-mist text-river-deep' },
  peneliti: { teks: 'Peneliti', kelas: 'bg-forest/10 text-forest' },
  admin: { teks: 'Admin', kelas: 'bg-lime/25 text-lime-deep' },
  pendaftar: { teks: 'Menunggu persetujuan', kelas: 'bg-waspada-wash text-waspada-ink' },
}

export function BadgePeran({ peran }: { peran: Peran }) {
  const p = PERAN_LABEL[peran]
  return <span className={`rounded-pill px-2 py-0.5 text-[11px] font-bold ${p.kelas}`}>{p.teks}</span>
}

export function Kosong({ children }: { children: ReactNode }) {
  return <p className="rounded-card bg-white/70 px-5 py-10 text-center text-sm text-ink-muted">{children}</p>
}

/** "7 Okt 2026, 14.05" */
export function tanggalJam(iso?: string): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}
