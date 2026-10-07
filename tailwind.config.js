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
        bone: {
          DEFAULT: '#F5EAD8',
          50: '#FBF5EA',
          100: '#F5EAD8',
          200: '#E9D6B4',
          300: '#DBBF91',
        },
        ink: {
          DEFAULT: '#1C2420',
          soft: '#3E4A40',
          muted: '#6E7A6D',
          faint: '#9CA599',
        },
        forest: {
          DEFAULT: '#1F4A3D',
          deep: '#12291F',
          soft: '#7D9C8C',
        },
        lime: {
          DEFAULT: '#C7AE4C',
          bright: '#D6BE5C',
          deep: '#A88F38',
        },
        river: {
          DEFAULT: '#4C7C99',
          deep: '#365C73',
          mist: '#D9E2E2',
        },
        // Traffic-light status system (prinsip dasar #2) — hijau tua bersahaja,
        // mustard-ochre, terakota. Bukan hijau/kuning/merah "stock" generik.
        aman: { DEFAULT: '#4C7A52', ink: '#1C331F', wash: '#E7EEE1' },
        waspada: { DEFAULT: '#C4892E', ink: '#573C10', wash: '#F5E7CB' },
        bahaya: { DEFAULT: '#B84B31', ink: '#48170C', wash: '#F1DCD1' },
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      borderRadius: {
        card: '1.5rem',
        xl2: '1.75rem',
        pill: '999px',
      },
      boxShadow: {
        card: '0 8px 30px -8px rgba(27, 42, 34, 0.12)',
        soft: '0 2px 10px -2px rgba(27, 42, 34, 0.08)',
        lift: '0 16px 40px -12px rgba(27, 42, 34, 0.22)',
        fab: '0 12px 28px -6px rgba(47, 93, 58, 0.45)',
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
        'pulse-ring': 'pulse-ring 1.8s ease-out infinite',
      },
    },
  },
  plugins: [],
}
