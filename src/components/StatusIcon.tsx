import { STATUS_MARK } from '../lib/status'
import type { Status } from '../lib/types'

// Status tidak boleh hanya dibedakan lewat warna (±8% pria buta warna
// merah-hijau), dan tidak dipinjam dari pustaka ikon generik supaya tidak
// terasa seperti template UI-kit. Tiga tanda ini digambar tangan bertema air
// sungai — bentuknya sendiri sudah membedakan, warna jadi penguat kedua.
// Geometri sama persis dipakai ulang di peta (screens/Peta.tsx) lewat
// lib/status.ts → STATUS_MARK, jadi satu sumber gambar untuk keduanya.

interface Props {
  status: Status
  size?: number
  className?: string
  strokeWidth?: number
}

export default function StatusIcon({ status, size = 18, className, strokeWidth = 2.3 }: Props) {
  const mark = STATUS_MARK[status]
  return (
    <svg
      viewBox={mark.viewBox}
      width={size}
      height={size}
      className={className}
      aria-hidden
    >
      {mark.d.map((d, i) => (
        <path
          key={i}
          d={d}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ))}
    </svg>
  )
}
