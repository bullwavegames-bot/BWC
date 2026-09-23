import { proxyRender, razorpayKeys } from '../_render.js'

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })
  const upstream = await proxyRender('/api/payments/config', req)
  if (upstream.status !== 404) return res.status(upstream.status).json(upstream.data)
  const { keyId, keySecret } = razorpayKeys()
  return res.status(200).json({
    enabled: Boolean(keyId && keySecret),
    keyId: keyId || null,
    currency: 'INR',
  })
}
