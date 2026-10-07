import { useMemo } from 'react'
import type { Status } from '../lib/types'

// Ilustrasi sungai prosedural (pengganti foto pada prototipe).
// Warna & tinggi air mengikuti status — "warna dulu, teks belakangan".

function mulberry32(seed: number) {
  let a = seed >>> 0
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const PALET: Record<
  Status,
  { langit: [string, string]; air: [string, string]; tepi: string; buih: string; level: number }
> = {
  aman: {
    langit: ['#DCEBF4', '#F2F6EC'],
    air: ['#5AA9C9', '#2F7C9B'],
    tepi: '#6E9A54',
    buih: '#EAF6FA',
    level: 0.42,
  },
  waspada: {
    langit: ['#E7E3D3', '#F3EBD7'],
    air: ['#B08A4E', '#7C6236'],
    tepi: '#7E7A45',
    buih: '#F0E7D2',
    level: 0.6,
  },
  bahaya: {
    langit: ['#DAD3C4', '#E4D2C4'],
    air: ['#A65B3D', '#7A3F2C'],
    tepi: '#6B5B3C',
    buih: '#E9D9CC',
    level: 0.78,
  },
}

interface Props {
  status: Status
  seed?: number
  className?: string
  /** tampilkan tiang ukur / palang jembatan sebagai skala */
  tiang?: boolean
}

export default function RiverScene({ status, seed = 1, className, tiang = true }: Props) {
  const p = PALET[status]
  const uid = useMemo(() => `rs-${status}-${seed}-${Math.random().toString(36).slice(2, 7)}`, [status, seed])

  const { pohon, awan, riak, sampah, bankPath } = useMemo(() => {
    const r = mulberry32(seed * 97 + status.length * 13)
    const waterY = 200 * (1 - p.level)
    const pohon = Array.from({ length: 5 }, () => ({
      x: 10 + r() * 300,
      y: waterY - 6 - r() * 26,
      s: 0.7 + r() * 0.8,
      kiri: r() > 0.5,
    }))
    const awan = Array.from({ length: 3 }, () => ({
      x: r() * 320,
      y: 12 + r() * 40,
      s: 0.8 + r() * 0.9,
    }))
    const riak = Array.from({ length: 5 }, (_, i) => ({
      y: waterY + 14 + i * ((186 - waterY) / 6),
      dx: r() * 40,
      w: 0.5 + r() * 0.5,
    }))
    const sampah =
      status === 'bahaya'
        ? Array.from({ length: 4 }, () => ({
            x: 30 + r() * 260,
            y: waterY + 12 + r() * 60,
            rot: r() * 60 - 30,
            s: 0.7 + r() * 0.7,
          }))
        : []
    const dip = 6 + r() * 10
    const bankPath = `M0,${waterY} C 80,${waterY - dip} 130,${waterY + dip} 200,${waterY - dip / 2} S 330,${waterY + dip} 360,${waterY} L360,200 L0,200 Z`
    return { pohon, awan, riak, sampah, bankPath }
  }, [seed, status, p.level])

  return (
    <svg
      viewBox="0 0 360 200"
      className={className}
      preserveAspectRatio="xMidYMid slice"
      role="img"
      aria-label={`Kondisi sungai: ${status}`}
    >
      <defs>
        <linearGradient id={`${uid}-sky`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={p.langit[0]} />
          <stop offset="100%" stopColor={p.langit[1]} />
        </linearGradient>
        <linearGradient id={`${uid}-water`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={p.air[0]} />
          <stop offset="100%" stopColor={p.air[1]} />
        </linearGradient>
        <clipPath id={`${uid}-clip`}>
          <rect x="0" y="0" width="360" height="200" />
        </clipPath>
      </defs>

      <g clipPath={`url(#${uid}-clip)`}>
        <rect x="0" y="0" width="360" height="200" fill={`url(#${uid}-sky)`} />

        {awan.map((a, i) => (
          <g key={i} transform={`translate(${a.x} ${a.y}) scale(${a.s})`} opacity={0.75}>
            <ellipse cx="0" cy="0" rx="22" ry="10" fill="#ffffff" />
            <ellipse cx="16" cy="4" rx="16" ry="8" fill="#ffffff" />
            <ellipse cx="-16" cy="4" rx="14" ry="7" fill="#ffffff" />
          </g>
        ))}

        {/* Tepi sungai / vegetasi */}
        <path d={bankPath} fill={p.tepi} />
        <path d={bankPath} fill="#000000" opacity={0.06} transform="translate(0 3)" />

        {pohon.map((t, i) => (
          <g key={i} transform={`translate(${t.x} ${t.y}) scale(${t.s})`}>
            <rect x="-1.5" y="0" width="3" height="12" fill="#5c4632" />
            <circle cx="0" cy="-2" r="9" fill={status === 'aman' ? '#4F7D3C' : '#6B7245'} />
            <circle cx="-6" cy="3" r="6" fill={status === 'aman' ? '#5C8F46' : '#767C4C'} />
            <circle cx="6" cy="3" r="6" fill={status === 'aman' ? '#5C8F46' : '#767C4C'} />
          </g>
        ))}

        {/* Air */}
        {(() => {
          const waterY = 200 * (1 - p.level)
          return (
            <>
              <rect x="0" y={waterY + 4} width="360" height={200 - waterY} fill={`url(#${uid}-water)`} />
              <path
                d={`M0,${waterY + 4} C 60,${waterY} 120,${waterY + 9} 180,${waterY + 4} S 300,${waterY} 360,${waterY + 5} L360,${waterY + 16} L0,${waterY + 16} Z`}
                fill={p.buih}
                opacity={0.55}
              />
              {riak.map((k, i) => (
                <path
                  key={i}
                  d={`M${-20 + k.dx},${k.y} q 18,-4 36,0 t 36,0 t 36,0 t 36,0 t 36,0 t 36,0 t 36,0 t 36,0`}
                  stroke={p.buih}
                  strokeWidth={k.w}
                  fill="none"
                  opacity={status === 'aman' ? 0.5 : 0.26}
                />
              ))}
              {sampah.map((s, i) => (
                <g key={i} transform={`translate(${s.x} ${s.y}) rotate(${s.rot}) scale(${s.s})`}>
                  <rect x="-7" y="-1.5" width="14" height="3" rx="1" fill="#3f2d20" opacity={0.8} />
                  <rect x="-2" y="-5" width="3" height="9" rx="1" fill="#4a3626" opacity={0.7} />
                </g>
              ))}
            </>
          )
        })()}

        {/* Tiang ukur ketinggian air (skala) */}
        {tiang &&
          (() => {
            const waterY = 200 * (1 - p.level)
            return (
              <g transform="translate(300 0)">
                <rect x="-3" y={waterY - 70} width="6" height={200 - (waterY - 70)} rx="2" fill="#EFE9DA" />
                {Array.from({ length: 8 }).map((_, i) => (
                  <rect key={i} x="-3" y={waterY - 62 + i * 12} width="6" height="2" fill="#B23A2B" />
                ))}
                <path
                  d={`M-3,${waterY + 4} h6`}
                  stroke="#1B2A22"
                  strokeWidth="2"
                />
              </g>
            )
          })()}

        <rect x="0" y="0" width="360" height="200" fill="#1B2A22" opacity={0.03} />
      </g>
    </svg>
  )
}
