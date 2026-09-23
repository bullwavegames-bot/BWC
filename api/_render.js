const RENDER_API = 'https://bwc-wgbu.onrender.com'

export async function proxyRender(path, req) {
  const headers = { 'Content-Type': 'application/json' }
  if (req.headers.authorization) headers.Authorization = req.headers.authorization
  const adminKey = req.headers['x-admin-key']
  if (adminKey) headers['x-admin-key'] = adminKey
  const res = await fetch(`${RENDER_API}${path}`, {
    method: req.method,
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

export function razorpayKeys() {
  const keyId = String(process.env.RAZORPAY_KEY_ID || process.env.VITE_RAZORPAY_KEY_ID || '').trim()
  const keySecret = String(process.env.RAZORPAY_KEY_SECRET || '').trim()
  return { keyId, keySecret }
}

export function razorpayAuthHeader(keyId, keySecret) {
  return `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString('base64')}`
}
