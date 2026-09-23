import { proxyRender, readAdminKey } from '../_render.js'

export default async function handler(req, res) {
  const key = readAdminKey(req)
  const incomingAuth = String(req.headers.authorization || '')
  const q = encodeURIComponent(String(req.method === 'GET' ? req.query?.q : req.body?.q || req.query?.q || ''))
  const forwarded = {
    method: 'GET',
    headers: {
      'content-type': 'application/json',
      'x-admin-key': key,
      authorization: incomingAuth || (key ? `Admin ${key}` : ''),
    },
  }
  const upstream = await proxyRender(`/api/admin/players?q=${q}`, forwarded)
  return res.status(upstream.status).json(upstream.data)
}
