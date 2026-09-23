const RENDER_API = 'https://bwc-wgbu.onrender.com'

export function readAdminKey(req) {
  const header = String(req.headers['x-admin-key'] || '').trim()
  if (header) return header
  const auth = String(req.headers.authorization || '').trim()
  if (/^Admin\s+/i.test(auth)) return auth.replace(/^Admin\s+/i, '').trim()
  const bodyKey = req.body?.adminKey
  if (bodyKey) return String(bodyKey).trim()
  return ''
}

export async function proxyRender(path, req) {
  const headers = { 'Content-Type': 'application/json' }
  const incomingAuth = String(req.headers?.authorization || '')
  if (incomingAuth) headers.Authorization = incomingAuth
  const adminKey = readAdminKey(req)
  if (adminKey) {
    headers['x-admin-key'] = adminKey
    if (!incomingAuth || /^Admin\s+/i.test(incomingAuth)) {
      headers.Authorization = `Admin ${adminKey}`
    }
  }
  const res = await fetch(`${RENDER_API}${path}`, {
    method: req.method || 'GET',
    headers,
    body: req.method === 'GET' || req.method === 'HEAD' ? undefined : JSON.stringify(req.body ?? {}),
  })
  const text = await res.text()
  let data = {}
  try {
    data = text ? JSON.parse(text) : {}
  } catch {
    data = { error: text.slice(0, 180) || `Render ${res.status}` }
  }
  return { status: res.status, data }
}

export function staffEmails() {
  return String(process.env.SUPER_ADMIN_EMAILS || '')
    .split(/[,;\n]+/)
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean)
}

export function staffIds() {
  return String(process.env.SUPER_ADMIN_USER_IDS || '')
    .split(/[,;\n]+/)
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean)
}

export function isAllowlistedProfile(user) {
  if (!user) return false
  const email = String(user.email || '').toLowerCase()
  if (email && staffEmails().includes(email)) return true
  const marks = [user.id, user.playerId, user.accountNumber].map((item) => String(item || '').toLowerCase())
  return marks.some((mark) => mark && staffIds().includes(mark))
}

export async function legacyAdminMe(req) {
  const key = readAdminKey(req)
  if (key) {
    const probe = await proxyRender('/api/admin/players?q=', {
      method: 'GET',
      headers: {
        'x-admin-key': key,
        authorization: `Admin ${key}`,
      },
    })
    if (probe.status === 401 || probe.status === 403) {
      return { status: probe.status, data: { error: probe.data.error || 'Admin key does not match.' } }
    }
    if (probe.status === 503) return probe
    if (probe.status < 500) {
      return { status: 200, data: { ok: true, staff: 'ADMIN_KEY', via: 'key' } }
    }
  }

  const auth = String(req.headers.authorization || '')
  if (auth.startsWith('Bearer ')) {
    const me = await proxyRender('/api/me', {
      method: 'GET',
      headers: { authorization: auth },
    })
    const user = me.data.user || me.data.profile
    if (me.status === 401) return { status: 401, data: { error: me.data.error || 'Sign in required' } }
    if (isAllowlistedProfile(user)) {
      return { status: 200, data: { ok: true, staff: user.email || user.accountNumber || user.phone, via: 'allowlist' } }
    }
    return { status: 403, data: { error: 'Ordinary accounts cannot open Super Admin.' } }
  }

  return { status: 401, data: { error: 'Sign in with a Super Admin account, or paste ADMIN_KEY.' } }
}

export function razorpayKeys() {
  const keyId = String(process.env.RAZORPAY_KEY_ID || process.env.VITE_RAZORPAY_KEY_ID || '').trim()
  const keySecret = String(process.env.RAZORPAY_KEY_SECRET || '').trim()
  return { keyId, keySecret }
}

export function razorpayAuthHeader(keyId, keySecret) {
  return `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString('base64')}`
}
