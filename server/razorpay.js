import crypto from 'node:crypto'
import RazorpaySdk from 'razorpay'

const Razorpay = RazorpaySdk.default || RazorpaySdk

const pendingOrders = new Map()

function keyId() {
  return String(process.env.RAZORPAY_KEY_ID || '').trim()
}

function keySecret() {
  return String(process.env.RAZORPAY_KEY_SECRET || '').trim()
}

export function razorpayEnabled() {
  return Boolean(keyId() && keySecret())
}

export function razorpayPublicConfig() {
  return { enabled: razorpayEnabled(), keyId: keyId() || null, currency: 'INR' }
}

function client() {
  if (!razorpayEnabled()) {
    const err = new Error('Razorpay is not configured on the server.')
    err.status = 503
    throw err
  }
  return new Razorpay({ key_id: keyId(), key_secret: keySecret() })
}

export async function createDepositOrder(user, amount, method = 'upi') {
  const rupees = Number(amount)
  if (!Number.isFinite(rupees) || rupees < 100) {
    const err = new Error('Minimum Razorpay deposit is ₹100.')
    err.status = 400
    throw err
  }
  if (rupees > 200000) {
    const err = new Error('Maximum Razorpay deposit is ₹2,00,000.')
    err.status = 400
    throw err
  }
  const paise = Math.round(rupees * 100)
  const order = await client().orders.create({
    amount: paise,
    currency: 'INR',
    receipt: `bwc_${String(user.id).slice(0, 8)}_${Date.now()}`.slice(0, 40),
    notes: { userId: user.id, method },
  })
  pendingOrders.set(order.id, { userId: user.id, amount: rupees, method, paid: false })
  return {
    orderId: order.id,
    amount: order.amount,
    currency: order.currency,
    keyId: keyId(),
  }
}

export function verifyDepositPayment(user, payload = {}) {
  const orderId = payload.razorpay_order_id
  const paymentId = payload.razorpay_payment_id
  const signature = payload.razorpay_signature
  if (!orderId || !paymentId || !signature) {
    const err = new Error('Missing Razorpay payment details.')
    err.status = 400
    throw err
  }
  const expected = crypto.createHmac('sha256', keySecret()).update(`${orderId}|${paymentId}`).digest('hex')
  if (expected !== signature) {
    const err = new Error('Payment signature mismatch.')
    err.status = 400
    throw err
  }
  const pending = pendingOrders.get(orderId)
  if (!pending || pending.userId !== user.id) {
    const err = new Error('Unknown or expired order. Create a new deposit.')
    err.status = 400
    throw err
  }
  if (pending.paid) {
    return { already: true, amount: pending.amount, paymentId }
  }
  pending.paid = true
  const coins = Math.round(Number(pending.amount) * 10)
  user.balance = Number((Number(user.balance || 0) + coins).toFixed(2))
  return { already: false, amount: pending.amount, coins, paymentId }
}
