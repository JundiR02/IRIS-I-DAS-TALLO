import { useApp } from '../store/store'

export default function Toast() {
  const { state } = useApp()
  if (!state.toast) return null
  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-24 z-50 flex justify-center px-6">
      <div
        key={state.toast.id}
        className="animate-fade-up flex max-w-[88%] items-center gap-2 rounded-pill bg-ink px-4 py-2.5 text-sm font-semibold text-bone-50 shadow-lift"
      >
        {state.toast.ikon && <span aria-hidden>{state.toast.ikon}</span>}
        <span>{state.toast.teks}</span>
      </div>
    </div>
  )
}
