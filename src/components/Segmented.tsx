interface Props<T extends string> {
  options: { value: T; label: string }[]
  value: T
  onChange: (v: T) => void
  className?: string
}

export default function Segmented<T extends string>({ options, value, onChange, className }: Props<T>) {
  return (
    <div className={`inline-flex rounded-pill bg-bone-200 p-1 ${className ?? ''}`}>
      {options.map((o) => (
        <button
          key={o.value}
          onClick={() => onChange(o.value)}
          className={`rounded-pill px-3.5 py-1.5 text-xs font-bold transition-colors ${
            value === o.value ? 'bg-white text-ink shadow-soft' : 'text-ink-muted'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}
