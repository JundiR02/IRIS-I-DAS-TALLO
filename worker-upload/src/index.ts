// IRIS-I — Worker backend: unggah foto (R2), login PIN warga, dan data
// kolaboratif (laporan + komentar) lewat D1 — supaya laporan warga A benar-
// benar terlihat di HP warga B, bukan cuma tersimpan lokal per-perangkat.
//
// Semua penulisan data (POST) wajib bawa token hasil login. Pembacaan (GET)
// terbuka — laporan warga memang ditujukan untuk dilihat komunitas.
//
// Tiga peran, tiga pintu masuk:
//   warga    (masyarakat) → POST /auth/masyarakat  { noUrut, pin }
//   peneliti               → POST /auth/peneliti   { username, password }
//   admin                  → POST /auth/admin      { username, password }
// Peneliti + admin bisa memverifikasi laporan & menyematkan komentar; hanya
// admin yang bisa mengelola akun dan menghapus konten (/admin/*).

export interface Env {
  FOTO_BUCKET: R2Bucket
  DB: D1Database
  AUTH_TOKEN_SECRET: string
}

const ASAL_DIIZINKAN = [
  'https://iris-i-tallo.web.app',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
]

const MAKS_BYTE_FOTO = 8 * 1024 * 1024
const UMUR_TOKEN_DETIK = 30 * 24 * 60 * 60 // 30 hari
const MAKS_PERCOBAAN_LOGIN = 5
const JENDELA_PERCOBAAN_MENIT = 15

// --- util: respons & CORS ---------------------------------------------------

function headerCors(origin: string | null): Headers {
  const h = new Headers()
  h.set('Access-Control-Allow-Origin', origin && ASAL_DIIZINKAN.includes(origin) ? origin : ASAL_DIIZINKAN[0])
  h.set('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS')
  h.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  h.set('Vary', 'Origin')
  return h
}

function json(cors: Headers, status: number, data: unknown): Response {
  const h = new Headers(cors)
  h.set('Content-Type', 'application/json')
  return new Response(JSON.stringify(data), { status, headers: h })
}

function err(cors: Headers, status: number, pesan: string): Response {
  return json(cors, status, { error: pesan })
}

// --- util: base64url ---------------------------------------------------------

function toB64Url(bytes: Uint8Array): string {
  let bin = ''
  for (const b of bytes) bin += String.fromCharCode(b)
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function fromB64Url(s: string): Uint8Array {
  const pad = s.length % 4 === 0 ? '' : '='.repeat(4 - (s.length % 4))
  const bin = atob(s.replace(/-/g, '+').replace(/_/g, '/') + pad)
  const bytes = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i)
  return bytes
}

// --- util: kripto (Web Crypto, tanpa pustaka tambahan) -----------------------

async function hmac(data: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(data))
  return toB64Url(new Uint8Array(sig))
}

async function sha256Hex(data: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(data))
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

function samaPersis(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let beda = 0
  for (let i = 0; i < a.length; i++) beda |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return beda === 0
}

// Hash PIN/kata sandi baru: PBKDF2-SHA256 (batas iterasi Workers = 100.000),
// disimpan sebagai "pbkdf2$<iterasi>$<salt>$<hash>". Hash lama (sha256 polos
// `${id}:${pin}` dari schema.sql) tetap diterima, lalu di-upgrade saat login.
const ITERASI_PBKDF2 = 100_000

async function pbkdf2(rahasia: string, salt: Uint8Array, iterasi: number): Promise<string> {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(rahasia), 'PBKDF2', false, [
    'deriveBits',
  ])
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt, iterations: iterasi }, key, 256)
  return toB64Url(new Uint8Array(bits))
}

async function hashRahasia(rahasia: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16))
  return `pbkdf2$${ITERASI_PBKDF2}$${toB64Url(salt)}$${await pbkdf2(rahasia, salt, ITERASI_PBKDF2)}`
}

async function cocokkanRahasia(id: string, rahasia: string, tersimpan: string): Promise<boolean> {
  if (tersimpan.startsWith('pbkdf2$')) {
    const [, iterasi, salt, hash] = tersimpan.split('$')
    return samaPersis(await pbkdf2(rahasia, fromB64Url(salt), Number(iterasi)), hash)
  }
  return samaPersis(await sha256Hex(`${id}:${rahasia}`), tersimpan)
}

// PIN warga 6 digit; kata sandi peneliti/admin 10 karakter tanpa huruf mirip
// (0/O, 1/l/I) supaya gampang didiktekan lewat telepon.
function acak(alfabet: string, panjang: number): string {
  const bytes = crypto.getRandomValues(new Uint8Array(panjang))
  return Array.from(bytes, (b) => alfabet[b % alfabet.length]).join('')
}
const buatPin = () => acak('0123456789', 6)
const buatKataSandi = () => acak('abcdefghjkmnpqrstuvwxyz23456789', 10)

type Peran = 'warga' | 'peneliti' | 'admin'

interface TokenPayload {
  id: string
  noUrut: number
  peran: Peran
  /** versi token akun — naik saat PIN direset / akun dinonaktifkan, membatalkan token lama */
  v?: number
  exp: number
}

/** Identitas pemanggil yang sudah diverifikasi: tanda tangan token + status akun di D1. */
interface Akun {
  id: string
  noUrut: number
  peran: Peran
  nama: string
}

async function buatToken(payload: TokenPayload, secret: string): Promise<string> {
  const payloadB64 = toB64Url(new TextEncoder().encode(JSON.stringify(payload)))
  const sig = await hmac(payloadB64, secret)
  return `${payloadB64}.${sig}`
}

async function verifikasiToken(token: string, secret: string): Promise<TokenPayload | null> {
  const [payloadB64, sig] = token.split('.')
  if (!payloadB64 || !sig) return null
  const sigHarapan = await hmac(payloadB64, secret)
  if (sig !== sigHarapan) return null
  try {
    const payload = JSON.parse(new TextDecoder().decode(fromB64Url(payloadB64))) as TokenPayload
    if (typeof payload.exp !== 'number' || payload.exp < Date.now() / 1000) return null
    return payload
  } catch {
    return null
  }
}

async function wargaDariRequest(request: Request, env: Env): Promise<Akun | null> {
  const authHeader = request.headers.get('Authorization') ?? ''
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null
  if (!token) return null
  const payload = await verifikasiToken(token, env.AUTH_TOKEN_SECRET)
  if (!payload) return null
  // Cek ulang ke D1: akun yang dinonaktifkan / direset PIN-nya oleh admin
  // langsung kehilangan akses, tanpa menunggu token 30 harinya habis.
  const row = await env.DB.prepare('SELECT id, no_urut, peran, nama, aktif, token_versi FROM warga_auth WHERE id = ?')
    .bind(payload.id)
    .first<{ id: string; no_urut: number; peran: Peran; nama: string | null; aktif: number; token_versi: number }>()
  if (!row || !row.aktif || row.token_versi !== (payload.v ?? 0)) return null
  return { id: row.id, noUrut: row.no_urut, peran: row.peran, nama: row.nama ?? row.id }
}

const SESI_TIDAK_VALID = 'Sesi login tidak valid atau sudah habis. Masuk ulang.'

/** null = boleh lanjut; selain itu respons error yang harus langsung dikembalikan. */
function tolakKecuali(cors: Headers, akun: Akun | null, ...peran: Peran[]): Response | null {
  if (!akun) return err(cors, 401, SESI_TIDAK_VALID)
  if (!peran.includes(akun.peran)) return err(cors, 403, 'Akun Anda tidak punya akses untuk tindakan ini.')
  return null
}

// --- util: pemetaan baris D1 (snake_case) → JSON (camelCase) ----------------

function laporanKeJson(r: Record<string, unknown>) {
  return {
    id: r.id,
    wargaId: r.warga_id,
    titikId: r.titik_id,
    noUrutHari: r.no_urut_hari,
    fotoUrl: r.foto_url,
    fotoAsliNama: r.foto_asli_nama,
    fotoDariRaw: !!r.foto_dari_raw,
    koordinat: { lat: r.lat, lng: r.lng },
    koordinatDariExif: !!r.koordinat_dari_exif,
    waktuUpload: r.waktu_upload,
    statusPelapor: r.status_pelapor,
    statusVerifikasi: r.status_verifikasi,
    statusTerverifikasi: r.status_terverifikasi ?? undefined,
    catatanSuaraDetik: r.catatan_suara_detik ?? undefined,
    rekomendasiTeks: r.rekomendasi_teks ?? undefined,
    reviewerNama: r.reviewer_nama ?? undefined,
    waktuReview: r.waktu_review ?? undefined,
    jumlahSuka: r.jumlah_suka,
    jumlahKomentar: r.jumlah_komentar,
    darurat: !!r.darurat,
  }
}

function komentarKeJson(r: Record<string, unknown>) {
  return {
    id: r.id,
    laporanId: r.laporan_id,
    wargaId: r.warga_id,
    teks: r.teks,
    waktu: r.waktu,
    suka: r.suka,
    disematkan: !!r.disematkan,
    mention: r.mention ?? undefined,
  }
}

interface BarisAkun {
  id: string
  no_urut: number
  peran: Peran
  pin_hash: string
  nama: string | null
  username: string | null
  inisial: string | null
  warna: string | null
  kelurahan: string | null
  titik_id: string | null
  aktif: number
  token_versi: number
  dibuat: string | null
  login_terakhir: string | null
}

/** Profil publik — dipakai aplikasi untuk menampilkan nama/avatar di feed. Tanpa kredensial. */
function profilKeJson(r: BarisAkun) {
  return {
    id: r.id,
    noUrut: r.no_urut,
    peran: r.peran,
    nama: r.nama ?? r.id,
    inisial: r.inisial ?? (r.nama ?? r.id).slice(0, 2).toUpperCase(),
    warna: r.warna ?? '#6B7770',
    kelurahan: r.kelurahan ?? '-',
    titikId: r.titik_id ?? undefined,
    aktif: !!r.aktif,
  }
}

/** Versi lengkap untuk admin: + username & jejak aktivitas. */
function akunKeJson(r: BarisAkun) {
  return { ...profilKeJson(r), username: r.username ?? undefined, dibuat: r.dibuat ?? undefined, loginTerakhir: r.login_terakhir ?? undefined }
}

/**
 * Satu jalur login untuk ketiga peran. `kunci` dipakai untuk membatasi
 * percobaan gagal (maks 5 / 15 menit per nomor urut atau per username).
 */
async function prosesLogin(
  env: Env,
  cors: Headers,
  kunci: string,
  noUrutLog: number,
  row: BarisAkun | null,
  rahasia: string,
  pesanSalah: string,
): Promise<Response> {
  const batasWaktu = new Date(Date.now() - JENDELA_PERCOBAAN_MENIT * 60_000).toISOString()
  const percobaan = await env.DB.prepare('SELECT COUNT(*) as n FROM login_attempts WHERE kunci = ? AND waktu > ?')
    .bind(kunci, batasWaktu)
    .first<{ n: number }>()
  if ((percobaan?.n ?? 0) >= MAKS_PERCOBAAN_LOGIN) {
    return err(cors, 429, 'Terlalu banyak percobaan gagal. Coba lagi dalam beberapa menit.')
  }

  const cocok = row ? await cocokkanRahasia(row.id, rahasia, row.pin_hash) : false
  if (!row || !cocok) {
    await env.DB.prepare('INSERT INTO login_attempts (no_urut, kunci, waktu) VALUES (?, ?, ?)')
      .bind(noUrutLog, kunci, new Date().toISOString())
      .run()
    return err(cors, 401, pesanSalah)
  }
  if (!row.aktif) return err(cors, 403, 'Akun ini sedang dinonaktifkan. Hubungi tim IRIS.')

  const sekarang = new Date().toISOString()
  // Hash format lama (sha256 polos) di-upgrade ke PBKDF2 begitu PIN-nya terbukti benar.
  const upgrade = row.pin_hash.startsWith('pbkdf2$') ? null : await hashRahasia(rahasia)
  await env.DB.prepare('UPDATE warga_auth SET login_terakhir = ?, pin_hash = COALESCE(?, pin_hash) WHERE id = ?')
    .bind(sekarang, upgrade, row.id)
    .run()

  const payload: TokenPayload = {
    id: row.id,
    noUrut: row.no_urut,
    peran: row.peran,
    v: row.token_versi,
    exp: Math.floor(Date.now() / 1000) + UMUR_TOKEN_DETIK,
  }
  const token = await buatToken(payload, env.AUTH_TOKEN_SECRET)
  return json(cors, 200, { token, warga: profilKeJson(row) })
}

/** Nama singkat untuk kolom reviewer, mis. "Dr. Amaliah — Tim IRIS" → "Dr. Amaliah". */
function namaSingkat(nama: string): string {
  return nama.split(' — ')[0].trim()
}

function inisialDari(nama: string): string {
  const kata = nama.replace(/\(.*?\)/g, '').split(/[\s.]+/).filter((k) => /^[A-Za-z]/.test(k))
  return ((kata[0]?.[0] ?? '?') + (kata.length > 1 ? kata[kata.length - 1][0] : kata[0]?.[1] ?? '')).toUpperCase()
}

/** PIN warga: 6–8 digit, bukan angka kembar/berurutan (111111, 123456, 987654). */
function cekPinBaru(pin: string): string | null {
  if (!/^\d{6,8}$/.test(pin)) return 'PIN baru harus 6–8 angka.'
  const d = [...pin].map(Number)
  const langkah = d.slice(1).map((x, i) => x - d[i])
  if (langkah.every((x) => x === 0) || langkah.every((x) => x === 1) || langkah.every((x) => x === -1)) {
    return 'PIN terlalu mudah ditebak (angka kembar/berurutan). Pilih yang lain.'
  }
  return null
}

function cekKataSandiBaru(sandi: string, username: string | null): string | null {
  if (sandi.length < 8) return 'Kata sandi baru minimal 8 karakter.'
  if (sandi.length > 128) return 'Kata sandi terlalu panjang (maks 128).'
  const nama = username?.split('@')[0] ?? ''
  if (nama.length >= 3 && sandi.toLowerCase().includes(nama)) return 'Kata sandi jangan memuat username/email Anda.'
  return null
}

// Username peneliti/admin — boleh berupa alamat email.
const USERNAME_VALID = /^[a-z0-9._+@-]{3,64}$/
const PESAN_USERNAME = 'Username/email 3–64 karakter: huruf kecil, angka, titik, strip, @.'

/** Peneliti/admin tidak ikut rotasi; nomor urut cuma pengisi unik (9001+ / 1+). */
async function noUrutBerikutnya(env: Env, peran: Peran): Promise<number> {
  const maks = await env.DB.prepare('SELECT MAX(no_urut) AS m FROM warga_auth WHERE peran = ?')
    .bind(peran)
    .first<{ m: number | null }>()
  return Math.max(maks?.m ?? 0, peran === 'peneliti' ? 9000 : 0) + 1
}

const WARNA_AVATAR = ['#2F5D3A', '#B0623B', '#2C5F91', '#6C4A70', '#B98A2E', '#2E7D74', '#A8455B', '#4A5560']
const STATUS_VALID = ['aman', 'waspada', 'bahaya']

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url)
    const cors = headerCors(request.headers.get('Origin'))

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: cors })
    }

    // === AUTH ================================================================

    // Masyarakat: nomor urut responden + PIN. /auth/login dipertahankan sebagai
    // alias supaya versi aplikasi lama yang sudah terpasang di HP tetap bisa masuk.
    if (request.method === 'POST' && (url.pathname === '/auth/masyarakat' || url.pathname === '/auth/login')) {
      const body = (await request.json().catch(() => null)) as { noUrut?: number; pin?: string } | null
      const noUrut = body?.noUrut
      const pin = body?.pin
      if (typeof noUrut !== 'number' || typeof pin !== 'string' || pin.length === 0) {
        return err(cors, 400, 'Nomor urut dan PIN wajib diisi.')
      }
      const row = await env.DB.prepare("SELECT * FROM warga_auth WHERE no_urut = ? AND peran = 'warga'")
        .bind(noUrut)
        .first<BarisAkun>()
      return prosesLogin(env, cors, `no:${noUrut}`, noUrut, row, pin, 'Nomor urut atau PIN salah.')
    }

    // Peneliti & admin: username + kata sandi, masing-masing lewat pintunya
    // sendiri — akun peneliti tidak bisa masuk lewat /auth/admin, dan sebaliknya.
    const loginUsername = url.pathname.match(/^\/auth\/(peneliti|admin)$/)
    if (request.method === 'POST' && loginUsername) {
      const peran = loginUsername[1] as Peran
      const body = (await request.json().catch(() => null)) as { username?: string; password?: string } | null
      const username = body?.username?.trim().toLowerCase()
      const password = body?.password
      if (!username || typeof password !== 'string' || password.length === 0) {
        return err(cors, 400, 'Username dan kata sandi wajib diisi.')
      }
      const row = await env.DB.prepare('SELECT * FROM warga_auth WHERE username = ? AND peran = ?')
        .bind(username, peran)
        .first<BarisAkun>()
      return prosesLogin(env, cors, `u:${username}`, -1, row, password, 'Username atau kata sandi salah.')
    }

    // Cek sesi saat aplikasi dibuka — 401 berarti token kedaluwarsa, PIN
    // direset, atau akun dinonaktifkan admin.
    if (request.method === 'GET' && url.pathname === '/auth/saya') {
      const akun = await wargaDariRequest(request, env)
      if (!akun) return err(cors, 401, SESI_TIDAK_VALID)
      const row = await env.DB.prepare('SELECT * FROM warga_auth WHERE id = ?').bind(akun.id).first<BarisAkun>()
      return json(cors, 200, profilKeJson(row!))
    }

    // Ganti PIN/kata sandi sendiri (semua peran). Wajib menyertakan sandi lama.
    // Sesi lain dicabut (token_versi naik), perangkat ini dapat token baru.
    if (request.method === 'POST' && url.pathname === '/auth/ganti-rahasia') {
      const akun = await wargaDariRequest(request, env)
      if (!akun) return err(cors, 401, SESI_TIDAK_VALID)
      const b = (await request.json().catch(() => null)) as { lama?: string; baru?: string } | null
      if (typeof b?.lama !== 'string' || typeof b?.baru !== 'string' || !b.lama || !b.baru) {
        return err(cors, 400, 'Isi sandi lama dan sandi baru.')
      }
      const row = await env.DB.prepare('SELECT * FROM warga_auth WHERE id = ?').bind(akun.id).first<BarisAkun>()
      if (!row) return err(cors, 401, SESI_TIDAK_VALID)

      const kunci = `ganti:${row.id}`
      const batasWaktu = new Date(Date.now() - JENDELA_PERCOBAAN_MENIT * 60_000).toISOString()
      const percobaan = await env.DB.prepare('SELECT COUNT(*) as n FROM login_attempts WHERE kunci = ? AND waktu > ?')
        .bind(kunci, batasWaktu)
        .first<{ n: number }>()
      if ((percobaan?.n ?? 0) >= MAKS_PERCOBAAN_LOGIN) {
        return err(cors, 429, 'Terlalu banyak percobaan gagal. Coba lagi dalam beberapa menit.')
      }
      if (!(await cocokkanRahasia(row.id, b.lama, row.pin_hash))) {
        await env.DB.prepare('INSERT INTO login_attempts (no_urut, kunci, waktu) VALUES (?, ?, ?)')
          .bind(-1, kunci, new Date().toISOString())
          .run()
        return err(cors, 401, row.peran === 'warga' ? 'PIN lama salah.' : 'Kata sandi lama salah.')
      }

      const masalah = row.peran === 'warga' ? cekPinBaru(b.baru) : cekKataSandiBaru(b.baru, row.username)
      if (masalah) return err(cors, 400, masalah)
      if (b.baru === b.lama) return err(cors, 400, 'Sandi baru harus berbeda dari yang lama.')

      await env.DB.prepare('UPDATE warga_auth SET pin_hash = ?, token_versi = token_versi + 1 WHERE id = ?')
        .bind(await hashRahasia(b.baru), row.id)
        .run()
      const token = await buatToken(
        {
          id: row.id,
          noUrut: row.no_urut,
          peran: row.peran,
          v: row.token_versi + 1,
          exp: Math.floor(Date.now() / 1000) + UMUR_TOKEN_DETIK,
        },
        env.AUTH_TOKEN_SECRET,
      )
      return json(cors, 200, { token, warga: profilKeJson(row) })
    }

    // Direktori publik (nama/avatar/kelurahan) — pengganti daftar WARGA yang
    // sebelumnya cuma ditulis tetap di src/data/seed.ts. Akun admin tidak ikut.
    if (request.method === 'GET' && url.pathname === '/warga') {
      const { results } = await env.DB.prepare(
        "SELECT * FROM warga_auth WHERE peran != 'admin' ORDER BY peran DESC, no_urut ASC",
      ).all<BarisAkun>()
      return json(cors, 200, (results ?? []).map(profilKeJson))
    }

    // === UPLOAD FOTO (wajib login) ===========================================

    if (request.method === 'POST' && url.pathname === '/upload') {
      const warga = await wargaDariRequest(request, env)
      if (!warga) return err(cors, 401, 'Sesi login tidak valid atau sudah habis. Masuk ulang.')

      const contentType = request.headers.get('Content-Type') ?? ''
      if (!contentType.startsWith('image/')) {
        return err(cors, 400, 'Tipe file harus gambar (image/jpeg atau image/png).')
      }
      const body = await request.arrayBuffer()
      if (body.byteLength === 0) return err(cors, 400, 'File kosong.')
      if (body.byteLength > MAKS_BYTE_FOTO) return err(cors, 413, 'File terlalu besar (maksimal 8MB).')

      const ekstensi = contentType === 'image/png' ? 'png' : 'jpg'
      const kunci = `laporan/${crypto.randomUUID()}.${ekstensi}`
      await env.FOTO_BUCKET.put(kunci, body, { httpMetadata: { contentType } })

      return json(cors, 200, { key: kunci, url: `${url.origin}/foto/${kunci}` })
    }

    if (request.method === 'GET' && url.pathname.startsWith('/foto/')) {
      const kunci = decodeURIComponent(url.pathname.slice('/foto/'.length))
      const objek = await env.FOTO_BUCKET.get(kunci)
      if (!objek) return new Response('Foto tidak ditemukan.', { status: 404, headers: cors })
      const h = new Headers(cors)
      objek.writeHttpMetadata(h)
      h.set('etag', objek.httpEtag)
      h.set('Cache-Control', 'public, max-age=31536000, immutable')
      return new Response(objek.body, { headers: h })
    }

    // === LAPORAN ==============================================================

    if (request.method === 'GET' && url.pathname === '/laporan') {
      // ?limit= dipakai Panel (maks 2000) supaya antrian verifikasi tidak terpotong.
      const limit = Math.min(Math.max(Number(url.searchParams.get('limit')) || 200, 1), 2000)
      const { results } = await env.DB.prepare('SELECT * FROM laporan ORDER BY waktu_upload DESC LIMIT ?')
        .bind(limit)
        .all<Record<string, unknown>>()
      return json(cors, 200, (results ?? []).map(laporanKeJson))
    }

    if (request.method === 'POST' && url.pathname === '/laporan') {
      const warga = await wargaDariRequest(request, env)
      if (!warga) return err(cors, 401, 'Sesi login tidak valid atau sudah habis. Masuk ulang.')

      const b = await request.json().catch(() => null) as Record<string, unknown> | null
      if (!b || typeof b.titikId !== 'string' || typeof b.statusPelapor !== 'string') {
        return err(cors, 400, 'Data laporan tidak lengkap.')
      }

      const id = `lp-${crypto.randomUUID()}`
      const waktuUpload = new Date().toISOString()
      await env.DB.prepare(
        `INSERT INTO laporan
          (id, warga_id, titik_id, no_urut_hari, foto_url, foto_asli_nama, foto_dari_raw,
           lat, lng, koordinat_dari_exif, waktu_upload, status_pelapor, status_verifikasi, darurat)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'menunggu', ?)`,
      ).bind(
        id,
        warga.id,
        b.titikId,
        Number(b.noUrutHari ?? 0),
        typeof b.fotoUrl === 'string' ? b.fotoUrl : null,
        typeof b.fotoAsliNama === 'string' ? b.fotoAsliNama : null,
        b.fotoDariRaw ? 1 : 0,
        Number(b.lat ?? 0),
        Number(b.lng ?? 0),
        b.koordinatDariExif ? 1 : 0,
        waktuUpload,
        b.statusPelapor,
        b.darurat ? 1 : 0,
      ).run()

      const row = await env.DB.prepare('SELECT * FROM laporan WHERE id = ?').bind(id).first<Record<string, unknown>>()
      return json(cors, 201, laporanKeJson(row!))
    }

    const sukaMatch = url.pathname.match(/^\/laporan\/([^/]+)\/suka$/)
    if (request.method === 'POST' && sukaMatch) {
      const warga = await wargaDariRequest(request, env)
      if (!warga) return err(cors, 401, 'Sesi login tidak valid atau sudah habis. Masuk ulang.')
      const laporanId = sukaMatch[1]

      const sudah = await env.DB.prepare(
        'SELECT 1 FROM suka_laporan WHERE laporan_id = ? AND warga_id = ?',
      ).bind(laporanId, warga.id).first()

      if (sudah) {
        await env.DB.batch([
          env.DB.prepare('DELETE FROM suka_laporan WHERE laporan_id = ? AND warga_id = ?').bind(laporanId, warga.id),
          env.DB.prepare('UPDATE laporan SET jumlah_suka = MAX(0, jumlah_suka - 1) WHERE id = ?').bind(laporanId),
        ])
      } else {
        await env.DB.batch([
          env.DB.prepare('INSERT INTO suka_laporan (laporan_id, warga_id) VALUES (?, ?)').bind(laporanId, warga.id),
          env.DB.prepare('UPDATE laporan SET jumlah_suka = jumlah_suka + 1 WHERE id = ?').bind(laporanId),
        ])
      }

      const row = await env.DB.prepare('SELECT jumlah_suka FROM laporan WHERE id = ?')
        .bind(laporanId)
        .first<{ jumlah_suka: number }>()
      return json(cors, 200, { sukaSaya: !sudah, jumlahSuka: row?.jumlah_suka ?? 0 })
    }

    // === KOMENTAR ==============================================================

    if (request.method === 'GET' && url.pathname === '/komentar') {
      const laporanId = url.searchParams.get('laporanId')
      const stmt = laporanId
        ? env.DB.prepare('SELECT * FROM komentar WHERE laporan_id = ? ORDER BY waktu ASC').bind(laporanId)
        : env.DB.prepare('SELECT * FROM komentar ORDER BY waktu ASC LIMIT 500')
      const { results } = await stmt.all<Record<string, unknown>>()
      return json(cors, 200, (results ?? []).map(komentarKeJson))
    }

    if (request.method === 'POST' && url.pathname === '/komentar') {
      const warga = await wargaDariRequest(request, env)
      if (!warga) return err(cors, 401, 'Sesi login tidak valid atau sudah habis. Masuk ulang.')

      const b = await request.json().catch(() => null) as Record<string, unknown> | null
      if (!b || typeof b.laporanId !== 'string' || typeof b.teks !== 'string' || !b.teks.trim()) {
        return err(cors, 400, 'Komentar tidak boleh kosong.')
      }

      const id = `km-${crypto.randomUUID()}`
      const waktu = new Date().toISOString()
      await env.DB.batch([
        env.DB.prepare(
          'INSERT INTO komentar (id, laporan_id, warga_id, teks, waktu, mention) VALUES (?, ?, ?, ?, ?, ?)',
        ).bind(id, b.laporanId, warga.id, b.teks, waktu, typeof b.mention === 'string' ? b.mention : null),
        env.DB.prepare('UPDATE laporan SET jumlah_komentar = jumlah_komentar + 1 WHERE id = ?').bind(b.laporanId),
      ])

      const row = await env.DB.prepare('SELECT * FROM komentar WHERE id = ?').bind(id).first<Record<string, unknown>>()
      return json(cors, 201, komentarKeJson(row!))
    }

    // === PANEL: PENELITI + ADMIN ==============================================

    if (request.method === 'GET' && url.pathname === '/panel/ringkasan') {
      const tolak = tolakKecuali(cors, await wargaDariRequest(request, env), 'peneliti', 'admin')
      if (tolak) return tolak
      const sehariLalu = new Date(Date.now() - 24 * 3_600_000).toISOString()
      const [lap, akun, kom] = await env.DB.batch([
        env.DB.prepare(
          `SELECT COUNT(*) AS total,
                  SUM(status_verifikasi = 'menunggu') AS menunggu,
                  SUM(waktu_upload > ?1) AS sehari,
                  SUM(waktu_upload > ?1 AND COALESCE(status_terverifikasi, status_pelapor) = 'bahaya') AS bahaya_sehari,
                  SUM(darurat = 1 AND status_verifikasi = 'menunggu') AS darurat_menunggu
           FROM laporan`,
        ).bind(sehariLalu),
        env.DB.prepare(
          `SELECT SUM(peran = 'warga' AND aktif = 1) AS warga, SUM(peran = 'peneliti' AND aktif = 1) AS peneliti,
                  SUM(aktif = 0) AS nonaktif FROM warga_auth`,
        ),
        env.DB.prepare('SELECT COUNT(*) AS total FROM komentar'),
      ])
      const l = (lap.results?.[0] ?? {}) as Record<string, number | null>
      const a = (akun.results?.[0] ?? {}) as Record<string, number | null>
      const k = (kom.results?.[0] ?? {}) as Record<string, number | null>
      return json(cors, 200, {
        laporanTotal: l.total ?? 0,
        laporanMenunggu: l.menunggu ?? 0,
        laporan24Jam: l.sehari ?? 0,
        bahaya24Jam: l.bahaya_sehari ?? 0,
        daruratMenunggu: l.darurat_menunggu ?? 0,
        wargaAktif: a.warga ?? 0,
        penelitiAktif: a.peneliti ?? 0,
        akunNonaktif: a.nonaktif ?? 0,
        komentarTotal: k.total ?? 0,
      })
    }

    // Verifikasi 3-klik: sama / dikoreksi (+ status koreksi) + teks rekomendasi.
    // Nama reviewer diambil dari akun di token, bukan dari body.
    const verifMatch = url.pathname.match(/^\/laporan\/([^/]+)\/verifikasi$/)
    if (request.method === 'POST' && verifMatch) {
      const akun = await wargaDariRequest(request, env)
      const tolak = tolakKecuali(cors, akun, 'peneliti', 'admin')
      if (tolak) return tolak
      const laporanId = verifMatch[1]
      const b = (await request.json().catch(() => null)) as {
        statusVerifikasi?: string
        statusTerverifikasi?: string
        rekomendasiTeks?: string
        sematkanKomentar?: boolean
      } | null
      if (!b || (b.statusVerifikasi !== 'sama' && b.statusVerifikasi !== 'dikoreksi')) {
        return err(cors, 400, 'Pilih hasil verifikasi: sama atau dikoreksi.')
      }
      const lama = await env.DB.prepare('SELECT status_pelapor FROM laporan WHERE id = ?')
        .bind(laporanId)
        .first<{ status_pelapor: string }>()
      if (!lama) return err(cors, 404, 'Laporan tidak ditemukan.')
      const statusAkhir = b.statusVerifikasi === 'sama' ? lama.status_pelapor : b.statusTerverifikasi
      if (!statusAkhir || !STATUS_VALID.includes(statusAkhir)) {
        return err(cors, 400, 'Status koreksi harus aman, waspada, atau bahaya.')
      }
      if (b.statusVerifikasi === 'dikoreksi' && statusAkhir === lama.status_pelapor) {
        return err(cors, 400, 'Status koreksi sama dengan status pelapor — pilih "Sesuai" saja.')
      }
      const rekomendasi = b.rekomendasiTeks?.trim() || null
      const sekarang = new Date().toISOString()

      const langkah = [
        env.DB.prepare(
          `UPDATE laporan SET status_verifikasi = ?, status_terverifikasi = ?, rekomendasi_teks = ?,
             reviewer_nama = ?, waktu_review = ? WHERE id = ?`,
        ).bind(b.statusVerifikasi, statusAkhir, rekomendasi, namaSingkat(akun!.nama), sekarang, laporanId),
      ]
      // Opsional: tampilkan rekomendasinya juga sebagai komentar tersemat
      // "Rekomendasi Resmi" di thread diskusi laporan tersebut.
      if (b.sematkanKomentar && rekomendasi) {
        langkah.push(
          env.DB.prepare(
            'INSERT INTO komentar (id, laporan_id, warga_id, teks, waktu, disematkan) VALUES (?, ?, ?, ?, ?, 1)',
          ).bind(`km-${crypto.randomUUID()}`, laporanId, akun!.id, `Rekomendasi Resmi: ${rekomendasi}`, sekarang),
          env.DB.prepare('UPDATE laporan SET jumlah_komentar = jumlah_komentar + 1 WHERE id = ?').bind(laporanId),
        )
      }
      await env.DB.batch(langkah)
      const row = await env.DB.prepare('SELECT * FROM laporan WHERE id = ?').bind(laporanId).first<Record<string, unknown>>()
      return json(cors, 200, laporanKeJson(row!))
    }

    const sematMatch = url.pathname.match(/^\/komentar\/([^/]+)\/sematkan$/)
    if (request.method === 'POST' && sematMatch) {
      const tolak = tolakKecuali(cors, await wargaDariRequest(request, env), 'peneliti', 'admin')
      if (tolak) return tolak
      await env.DB.prepare('UPDATE komentar SET disematkan = 1 - disematkan WHERE id = ?').bind(sematMatch[1]).run()
      const row = await env.DB.prepare('SELECT * FROM komentar WHERE id = ?').bind(sematMatch[1]).first<Record<string, unknown>>()
      if (!row) return err(cors, 404, 'Komentar tidak ditemukan.')
      return json(cors, 200, komentarKeJson(row))
    }

    // === ADMIN: KELOLA AKUN & MODERASI ========================================

    if (url.pathname.startsWith('/admin/')) {
      const admin = await wargaDariRequest(request, env)
      const tolak = tolakKecuali(cors, admin, 'admin')
      if (tolak) return tolak

      if (request.method === 'GET' && url.pathname === '/admin/akun') {
        const { results } = await env.DB.prepare('SELECT * FROM warga_auth ORDER BY peran ASC, no_urut ASC').all<BarisAkun>()
        return json(cors, 200, (results ?? []).map(akunKeJson))
      }

      // Buat akun baru. PIN/kata sandi dibuat server secara acak dan HANYA
      // dikembalikan sekali di respons ini — tidak bisa dilihat lagi sesudahnya.
      if (request.method === 'POST' && url.pathname === '/admin/akun') {
        const b = (await request.json().catch(() => null)) as Record<string, unknown> | null
        const peran = b?.peran as Peran | undefined
        const nama = typeof b?.nama === 'string' ? b.nama.trim() : ''
        if (!peran || !['warga', 'peneliti', 'admin'].includes(peran)) return err(cors, 400, 'Peran tidak valid.')
        if (!nama) return err(cors, 400, 'Nama wajib diisi.')

        let noUrut: number
        let username: string | null = null
        if (peran === 'warga') {
          noUrut = Number(b?.noUrut)
          if (!Number.isInteger(noUrut) || noUrut < 1 || noUrut > 40) {
            return err(cors, 400, 'Nomor urut responden harus 1–40 (rotasi 40 hari).')
          }
          if (typeof b?.titikId !== 'string' || !b.titikId) return err(cors, 400, 'Titik pantau wajib dipilih.')
        } else {
          username = typeof b?.username === 'string' ? b.username.trim().toLowerCase() : ''
          if (!USERNAME_VALID.test(username)) return err(cors, 400, PESAN_USERNAME)
          noUrut = await noUrutBerikutnya(env, peran)
        }

        const id = `${peran === 'warga' ? 'w' : peran === 'peneliti' ? 'p' : 'adm'}-${crypto.randomUUID().slice(0, 8)}`
        const rahasia = peran === 'warga' ? buatPin() : buatKataSandi()
        try {
          await env.DB.prepare(
            `INSERT INTO warga_auth (id, no_urut, peran, pin_hash, nama, username, inisial, warna, kelurahan, titik_id, aktif, token_versi, dibuat)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 0, ?)`,
          ).bind(
            id,
            noUrut,
            peran,
            await hashRahasia(rahasia),
            nama,
            username,
            inisialDari(nama),
            WARNA_AVATAR[Math.floor(Math.random() * WARNA_AVATAR.length)],
            typeof b?.kelurahan === 'string' && b.kelurahan.trim() ? b.kelurahan.trim() : peran === 'warga' ? '-' : 'Tim IRIS',
            typeof b?.titikId === 'string' && b.titikId ? b.titikId : null,
            new Date().toISOString(),
          ).run()
        } catch {
          return err(cors, 409, peran === 'warga' ? `Nomor urut ${noUrut} sudah dipakai warga lain.` : `Username "${username}" sudah dipakai.`)
        }
        const row = await env.DB.prepare('SELECT * FROM warga_auth WHERE id = ?').bind(id).first<BarisAkun>()
        return json(cors, 201, { akun: akunKeJson(row!), rahasia })
      }

      const akunMatch = url.pathname.match(/^\/admin\/akun\/([^/]+)(\/reset)?$/)
      if (akunMatch) {
        const id = akunMatch[1]
        const row = await env.DB.prepare('SELECT * FROM warga_auth WHERE id = ?').bind(id).first<BarisAkun>()
        if (!row) return err(cors, 404, 'Akun tidak ditemukan.')

        // Reset PIN/kata sandi: rahasia baru + naikkan token_versi supaya
        // semua sesi lama (mis. HP yang hilang) langsung keluar.
        if (request.method === 'POST' && akunMatch[2]) {
          const rahasia = row.peran === 'warga' ? buatPin() : buatKataSandi()
          // Reset akun sendiri = ganti kata sandi; sesi yang sedang dipakai tetap
          // jalan supaya kata sandi baru sempat dicatat sebelum keluar.
          await env.DB.prepare('UPDATE warga_auth SET pin_hash = ?, token_versi = token_versi + ? WHERE id = ?')
            .bind(await hashRahasia(rahasia), id === admin!.id ? 0 : 1, id)
            .run()
          return json(cors, 200, { rahasia })
        }

        if (request.method === 'PATCH' && !akunMatch[2]) {
          const b = (await request.json().catch(() => null)) as Record<string, unknown> | null
          if (!b) return err(cors, 400, 'Data tidak valid.')
          if (id === admin!.id && b.aktif === false) return err(cors, 400, 'Tidak bisa menonaktifkan akun Anda sendiri.')

          // Ganti peran (mis. masyarakat → peneliti). Cara masuknya ikut berubah
          // (nomor urut + PIN ↔ username + kata sandi), jadi kredensial baru
          // dibuat dan semua sesi lama dicabut.
          const peranBaru = (b.peran ?? row.peran) as Peran
          if (!['warga', 'peneliti', 'admin'].includes(peranBaru)) return err(cors, 400, 'Peran tidak valid.')
          const gantiPeran = peranBaru !== row.peran
          if (gantiPeran && id === admin!.id) return err(cors, 400, 'Tidak bisa mengubah peran akun Anda sendiri.')

          const nama = typeof b.nama === 'string' && b.nama.trim() ? b.nama.trim() : row.nama
          let noUrut = row.no_urut
          let username = row.username
          let titikId = typeof b.titikId === 'string' ? b.titikId || null : row.titik_id
          if (peranBaru === 'warga') {
            if (b.noUrut !== undefined || gantiPeran) {
              noUrut = Number(b.noUrut)
              if (!Number.isInteger(noUrut) || noUrut < 1 || noUrut > 40) return err(cors, 400, 'Nomor urut harus 1–40.')
            }
            if (gantiPeran && !titikId) return err(cors, 400, 'Titik pantau wajib dipilih untuk akun masyarakat.')
            // Masyarakat masuk pakai nomor urut; username/email lamanya dilepas.
            if (gantiPeran) username = null
          } else {
            if (typeof b.username === 'string' && b.username.trim()) username = b.username.trim().toLowerCase()
            if (!username || !USERNAME_VALID.test(username)) return err(cors, 400, PESAN_USERNAME)
            if (gantiPeran) noUrut = await noUrutBerikutnya(env, peranBaru)
          }
          const rahasia = gantiPeran ? (peranBaru === 'warga' ? buatPin() : buatKataSandi()) : null
          const aktif = typeof b.aktif === 'boolean' ? (b.aktif ? 1 : 0) : row.aktif
          try {
            await env.DB.prepare(
              `UPDATE warga_auth SET peran = ?, nama = ?, inisial = ?, no_urut = ?, username = ?, kelurahan = ?, titik_id = ?,
                 aktif = ?, pin_hash = COALESCE(?, pin_hash), token_versi = token_versi + ? WHERE id = ?`,
            ).bind(
              peranBaru,
              nama,
              nama !== row.nama ? inisialDari(nama ?? id) : row.inisial,
              noUrut,
              username,
              typeof b.kelurahan === 'string' ? b.kelurahan.trim() || '-' : row.kelurahan,
              titikId,
              aktif,
              rahasia ? await hashRahasia(rahasia) : null,
              // Menonaktifkan / ganti peran = cabut semua sesi yang sedang berjalan.
              (row.aktif && !aktif) || gantiPeran ? 1 : 0,
              id,
            ).run()
          } catch {
            return err(
              cors,
              409,
              peranBaru === 'warga' ? `Nomor urut ${noUrut} sudah dipakai warga lain.` : `Username "${username}" sudah dipakai.`,
            )
          }
          const baru = await env.DB.prepare('SELECT * FROM warga_auth WHERE id = ?').bind(id).first<BarisAkun>()
          return json(cors, 200, { ...akunKeJson(baru!), ...(rahasia ? { rahasiaBaru: rahasia } : {}) })
        }
      }

      // Hapus laporan (moderasi): ikut hapus komentar, suka, dan fotonya di R2.
      const hapusLapMatch = url.pathname.match(/^\/admin\/laporan\/([^/]+)$/)
      if (request.method === 'DELETE' && hapusLapMatch) {
        const id = hapusLapMatch[1]
        const row = await env.DB.prepare('SELECT foto_url FROM laporan WHERE id = ?').bind(id).first<{ foto_url: string | null }>()
        if (!row) return err(cors, 404, 'Laporan tidak ditemukan.')
        await env.DB.batch([
          env.DB.prepare('DELETE FROM komentar WHERE laporan_id = ?').bind(id),
          env.DB.prepare('DELETE FROM suka_laporan WHERE laporan_id = ?').bind(id),
          env.DB.prepare('DELETE FROM laporan WHERE id = ?').bind(id),
        ])
        const kunciFoto = row.foto_url?.split('/foto/')[1]
        if (kunciFoto) await env.FOTO_BUCKET.delete(decodeURIComponent(kunciFoto))
        return json(cors, 200, { ok: true })
      }

      const hapusKomMatch = url.pathname.match(/^\/admin\/komentar\/([^/]+)$/)
      if (request.method === 'DELETE' && hapusKomMatch) {
        const id = hapusKomMatch[1]
        const row = await env.DB.prepare('SELECT laporan_id FROM komentar WHERE id = ?').bind(id).first<{ laporan_id: string }>()
        if (!row) return err(cors, 404, 'Komentar tidak ditemukan.')
        await env.DB.batch([
          env.DB.prepare('DELETE FROM komentar WHERE id = ?').bind(id),
          env.DB.prepare('UPDATE laporan SET jumlah_komentar = MAX(0, jumlah_komentar - 1) WHERE id = ?').bind(row.laporan_id),
        ])
        return json(cors, 200, { ok: true })
      }

      return err(cors, 404, 'Endpoint admin tidak dikenal.')
    }

    return new Response('IRIS-I — Worker backend (R2 + D1).', { status: 200, headers: cors })
  },
}
