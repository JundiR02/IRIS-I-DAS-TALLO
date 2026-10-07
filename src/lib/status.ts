import type { Lang, Status } from './types'

// Sistem "traffic light" — warna & ikon dulu, teks belakangan (prinsip dasar #2).

export const STATUS_ORDER: Status[] = ['aman', 'waspada', 'bahaya']

// Tanda status — bukan ikon generik dari pustaka, tapi gambar tangan bertema
// "air sungai" supaya terasa milik IRIS-I sendiri, bukan template UI-kit:
//   aman    = satu gelombang tenang
//   waspada = gelombang naik + anak panah
//   bahaya  = gelombang meluap melewati garis tanggul
// Path memakai koordinat berpusat di (0,0) supaya bisa dipakai langsung baik
// di komponen React (components/StatusIcon.tsx) maupun ditempel sebagai
// <path> mentah di dalam SVG peta (screens/Peta.tsx) — satu sumber gambar.
export const STATUS_MARK: Record<Status, { viewBox: string; d: string[] }> = {
  aman: {
    viewBox: '-9 -9 18 18',
    d: ['M-6,0 Q-3,-4.2 0,0 T6,0'],
  },
  waspada: {
    viewBox: '-9 -9 18 18',
    d: ['M-6.5,3.5 Q-2.5,-0.5 1,1 T6,-3.5', 'M3,-1.6 L6,-4.2 L7.6,-1.8'],
  },
  bahaya: {
    viewBox: '-9 -9 18 18',
    d: ['M-7,4.3 L7,4.3', 'M-6,2 Q-3,-6 0,0 T6,-5.2'],
  },
}

interface StatusMeta {
  /** label Bahasa Indonesia sehari-hari */
  id: string
  /** label Bahasa Makassar (Mangkasara) — perlu validasi penutur asli */
  mks: string
  /** arti singkat untuk warga */
  arti: string
  /** kelas Tailwind */
  dot: string
  text: string
  wash: string
  ring: string
  solid: string
}

export const STATUS: Record<Status, StatusMeta> = {
  aman: {
    id: 'Aman',
    mks: 'Bajik',
    arti: 'Air normal',
    dot: 'bg-aman',
    text: 'text-aman-ink',
    wash: 'bg-aman-wash',
    ring: 'ring-aman',
    solid: 'bg-aman text-white',
  },
  waspada: {
    id: 'Waspada',
    mks: 'Jaga-jaga',
    arti: 'Air naik / keruh',
    dot: 'bg-waspada',
    text: 'text-waspada-ink',
    wash: 'bg-waspada-wash',
    ring: 'ring-waspada',
    solid: 'bg-waspada text-white',
  },
  bahaya: {
    id: 'Bahaya',
    mks: 'Bahaya',
    arti: 'Meluap / banjir',
    dot: 'bg-bahaya',
    text: 'text-bahaya-ink',
    wash: 'bg-bahaya-wash',
    ring: 'ring-bahaya',
    solid: 'bg-bahaya text-white',
  },
}

export function statusLabel(s: Status, lang: Lang): string {
  return lang === 'mks' ? STATUS[s].mks : STATUS[s].id
}

// Glosarium istilah lokal untuk label penting (bagian 8 checklist).
// TODO: validasi seluruh istilah Mangkasara bersama penutur asli / tim desa.
export const GLOSSARY: Record<string, { id: string; mks: string }> = {
  sungai: { id: 'Sungai', mks: 'Binanga' },
  air: { id: 'Air', mks: "Je'ne" },
  lapor: { id: 'Lapor', mks: 'Lapor' },
  hariIni: { id: 'Hari ini', mks: 'Anne alloa' },
  wilayah: { id: 'Wilayah', mks: 'Daera' },
}

export function t(key: keyof typeof GLOSSARY, lang: Lang): string {
  return lang === 'mks' ? GLOSSARY[key].mks : GLOSSARY[key].id
}
