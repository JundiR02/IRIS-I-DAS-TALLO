interface Props {
  nama: string
  inisial: string
  warna: string
  size?: number
  peneliti?: boolean
  className?: string
}

export default function Avatar({ nama, inisial, warna, size = 40, peneliti, className }: Props) {
  return (
    <span
      className={`relative inline-flex shrink-0 items-center justify-center rounded-full font-bold text-white ${className ?? ''}`}
      style={{
        width: size,
        height: size,
        background: `linear-gradient(150deg, ${warna}, ${warna}cc)`,
        fontSize: size * 0.38,
        boxShadow: peneliti ? `0 0 0 2px #fff, 0 0 0 4px ${warna}` : undefined,
      }}
      aria-label={nama}
      title={nama}
    >
      {inisial}
      {peneliti && (
        <span
          className="absolute -bottom-0.5 -right-0.5 flex items-center justify-center rounded-full bg-forest text-[9px] text-white ring-2 ring-white"
          style={{ width: size * 0.42, height: size * 0.42 }}
        >
          ✓
        </span>
      )}
    </span>
  )
}
