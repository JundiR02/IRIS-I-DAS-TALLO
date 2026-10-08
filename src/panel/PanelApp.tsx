import { NavLink, Navigate, Route, Routes } from 'react-router-dom'
import { useState } from 'react'
import { LayoutDashboard, ClipboardCheck, MessagesSquare, Users, LogOut, RefreshCw, Smartphone, KeyRound } from 'lucide-react'
import { gantiRahasia } from '../lib/api'
import FormGantiSandi from '../components/FormGantiSandi'
import Logo from '../components/Logo'
import Avatar from '../components/Avatar'
import { PanelProvider, usePanel } from './usePanel'
import PanelLogin from './PanelLogin'
import TabRingkasan from './TabRingkasan'
import TabLaporan from './TabLaporan'
import TabKomentar from './TabKomentar'
import TabPengguna from './TabPengguna'
import ProfilSaya from './ProfilSaya'
import { BadgePeran, Modal } from './ui'

const NAV = [
  { to: '/panel', label: 'Ringkasan', Ikon: LayoutDashboard, end: true, admin: false },
  { to: '/panel/laporan', label: 'Laporan & Verifikasi', Ikon: ClipboardCheck, end: false, admin: false },
  { to: '/panel/komentar', label: 'Komentar', Ikon: MessagesSquare, end: false, admin: false },
  { to: '/panel/pengguna', label: 'Pengguna', Ikon: Users, end: false, admin: true },
]

function KerangkaPanel() {
  const { sesi, isAdmin, keluar, masuk, muatUlang, memuat, galat, notif, ringkasan } = usePanel()
  const [gantiSandi, setGantiSandi] = useState(false)
  const [ubahProfil, setUbahProfil] = useState(false)
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
          <button onClick={() => setUbahProfil(true)} className="ml-auto lg:hidden" aria-label="Profil saya">
            <Avatar nama={sesi.akun.nama} inisial={sesi.akun.inisial} warna={sesi.akun.warna} foto={sesi.akun.fotoUrl} size={36} />
          </button>
          <button
            onClick={() => setGantiSandi(true)}
            className="grid h-9 w-9 place-items-center rounded-full bg-white/10 lg:hidden"
            aria-label="Ganti kata sandi"
          >
            <KeyRound size={16} />
          </button>
          <button
            onClick={() => keluar()}
            className="grid h-9 w-9 place-items-center rounded-full bg-white/10 lg:hidden"
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
              {to === '/panel/pengguna' && !!ringkasan?.pendaftarMenunggu && (
                <span className="ml-auto rounded-pill bg-waspada px-1.5 text-[11px] text-white">{ringkasan.pendaftarMenunggu}</span>
              )}
            </NavLink>
          ))}
        </nav>
        <div className="hidden border-t border-white/10 p-4 lg:block">
          <button
            onClick={() => setUbahProfil(true)}
            className="-m-2 flex w-[calc(100%+1rem)] items-center gap-2.5 rounded-xl p-2 text-left hover:bg-white/10"
            title="Ubah nama & foto profil"
          >
            <Avatar nama={sesi.akun.nama} inisial={sesi.akun.inisial} warna={sesi.akun.warna} foto={sesi.akun.fotoUrl} size={40} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold">{sesi.akun.nama}</p>
              <span className="flex items-center gap-1.5">
                <BadgePeran peran={sesi.akun.peran} />
                <span className="text-[11px] text-white/50">Ubah profil</span>
              </span>
            </div>
          </button>
          <button
            onClick={() => setGantiSandi(true)}
            className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-pill bg-white/10 py-2 text-[12px] font-bold hover:bg-white/20"
          >
            <KeyRound size={13} /> Ganti kata sandi
          </button>
          <div className="mt-2 flex gap-2">
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

      {ubahProfil && (
        <Modal judul="Profil saya" onTutup={() => setUbahProfil(false)} lebar="max-w-md">
          <ProfilSaya onTutup={() => setUbahProfil(false)} />
        </Modal>
      )}

      {gantiSandi && (
        <Modal judul="Ganti kata sandi" onTutup={() => setGantiSandi(false)} lebar="max-w-sm">
          <FormGantiSandi
            jenis="sandi"
            kirim={async (lama, baru) => {
              const s = await gantiRahasia(sesi.token, lama, baru)
              masuk({ token: s.token, akun: s.warga })
            }}
            onSelesai={() => setGantiSandi(false)}
          />
        </Modal>
      )}

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
