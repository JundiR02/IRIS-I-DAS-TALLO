import type { Lang, Status } from '../lib/types'
import { STATUS, statusLabel } from '../lib/status'
import StatusIcon from './StatusIcon'

interface Props {
  status: Status
  lang?: Lang
  size?: 'sm' | 'md' | 'lg'
  variant?: 'soft' | 'solid'
  showMark?: boolean
  className?: string
}

const MARK_SIZE = { sm: 11, md: 13, lg: 15 }

const SIZE = {
  sm: 'text-[11px] px-2 py-0.5 gap-1',
  md: 'text-xs px-2.5 py-1 gap-1.5',
  lg: 'text-sm px-3 py-1.5 gap-1.5',
}

export default function StatusPill({
  status,
  lang = 'id',
  size = 'md',
  variant = 'soft',
  showMark = true,
  className,
}: Props) {
  const s = STATUS[status]
  const tone =
    variant === 'solid' ? `${s.solid}` : `${s.wash} ${s.text}`
  return (
    <span
      className={`inline-flex items-center rounded-pill font-bold ${SIZE[size]} ${tone} ${className ?? ''}`}
    >
      {showMark && <StatusIcon status={status} size={MARK_SIZE[size]} strokeWidth={2.6} />}
      {statusLabel(status, lang)}
    </span>
  )
}
