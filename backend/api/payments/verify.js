import { proxyRender } from '../_render.js'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  if (!req.headers.authorization) return res.status(401).json({ error: 'Sign in required' })

  const upstream = await proxyRender('/api/payments/verify', req)
  return res.status(upstream.status).json(upstream.data)
}
