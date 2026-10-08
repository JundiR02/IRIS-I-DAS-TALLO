import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  SlidersHorizontal,
  RotateCcw,
  ChevronDown,
  CalendarDays,
  WifiOff,
  MapPinOff,
  CameraOff,
  Languages,
  Radio,
  KeyRound,
  LogOut,
  LayoutDashboard,
} from 'lucide-react'
import { useApp } from '../store/store'
import { noUrutHariIni } from '../lib/rotasi'

// Cocok dengan worker-upload/schema.sql — PIN demo warga (ganti sebelum pakai
// ke 40 responden sungguhan). Akun peneliti/admin sengaja tidak ada di sini.
// Akun contoh sudah dihapus dari database produksi — isi lagi kalau perlu
// pintasan login untuk peninjau (pakai akun uji, bukan responden asli).
const AKUN_DEMO: { id: string; noUrut: number; rahasia: string; label: string }[] = []

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <input
      type="checkbox"
      checked={checked}
      onChange={(e) => onChange(e.target.checked)}
      className="h-5 w-9 shrink-0 cursor-pointer appearance-none rounded-full bg-bone-300 transition-colors before:ml-0.5 before:mt-0.5 before:block before:h-4 before:w-4 before:rounded-full before:bg-white before:transition-transform checked:bg-forest checked:before:translate-x-4"
    />
  )
}

export default function DemoPanel() {
  const navigate = useNavigate()
  const { state, me, masuk, giliranHariIni, actions } = useApp()
  const [open, setOpen] = useState(true)
  const [masukMemuat, setMasukMemuat] = useState<string | null>(null)

  const loginCepat = async (akun: (typeof AKUN_DEMO)[number]) => {
    setMasukMemuat(akun.id)
    try {
      await actions.loginMasyarakat(String(akun.noUrut), akun.rahasia)
    } catch {
      actions.toast('Gagal masuk — periksa apakah kredensial demo masih sesuai di database.', '⚠️')
    } finally {
      setMasukMemuat(null)
    }
  }

  return (
    <aside className="hidden w-[300px] shrink-0 xl:block">
      <div className="sticky top-8 rounded-card bg-white/90 p-5 shadow-card backdrop-blur">
        <button
          onClick={() => setOpen((v) => !v)}
          className="flex w-full items-center gap-2 text-left"
        >
          <span className="grid h-8 w-8 place-items-center rounded-full bg-forest text-white">
            <SlidersHorizontal size={15} />
          </span>
          <span className="flex-1">
            <span className="block text-sm font-extrabold text-ink">Panel Demo</span>
            <span className="block text-[11px] text-ink-muted">Kontrol untuk peninjau — bukan bagian aplikasi</span>
          </span>
          <ChevronDown size={16} className={`text-ink-muted transition-transform ${open ? 'rotate-180' : ''}`} />
        </button>

        {open && (
          <div className="mt-4 space-y-4 text-sm">
            {/* Akun — login sungguhan lewat Worker (PIN), bukan simulasi */}
            <div>
              <p className="mb-1.5 flex items-center gap-1.5 font-bold text-ink">
                <KeyRound size={14} /> Akun
              </p>
              {masuk ? (
                <div className="flex items-center justify-between gap-2 rounded-xl bg-forest/10 px-3 py-2">
                  <span className="text-[12px] font-bold text-forest-deep">
                    Masuk sebagai {me.nama} (no. {me.noUrut})
                  </span>
                  <button
                    onClick={() => actions.logout()}
                    className="flex items-center gap-1 rounded-pill bg-white px-2.5 py-1 text-[11px] font-bold text-ink-soft"
                  >
                    <LogOut size={12} /> Keluar
                  </button>
                </div>
              ) : (
                <div className="space-y-1.5">
                  <p className="text-[11px] text-ink-muted">Login cepat (PIN demo):</p>
                  {AKUN_DEMO.map((akun) => {
                    const w = state.direktori.find((x) => x.id === akun.id)
                    return (
                      <button
                        key={akun.id}
                        onClick={() => loginCepat(akun)}
                        disabled={!!masukMemuat}
                        className="flex w-full items-center justify-between rounded-pill bg-bone-200 px-3 py-2 text-left text-[12px] font-bold text-ink-soft disabled:opacity-60"
                      >
                        <span>{w?.nama ?? akun.id}</span>
                        <span className="text-ink-faint">
                          {masukMemuat === akun.id ? 'Masuk…' : akun.label}
                        </span>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>

            <a
              href="#/panel"
              className="flex items-center justify-between gap-2 rounded-xl bg-forest-deep px-3 py-2.5 text-[12px] font-bold text-white"
            >
              <span className="flex items-center gap-1.5">
                <LayoutDashboard size={14} /> Buka Panel Admin / Peneliti
              </span>
            </a>

            <hr className="border-bone-200" />

            {/* Rotasi hari */}
            <div>
              <p className="mb-1.5 flex items-center gap-1.5 font-bold text-ink">
                <CalendarDays size={14} /> Rotasi 40 hari
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => actions.setHari(state.hariKe - 1)}
                  className="h-8 w-8 rounded-full bg-bone-200 font-bold text-ink-soft"
                >
                  −
                </button>
                <div className="flex-1 rounded-xl bg-bone-100 py-1.5 text-center">
                  <span className="block text-[11px] text-ink-muted">Hari ke-</span>
                  <span className="text-base font-extrabold text-ink">{state.hariKe}</span>
                </div>
                <button
                  onClick={() => actions.setHari(state.hariKe + 1)}
                  className="h-8 w-8 rounded-full bg-bone-200 font-bold text-ink-soft"
                >
                  +
                </button>
              </div>
              <p className="mt-1.5 text-[11px] text-ink-muted">
                Giliran responden no. <b className="text-ink">{noUrutHariIni(state.hariKe)}</b>. Anda no.{' '}
                <b className="text-ink">{me.noUrut}</b> →{' '}
                {giliranHariIni ? (
                  <span className="font-bold text-forest">hari ini giliran Anda</span>
                ) : (
                  <span className="font-bold text-ink-soft">belum giliran</span>
                )}
              </p>
              <button
                onClick={() => actions.setHari(me.noUrut)}
                className="mt-2 w-full rounded-pill bg-lime py-2 text-xs font-bold text-forest-deep"
              >
                Jadikan hari giliran saya
              </button>
            </div>

            <hr className="border-bone-200" />

            {/* Bahasa */}
            <div>
              <p className="mb-1.5 flex items-center gap-1.5 font-bold text-ink">
                <Languages size={14} /> Bahasa antarmuka
              </p>
              <div className="flex rounded-pill bg-bone-200 p-1">
                {(['id', 'mks'] as const).map((l) => (
                  <button
                    key={l}
                    onClick={() => actions.setLang(l)}
                    className={`flex-1 rounded-pill py-1.5 text-xs font-bold ${
                      state.lang === l ? 'bg-white text-ink shadow-soft' : 'text-ink-muted'
                    }`}
                  >
                    {l === 'id' ? 'Indonesia' : 'Mangkasara'}
                  </button>
                ))}
              </div>
            </div>

            {/* Kondisi lapangan */}
            <div>
              <p className="mb-1.5 flex items-center gap-1.5 font-bold text-ink">
                <Radio size={14} /> Kondisi lapangan
              </p>
              <p className="mb-2 text-[11px] text-ink-muted">
                DAS Tallo bukan selalu kondisi mulus — coba tinjau layar Lapor saat kondisi ini aktif.
              </p>
              <div className="space-y-2.5">
                <label className="flex items-center justify-between gap-2 font-bold text-ink">
                  <span className="flex items-center gap-1.5">
                    <WifiOff size={14} /> Sinyal mati (offline)
                  </span>
                  <Toggle checked={state.offline} onChange={actions.setOffline} />
                </label>
                <label className="flex items-center justify-between gap-2 font-bold text-ink">
                  <span className="flex items-center gap-1.5">
                    <MapPinOff size={14} /> GPS tidak aktif
                  </span>
                  <Toggle checked={state.gpsMati} onChange={actions.setGpsMati} />
                </label>
                <label className="flex items-center justify-between gap-2 font-bold text-ink">
                  <span className="flex items-center gap-1.5">
                    <CameraOff size={14} /> Izin kamera ditolak
                  </span>
                  <Toggle checked={state.kameraDitolak} onChange={actions.setKameraDitolak} />
                </label>
              </div>
            </div>

            <hr className="border-bone-200" />

            <button
              onClick={() => {
                actions.reset()
                navigate('/')
              }}
              className="flex w-full items-center justify-center gap-2 rounded-pill bg-bone-200 py-2 text-xs font-bold text-ink-soft"
            >
              <RotateCcw size={13} /> Reset data contoh
            </button>
          </div>
        )}
      </div>
    </aside>
  )
}
