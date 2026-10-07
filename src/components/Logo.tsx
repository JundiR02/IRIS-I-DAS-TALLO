interface Props {
  size?: number
  withText?: boolean
  className?: string
}

export default function Logo({ size = 30, withText = true, className }: Props) {
  return (
    <span className={`inline-flex items-center gap-2 ${className ?? ''}`}>
      <svg width={size} height={size} viewBox="0 0 64 64" fill="none" aria-hidden>
        <rect width="64" height="64" rx="18" fill="#2F5D3A" />
        <path
          d="M14 40c5 0 5-5 10-5s5 5 10 5 5-5 10-5 5 5 10 5"
          stroke="#CFE95B"
          strokeWidth="4.5"
          strokeLinecap="round"
        />
        <path
          d="M14 30c5 0 5-4 10-4s5 4 10 4 5-4 10-4 5 4 10 4"
          stroke="#8FBF9A"
          strokeWidth="3.5"
          strokeLinecap="round"
          opacity="0.7"
        />
        <path d="M32 12c4 6 7 10 7 15a7 7 0 0 1-14 0c0-5 3-9 7-15Z" fill="#CFE95B" />
      </svg>
      {withText && (
        <span className="leading-none">
          <span className="block text-[15px] font-extrabold tracking-tight text-forest-deep">
            IRIS-I
          </span>
          <span className="block text-[10px] font-semibold text-ink-muted">Sungai Tallo</span>
        </span>
      )}
    </span>
  )
}
