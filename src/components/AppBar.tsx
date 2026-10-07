import type { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'

interface Props {
  title?: ReactNode
  left?: ReactNode
  right?: ReactNode
  showBack?: boolean
  onBack?: () => void
  border?: boolean
}

export default function AppBar({ title, left, right, showBack, onBack, border = true }: Props) {
  const navigate = useNavigate()
  return (
    <header
      className={`sticky top-0 z-20 flex h-14 items-center gap-2 bg-bone-50/90 px-4 backdrop-blur ${
        border ? 'border-b border-bone-200' : ''
      }`}
    >
      {showBack && (
        <button
          onClick={() => (onBack ? onBack() : navigate(-1))}
          aria-label="Kembali"
          className="-ml-1.5 grid h-9 w-9 shrink-0 place-items-center rounded-full bg-bone-200 text-ink-soft active:scale-95"
        >
          <ChevronLeft size={20} />
        </button>
      )}
      {left}
      {title && (
        <h1 className="truncate text-[17px] font-extrabold tracking-tight text-ink">{title}</h1>
      )}
      <div className="ml-auto flex items-center gap-1.5">{right}</div>
    </header>
  )
}
