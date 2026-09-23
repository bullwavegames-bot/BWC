import { proxyRender, readAdminKey } from '../_render.js'

export default async function handler(req, res) {
  const parts = req.query.path
  const rest = Array.isArray(parts) ? parts.join('/') : String(parts || '')
  const key = readAdminKey(req)
  const qIndex = String(req.url || '').indexOf('?')
  const query = qIndex >= 0 ? String(req.url).slice(qIndex) : ''
  const forwarded = {
    method: req.method,
    headers: {
      'content-type': 'application/json',
      'x-admin-key': key,
      authorization: key ? `Admin ${key}` : '',
    },
    body: req.body,
  }

  if (rest === 'players' && req.method === 'POST') {
    const q = encodeURIComponent(String(req.body?.q || ''))
    forwarded.method = 'GET'
    forwarded.body = undefined
    const upstream = await proxyRender(`/api/admin/players?q=${q}`, forwarded)
    return res.status(upstream.status).json(upstream.data)
  }

  const upstream = await proxyRender(`/api/admin/${rest}${query}`, forwarded)
  return res.status(upstream.status).json(upstream.data)
}
