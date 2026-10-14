import { GARIS_SUNGAI } from './Logo'

/** Layar pertama saat aplikasi dibuka: peta Makassar gelap di latar, garis
    Sungai Tallo (simbol logo) di tengah, lalu masuk ke panduan singkat. */
export default function LayarPembuka({ onMulai }: { onMulai: () => void }) {
  return (
    <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden bg-[#303030] text-[#F2F1EE]">
      {/* Peta jalan Makassar (OpenStreetMap), dibalik jadi garis terang samar.
          Diposisikan ke kanan supaya kelokan Sungai Tallo ikut terlihat. */}
      <img
        src="/peta-makassar.webp"
        alt=""
        aria-hidden
        className="pointer-events-none absolute inset-0 h-full w-full object-cover object-[68%_50%] motion-safe:animate-peta-masuk"
      />
      {/* Penyangga keterbacaan: gelap di belakang logo & di zona tombol. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 75% 42% at 50% 42%, rgba(48,48,48,0.92) 0%, rgba(48,48,48,0.6) 55%, rgba(48,48,48,0) 100%), linear-gradient(to top, #303030 0%, rgba(48,48,48,0.85) 18%, rgba(48,48,48,0) 40%)',
        }}
      />

      <div className="relative flex flex-1 flex-col items-center justify-center px-8 text-center">
        <svg viewBox="4 24 112 72" className="w-44 max-w-[55%]" fill="none" aria-hidden>
          <path
            d={GARIS_SUNGAI}
            pathLength={1}
            stroke="currentColor"
            strokeWidth="9"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="motion-safe:animate-garis-sungai"
            style={{ strokeDasharray: 1 }}
          />
        </svg>
        <h1 className="mt-10 font-brand text-[44px] font-extrabold leading-none tracking-[0.04em]">IRIS-I</h1>
        <p className="mr-[-0.5em] mt-3 font-brand text-[13px] font-semibold tracking-[0.5em]">DAS TALLO</p>
        <p className="mt-8 max-w-[26ch] text-[15px] leading-relaxed text-[#F2F1EE]/80">
          Pemantauan sungai berbasis warga
        </p>
      </div>

      <div className="relative px-6 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
        <button
          onClick={onMulai}
          className="flex min-h-14 w-full items-center justify-center rounded-2xl bg-[#F2F1EE] text-base font-extrabold text-[#303030] transition-transform active:scale-[0.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#F2F1EE]"
        >
          Mulai
        </button>
        <p className="mt-4 text-center text-[10.5px] text-[#F2F1EE]/60">
          Peta © OpenStreetMap contributors · terraink.app
        </p>
      </div>
    </div>
  )
}
