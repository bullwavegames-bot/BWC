const CLUB_ORIGIN = (import.meta.env.VITE_API_URL || 'https://bwc-wgbu.onrender.com').replace(/\/$/, '')

function sameOriginApi() {
  if (typeof window === 'undefined') return false
  const host = window.location.hostname
  return host === 'localhost' || host === '127.0.0.1' || host.endsWith('.vercel.app')
}

const useSiteProxy = sameOriginApi()
const BASE = useSiteProxy ? '' : CLUB_ORIGIN
const OTP_BASE = useSiteProxy
  ? ''
  : (import.meta.env.VITE_OTP_API_URL || CLUB_ORIGIN).replace(/\/$/, '')

function fail(res, data, fallback) {
  const msg = data.error || data.message || data.msg
  if (msg && msg !== 'Not Found') return new Error(msg)
  if (res.status === 404) {
    return new Error('This API has no OTP route. Confirm the app is using https://bwc-wgbu.onrender.com and restart Vite.')
  }
  return new Error(fallback)
}

export async function sendOtp(phone) {
  const res = await fetch(`${OTP_BASE}/api/otp/send`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone }),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw fail(res, data, 'Could not send OTP')
  return data
}

export async function verifyOtp(phone, otp) {
  const res = await fetch(`${OTP_BASE}/api/otp/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone, otp }),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw fail(res, data, 'Could not verify OTP')
  return data
}

export async function loginWithPhoneOtp(phone, otp) {
  const res = await fetch(`${OTP_BASE}/api/otp/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone, otp }),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw fail(res, data, 'Could not log in with this OTP')
  return data
}

export async function api(path, { method = 'GET', body, token } = {}) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error || data.message || 'Request failed')
  return data
}

export function mapAccount(data, extra = {}) {
  const profile = data.profile || data.user || {}
  const wallet = data.wallet || {}
  return {
    id: profile.id || extra.id,
    email: profile.email || extra.email || '',
    phone: profile.phone || extra.phone || '',
    username: profile.username || extra.username || '',
    balance: Number(wallet.total ?? wallet.cash ?? profile.balance ?? extra.balance ?? 0),
    bonus: wallet.bonus ?? profile.bonus ?? extra.bonus ?? 0,
    vipLevel: profile.vipLevel || 1,
    accountNumber: profile.accountNumber || extra.accountNumber || '',
    createdAt: profile.createdAt || extra.createdAt,
  }
}

export function saveSession(token, user) {
  localStorage.setItem('bwc_token', token)
  localStorage.setItem('bwc_user', JSON.stringify(user))
}

export function clearSession() {
  localStorage.removeItem('bwc_token')
  localStorage.removeItem('bwc_user')
}

export function loadSession() {
  const token = localStorage.getItem('bwc_token')
  const raw = localStorage.getItem('bwc_user')
  return { token, user: raw ? JSON.parse(raw) : null }
}

export function gameHue(slug = '') {
  let n = 0
  for (const ch of slug) n = (n + ch.charCodeAt(0) * 13) % 360
  return n
}

export function mapClubGame(game) {
  const genre = String(game.genre || '').toLowerCase()
  let cat = 'instant'
  if (genre.includes('card') || genre.includes('board') || genre.includes('party')) cat = 'live'
  if (genre.includes('puzzle') || genre.includes('trivia')) cat = 'slots'
  if (genre.includes('strategy') || genre.includes('sim')) cat = 'virtual'
  if (genre.includes('quiz') || genre.includes('trivia')) cat = 'tv'
  return {
    id: game.slug,
    name: game.title,
    cat,
    hue: gameHue(game.slug),
    cover: game.cover ? `${CLUB_ORIGIN}${game.cover}` : null,
    genre: game.genre,
  }
}
