import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell, ChevronRight, TriangleAlert, CloudUpload, RefreshCw, Hourglass, MapPinned } from 'lucide-react'
import { useApp } from '../store/store'
import { TITIK, titikById } from '../data/seed'
import { STATUS } from '../lib/status'
import type { Status } from '../lib/types'
import { isHariIni, waktuRelatif } from '../lib/format'
import AppBar from '../components/AppBar'
import Logo from '../components/Logo'
import PostCard from '../components/PostCard'
import Segmented from '../components/Segmented'
import StatusIcon from '../components/StatusIcon'

export default function Beranda() {
  const navigate = useNavigate()
  const {
    state,
    me,
    statusWilayah,
    laporanTerakhirWilayah,
    peringatanTerdekat,
    peringatanJarak,
    notifBelumDibaca,
    actions,
  } = useApp()
  const [filter, setFilter] = useState<'semua' | 'wilayah'>('semua')

  const statusPerTitik = useMemo(() => {
    const map = new Map<string, Status>()
    for (const t of TITIK) {
      const l = state.laporan
        .filter((x) => x.titikId === t.id)
        .sort((a, b) => +new Date(b.waktuUpload) - +new Date(a.waktuUpload))[0]
      map.set(t.id, l ? (l.statusTerverifikasi ?? l.statusPelapor) : 'aman')
    }
    return map
  }, [state.laporan])

  const feed = useMemo(() => {
    const list = [...state.laporan].sort(
      (a, b) => +new Date(b.waktuUpload) - +new Date(a.waktuUpload),
    )
    return filter === 'wilayah' ? list.filter((l) => l.titikId === me.titikId) : list
  }, [state.laporan, filter, me.titikId])

  const pendingOffline = state.laporan.filter((l) => l.offline).length
  const sm = STATUS[statusWilayah]
  // Jujur soal usia data: sistem cuma terima 1 laporan/hari secara giliran,
  // jadi "status hari ini" bisa saja masih data kemarin sampai giliran tiba.
  const dataHariIni = laporanTerakhirWilayah ? isHariIni(laporanTerakhirWilayah.waktuUpload) : false

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <AppBar
        left={<Logo />}
        right={
          <button
            onClick={() => navigate('/notifikasi')}
            className="relative grid h-9 w-9 place-items-center rounded-full bg-bone-200 text-ink-soft"
            aria-label="Notifikasi"
          >
            <Bell size={18} />
            {notifBelumDibaca > 0 && (
              <span className="absolute -right-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-bahaya px-1 text-[9px] font-bold text-white">
                {notifBelumDibaca}
              </span>
            )}
          </button>
        }
      />

      <div className="app-scroll flex-1 space-y-4 overflow-y-auto px-4 pb-28 pt-4">
        {/* Kartu status wilayah — 1 layar, 1 pesan utama */}
        <button
          onClick={() => navigate('/peta')}
          className={`block w-full overflow-hidden rounded-card ${sm.wash} p-5 text-left shadow-soft`}
        >
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className={`flex items-center gap-1.5 text-[13px] font-bold ${sm.text}`}>
                {dataHariIni ? 'Sungai di wilayah Anda hari ini' : 'Status terakhir sungai di wilayah Anda'}
              </p>
              <p className="mt-1.5 flex items-center gap-3">
                <span className={`grid h-14 w-14 shrink-0 place-items-center rounded-full bg-white/70 ${sm.text}`}>
                  <StatusIcon status={statusWilayah} size={30} strokeWidth={2.2} />
                </span>
                <span>
                  <span className={`block text-2xl font-extrabold leading-tight ${sm.text}`}>
                    {state.lang === 'mks' ? sm.mks : sm.id}
                  </span>
                  <span className={`block text-sm font-semibold ${sm.text} opacity-80`}>{sm.arti}</span>
                  {state.lang === 'mks' && (
                    <span className={`mt-0.5 block text-[10px] font-semibold ${sm.text} opacity-60`}>
                      *baru istilah status yang diterjemahkan
                    </span>
                  )}
                </span>
              </p>
              {!dataHariIni && (
                <span
                  className={`mt-3 inline-flex items-center gap-1.5 rounded-pill bg-white/70 px-2.5 py-1 text-[11px] font-bold ${sm.text}`}
                >
                  <Hourglass size={12} /> Menunggu laporan hari ini
                </span>
              )}
            </div>
            <ChevronRight className={`${sm.text} shrink-0`} />
          </div>
          <p className={`mt-3 text-[11px] font-semibold ${sm.text} opacity-70`}>
            Titik {titikById(me.titikId).nama}
            {laporanTerakhirWilayah
              ? dataHariIni
                ? ` · diperbarui ${waktuRelatif(laporanTerakhirWilayah.waktuUpload)}`
                : ` · data ${waktuRelatif(laporanTerakhirWilayah.waktuUpload)} — giliran hari ini belum sampai`
              : ' · belum pernah ada laporan di titik ini'}
          </p>
        </button>

        {/* Peringatan dini personal (bagian 6.1) — jelas ini titik TETANGGA, bukan wilayah sendiri,
            supaya tidak salah dibaca sebagai status wilayah sendiri yang baru saja ditampilkan di atas. */}
        {peringatanTerdekat && peringatanJarak && (
          <button
            onClick={() => navigate(`/diskusi/${peringatanTerdekat.id}`)}
            className="flex w-full items-start gap-3 rounded-card bg-bahaya px-4 py-3.5 text-left text-white shadow-card"
          >
            <TriangleAlert size={20} className="mt-0.5 shrink-0" />
            <div>
              <p className="flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-wide text-white/80">
                <MapPinned size={11} /> Peringatan tetangga — bukan wilayah Anda
              </p>
              <p className="mt-0.5 text-sm font-extrabold">
                Titik {peringatanJarak.titikNama} naik ke BAHAYA
              </p>
              <p className="text-[11px] font-semibold text-white/80">
                {peringatanJarak.jumlahTitik} titik pantau di arah {peringatanJarak.arah} dari wilayah Anda
              </p>
              <p className="mt-1 text-[12px] opacity-90">
                {peringatanTerdekat.rekomendasiTeks ??
                  'Warga di sekitar titik tersebut, amankan barang berharga & jauhi bantaran sungai.'}
              </p>
            </div>
          </button>
        )}

        {/* Banner offline — tampil tiap ada foto yang belum sempat terunggah,
            baik karena mode offline sengaja diaktifkan maupun sinyal asli gagal. */}
        {pendingOffline > 0 && (
          <div className="flex items-center gap-3 rounded-card border border-waspada/40 bg-waspada-wash px-4 py-3">
            <CloudUpload size={20} className="shrink-0 text-waspada-ink" />
            <p className="flex-1 text-[12px] font-semibold text-waspada-ink">
              {pendingOffline} laporan tersimpan di HP, menunggu sinyal.
            </p>
            <button
              onClick={async () => {
                actions.toast('Menyinkronkan…', '🔄')
                const hasil = await actions.sinkronkan()
                if (hasil.berhasil > 0) {
                  actions.toast(`${hasil.berhasil} laporan berhasil terkirim`, '✅')
                } else if (hasil.gagal > 0) {
                  actions.toast('Masih belum ada sinyal — coba lagi nanti', '⚠️')
                }
              }}
              className="flex items-center gap-1 rounded-pill bg-white px-3 py-1.5 text-xs font-bold text-waspada-ink"
            >
              <RefreshCw size={12} /> Kirim
            </button>
          </div>
        )}

        {/* Baris titik pantau (bukti sosial per lokasi) */}
        <div>
          <p className="mb-2 px-1 text-[13px] font-extrabold text-ink">Titik pantau Sungai Tallo</p>
          <div className="app-scroll -mx-4 flex gap-3 overflow-x-auto px-4 pb-1">
            {TITIK.map((t) => {
              const st = statusPerTitik.get(t.id) ?? 'aman'
              const meHere = t.id === me.titikId
              return (
                <button
                  key={t.id}
                  onClick={() => navigate('/peta')}
                  className="flex w-16 shrink-0 flex-col items-center gap-1.5"
                >
                  <span
                    className={`grid h-16 w-16 place-items-center rounded-full bg-white p-[3px] ring-2 ${STATUS[st].ring}`}
                  >
                    <span className={`grid h-full w-full place-items-center rounded-full ${STATUS[st].wash} ${STATUS[st].text}`}>
                      <StatusIcon status={st} size={24} strokeWidth={2.4} />
                    </span>
                  </span>
                  <span className={`text-center text-[10px] font-bold leading-tight ${meHere ? 'text-forest' : 'text-ink-muted'}`}>
                    {meHere ? 'Wilayah Anda' : t.nama}
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Feed */}
        <div className="flex items-center justify-between px-1 pt-1">
          <p className="text-[15px] font-extrabold text-ink">Laporan warga</p>
          <Segmented
            value={filter}
            onChange={setFilter}
            options={[
              { value: 'semua', label: 'Semua' },
              { value: 'wilayah', label: 'Wilayah saya' },
            ]}
          />
        </div>

        {feed.length === 0 ? (
          <p className="rounded-card bg-white px-4 py-8 text-center text-sm text-ink-muted shadow-soft">
            Belum ada laporan di wilayah Anda hari ini.
          </p>
        ) : (
          feed.map((l) => <PostCard key={l.id} laporan={l} />)
        )}
      </div>
    </div>
  )
}
