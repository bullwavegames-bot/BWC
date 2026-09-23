import { proxyRender, razorpayAuthHeader, razorpayKeys } from '../_render.js'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  if (!req.headers.authorization) return res.status(401).json({ error: 'Sign in required' })

  const upstream = await proxyRender('/api/payments/create-order', req)
  if (upstream.status !== 404) return res.status(upstream.status).json(upstream.data)

  const { keyId, keySecret } = razorpayKeys()
  if (!keyId || !keySecret) {
    return res.status(503).json({
      error: 'Razorpay keys are missing. Add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET on Vercel, then redeploy.',
    })
  }

  const rupees = Number(req.body?.amount)
  if (!Number.isFinite(rupees) || rupees < 100) {
    return res.status(400).json({ error: 'Minimum Razorpay deposit is ₹100.' })
  }
  if (rupees > 200000) {
    return res.status(400).json({ error: 'Maximum Razorpay deposit is ₹2,00,000.' })
  }

  const orderRes = await fetch('https://api.razorpay.com/v1/orders', {
    method: 'POST',
    headers: {
      Authorization: razorpayAuthHeader(keyId, keySecret),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      amount: Math.round(rupees * 100),
      currency: 'INR',
      receipt: `bwc_${Date.now()}`.slice(0, 40),
      notes: { method: String(req.body?.method || 'upi'), rupees: String(rupees) },
    }),
  })
  const order = await orderRes.json().catch(() => ({}))
  if (!orderRes.ok) {
    return res.status(orderRes.status).json({ error: order.error?.description || 'Could not create Razorpay order' })
  }
  return res.status(200).json({
    orderId: order.id,
    amount: order.amount,
    currency: order.currency,
    keyId,
  })
}
