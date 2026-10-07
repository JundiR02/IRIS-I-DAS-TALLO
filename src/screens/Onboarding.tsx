import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Camera, CircleDot, Send, ShieldCheck, Gift, Users } from 'lucide-react'
import { useApp } from '../store/store'
import Logo from '../components/Logo'
import RiverScene from '../components/RiverScene'

const SLIDES = [
  {
    tema: 'bg-forest text-white',
    ilustrasi: 'sungai',
    judul: 'Pantau Sungai Tallo bersama tetangga',
    teks: 'Lihat kondisi sungai di wilayah Anda setiap hari, langsung dari laporan warga lain.',
    ikon: <Users size={18} />,
  },
  {
    tema: 'bg-lime text-forest-deep',
    ilustrasi: 'langkah',
    judul: 'Lapor cukup 3 langkah',
    teks: 'Ambil foto sungai, pilih warna kondisi (hijau–kuning–merah), lalu kirim. Bisa rekam suara juga.',
    ikon: <Send size={18} />,
  },
  {
    tema: 'bg-river text-white',
    ilustrasi: 'arahan',
    judul: 'Dapat arahan yang jelas',
    teks: 'Tim Peneliti mengecek laporan Anda dan memberi arahan singkat: apa yang perlu dilakukan hari ini.',
    ikon: <ShieldCheck size={18} />,
  },
]

export default function Onboarding() {
  const navigate = useNavigate()
  const { actions } = useApp()
  const [i, setI] = useState(0)
  const last = i === SLIDES.length - 1
  const s = SLIDES[i]

  const selesai = () => {
    actions.selesaiOnboarding()
    navigate('/', { replace: true })
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-bone-50">
      <div className="flex items-center justify-between px-5 pt-4">
        <Logo size={26} />
        <button onClick={selesai} className="text-xs font-bold text-ink-muted">
          Lewati
        </button>
      </div>

      {/* Ilustrasi */}
      <div className="px-5 pt-5">
        <div className={`relative overflow-hidden rounded-[28px] ${s.tema} aspect-[4/3]`}>
          {s.ilustrasi === 'sungai' && (
            <RiverScene status="aman" seed={7} className="h-full w-full" />
          )}
          {s.ilustrasi === 'langkah' && (
            <div className="flex h-full items-center justify-center gap-3">
              {[Camera, CircleDot, Send].map((Ic, k) => (
                <div key={k} className="flex flex-col items-center gap-2">
                  <div className="grid h-14 w-14 place-items-center rounded-2xl bg-white/85 text-forest-deep">
                    <Ic size={24} />
                  </div>
                  <span className="text-[11px] font-bold">{k + 1}</span>
                </div>
              ))}
            </div>
          )}
          {s.ilustrasi === 'arahan' && (
            <div className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center">
              <ShieldCheck size={40} />
              <p className="rounded-2xl bg-white/15 px-3 py-2 text-[12px] font-semibold">
                "Air naik 20 cm. Pindahkan barang berharga ke tempat lebih tinggi malam ini."
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Teks */}
      <div className="flex-1 px-6 pt-7">
        <span className="inline-flex items-center gap-1.5 rounded-pill bg-forest/10 px-2.5 py-1 text-[11px] font-extrabold text-forest-deep">
          {s.ikon} Langkah {i + 1} dari {SLIDES.length}
        </span>
        <h1 className="mt-3 text-[26px] font-extrabold leading-tight tracking-tight text-ink">
          {s.judul}
        </h1>
        <p className="mt-2 text-[15px] leading-relaxed text-ink-soft">{s.teks}</p>

        {last && (
          <div className="mt-5 flex items-start gap-2.5 rounded-2xl bg-lime/25 px-3.5 py-3">
            <Gift size={18} className="mt-0.5 shrink-0 text-forest" />
            <p className="text-[13px] font-semibold text-forest-deep">
              Ikuti jadwal 40 hari dan kumpulkan poin. Poin bisa ditukar pulsa/token lewat program desa.
            </p>
          </div>
        )}
      </div>

      {/* Kontrol */}
      <div className="px-6 pb-8">
        <div className="mb-4 flex justify-center gap-1.5">
          {SLIDES.map((_, k) => (
            <span
              key={k}
              className={`h-1.5 rounded-full transition-all ${
                k === i ? 'w-6 bg-forest' : 'w-1.5 bg-bone-300'
              }`}
            />
          ))}
        </div>
        <button
          onClick={() => (last ? selesai() : setI(i + 1))}
          className="w-full rounded-pill bg-forest py-4 text-base font-extrabold text-white shadow-fab active:scale-[0.98]"
        >
          {last ? 'Mulai pakai IRIS-I' : 'Lanjut'}
        </button>
      </div>
    </div>
  )
}
