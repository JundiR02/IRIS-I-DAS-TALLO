import { NavLink, Navigate, Route, Routes } from 'react-router-dom'
import { LayoutDashboard, ClipboardCheck, MessagesSquare, Users, LogOut, RefreshCw, Smartphone } from 'lucide-react'
import Logo from '../components/Logo'
import Avatar from '../components/Avatar'
import { PanelProvider, usePanel } from './usePanel'
import PanelLogin from './PanelLogin'
import TabRingkasan from './TabRingkasan'
import TabLaporan from './TabLaporan'
import TabKomentar from './TabKomentar'
import TabPengguna from './TabPengguna'
import { BadgePeran } from './ui'

const NAV = [
  { to: '/panel', label: 'Ringkasan', Ikon: LayoutDashboard, end: true, admin: false },
  { to: '/panel/laporan', label: 'Laporan & Verifikasi', Ikon: ClipboardCheck, end: false, admin: false },
  { to: '/panel/komentar', label: 'Komentar', Ikon: MessagesSquare, end: false, admin: false },
  { to: '/panel/pengguna', label: 'Pengguna', Ikon: Users, end: false, admin: true },
]

function KerangkaPanel() {
  const { sesi, isAdmin, keluar, muatUlang, memuat, galat, notif, ringkasan } = usePanel()
  if (!sesi) return <PanelLogin />

  const nav = NAV.filter((n) => !n.admin || isAdmin)

  return (
    <div className="flex h-full flex-col bg-bone-100 lg:flex-row">
      {/* Sidebar (desktop) / bilah atas (HP) */}
      <aside className="shrink-0 bg-forest-deep text-white lg:flex lg:w-64 lg:flex-col">
        <div className="flex items-center gap-3 px-4 py-3 lg:px-5 lg:py-5">
          <span className="rounded-xl bg-bone-50 px-2 py-1.5">
            <Logo size={26} />
          </span>
          <span className="text-[11px] font-bold uppercase tracking-wider text-white/60">Panel</span>
          <button
            onClick={() => keluar()}
            className="ml-auto grid h-9 w-9 place-items-center rounded-full bg-white/10 lg:hidden"
            aria-label="Keluar"
          >
            <LogOut size={16} />
          </button>
        </div>
        <nav className="flex gap-1 overflow-x-auto px-3 pb-3 lg:flex-1 lg:flex-col lg:overflow-visible lg:pb-0">
          {nav.map(({ to, label, Ikon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex shrink-0 items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-bold transition-colors ${
                  isActive ? 'bg-white text-forest-deep' : 'text-white/75 hover:bg-white/10 hover:text-white'
                }`
              }
            >
              <Ikon size={17} />
              <span className="whitespace-nowrap">{label}</span>
              {to === '/panel/laporan' && !!ringkasan?.laporanMenunggu && (
                <span className="ml-auto rounded-pill bg-waspada px-1.5 text-[11px] text-white">{ringkasan.laporanMenunggu}</span>
              )}
            </NavLink>
          ))}
        </nav>
        <div className="hidden border-t border-white/10 p-4 lg:block">
          <div className="flex items-center gap-2.5">
            <Avatar nama={sesi.akun.nama} inisial={sesi.akun.inisial} warna={sesi.akun.warna} size={36} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold">{sesi.akun.nama}</p>
              <BadgePeran peran={sesi.akun.peran} />
            </div>
          </div>
          <div className="mt-3 flex gap-2">
            <a href="#/" className="flex flex-1 items-center justify-center gap-1.5 rounded-pill bg-white/10 py-2 text-[12px] font-bold hover:bg-white/20">
              <Smartphone size={13} /> Aplikasi
            </a>
            <button
              onClick={() => keluar()}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-pill bg-white/10 py-2 text-[12px] font-bold hover:bg-white/20"
            >
              <LogOut size={13} /> Keluar
            </button>
          </div>
        </div>
      </aside>

      <main className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto max-w-6xl px-4 py-5 lg:px-8 lg:py-8">
          <div className="mb-4 flex items-center justify-end gap-3">
            {galat && <p className="mr-auto text-sm font-semibold text-bahaya-ink">{galat}</p>}
            <button
              onClick={() => void muatUlang()}
              disabled={memuat}
              className="inline-flex items-center gap-1.5 rounded-pill bg-white px-3 py-1.5 text-[12px] font-bold text-ink-soft shadow-soft disabled:opacity-60"
            >
              <RefreshCw size={13} className={memuat ? 'animate-spin' : ''} /> {memuat ? 'Memuat…' : 'Muat ulang'}
            </button>
          </div>
          <Routes>
            <Route path="/panel" element={<TabRingkasan />} />
            <Route path="/panel/laporan" element={<TabLaporan />} />
            <Route path="/panel/komentar" element={<TabKomentar />} />
            <Route path="/panel/pengguna" element={isAdmin ? <TabPengguna /> : <Navigate to="/panel" replace />} />
            <Route path="*" element={<Navigate to="/panel" replace />} />
          </Routes>
        </div>
      </main>

      {notif && (
        <div
          key={notif.id}
          role="status"
          className={`fixed bottom-5 left-1/2 z-[60] -translate-x-1/2 animate-fade-up rounded-pill px-4 py-2.5 text-sm font-bold shadow-lift ${
            notif.jenis === 'ok' ? 'bg-forest-deep text-white' : 'bg-bahaya text-white'
          }`}
        >
          {notif.teks}
        </div>
      )}
    </div>
  )
}

/** Panel web untuk admin & peneliti — dibuka di #/panel, di luar bingkai HP. */
export default function PanelApp() {
  return (
    <PanelProvider>
      <KerangkaPanel />
    </PanelProvider>
  )
}
