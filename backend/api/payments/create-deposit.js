export default function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  return res.status(410).json({
    error: 'Razorpay checkout cannot mint cash here. Pay the Telegram UPI QR, send proof, and wait for Super Admin to Settle bill on a unique UTR.',
  })
}
