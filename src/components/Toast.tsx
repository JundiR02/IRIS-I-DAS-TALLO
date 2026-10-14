import { CircleCheck, Info, TriangleAlert } from 'lucide-react'
import { useApp, type NadaToast } from '../store/store'

const IKON: Record<NadaToast, typeof Info> = {
  ok: CircleCheck,
  peringatan: TriangleAlert,
  info: Info,
}

export default function Toast() {
  const { state } = useApp()
  if (!state.toast) return null
  const Ikon = state.toast.nada ? IKON[state.toast.nada] : null
  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-24 z-50 flex justify-center px-6">
      <div
        key={state.toast.id}
        role="status"
        className={`animate-fade-up flex max-w-[88%] items-center gap-2 rounded-pill bg-ink px-4 py-2.5 text-sm font-semibold text-bone-50 shadow-lift`}
      >
        {Ikon && (
          <Ikon
            size={17}
            aria-hidden
            className={`shrink-0 ${state.toast.nada === 'peringatan' ? 'text-waspada' : 'text-lime'}`}
          />
        )}
        <span>{state.toast.teks}</span>
      </div>
    </div>
  )
}
