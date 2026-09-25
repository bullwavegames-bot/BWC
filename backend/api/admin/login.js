import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { proxyRender } from '../_render.js'

async function signFromEnv(req) {
  const adminId = String(process.env.ADMIN_ID || '').trim()
  const passwordHash = String(process.env.ADMIN_PASSWORD_HASH || '').trim()
  const plainPassword = String(process.env.ADMIN_PASSWORD || '').trim()
  const secret = String(process.env.JWT_SECRET || 'dev-bullwave-secret-change-me').trim()
  if (!adminId || (!passwordHash && !plainPassword)) return null
  const idOk = String(req.body?.adminId || '').trim() === adminId
  const submitted = String(req.body?.password || '')
  const passwordOk = passwordHash
    ? await bcrypt.compare(submitted, passwordHash).catch(() => false)
    : submitted === plainPassword
  if (!idOk || !passwordOk) {
    const err = new Error('Admin ID or password is incorrect.')
    err.status = 401
    throw err
  }
  return {
    token: jwt.sign({ role: 'admin', adminId }, secret, { expiresIn: '2h' }),
    admin: { id: adminId },
    expiresIn: 7200,
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  try {
    const local = await signFromEnv(req)
    if (local) return res.status(200).json(local)
  } catch (err) {
    if (err.status === 401) return res.status(401).json({ error: err.message })
  }

  const upstream = await proxyRender('/api/admin/login', req)
  const missing = /PASSWORD_HASH|ADMIN_ID|not on Render|not live/i.test(String(upstream.data?.error || ''))
  if (upstream.status === 404 || upstream.status === 503 || missing || String(upstream.data?.error || '').includes('Cannot POST')) {
    return res.status(503).json({
      error: 'Set ADMIN_ID and ADMIN_PASSWORD on Vercel (same as Render), then redeploy Vercel. Render still wants ADMIN_PASSWORD_HASH unless that service is on the latest build.',
    })
  }
  return res.status(upstream.status).json(upstream.data)
}
