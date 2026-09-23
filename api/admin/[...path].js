import { proxyRender } from '../_render.js'

export default async function handler(req, res) {
  const parts = req.query.path
  const rest = Array.isArray(parts) ? parts.join('/') : String(parts || '')
  const qIndex = String(req.url || '').indexOf('?')
  const query = qIndex >= 0 ? String(req.url).slice(qIndex) : ''
  const upstream = await proxyRender(`/api/admin/${rest}${query}`, req)
  return res.status(upstream.status).json(upstream.data)
}
