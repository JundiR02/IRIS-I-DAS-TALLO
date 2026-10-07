import type { Laporan } from '../lib/types'
import RiverScene from './RiverScene'

interface Props {
  laporan: Pick<Laporan, 'id' | 'fotoUrl' | 'fotoSeed' | 'statusTerverifikasi' | 'statusPelapor'>
  className?: string
  /** tiang ukur hanya relevan untuk ilustrasi prosedural (fallback data contoh) */
  tiang?: boolean
}

/** Angka 10..98 yang stabil untuk id yang sama — dipakai sebagai seed ilustrasi
    prosedural ketika laporan tidak membawa fotoSeed eksplisit (mis. dari API). */
function seedDariId(id: string): number {
  let h = 0
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0
  return 10 + (h % 89)
}

/**
 * Foto sebuah laporan — foto sungai sungguhan kalau warga sudah pernah
 * unggah (fotoUrl), atau ilustrasi prosedural sebagai fallback untuk data
 * contoh/demo yang memang tidak punya foto asli.
 */
export default function FotoLaporan({ laporan, className, tiang }: Props) {
  if (laporan.fotoUrl) {
    return (
      <img
        src={laporan.fotoUrl}
        alt="Foto sungai dari laporan warga"
        className={`object-cover ${className ?? ''}`}
      />
    )
  }
  return (
    <RiverScene
      status={laporan.statusTerverifikasi ?? laporan.statusPelapor}
      seed={laporan.fotoSeed ?? seedDariId(laporan.id)}
      className={className}
      tiang={tiang}
    />
  )
}
