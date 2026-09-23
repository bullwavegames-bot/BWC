import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { proxyRender } from '../_render.js'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const upstream = await proxyRender('/api/admin/login', req)
  if (upstream.status !== 404 && !String(upstream.data?.error || '').includes('Cannot POST')) {
    return res.status(upstream.status).json(upstream.data)
  }

  const adminId = String(process.env.ADMIN_ID || '').trim()
  const passwordHash = String(process.env.ADMIN_PASSWORD_HASH || '').trim()
  const plainPassword = String(process.env.ADMIN_PASSWORD || '').trim()
  const secret = String(process.env.JWT_SECRET || 'dev-bullwave-secret-change-me').trim()
  if (!adminId || (!passwordHash && !plainPassword)) {
    return res.status(503).json({
      error: 'Set ADMIN_ID and ADMIN_PASSWORD (or ADMIN_PASSWORD_HASH) plus JWT_SECRET on Vercel and Render, then redeploy.',
    })
  }
  const idOk = String(req.body?.adminId || '').trim() === adminId
  const submitted = String(req.body?.password || '')
  const passwordOk = passwordHash
    ? await bcrypt.compare(submitted, passwordHash).catch(() => false)
    : submitted === plainPassword
  if (!idOk || !passwordOk) return res.status(401).json({ error: 'Admin ID or password is incorrect.' })
  const token = jwt.sign({ role: 'admin', adminId }, secret, { expiresIn: '2h' })
  return res.status(200).json({ token, admin: { id: adminId }, expiresIn: 7200 })
}
