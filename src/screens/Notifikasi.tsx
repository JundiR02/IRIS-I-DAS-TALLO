import { useNavigate } from 'react-router-dom'
import {
  CalendarDays,
  ShieldCheck,
  TriangleAlert,
  MessageCircle,
  Gift,
  CheckCheck,
} from 'lucide-react'
import { useApp } from '../store/store'
import type { JenisNotif, Notif } from '../lib/types'
import { labelHari, waktuRelatif } from '../lib/format'
import AppBar from '../components/AppBar'

const IKON: Record<JenisNotif, { Icon: typeof Gift; cls: string }> = {
  giliran: { Icon: CalendarDays, cls: 'bg-forest/10 text-forest' },
  terverifikasi: { Icon: ShieldCheck, cls: 'bg-forest/10 text-forest' },
  peringatan: { Icon: TriangleAlert, cls: 'bg-bahaya-wash text-bahaya-ink' },
  komentar: { Icon: MessageCircle, cls: 'bg-river/10 text-river-deep' },
  poin: { Icon: Gift, cls: 'bg-lime/25 text-forest-deep' },
}

export default function Notifikasi() {
  const navigate = useNavigate()
  const { state, actions } = useApp()

  const notif = [...state.notif].sort((a, b) => +new Date(b.waktu) - +new Date(a.waktu))
  const isRead = (id: string, dibaca: boolean) => dibaca || state.notifDibaca.includes(id)

  // Kelompokkan per hari — daftar datar akan sulit dipindai kalau sudah berjalan puluhan hari.
  const kelompok: { label: string; item: Notif[] }[] = []
  for (const n of notif) {
    const label = labelHari(n.waktu)
    const grup = kelompok[kelompok.length - 1]
    if (grup && grup.label === label) grup.item.push(n)
    else kelompok.push({ label, item: [n] })
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <AppBar
        title="Notifikasi"
        showBack
        right={
          <button
            onClick={() => actions.bacaNotif()}
            className="flex items-center gap-1 rounded-pill bg-bone-200 px-2.5 py-1.5 text-[11px] font-bold text-ink-soft"
          >
            <CheckCheck size={13} /> Tandai dibaca
          </button>
        }
      />
      <div className="app-scroll flex-1 overflow-y-auto px-4 pb-6 pt-4">
        {kelompok.map((grup) => (
          <div key={grup.label} className="mb-4">
            <p className="mb-2 px-1 text-[11px] font-extrabold uppercase tracking-wide text-ink-faint">
              {grup.label}
            </p>
            <div className="space-y-2">
              {grup.item.map((n) => {
                const { Icon, cls } = IKON[n.jenis]
                const read = isRead(n.id, n.dibaca)
                return (
                  <button
                    key={n.id}
                    onClick={() => {
                      actions.bacaNotif(n.id)
                      if (n.laporanId) navigate(`/diskusi/${n.laporanId}`)
                    }}
                    className={`flex w-full items-start gap-3 rounded-card p-3.5 text-left shadow-soft ${
                      read ? 'bg-white' : 'bg-white ring-1 ring-forest/25'
                    }`}
                  >
                    <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-full ${cls}`}>
                      <Icon size={17} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-[13px] leading-snug text-ink-soft">{n.teks}</span>
                      <span className="mt-1 block text-[11px] text-ink-faint">{waktuRelatif(n.waktu)}</span>
                    </span>
                    {!read && <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-bahaya" />}
                  </button>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
