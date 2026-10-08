import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { useApp } from './store/store'
import { useIsMobile } from './lib/useMediaQuery'
import PhoneFrame from './components/PhoneFrame'
import BottomNav from './components/BottomNav'
import DemoPanel from './components/DemoPanel'
import Toast from './components/Toast'
import Logo from './components/Logo'
import Onboarding from './screens/Onboarding'
import Login from './screens/Login'
import MenungguPersetujuan from './screens/MenungguPersetujuan'
import Beranda from './screens/Beranda'
import Lapor from './screens/Lapor'
import Rekomendasi from './screens/Rekomendasi'
import Peta from './screens/Peta'
import Diskusi from './screens/Diskusi'
import Profil from './screens/Profil'
import Notifikasi from './screens/Notifikasi'
import PanelApp from './panel/PanelApp'

const TAB_ROUTES = ['/', '/peta', '/rekomendasi', '/profil']

/** Layar aplikasi sesungguhnya — sama persis dipakai baik di HP asli (penuh
    layar) maupun di dalam mock-up bingkai HP (mode peninjau desktop). */
function AppScreens({ location }: { location: ReturnType<typeof useLocation> }) {
  const showNav = TAB_ROUTES.includes(location.pathname)
  return (
    <>
      <div key={location.pathname} className="screen-enter flex min-h-0 flex-1 flex-col">
        <Routes location={location}>
          <Route path="/onboarding" element={<Onboarding />} />
          <Route path="/" element={<Beranda />} />
          <Route path="/lapor" element={<Lapor />} />
          <Route path="/rekomendasi" element={<Rekomendasi />} />
          <Route path="/peta" element={<Peta />} />
          <Route path="/diskusi/:id" element={<Diskusi />} />
          <Route path="/profil" element={<Profil />} />
          <Route path="/notifikasi" element={<Notifikasi />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
      {showNav && <BottomNav />}
      <Toast />
    </>
  )
}

export default function App() {
  const { state, masuk } = useApp()
  const location = useLocation()
  const isMobile = useIsMobile()

  // Panel admin & peneliti — halaman web penuh, di luar bingkai HP, tanpa
  // onboarding/login warga.
  if (location.pathname === '/panel' || location.pathname.startsWith('/panel/')) {
    return <PanelApp />
  }

  if (!state.onboardingSelesai && location.pathname !== '/onboarding') {
    return <Navigate to="/onboarding" replace />
  }

  // Belum login (dan bukan sedang di layar onboarding) — tampilkan gerbang
  // login PIN. Identitas warga (titik, rotasi, profil) baru valid sesudah ini.
  const konten =
    !masuk && location.pathname !== '/onboarding' ? (
      <Login />
    ) : state.auth?.peran === 'pendaftar' ? (
      <MenungguPersetujuan />
    ) : (
      <AppScreens location={location} />
    )

  // HP sungguhan: penuh layar, tanpa bingkai/status-bar palsu — HP-nya sendiri
  // sudah punya itu. Ini yang dipakai warga sehari-hari.
  if (isMobile) {
    return (
      <div className="relative flex h-[100dvh] w-full flex-col overflow-hidden bg-bone-50">
        {konten}
      </div>
    )
  }

  // Tablet/desktop (peninjau): dibungkus mock-up bingkai HP supaya jelas ini
  // aplikasi mobile, ditambah Panel Demo di layar lebar.
  return (
    <div className="flex min-h-full w-full items-start justify-center gap-10 p-4 lg:p-10">
      <div className="flex flex-col items-center gap-4">
        <div className="hidden items-center gap-2 lg:flex">
          <Logo />
        </div>
        <PhoneFrame>{konten}</PhoneFrame>
      </div>
      <DemoPanel />
    </div>
  )
}
