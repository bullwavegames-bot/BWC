import { proxyRender, readAdminKey } from '../_render.js'

function adminRest(req) {
  const raw = String(req.url || '')
  const pathname = raw.split('?')[0]
  const marker = '/api/admin/'
  const at = pathname.indexOf(marker)
  if (at >= 0) return pathname.slice(at + marker.length).replace(/\/$/, '')
  const parts = req.query?.path
  if (Array.isArray(parts)) return parts.filter(Boolean).join('/')
  if (parts) return String(parts)
  return pathname.replace(/^\/+/, '')
}

export default async function handler(req, res) {
  const rest = adminRest(req)
  const search = String(req.url || '').includes('?')
    ? String(req.url).slice(String(req.url).indexOf('?'))
    : ''
  const key = readAdminKey(req)
  const forwarded = {
    method: req.method,
    headers: {
      'content-type': 'application/json',
      'x-admin-key': key,
      authorization: key ? `Admin ${key}` : '',
    },
    body: req.body,
  }

  if ((rest === 'players' || rest === '') && req.method === 'POST') {
    const q = encodeURIComponent(String(req.body?.q || ''))
    forwarded.method = 'GET'
    forwarded.body = undefined
    const upstream = await proxyRender(`/api/admin/players?q=${q}`, forwarded)
    return res.status(upstream.status).json(upstream.data)
  }

  const upstream = await proxyRender(`/api/admin/${rest}${search}`, forwarded)
  return res.status(upstream.status).json(upstream.data)
}
