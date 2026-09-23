import crypto from 'node:crypto'
import { proxyRender, razorpayAuthHeader, razorpayKeys } from '../_render.js'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  if (!req.headers.authorization) return res.status(401).json({ error: 'Sign in required' })

  const upstream = await proxyRender('/api/payments/verify', req)
  if (upstream.status !== 404) return res.status(upstream.status).json(upstream.data)

  const { keyId, keySecret } = razorpayKeys()
  if (!keySecret) {
    return res.status(503).json({ error: 'Razorpay secret is missing on Vercel.' })
  }

  const orderId = req.body?.razorpay_order_id
  const paymentId = req.body?.razorpay_payment_id
  const signature = req.body?.razorpay_signature
  if (!orderId || !paymentId || !signature) {
    return res.status(400).json({ error: 'Missing Razorpay payment details.' })
  }
  const expected = crypto.createHmac('sha256', keySecret).update(`${orderId}|${paymentId}`).digest('hex')
  if (expected !== signature) {
    return res.status(400).json({ error: 'Payment signature mismatch.' })
  }

  const orderRes = await fetch(`https://api.razorpay.com/v1/orders/${orderId}`, {
    headers: { Authorization: razorpayAuthHeader(keyId, keySecret) },
  })
  const order = await orderRes.json().catch(() => ({}))
  const rupees = Number(order.notes?.rupees || (order.amount ? order.amount / 100 : 0))
  if (!Number.isFinite(rupees) || rupees <= 0) {
    return res.status(400).json({ error: 'Could not read paid amount from Razorpay.' })
  }

  const credit = await fetch('https://bwc-wgbu.onrender.com/api/wallet/deposit', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: req.headers.authorization,
    },
    body: JSON.stringify({ amount: rupees, method: 'razorpay' }),
  })
  const data = await credit.json().catch(() => ({}))
  if (!credit.ok) {
    return res.status(credit.status).json({ error: data.error || 'Payment verified, but the club wallet did not credit.' })
  }
  return res.status(200).json({ user: data.user, amount: rupees, paymentId, already: false })
}
