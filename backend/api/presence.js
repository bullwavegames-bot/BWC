import { proxyRender } from './_render.js'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  const upstream = await proxyRender('/api/presence', req)
  if (upstream.status === 404 || String(upstream.data?.error || '').includes('Cannot POST')) {
    return res.status(204).end()
  }
  return res.status(upstream.status).json(upstream.data)
}
