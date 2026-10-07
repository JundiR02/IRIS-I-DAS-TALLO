import { useEffect, useRef, useState, type ChangeEventHandler, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  X,
  Camera,
  RefreshCw,
  MapPin,
  MapPinOff,
  MapPinned,
  CameraOff,
  Images,
  FileWarning,
  Loader2,
  Cloud,
  CloudOff,
  CloudUpload,
  Check,
  Mic,
  Square,
  Play,
  Siren,
  ChevronLeft,
  CircleCheckBig,
} from 'lucide-react'
import { useApp } from '../store/store'
import { titikById } from '../data/seed'
import { STATUS_ORDER, STATUS } from '../lib/status'
import type { Status } from '../lib/types'
import { tanggalGiliran } from '../lib/rotasi'
import { jamMenit } from '../lib/format'
import { prosesFotoUpload, FotoError, type FotoDiproses } from '../lib/rawPhoto'
import { unggahFotoKeServer } from '../lib/uploadFoto'
import RiverScene from '../components/RiverScene'
import FotoLaporan from '../components/FotoLaporan'
import StatusIcon from '../components/StatusIcon'
import StatusPill from '../components/StatusPill'

type Step = 1 | 2 | 3 | 4
type StatusFoto = 'kosong' | 'proses-biasa' | 'proses-raw' | 'siap'
type StatusSinkron = 'lokal' | 'mengunggah' | 'tersinkron'

const EXT_FILE_DITERIMA =
  'image/*,.cr2,.CR2,.cr3,.CR3,.nef,.NEF,.arw,.ARW,.dng,.DNG,.raf,.RAF,.rw2,.RW2,.orf,.ORF'

export default function Lapor() {
  const navigate = useNavigate()
  const { me, state, giliranHariIni, actions } = useApp()
  const titik = titikById(me.titikId)

  const [darurat, setDarurat] = useState(false)
  const [step, setStep] = useState<Step>(1)
  const [foto, setFoto] = useState<FotoDiproses | null>(null)
  const [errorFoto, setErrorFoto] = useState<string | null>(null)
  const [statusFoto, setStatusFoto] = useState<StatusFoto>('kosong')
  const [statusSinkron, setStatusSinkron] = useState<StatusSinkron>('lokal')
  const [status, setStatus] = useState<Status | null>(null)
  const [suara, setSuara] = useState<number | null>(null)
  const [terkirim, setTerkirim] = useState(false)

  const inputKameraRef = useRef<HTMLInputElement>(null)
  const inputFileRef = useRef<HTMLInputElement>(null)

  const boleh = giliranHariIni || darurat

  // Foto acuan: laporan terakhir di titik yang sama, untuk konsistensi sudut ambil foto.
  const acuan = state.laporan
    .filter((l) => l.titikId === me.titikId)
    .sort((a, b) => +new Date(b.waktuUpload) - +new Date(a.waktuUpload))[0]
  // Terhalang kendala lapangan (GPS/kamera) — kalau kamera sudah diatasi lewat
  // file lain (foto sudah ada), jangan tampilkan blokir lagi.
  const terhalang = state.gpsMati || (state.kameraDitolak && foto === null)

  const prosesFile = async (file: File) => {
    setErrorFoto(null)
    setStatusSinkron('lokal')
    const ext = file.name.split('.').pop()?.toLowerCase() ?? ''
    const kemungkinanRaw = ['cr2', 'cr3', 'nef', 'arw', 'dng', 'raf', 'rw2', 'orf'].includes(ext)
    setStatusFoto(kemungkinanRaw ? 'proses-raw' : 'proses-biasa')
    try {
      const hasil = await prosesFotoUpload(file)
      setFoto(hasil)
      setStatusFoto('siap')

      // Coba langsung unggah ke server (R2) — kalau sinyal lemah/mati, foto tetap
      // tersimpan lokal dan akan disinkronkan belakangan dari banner di Beranda.
      if (!state.offline && state.auth) {
        setStatusSinkron('mengunggah')
        try {
          const urlServer = await unggahFotoKeServer(hasil.dataUrl, state.auth.token)
          setFoto((f) => (f ? { ...f, dataUrl: urlServer } : f))
          setStatusSinkron('tersinkron')
        } catch {
          setStatusSinkron('lokal')
        }
      }
    } catch (e) {
      setFoto(null)
      setStatusFoto('kosong')
      setErrorFoto(
        e instanceof FotoError
          ? e.message
          : 'Gagal memproses foto ini. Coba file lain, atau pastikan filenya tidak rusak.',
      )
    }
  }

  const onPilihFile: ChangeEventHandler<HTMLInputElement> = (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (file) void prosesFile(file)
  }

  // --- Gerbang giliran -----------------------------------------------------
  if (!boleh) {
    return (
      <div className="flex min-h-0 flex-1 flex-col bg-bone-50">
        <FlowHeader onClose={() => navigate('/')} />
        <div className="flex flex-1 flex-col items-center justify-center px-8 text-center">
          <div className="grid h-20 w-20 place-items-center rounded-full bg-bone-200 text-3xl">🗓️</div>
          <h1 className="mt-5 text-xl font-extrabold text-ink">Belum giliran Anda hari ini</h1>
          <p className="mt-2 text-[14px] leading-relaxed text-ink-soft">
            Sistem menerima 1 laporan per hari secara bergilir. Giliran Anda berikutnya sekitar{' '}
            <b className="text-ink">{tanggalGiliran(state.hariKe, me.noUrut)}</b>.
          </p>
          <p className="mt-2 text-[13px] text-ink-muted">
            Anda tetap bisa melihat, menyukai, dan mengomentari laporan warga lain.
          </p>
          {/* "Kembali" jadi aksi utama — Lapor Darurat tetap terlihat tapi tidak
              jadi godaan visual tiap kali warga buka Lapor di luar giliran. */}
          <div className="mt-7 w-full space-y-2.5">
            <button
              onClick={() => navigate('/')}
              className="w-full rounded-pill bg-forest py-3.5 text-base font-extrabold text-white shadow-fab active:scale-[0.98]"
            >
              Kembali ke Beranda
            </button>
            <button
              onClick={() => setDarurat(true)}
              className="flex w-full items-center justify-center gap-2 rounded-pill border-2 border-bahaya/60 py-3 text-sm font-extrabold text-bahaya active:scale-[0.98]"
            >
              <Siren size={16} /> Lapor Darurat
            </button>
            <p className="text-[11px] text-ink-faint">
              Gunakan hanya bila air naik drastis / ada tanda banjir di luar jadwal.
            </p>
          </div>
        </div>
      </div>
    )
  }

  // --- Layar sukses ------------------------------------------------------
  if (terkirim) {
    return (
      <div className="flex min-h-0 flex-1 flex-col items-center justify-center bg-forest px-8 text-center text-white">
        <div className="relative grid h-24 w-24 animate-scale-in place-items-center rounded-full bg-white/15">
          <svg viewBox="0 0 52 52" className="h-14 w-14">
            <path
              d="M14 27l8 8 16-16"
              fill="none"
              stroke="#CFE95B"
              strokeWidth="5"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeDasharray="48"
              className="animate-draw-check"
            />
          </svg>
        </div>
        <h1 className="mt-6 text-2xl font-extrabold">Laporan terkirim</h1>
        <p className="mt-2 text-[14px] text-white/85">
          {statusSinkron !== 'tersinkron'
            ? 'Foto tersimpan di HP Anda. Akan terkirim otomatis saat ada sinyal.'
            : 'Laporan Anda sudah masuk dan sedang menunggu ulasan Tim Peneliti.'}
        </p>
        <div className="mt-5 rounded-2xl bg-white/10 px-4 py-3 text-[13px]">
          Anda akan dapat notifikasi begitu peneliti selesai mengecek — biasanya beberapa jam.
        </div>
        <button
          onClick={() => navigate('/')}
          className="mt-8 w-full rounded-pill bg-lime py-4 text-base font-extrabold text-forest-deep active:scale-[0.98]"
        >
          Lihat di Beranda
        </button>
      </div>
    )
  }

  const back = () => {
    if (step === 1) navigate('/')
    else setStep((s) => (s - 1) as Step)
  }

  const kirim = () => {
    if (!foto) return
    actions.tambahLaporan({
      fotoUrl: foto.dataUrl,
      fotoAsliNama: foto.namaAsli,
      fotoDariRaw: foto.dariRaw,
      fotoTersinkron: statusSinkron === 'tersinkron',
      gps: foto.gps,
      status: status ?? 'aman',
      catatanSuaraDetik: suara ?? undefined,
      darurat,
    })
    setTerkirim(true)
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-bone-50">
      <FlowHeader onClose={() => navigate('/')} onBack={back} step={step} darurat={darurat} />

      <input
        ref={inputKameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={onPilihFile}
      />
      <input
        ref={inputFileRef}
        type="file"
        accept={EXT_FILE_DITERIMA}
        className="hidden"
        onChange={onPilihFile}
      />

      <div className="app-scroll flex-1 overflow-y-auto px-5 pb-6 pt-4">
        {step === 1 && (
          <StepShell
            no={1}
            judul="Ambil foto sungai"
            sub="Foto dari titik yang sama tiap hari, mis. dari sisi jembatan. Mendukung JPEG & file RAW kamera (CR2)."
          >
            {state.gpsMati ? (
              <BlokKendala
                ikon={<MapPinOff size={30} />}
                judul="Lokasi tidak terdeteksi"
                pesan="Aktifkan GPS/Lokasi di pengaturan HP Anda supaya laporan tercatat di titik yang benar."
                tombol="Aktifkan Lokasi"
                onTombol={() => actions.setGpsMati(false)}
              />
            ) : state.kameraDitolak && foto === null ? (
              <BlokKendala
                ikon={<CameraOff size={30} />}
                judul="Izin kamera ditolak"
                pesan="IRIS-I butuh izin kamera untuk memfoto sungai. Aktifkan lewat pengaturan HP, atau pilih file foto yang sudah ada."
                tombol="Coba Lagi"
                onTombol={() => actions.setKameraDitolak(false)}
                tombolKedua={{
                  label: 'Pilih File',
                  ikon: <Images size={15} />,
                  onClick: () => inputFileRef.current?.click(),
                }}
              />
            ) : (
              <div className="overflow-hidden rounded-card bg-white shadow-card">
                <div className="relative aspect-[4/3] bg-ink/90">
                  {statusFoto === 'proses-raw' || statusFoto === 'proses-biasa' ? (
                    <div className="flex h-full flex-col items-center justify-center gap-3 text-white/85">
                      <Loader2 size={34} className="animate-spin" />
                      <span className="text-sm font-semibold">
                        {statusFoto === 'proses-raw'
                          ? 'Membaca pratinjau dari file RAW…'
                          : 'Memproses foto…'}
                      </span>
                    </div>
                  ) : foto ? (
                    <img
                      src={foto.dataUrl}
                      alt="Foto sungai yang diambil"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full flex-col items-center justify-center gap-3 text-white/70">
                      <Camera size={40} />
                      <span className="text-sm font-semibold">Kamera</span>
                    </div>
                  )}

                  {foto && (
                    <div className="absolute right-3 top-3 flex flex-col items-end gap-1.5">
                      {foto.dariRaw && (
                        <span className="rounded-pill bg-ink/80 px-2 py-1 text-[10px] font-bold text-white">
                          RAW → JPEG
                        </span>
                      )}
                      {statusSinkron === 'mengunggah' && (
                        <span className="flex items-center gap-1 rounded-pill bg-ink/80 px-2 py-1 text-[10px] font-bold text-white">
                          <CloudUpload size={11} className="animate-pulse" /> Mengunggah…
                        </span>
                      )}
                      {statusSinkron === 'tersinkron' && (
                        <span className="flex items-center gap-1 rounded-pill bg-forest/90 px-2 py-1 text-[10px] font-bold text-white">
                          <Cloud size={11} /> Tersimpan di server
                        </span>
                      )}
                      {statusSinkron === 'lokal' && statusFoto === 'siap' && (
                        <span className="flex items-center gap-1 rounded-pill bg-waspada/90 px-2 py-1 text-[10px] font-bold text-white">
                          <CloudOff size={11} /> Tersimpan di HP
                        </span>
                      )}
                    </div>
                  )}

                  <div className="absolute bottom-3 left-3 flex items-center gap-1.5 rounded-pill bg-white/95 px-2.5 py-1 text-[11px] font-bold text-ink">
                    {foto?.gps ? (
                      <>
                        <MapPinned size={12} className="text-forest" /> GPS dari foto ·{' '}
                        {foto.gps.latitude.toFixed(4)}, {foto.gps.longitude.toFixed(4)}
                      </>
                    ) : (
                      <>
                        <MapPin size={12} className="text-forest" /> GPS aktif · {titik.nama}
                      </>
                    )}
                  </div>
                </div>

                {errorFoto && (
                  <p className="mx-3 mt-3 flex items-start gap-2 rounded-xl bg-bahaya-wash px-3 py-2.5 text-[12px] font-semibold text-bahaya-ink">
                    <FileWarning size={15} className="mt-0.5 shrink-0" /> {errorFoto}
                  </p>
                )}

                <div className="space-y-2 p-3">
                  {foto === null ? (
                    <>
                      <button
                        onClick={() => inputKameraRef.current?.click()}
                        disabled={statusFoto !== 'kosong'}
                        className="flex w-full items-center justify-center gap-2 rounded-pill bg-forest py-3.5 text-base font-extrabold text-white active:scale-[0.98] disabled:opacity-60"
                      >
                        <Camera size={18} /> Ambil Foto
                      </button>
                      <button
                        onClick={() => inputFileRef.current?.click()}
                        disabled={statusFoto !== 'kosong'}
                        className="flex w-full items-center justify-center gap-2 rounded-pill bg-bone-200 py-3 text-sm font-bold text-ink-soft disabled:opacity-60"
                      >
                        <Images size={15} /> Pilih File (termasuk RAW/CR2)
                      </button>
                    </>
                  ) : (
                    <>
                      <div className="flex gap-2">
                        <button
                          onClick={() => inputKameraRef.current?.click()}
                          className="flex flex-1 items-center justify-center gap-2 rounded-pill bg-bone-200 py-3 text-sm font-bold text-ink-soft"
                        >
                          <RefreshCw size={15} /> Ambil ulang
                        </button>
                        <button
                          onClick={() => inputFileRef.current?.click()}
                          className="flex flex-1 items-center justify-center gap-2 rounded-pill bg-bone-200 py-3 text-sm font-bold text-ink-soft"
                        >
                          <Images size={15} /> Pilih lain
                        </button>
                      </div>
                      <button
                        onClick={() => setStep(2)}
                        className="flex w-full items-center justify-center gap-1 rounded-pill bg-forest py-3.5 text-base font-extrabold text-white"
                      >
                        Lanjut <ChevronLeft size={16} className="rotate-180" />
                      </button>
                      <p className="truncate px-1 text-center text-[11px] text-ink-faint">
                        Berkas: {foto.namaAsli} ({foto.lebar}×{foto.tinggi}px)
                      </p>
                    </>
                  )}
                </div>
              </div>
            )}

            {!terhalang && acuan && (
              <div className="mt-3 flex items-center gap-3 rounded-2xl bg-white p-2.5 shadow-soft">
                <span className="h-14 w-16 shrink-0 overflow-hidden rounded-xl">
                  <FotoLaporan laporan={acuan} className="h-full w-full" tiang={false} />
                </span>
                <p className="text-[12px] leading-snug text-ink-muted">
                  <span className="font-bold text-ink">Foto acuan hari lalu.</span> Ambil dari sudut
                  yang sama supaya perubahan air mudah dibandingkan.
                </p>
              </div>
            )}

            <p className="mt-3 text-center text-[11px] text-ink-faint">
              Lokasi diambil otomatis dari GPS HP Anda (atau dari EXIF foto, kalau ada).
            </p>
          </StepShell>
        )}

        {step === 2 && (
          <StepShell
            no={2}
            judul="Pilih kondisi sungai"
            sub="Tekan satu tombol. Pakai warna, tidak perlu istilah teknis."
          >
            <div className="space-y-3">
              {STATUS_ORDER.map((s) => {
                const meta = STATUS[s]
                const dipilih = status === s
                return (
                  <button
                    key={s}
                    onClick={() => {
                      setStatus(s)
                      window.setTimeout(() => setStep(3), 420)
                    }}
                    className={`flex w-full items-center gap-3 rounded-card border-2 bg-white p-2.5 text-left transition-all ${
                      dipilih ? `${meta.ring} ring-2 border-transparent` : 'border-transparent'
                    }`}
                  >
                    <span className="relative h-20 w-24 shrink-0 overflow-hidden rounded-2xl">
                      <RiverScene status={s} seed={s === 'aman' ? 4 : s === 'waspada' ? 5 : 6} className="h-full w-full" tiang={false} />
                    </span>
                    <span className="flex-1">
                      <span className="flex items-center gap-2.5 text-lg font-extrabold text-ink">
                        <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-full ${meta.wash} ${meta.text}`}>
                          <StatusIcon status={s} size={18} strokeWidth={2.6} />
                        </span>
                        {state.lang === 'mks' ? meta.mks : meta.id}
                      </span>
                      <span className="mt-0.5 block text-[13px] font-semibold text-ink-muted">
                        {meta.arti}
                      </span>
                    </span>
                    <span
                      className={`grid h-7 w-7 shrink-0 place-items-center rounded-full ${
                        dipilih ? meta.solid : 'bg-bone-200 text-transparent'
                      }`}
                    >
                      <Check size={16} strokeWidth={3} />
                    </span>
                  </button>
                )
              })}
            </div>
          </StepShell>
        )}

        {step === 3 && (
          <StepShell
            no={3}
            judul="Rekam catatan suara"
            sub="Opsional — ceritakan yang Anda lihat (maksimal 10 detik)."
          >
            <Recorder value={suara} onChange={setSuara} />
            <div className="mt-6 flex gap-2">
              <button
                onClick={() => {
                  setSuara(null)
                  setStep(4)
                }}
                className="flex-1 rounded-pill bg-bone-200 py-3.5 text-sm font-bold text-ink-soft"
              >
                Lewati
              </button>
              <button
                onClick={() => setStep(4)}
                className="flex-[1.4] rounded-pill bg-forest py-3.5 text-sm font-extrabold text-white"
              >
                Lanjut
              </button>
            </div>
          </StepShell>
        )}

        {step === 4 && status !== null && foto && (
          <StepShell no={4} judul="Periksa lalu kirim" sub="Pastikan sudah benar sebelum dikirim.">
            <div className="overflow-hidden rounded-card bg-white shadow-card">
              <div className="relative aspect-[16/10]">
                <img src={foto.dataUrl} alt="Foto sungai" className="h-full w-full object-cover" />
                <StatusPill
                  status={status}
                  lang={state.lang}
                  variant="solid"
                  className="absolute left-3 top-3"
                />
                {darurat && (
                  <span className="absolute right-3 top-3 flex items-center gap-1 rounded-pill bg-bahaya px-2 py-1 text-[10px] font-bold text-white">
                    <Siren size={11} /> Darurat
                  </span>
                )}
              </div>
              <dl className="divide-y divide-bone-100 px-4 text-sm">
                <Row
                  k="Lokasi"
                  v={
                    foto.gps
                      ? `GPS dari foto (${foto.gps.latitude.toFixed(4)}, ${foto.gps.longitude.toFixed(4)})`
                      : `${titik.nama}, ${titik.kelurahan}`
                  }
                />
                <Row k="Waktu" v={`Hari ini, ${jamMenit(new Date().toISOString())}`} />
                <Row k="Hari rotasi" v={`Ke-${state.hariKe} · responden no. ${me.noUrut}`} />
                <Row k="Berkas foto" v={`${foto.namaAsli}${foto.dariRaw ? ' (RAW)' : ''}`} />
                <Row
                  k="Status unggah"
                  v={statusSinkron === 'tersinkron' ? 'Tersimpan di server' : 'Tersimpan di HP (menunggu sinyal)'}
                />
                <Row k="Catatan suara" v={suara ? `${suara} detik` : 'Tidak ada'} />
              </dl>
            </div>

            {statusSinkron !== 'tersinkron' && (
              <p className="mt-3 rounded-2xl bg-waspada-wash px-3.5 py-2.5 text-[12px] font-semibold text-waspada-ink">
                {state.offline
                  ? 'Mode offline: foto disimpan di HP dulu, terkirim otomatis saat ada sinyal.'
                  : 'Foto belum berhasil diunggah ke server — tersimpan di HP dulu, akan dicoba lagi otomatis.'}
              </p>
            )}

            <button
              onClick={kirim}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-pill bg-forest py-4 text-base font-extrabold text-white shadow-fab active:scale-[0.98]"
            >
              <CircleCheckBig size={18} /> Kirim Laporan
            </button>
          </StepShell>
        )}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------

function FlowHeader({
  onClose,
  onBack,
  step,
  darurat,
}: {
  onClose: () => void
  onBack?: () => void
  step?: Step
  darurat?: boolean
}) {
  return (
    <div className="flex items-center gap-3 px-4 pb-2 pt-4">
      <button
        onClick={onBack ?? onClose}
        className="grid h-9 w-9 place-items-center rounded-full bg-bone-200 text-ink-soft active:scale-95"
        aria-label={onBack ? 'Kembali' : 'Tutup'}
      >
        {onBack ? <ChevronLeft size={20} /> : <X size={18} />}
      </button>
      <div className="flex-1">
        <p className="text-sm font-extrabold text-ink">
          {darurat ? 'Lapor Darurat' : 'Lapor Hari Ini'}
        </p>
        {step && (
          <div className="mt-1 flex gap-1">
            {[1, 2, 3, 4].map((n) => (
              <span
                key={n}
                className={`h-1.5 flex-1 rounded-full ${n <= step ? 'bg-forest' : 'bg-bone-200'}`}
              />
            ))}
          </div>
        )}
      </div>
      {step && <span className="text-xs font-bold text-ink-muted">{step}/4</span>}
    </div>
  )
}

function StepShell({
  no,
  judul,
  sub,
  children,
}: {
  no: number
  judul: string
  sub: string
  children: ReactNode
}) {
  return (
    <div className="animate-fade-up">
      <span className="text-[11px] font-bold uppercase tracking-wide text-forest">Langkah {no}</span>
      <h1 className="mt-1 text-xl font-extrabold leading-tight text-ink">{judul}</h1>
      <p className="mb-4 mt-1 text-[13px] text-ink-muted">{sub}</p>
      {children}
    </div>
  )
}

/** Kondisi lapangan yang menghalangi kamera/GPS — simulasi lewat Panel Demo,
    supaya alur "tidak semua berjalan mulus" ikut ditinjau (bukan cuma jalur sukses). */
function BlokKendala({
  ikon,
  judul,
  pesan,
  tombol,
  onTombol,
  tombolKedua,
}: {
  ikon: ReactNode
  judul: string
  pesan: string
  tombol: string
  onTombol: () => void
  tombolKedua?: { label: string; ikon: ReactNode; onClick: () => void }
}) {
  return (
    <div className="overflow-hidden rounded-card bg-white shadow-card">
      <div className="flex aspect-[4/3] flex-col items-center justify-center gap-3 bg-waspada-wash px-8 text-center text-waspada-ink">
        <span className="grid h-16 w-16 place-items-center rounded-full bg-white/70">{ikon}</span>
        <div>
          <p className="text-base font-extrabold">{judul}</p>
          <p className="mt-1 text-[13px] leading-relaxed opacity-90">{pesan}</p>
        </div>
      </div>
      <div className="space-y-2 p-3">
        <button
          onClick={onTombol}
          className="flex w-full items-center justify-center gap-2 rounded-pill bg-forest py-3.5 text-base font-extrabold text-white active:scale-[0.98]"
        >
          <RefreshCw size={16} /> {tombol}
        </button>
        {tombolKedua && (
          <button
            onClick={tombolKedua.onClick}
            className="flex w-full items-center justify-center gap-2 rounded-pill bg-bone-200 py-3 text-sm font-bold text-ink-soft"
          >
            {tombolKedua.ikon} {tombolKedua.label}
          </button>
        )}
      </div>
    </div>
  )
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-center justify-between gap-3 py-2.5">
      <dt className="shrink-0 text-ink-muted">{k}</dt>
      <dd className="truncate text-right font-semibold text-ink">{v}</dd>
    </div>
  )
}

function Recorder({ value, onChange }: { value: number | null; onChange: (v: number | null) => void }) {
  const [recording, setRecording] = useState(false)
  const [detik, setDetik] = useState(0)
  const timer = useRef<number | null>(null)

  useEffect(() => {
    if (!recording) return
    timer.current = window.setInterval(() => {
      setDetik((d) => {
        if (d + 1 >= 10) {
          setRecording(false)
          onChange(10)
          return 10
        }
        return d + 1
      })
    }, 1000)
    return () => {
      if (timer.current) window.clearInterval(timer.current)
    }
  }, [recording, onChange])

  const mulai = () => {
    setDetik(0)
    onChange(null)
    setRecording(true)
  }
  const stop = () => {
    setRecording(false)
    onChange(Math.max(1, detik))
  }

  return (
    <div className="rounded-card bg-white p-5 shadow-card">
      <div className="flex h-16 items-end justify-center gap-1">
        {Array.from({ length: 22 }).map((_, i) => (
          <span
            key={i}
            className="eq-bar w-1.5 rounded-full bg-forest/70"
            style={{
              height: recording ? '100%' : value ? '38%' : '18%',
              animationPlayState: recording ? 'running' : 'paused',
              animationDelay: `${(i % 7) * 0.09}s`,
            }}
          />
        ))}
      </div>

      <p className="mt-3 text-center text-2xl font-extrabold tabular-nums text-ink">
        0:{String(recording ? detik : value ?? 0).padStart(2, '0')}
        <span className="text-base font-bold text-ink-faint"> / 0:10</span>
      </p>

      <div className="mt-4 flex justify-center">
        {!recording && value === null && (
          <button
            onClick={mulai}
            className="flex h-16 w-16 items-center justify-center rounded-full bg-bahaya text-white shadow-fab active:scale-95"
            aria-label="Mulai merekam"
          >
            <Mic size={26} />
          </button>
        )}
        {recording && (
          <button
            onClick={stop}
            className="flex h-16 w-16 items-center justify-center rounded-full bg-ink text-white shadow-fab active:scale-95"
            aria-label="Berhenti"
          >
            <Square size={22} className="fill-white" />
          </button>
        )}
        {!recording && value !== null && (
          <div className="flex items-center gap-3">
            <button className="flex h-12 w-12 items-center justify-center rounded-full bg-forest text-white">
              <Play size={20} className="fill-white" />
            </button>
            <button
              onClick={mulai}
              className="rounded-pill bg-bone-200 px-4 py-2.5 text-sm font-bold text-ink-soft"
            >
              Rekam ulang
            </button>
          </div>
        )}
      </div>
      <p className="mt-3 text-center text-[11px] text-ink-faint">
        {recording ? 'Sedang merekam… tekan kotak untuk berhenti' : value !== null ? 'Catatan suara siap' : 'Tekan tombol merah untuk mulai'}
      </p>
    </div>
  )
}
