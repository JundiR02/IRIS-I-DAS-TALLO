// Waktu relatif berbahasa Indonesia — "bahasa hasil, bukan bahasa proses".

const HARI = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', "Jumat", 'Sabtu']
const BULAN = [
  'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
  'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des',
]

export function waktuRelatif(iso: string, now: Date = new Date()): string {
  const d = new Date(iso)
  const detik = Math.round((now.getTime() - d.getTime()) / 1000)
  if (detik < 45) return 'baru saja'
  const menit = Math.round(detik / 60)
  if (menit < 60) return `${menit} menit lalu`
  const jam = Math.round(menit / 60)
  if (jam < 24) return `${jam} jam lalu`
  const hari = Math.round(jam / 24)
  if (hari === 1) return 'kemarin'
  if (hari < 7) return `${hari} hari lalu`
  return `${d.getDate()} ${BULAN[d.getMonth()]}`
}

function startOfDay(d: Date): number {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()
}

/** Apakah waktu ISO jatuh pada hari kalender yang sama dengan `now`. */
export function isHariIni(iso: string, now: Date = new Date()): boolean {
  return startOfDay(new Date(iso)) === startOfDay(now)
}

/** Label pengelompokan notifikasi/riwayat per hari — "Hari ini" / "Kemarin" / dst. */
export function labelHari(iso: string, now: Date = new Date()): string {
  const d = new Date(iso)
  const selisihHari = Math.round((startOfDay(now) - startOfDay(d)) / 86_400_000)
  if (selisihHari <= 0) return 'Hari ini'
  if (selisihHari === 1) return 'Kemarin'
  if (selisihHari < 7) return `${selisihHari} hari lalu`
  return tanggalPanjang(d)
}

export function jamMenit(iso: string): string {
  const d = new Date(iso)
  return `${String(d.getHours()).padStart(2, '0')}.${String(d.getMinutes()).padStart(2, '0')}`
}

export function tanggalPanjang(d: Date): string {
  return `${HARI[d.getDay()]}, ${d.getDate()} ${BULAN[d.getMonth()]} ${d.getFullYear()}`
}

export function tanggalPendek(d: Date): string {
  return `${d.getDate()} ${BULAN[d.getMonth()]}`
}

export function angkaRingkas(n: number): string {
  if (n < 1000) return String(n)
  if (n < 1_000_000) return `${(n / 1000).toFixed(n % 1000 === 0 ? 0 : 1)}rb`
  return `${(n / 1_000_000).toFixed(1)}jt`
}
