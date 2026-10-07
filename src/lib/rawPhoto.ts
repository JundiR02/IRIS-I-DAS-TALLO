import { gps as exifGps, thumbnailUrl as exifThumbnailUrl } from 'exifr'

// Foto sungai sungguhan — mendukung JPEG/PNG/HEIC biasa dari HP, maupun file
// RAW kamera (CR2 Canon, dan NEF/ARW/DNG/RAF/RW2/ORF sebagai bonus) yang
// browser tidak bisa tampilkan langsung. Untuk RAW, kita ambil pratinjau JPEG
// yang sudah disisipkan kamera di dalam file itu sendiri (lewat EXIF), lalu
// dikompresi ulang supaya hemat kuota & muat di penyimpanan lokal.

const EKSTENSI_RAW = ['cr2', 'cr3', 'nef', 'arw', 'dng', 'raf', 'rw2', 'orf']
const DIM_MAKS = 1280
const KUALITAS_JPEG = 0.78

export interface FotoDiproses {
  dataUrl: string
  lebar: number
  tinggi: number
  dariRaw: boolean
  namaAsli: string
  gps?: { latitude: number; longitude: number }
}

export class FotoError extends Error {
  constructor(public kode: 'RAW_TANPA_PRATINJAU' | 'GAGAL_BACA' | 'FORMAT_TIDAK_DIKENAL', pesan: string) {
    super(pesan)
  }
}

function ekstensiFile(nama: string): string {
  const i = nama.lastIndexOf('.')
  return i === -1 ? '' : nama.slice(i + 1).toLowerCase()
}

export function isFileRaw(file: File): boolean {
  const ext = ekstensiFile(file.name)
  // File RAW kamera umumnya tidak punya MIME type standar di browser Windows/Android
  // (kosong atau "application/octet-stream"), jadi ekstensi lebih bisa diandalkan.
  return EKSTENSI_RAW.includes(ext)
}

type SumberGambar = ImageBitmap | HTMLImageElement

async function muatBitmap(blob: Blob): Promise<SumberGambar> {
  if (typeof createImageBitmap === 'function') {
    try {
      return await createImageBitmap(blob, { imageOrientation: 'from-image' })
    } catch {
      try {
        return await createImageBitmap(blob)
      } catch {
        /* lanjut ke fallback <img> di bawah */
      }
    }
  }
  const url = URL.createObjectURL(blob)
  try {
    const img = new Image()
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve()
      img.onerror = () => reject(new Error('gagal memuat gambar'))
      img.src = url
    })
    return img
  } finally {
    URL.revokeObjectURL(url)
  }
}

function perkecilJadiJpeg(sumber: SumberGambar, dimMaks: number, kualitas: number) {
  const w = sumber.width
  const h = sumber.height
  const skala = Math.min(1, dimMaks / Math.max(w, h))
  const lebar = Math.max(1, Math.round(w * skala))
  const tinggi = Math.max(1, Math.round(h * skala))

  const canvas = document.createElement('canvas')
  canvas.width = lebar
  canvas.height = tinggi
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new FotoError('GAGAL_BACA', 'Kanvas tidak didukung di perangkat ini.')
  ctx.drawImage(sumber, 0, 0, lebar, tinggi)

  if ('close' in sumber && typeof sumber.close === 'function') sumber.close()

  return { dataUrl: canvas.toDataURL('image/jpeg', kualitas), lebar, tinggi }
}

/**
 * Memproses file foto apa pun jadi JPEG terkompresi siap tampil & disimpan.
 * - File gambar biasa (JPEG/PNG/WebP/HEIC) → dipakai langsung kualitas penuh.
 * - File RAW (CR2/NEF/ARW/…) → ambil pratinjau JPEG bawaan kamera dari EXIF.
 */
export async function prosesFotoUpload(file: File): Promise<FotoDiproses> {
  const dariRaw = isFileRaw(file)
  let sumberBlob: Blob = file

  if (dariRaw) {
    let urlPratinjau: string | undefined
    try {
      urlPratinjau = await exifThumbnailUrl(file)
    } catch {
      urlPratinjau = undefined
    }
    if (!urlPratinjau) {
      throw new FotoError(
        'RAW_TANPA_PRATINJAU',
        'Tidak ditemukan pratinjau di dalam file RAW ini. Coba file RAW lain, atau pakai JPEG.',
      )
    }
    try {
      sumberBlob = await fetch(urlPratinjau).then((r) => r.blob())
    } finally {
      URL.revokeObjectURL(urlPratinjau)
    }
  }

  let bitmap: SumberGambar
  try {
    bitmap = await muatBitmap(sumberBlob)
  } catch {
    throw new FotoError(
      'FORMAT_TIDAK_DIKENAL',
      dariRaw
        ? 'Pratinjau di dalam file RAW ini rusak atau tidak didukung.'
        : 'Format file ini tidak bisa dibaca sebagai gambar.',
    )
  }

  const { dataUrl, lebar, tinggi } = perkecilJadiJpeg(bitmap, DIM_MAKS, KUALITAS_JPEG)

  let gps: FotoDiproses['gps']
  try {
    const hasil = await exifGps(file)
    if (hasil && Number.isFinite(hasil.latitude) && Number.isFinite(hasil.longitude)) {
      gps = { latitude: hasil.latitude, longitude: hasil.longitude }
    }
  } catch {
    gps = undefined // wajar: kamera DSLR umumnya tidak punya modul GPS
  }

  return { dataUrl, lebar, tinggi, dariRaw, namaAsli: file.name, gps }
}
