// Mengunggah foto terkompresi ke Worker penyimpan (Cloudflare R2 di baliknya).
// Kalau gagal (sinyal lemah/mati, server tidak terjangkau), pemanggil tetap
// menyimpan versi lokal (data URL) dan menandai laporan sebagai "offline" —
// konsisten dengan prinsip mode offline (§8): tersimpan dulu di HP, terkirim
// otomatis saat ada sinyal (lewat actions.sinkronkan()).

const WORKER_URL =
  (import.meta.env.VITE_UPLOAD_URL as string | undefined) ||
  'https://iris-i-tallo-upload.mrv-nexus.workers.dev'

export async function unggahFotoKeServer(
  dataUrlAtauBlob: string | Blob,
  token: string,
  jenis: 'laporan' | 'profil' = 'laporan',
): Promise<string> {
  const blob =
    typeof dataUrlAtauBlob === 'string'
      ? await fetch(dataUrlAtauBlob).then((r) => r.blob())
      : dataUrlAtauBlob

  const res = await fetch(`${WORKER_URL}/upload${jenis === 'profil' ? '?jenis=profil' : ''}`, {
    method: 'POST',
    headers: {
      'Content-Type': blob.type || 'image/jpeg',
      Authorization: `Bearer ${token}`,
    },
    body: blob,
  })

  if (!res.ok) {
    const info: { error?: string } | null = await res.json().catch(() => null)
    throw new Error(info?.error ?? `Gagal mengunggah foto (HTTP ${res.status})`)
  }

  const data = (await res.json()) as { url: string }
  return data.url
}
