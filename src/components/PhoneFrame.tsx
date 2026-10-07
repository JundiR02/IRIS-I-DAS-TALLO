import type { ReactNode } from 'react'
import { Signal, Wifi, BatteryMedium } from 'lucide-react'

export default function PhoneFrame({ children }: { children: ReactNode }) {
  return (
    <div className="relative shrink-0" data-shot="phone-frame">
      {/* Bezel */}
      <div className="relative h-[812px] w-[380px] rounded-[46px] bg-ink p-[10px] shadow-[0_40px_90px_-30px_rgba(27,42,34,0.55)]">
        <div className="relative h-full w-full overflow-hidden rounded-[38px] bg-bone-50">
          {/* Status bar */}
          <div className="pointer-events-none absolute inset-x-0 top-0 z-50 flex h-11 items-center justify-between px-7 pt-1 text-[13px] font-semibold text-ink">
            <span>07.20</span>
            <span className="flex items-center gap-1.5">
              <Signal size={14} />
              <Wifi size={14} />
              <BatteryMedium size={18} />
            </span>
          </div>
          {/* Notch */}
          <div className="absolute left-1/2 top-2 z-50 h-6 w-32 -translate-x-1/2 rounded-full bg-ink" />
          {/* App viewport */}
          <div className="absolute inset-0 top-11 flex flex-col">{children}</div>
        </div>
      </div>
    </div>
  )
}
