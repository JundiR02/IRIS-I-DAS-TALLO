import { useRef, useState, type FormEvent } from 'react'
import { Camera, Trash2, Save } from 'lucide-react'
import { ApiError, ubahProfilSaya } from '../lib/api'
import { unggahFotoKeServer } from '../lib/uploadFoto'
import Avatar from '../components/Avatar'
import { usePanel } from './usePanel'
import { BTN, INPUT, LABEL, BadgePeran } from './ui'

const SISI_FOTO = 320

/** Potong tengah jadi persegi & kecilkan ke 320px JPEG — hemat kuota, cukup tajam untuk avatar. */
function kecilkanFoto(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      const sisi = Math.min(img.naturalWidth, img.naturalHeight)
      const canvas = document.createElement('canvas')
      canvas.width = canvas.height = SISI_FOTO
      canvas
        .getContext('2d')!
        .drawImage(img, (img.naturalWidth - sisi) / 2, (img.naturalHeight - sisi) / 2, sisi, sisi, 0, 0, SISI_FOTO, SISI_FOTO)
      URL.revokeObjectURL(url)
      canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Gagal memproses foto.'))), 'image/jpeg', 0.85)
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Format foto tidak didukung browser ini. Coba JPG atau PNG.'))
    }
    img.src = url
  })
}

export default function ProfilSaya({ onTutup }: { onTutup: () => void }) {
  const { sesi, masuk, beriNotif, muatUlang } = usePanel()
  const akun = sesi!.akun
  const [nama, setNama] = useState(akun.nama)
  const [foto, setFoto] = useState<{ blob: Blob; pratinjau: string } | null>(null)
  const [hapusFoto, setHapusFoto] = useState(false)
  const [kirim, setKirim] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const pilih = useRef<HTMLInputElement>(null)

  const fotoTampil = foto?.pratinjau ?? (hapusFoto ? undefined : akun.fotoUrl)

  const pilihFoto = async (file?: File) => {
    if (!file) return
    setError(null)
    try {
      const blob = await kecilkanFoto(file)
      setFoto({ blob, pratinjau: URL.createObjectURL(blob) })
      setHapusFoto(false)
    } catch (e) {
      setError((e as Error).message)
    }
  }

  const simpan = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    if (nama.trim().length < 2) return setError('Nama minimal 2 karakter.')
    setKirim(true)
    try {
      const fotoUrl = foto ? await unggahFotoKeServer(foto.blob, sesi!.token, 'profil') : hapusFoto ? null : undefined
      const baru = await ubahProfilSaya(sesi!.token, { nama: nama.trim(), fotoUrl })
      masuk({ token: sesi!.token, akun: baru })
      void muatUlang()
      beriNotif('Profil disimpan.')
      onTutup()
    } catch (e) {
      setError(e instanceof ApiError || e instanceof Error ? e.message : 'Tidak bisa terhubung ke server.')
    } finally {
      setKirim(false)
    }
  }

  return (
    <form onSubmit={simpan} className="space-y-4">
      <div className="flex items-center gap-4">
        <Avatar nama={nama} inisial={akun.inisial} warna={akun.warna} size={76} foto={fotoTampil} />
        <div className="space-y-2">
          <BadgePeran peran={akun.peran} />
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => pilih.current?.click()} className={BTN.kecil}>
              <Camera size={12} /> {fotoTampil ? 'Ganti foto' : 'Unggah foto'}
            </button>
            {fotoTampil && (
              <button
                type="button"
                onClick={() => {
                  setFoto(null)
                  setHapusFoto(true)
                }}
                className={`${BTN.kecil} text-bahaya-ink`}
              >
                <Trash2 size={12} /> Hapus
              </button>
            )}
          </div>
          <input ref={pilih} type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={(e) => pilihFoto(e.target.files?.[0])} />
        </div>
      </div>

      <div>
        <label htmlFor="ps-nama" className={LABEL}>
          Nama tampilan
        </label>
        <input id="ps-nama" value={nama} maxLength={60} onChange={(e) => setNama(e.target.value)} className={INPUT} placeholder="Nama lengkap Anda" />
        <p className="mt-1 text-[11.5px] text-ink-muted">Tampil di Panel, di komentar, dan sebagai nama peninjau pada laporan yang Anda verifikasi.</p>
      </div>

      {error && <p className="rounded-xl bg-bahaya-wash px-3 py-2 text-[12.5px] font-semibold text-bahaya-ink">{error}</p>}

      <div className="flex justify-end gap-2">
        <button type="button" onClick={onTutup} className={BTN.sekunder}>
          Batal
        </button>
        <button type="submit" disabled={kirim} className={BTN.primer}>
          <Save size={15} /> {kirim ? 'Menyimpan…' : 'Simpan'}
        </button>
      </div>
    </form>
  )
}
