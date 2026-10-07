interface Props {
  values: number[]
  width?: number
  height?: number
  stroke?: string
  fill?: string
  className?: string
}

export default function Sparkline({
  values,
  width = 120,
  height = 40,
  stroke = '#2F5D3A',
  fill = 'rgba(47,93,58,0.12)',
  className,
}: Props) {
  if (values.length < 2) return null
  const min = Math.min(...values)
  const max = Math.max(...values)
  const span = max - min || 1
  const stepX = width / (values.length - 1)
  const pts = values.map((v, i) => {
    const x = i * stepX
    const y = height - 4 - ((v - min) / span) * (height - 8)
    return [x, y] as const
  })
  const line = pts.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`).join(' ')
  const area = `${line} L${width},${height} L0,${height} Z`
  return (
    <svg width={width} height={height} className={className} aria-hidden>
      <path d={area} fill={fill} />
      <path d={line} fill="none" stroke={stroke} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={pts[pts.length - 1][0]} cy={pts[pts.length - 1][1]} r="3" fill={stroke} />
    </svg>
  )
}
