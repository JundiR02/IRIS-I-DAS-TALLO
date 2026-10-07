import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowUpRight, Navigation } from 'lucide-react'
import { useApp } from '../store/store'
import { TITIK } from '../data/seed'
import { STATUS, STATUS_MARK } from '../lib/status'
import type { Status, TitikPantau } from '../lib/types'
import { isHariIni, waktuRelatif } from '../lib/format'
import AppBar from '../components/AppBar'
import Segmented from '../components/Segmented'
import Sheet from '../components/Sheet'
import StatusPill from '../components/StatusPill'
import StatusIcon from '../components/StatusIcon'
import RiverScene from '../components/RiverScene'
import FotoLaporan from '../components/FotoLaporan'

// Sama dengan token Tailwind aman/waspada/bahaya (tailwind.config.js) — SVG
// peta digambar manual jadi butuh nilai hex, bukan kelas.
const WARNA_STATUS: Record<Status, string> = {
  aman: '#4C7A52',
  waspada: '#C4892E',
  bahaya: '#B84B31',
}

const W = 320
const HGT = 520

// Titik pada alur sungai untuk parameter t (0=hulu .. 1=muara).
// Sisakan ruang aman di atas (kontrol/legenda) dan bawah (bottom-nav).
const PAD_ATAS = 112
const PAD_BAWAH = 96
function riverXY(t: number): [number, number] {
  const x = W / 2 + Math.sin(t * Math.PI * 2.6 + 0.3) * 60
  const y = PAD_ATAS + t * (HGT - PAD_ATAS - PAD_BAWAH)
  return [x, y]
}
function pinXY(tp: TitikPantau): [number, number] {
  const [x, y] = riverXY(tp.t)
  return [x + tp.offset * 44, y + tp.offset * 6]
}

const RIVER_PATH = (() => {
  const pts: string[] = []
  for (let i = 0; i <= 60; i++) {
    const [x, y] = riverXY(i / 60)
    pts.push(`${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`)
  }
  return pts.join(' ')
})()

function turunSatu(s: Status): Status {
  return s === 'bahaya' ? 'waspada' : s === 'waspada' ? 'aman' : 'aman'
}

export default function Peta() {
  const navigate = useNavigate()
  const { state, me } = useApp()
  const [hari, setHari] = useState<'ini' | 'kemarin'>('ini')
  const [pilih, setPilih] = useState<string | null>(null)

  const dataTitik = useMemo(() => {
    return TITIK.map((t) => {
      const laporan = state.laporan
        .filter((l) => l.titikId === t.id)
        .sort((a, b) => +new Date(b.waktuUpload) - +new Date(a.waktuUpload))
      const terbaru = laporan[0]
      const statusIni: Status = terbaru
        ? (terbaru.statusTerverifikasi ?? terbaru.statusPelapor)
        : 'aman'
      const statusKemarin = turunSatu(statusIni)
      return { titik: t, terbaru, statusIni, statusKemarin }
    })
  }, [state.laporan])

  const sel = dataTitik.find((d) => d.titik.id === pilih)

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <AppBar title="Peta Sungai Tallo" />

      <div className="relative flex-1 overflow-hidden bg-[#E9E7D8]">
        {/* Kontrol atas — ditumpuk vertikal, bukan berdampingan, supaya legenda
            (kini bawa glyph bentuk, bukan cuma warna) tidak terpotong di layar sempit. */}
        <div className="absolute inset-x-0 top-3 z-10 flex flex-col items-start gap-2 px-4">
          <Segmented
            value={hari}
            onChange={setHari}
            options={[
              { value: 'ini', label: 'Hari ini' },
              { value: 'kemarin', label: 'Kemarin' },
            ]}
          />
          <div className="flex items-center gap-3 rounded-pill bg-white/95 px-3 py-1.5 text-[11px] font-bold shadow-soft">
            {(['aman', 'waspada', 'bahaya'] as Status[]).map((s) => (
              <span key={s} className="flex items-center gap-1.5">
                <span
                  className={`grid h-4 w-4 shrink-0 place-items-center rounded-full text-white ${STATUS[s].dot}`}
                >
                  <StatusIcon status={s} size={10} strokeWidth={3} />
                </span>
                {STATUS[s].id}
              </span>
            ))}
          </div>
        </div>

        {/* Peta SVG sederhana */}
        <svg viewBox={`0 0 ${W} ${HGT}`} className="h-full w-full" preserveAspectRatio="xMidYMid slice">
          <defs>
            <linearGradient id="land" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#D9E4C7" />
              <stop offset="55%" stopColor="#E7E7D6" />
              <stop offset="100%" stopColor="#E3DEC9" />
            </linearGradient>
          </defs>
          <rect width={W} height={HGT} fill="url(#land)" />

          {/* Hutan / kebun di hulu */}
          {Array.from({ length: 46 }).map((_, i) => {
            const x = (i * 53) % W
            const y = 20 + ((i * 37) % 150)
            return <circle key={i} cx={x} cy={y} r={3 + (i % 3)} fill="#8CA86A" opacity={0.5} />
          })}
          {/* Blok permukiman di hilir */}
          {Array.from({ length: 60 }).map((_, i) => {
            const x = 12 + ((i * 47) % (W - 30))
            const y = 330 + ((i * 71) % 170)
            return (
              <rect
                key={i}
                x={x}
                y={y}
                width={10 + (i % 4) * 4}
                height={8 + (i % 3) * 4}
                rx={1.5}
                fill="#CFC7AE"
                opacity={0.75}
              />
            )
          })}

          {/* Anak sungai */}
          <path d="M40,120 C90,150 120,150 155,180" stroke="#B9D0DE" strokeWidth="7" fill="none" strokeLinecap="round" />
          <path d="M285,250 C240,270 220,275 190,300" stroke="#B9D0DE" strokeWidth="7" fill="none" strokeLinecap="round" />

          {/* Sungai utama */}
          <path d={RIVER_PATH} stroke="#8FB6C9" strokeWidth="20" fill="none" strokeLinecap="round" />
          <path d={RIVER_PATH} stroke="#4E90B4" strokeWidth="12" fill="none" strokeLinecap="round" />
          <path d={RIVER_PATH} stroke="#BFE0EC" strokeWidth="3" fill="none" strokeLinecap="round" opacity={0.7} />

          {/* Label hulu / muara */}
          <text x={riverXY(0)[0] + 16} y={riverXY(0)[1] - 12} fontSize="10" fontWeight="700" fill="#5B6B57">
            HULU
          </text>
          <text x={riverXY(1)[0] - 6} y={riverXY(1)[1] + 26} fontSize="10" fontWeight="700" fill="#5B6B57">
            MUARA · Laut
          </text>

          {/* Pin titik pantau */}
          {dataTitik.map((d) => {
            const [x, y] = pinXY(d.titik)
            const st = hari === 'ini' ? d.statusIni : d.statusKemarin
            const c = WARNA_STATUS[st]
            const meHere = d.titik.id === me.titikId
            const naik = hari === 'ini' && d.statusIni !== d.statusKemarin
            return (
              <g
                key={d.titik.id}
                transform={`translate(${x} ${y})`}
                onClick={() => setPilih(d.titik.id)}
                className="cursor-pointer"
              >
                {naik && <circle r="17" fill={c} opacity={0.25} />}
                {meHere && <circle r="13" fill="none" stroke="#12291F" strokeWidth="2" />}
                <circle r="9" fill={c} stroke="#fff" strokeWidth="2.5" />
                {/* Tanda bentuk per status — gelombang tenang/naik/meluap, bukan cuma warna */}
                <g
                  transform="scale(0.5)"
                  stroke="#fff"
                  strokeWidth={3.2}
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{ pointerEvents: 'none' }}
                >
                  {STATUS_MARK[st].d.map((dPath, i) => (
                    <path key={i} d={dPath} />
                  ))}
                </g>
                {naik && (
                  <g transform="translate(10.5 -13.5)">
                    <circle r="8" fill="#B84B31" stroke="#fff" strokeWidth="2" />
                    <path
                      d="M0,3.4 L0,-3.4 M-2.6,-1 L0,-3.6 L2.6,-1"
                      stroke="#fff"
                      strokeWidth="1.8"
                      fill="none"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </g>
                )}
                <text
                  x={d.titik.offset >= 0 ? 15 : -15}
                  y="4"
                  textAnchor={d.titik.offset >= 0 ? 'start' : 'end'}
                  fontSize="9.5"
                  fontWeight={meHere ? 800 : 600}
                  fill="#2A362E"
                >
                  {meHere ? 'Wilayah Anda' : d.titik.nama}
                </text>
              </g>
            )
          })}
        </svg>

        {/* Ringkasan bawah */}
        <div className="absolute inset-x-0 bottom-3 z-10 px-4">
          <div className="flex items-center gap-3 rounded-card bg-white/95 px-4 py-3 shadow-card backdrop-blur">
            <Navigation size={16} className="text-forest" />
            <p className="flex-1 text-[12px] font-semibold text-ink-soft">
              {dataTitik.filter((d) => d.statusIni === 'bahaya').length} titik Bahaya ·{' '}
              {dataTitik.filter((d) => d.statusIni === 'waspada').length} Waspada · sisanya Aman
            </p>
            <span className="text-[11px] font-bold text-ink-faint">{TITIK.length} titik</span>
          </div>
        </div>
      </div>

      {/* Detail titik */}
      <Sheet open={!!sel} onClose={() => setPilih(null)} title={sel ? sel.titik.nama : ''}>
        {sel && (
          <div>
            <div className="relative overflow-hidden rounded-card">
              {sel.terbaru ? (
                <FotoLaporan laporan={sel.terbaru} className="aspect-[16/10] w-full" />
              ) : (
                <RiverScene status={sel.statusIni} seed={3} className="aspect-[16/10] w-full" />
              )}
              <div className="absolute left-3 top-3">
                <StatusPill status={sel.statusIni} lang={state.lang} variant="solid" size="lg" />
              </div>
            </div>

            <div className="mt-3 flex items-center justify-between">
              <div>
                <p className="text-sm font-extrabold text-ink">{sel.titik.nama}</p>
                <p className="text-[12px] text-ink-muted">Kel. {sel.titik.kelurahan}</p>
              </div>
              {sel.statusIni !== sel.statusKemarin && (
                <span className="flex items-center gap-1 rounded-pill bg-bahaya-wash px-2.5 py-1 text-[11px] font-bold text-bahaya-ink">
                  <ArrowUpRight size={13} /> Naik dari {STATUS[sel.statusKemarin].id} kemarin
                </span>
              )}
            </div>

            {sel.terbaru ? (
              <>
                <p className="mt-2 text-[12px] text-ink-muted">
                  Laporan terakhir oleh {sel.terbaru.nama} · {waktuRelatif(sel.terbaru.waktuUpload)}
                  {!isHariIni(sel.terbaru.waktuUpload) && ' · menunggu laporan hari ini'}
                </p>
                {sel.terbaru.rekomendasiTeks && (
                  <p className="mt-2 rounded-2xl bg-forest/5 px-3 py-2.5 text-[13px] text-ink-soft">
                    {sel.terbaru.rekomendasiTeks}
                  </p>
                )}
                <button
                  onClick={() => navigate(`/diskusi/${sel.terbaru!.id}`)}
                  className="mt-4 w-full rounded-pill bg-forest py-3.5 text-sm font-extrabold text-white"
                >
                  Lihat laporan & diskusi
                </button>
              </>
            ) : (
              <p className="mt-3 rounded-2xl bg-bone-100 px-3 py-3 text-center text-[13px] text-ink-muted">
                Belum ada laporan di titik ini hari ini.
              </p>
            )}
          </div>
        )}
      </Sheet>
    </div>
  )
}
