import { useEffect, type ReactNode } from 'react'
import { X } from 'lucide-react'

interface Props {
  open: boolean
  onClose: () => void
  title?: string
  children: ReactNode
  /** tinggi maksimum konten dalam persen tinggi layar */
  maxHeight?: number
}

export default function Sheet({ open, onClose, title, children, maxHeight = 82 }: Props) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null
  return (
    <div className="absolute inset-0 z-40 flex flex-col justify-end">
      <button
        aria-label="Tutup"
        className="absolute inset-0 bg-ink/40 backdrop-blur-[1px] animate-[fade-up_0.2s_ease-out]"
        onClick={onClose}
      />
      <div
        className="relative animate-sheet-up rounded-t-[28px] bg-bone-50 shadow-lift"
        style={{ maxHeight: `${maxHeight}%` }}
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-center justify-between px-5 pb-2 pt-3">
          <span className="mx-auto h-1.5 w-10 rounded-full bg-ink-faint/40" />
        </div>
        <div className="flex items-center justify-between px-5 pb-3">
          {title && <h2 className="text-base font-extrabold text-ink">{title}</h2>}
          <button
            onClick={onClose}
            className="ml-auto grid h-8 w-8 place-items-center rounded-full bg-bone-200 text-ink-soft"
            aria-label="Tutup"
          >
            <X size={16} />
          </button>
        </div>
        <div className="app-scroll overflow-y-auto px-5 pb-6" style={{ maxHeight: '70vh' }}>
          {children}
        </div>
      </div>
    </div>
  )
}
