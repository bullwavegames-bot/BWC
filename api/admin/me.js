import { legacyAdminMe, proxyRender } from '../_render.js'

export default async function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    return res.status(405).json({ error: 'Method not allowed' })
  }
  const upstream = await proxyRender('/api/admin/me', req)
  if (upstream.status !== 404 && !String(upstream.data?.error || '').includes('Cannot GET')) {
    return res.status(upstream.status).json(upstream.data)
  }
  const fallback = await legacyAdminMe(req)
  return res.status(fallback.status).json(fallback.data)
}
