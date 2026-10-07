import { tanggalPendek } from './format'

// Skema rotasi: 40 responden, 40 hari, 1 data/hari (Dokumen bagian 5).
export const TOTAL_RESPONDEN = 40
export const TOTAL_HARI = 40

/** Nomor urut hari (1..40) yang sedang aktif dari sebuah "hari ke-N" siklus. */
export function noUrutHariIni(hariKe: number): number {
  return ((hariKe - 1) % TOTAL_RESPONDEN) + 1
}

/** Apakah hari ini giliran responden dengan nomor urut tertentu. */
export function giliranSaya(hariKe: number, noUrut: number): boolean {
  return noUrutHariIni(hariKe) === noUrut
}

/** Berapa hari lagi sampai giliran responden tersebut. 0 = hari ini. */
export function hariMenujuGiliran(hariKe: number, noUrut: number): number {
  const skrg = noUrutHariIni(hariKe)
  return (noUrut - skrg + TOTAL_RESPONDEN) % TOTAL_RESPONDEN
}

/** Tanggal (perkiraan) giliran berikutnya, relatif hari nyata. */
export function tanggalGiliran(hariKe: number, noUrut: number, dari: Date = new Date()): string {
  const selisih = hariMenujuGiliran(hariKe, noUrut)
  const d = new Date(dari)
  d.setDate(d.getDate() + selisih)
  return tanggalPendek(d)
}
