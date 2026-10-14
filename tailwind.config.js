/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Palet "boutique earth" — teal-forest tua, terakota, mustard, sage,
        // krem hangat. Traffic-light tetap merah/kuning/hijau, tapi dalam
        // keluarga warna yang sama supaya tidak terasa seperti palet UI-kit
        // generik (lihat referensi kombinasi warna dari pengguna).
        // Palet inti diambil dari logo: ARANG (#303030) + KAPUR (#F2F1EE),
        // dengan tingkatan abu hangat di antaranya, dan MUSTARD sebagai satu-
        // satunya aksen. Nama token lama (bone/ink/forest/river) dipertahankan
        // supaya seluruh komponen ikut berubah tanpa disentuh satu per satu.
        bone: {
          DEFAULT: '#F2F1EE',
          50: '#F8F7F5',
          100: '#F2F1EE',
          200: '#E4E2DD',
          300: '#D0CDC6',
        },
        ink: {
          DEFAULT: '#262626',
          soft: '#454441',
          muted: '#6A6863',
          faint: '#8C8A85',
        },
        // dulu hijau hutan — kini arang logo
        forest: {
          DEFAULT: '#303030',
          deep: '#1E1E1E',
          soft: '#8C8A85',
        },
        lime: {
          DEFAULT: '#C7AE4C',
          bright: '#D6BE5C',
          deep: '#8A7428',
        },
        // dulu biru sungai — kini abu arang menengah (bukan warna baru)
        river: {
          DEFAULT: '#4A4946',
          deep: '#303030',
          mist: '#E4E2DD',
        },
        // Traffic-light status system (prinsip dasar #2) — hijau tua bersahaja,
        // mustard-ochre, terakota. Bukan hijau/kuning/merah "stock" generik.
        aman: { DEFAULT: '#4C7A52', ink: '#1C331F', wash: '#E7EEE1' },
        waspada: { DEFAULT: '#C4892E', ink: '#573C10', wash: '#F5E7CB' },
        bahaya: { DEFAULT: '#B84B31', ink: '#48170C', wash: '#F1DCD1' },
      },
      fontFamily: {
        // Montserrat khusus untuk wordmark IRIS-I (lihat Logo.tsx).
        brand: ['Montserrat', 'system-ui', 'sans-serif'],
        sans: ['"Plus Jakarta Sans"', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      borderRadius: {
        card: '1.5rem',
        xl2: '1.75rem',
        pill: '999px',
      },
      boxShadow: {
        // Kartu dalam alur halaman duduk rata — cukup garis tepi tipis.
        // Bayangan sungguhan (lift/fab) hanya untuk yang melayang di atas
        // konten: navigasi bawah, kartu di atas peta, sheet, modal, toast.
        card: '0 0 0 1px rgba(48, 48, 48, 0.07)',
        soft: '0 0 0 1px rgba(48, 48, 48, 0.06)',
        lift: '0 16px 40px -12px rgba(48, 48, 48, 0.22)',
        fab: '0 12px 28px -6px rgba(48, 48, 48, 0.4)',
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'scale-in': {
          '0%': { opacity: '0', transform: 'scale(0.9)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        'slide-in': {
          '0%': { opacity: '0', transform: 'translateX(16px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        'sheet-up': {
          '0%': { transform: 'translateY(100%)' },
          '100%': { transform: 'translateY(0)' },
        },
        'draw-check': {
          '0%': { strokeDashoffset: '48' },
          '100%': { strokeDashoffset: '0' },
        },
        'pulse-ring': {
          '0%': { transform: 'scale(0.8)', opacity: '0.7' },
          '100%': { transform: 'scale(2.4)', opacity: '0' },
        },
        // Layar pembuka: peta pelan-pelan muncul, garis sungai tergambar dari hulu ke muara.
        'peta-masuk': {
          '0%': { opacity: '0', transform: 'scale(1.06)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        'garis-sungai': {
          '0%': { strokeDashoffset: '1' },
          '100%': { strokeDashoffset: '0' },
        },
        wave: {
          '0%,100%': { transform: 'scaleY(0.35)' },
          '50%': { transform: 'scaleY(1)' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.35s ease-out both',
        'scale-in': 'scale-in 0.3s ease-out both',
        'slide-in': 'slide-in 0.3s ease-out both',
        'sheet-up': 'sheet-up 0.32s cubic-bezier(0.22, 1, 0.36, 1) both',
        'draw-check': 'draw-check 0.5s ease-out 0.15s both',
        'pulse-ring': 'pulse-ring 1.8s ease-out 0.4s 3 both',
        'peta-masuk': 'peta-masuk 1.8s cubic-bezier(0.16, 1, 0.3, 1) both',
        'garis-sungai': 'garis-sungai 1.4s cubic-bezier(0.65, 0, 0.35, 1) 0.2s both',
      },
    },
  },
  plugins: [],
}
