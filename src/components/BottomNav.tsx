import { NavLink, useNavigate } from 'react-router-dom'
import { Home, Map, Lightbulb, User, Plus } from 'lucide-react'
import { useApp } from '../store/store'
import { tanggalGiliran } from '../lib/rotasi'

const TABS = [
  { to: '/', label: 'Beranda', Icon: Home, end: true },
  { to: '/peta', label: 'Peta', Icon: Map, end: false },
  { to: '/rekomendasi', label: 'Arahan', Icon: Lightbulb, end: false },
  { to: '/profil', label: 'Profil', Icon: User, end: false },
]

export default function BottomNav() {
  const navigate = useNavigate()
  const { giliranHariIni, me, state, rekomendasiSaya, actions } = useApp()
  const belumDibaca = rekomendasiSaya.filter((r) => !r.dibaca).length

  const handleLapor = () => {
    if (!giliranHariIni) {
      actions.toast(
        `Giliran Anda: ${tanggalGiliran(state.hariKe, me.noUrut)} — atau pakai Lapor Darurat`,
        '🗓️',
      )
    }
    navigate('/lapor')
  }

  return (
    <nav className="pointer-events-none absolute inset-x-0 bottom-0 z-30 px-4 pb-3">
      <div className="pointer-events-auto relative mx-auto flex items-end justify-between rounded-[26px] bg-white/95 px-3 py-2 shadow-card backdrop-blur">
        {TABS.slice(0, 2).map(({ to, label, Icon, end }) => (
          <Tab key={to} to={to} label={label} Icon={Icon} end={end} />
        ))}

        {/* FAB Lapor di tengah */}
        <div className="relative -mt-8 w-16 shrink-0">
          <button
            onClick={handleLapor}
            aria-label="Lapor hari ini"
            className={`group mx-auto flex h-14 w-14 items-center justify-center rounded-full shadow-fab transition-transform active:scale-95 ${
              giliranHariIni ? 'bg-lime text-forest-deep' : 'bg-bone-300 text-ink-muted'
            }`}
          >
            {giliranHariIni && (
              <span className="absolute inset-0 -z-10 rounded-full bg-lime/60 animate-pulse-ring" />
            )}
            <Plus size={26} strokeWidth={3} />
          </button>
          <span
            className={`mt-1 block text-center text-[10px] font-bold ${
              giliranHariIni ? 'text-forest' : 'text-ink-faint'
            }`}
          >
            {giliranHariIni ? 'Lapor' : 'Belum giliran'}
          </span>
        </div>

        {TABS.slice(2).map(({ to, label, Icon, end }) => (
          <Tab
            key={to}
            to={to}
            label={label}
            Icon={Icon}
            end={end}
            badge={to === '/rekomendasi' && belumDibaca > 0 ? belumDibaca : undefined}
          />
        ))}
      </div>
      {state.offline && (
        <p className="pointer-events-none mt-1 text-center text-[10px] font-semibold text-waspada-ink">
          Mode offline aktif
        </p>
      )}
    </nav>
  )
}

function Tab({
  to,
  label,
  Icon,
  end,
  badge,
}: {
  to: string
  label: string
  Icon: typeof Home
  end: boolean
  badge?: number
}) {
  return (
    <NavLink
      to={to}
      end={end}
      className="relative flex w-16 flex-col items-center gap-1 py-1"
    >
      {({ isActive }) => (
        <>
          <span
            className={`relative flex h-8 w-8 items-center justify-center rounded-full transition-colors ${
              isActive ? 'bg-forest text-white' : 'text-ink-muted'
            }`}
          >
            <Icon size={19} strokeWidth={isActive ? 2.6 : 2} />
            {badge !== undefined && (
              <span className="absolute -right-1 -top-1 grid h-4 min-w-4 place-items-center rounded-full bg-bahaya px-1 text-[9px] font-bold text-white">
                {badge}
              </span>
            )}
          </span>
          <span
            className={`text-[10px] font-bold ${isActive ? 'text-forest' : 'text-ink-faint'}`}
          >
            {label}
          </span>
        </>
      )}
    </NavLink>
  )
}
