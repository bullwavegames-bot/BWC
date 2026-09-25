export function envList(name) {
  return String(process.env[name] || '')
    .split(/[,;\n]+/)
    .map((item) => item.trim())
    .filter(Boolean)
}

export function isSuperAdminUser(user) {
  if (!user || user.deleted) return false
  const emails = envList('SUPER_ADMIN_EMAILS').map((item) => item.toLowerCase())
  const ids = envList('SUPER_ADMIN_USER_IDS').map((item) => item.toLowerCase())
  if (user.email && emails.includes(String(user.email).toLowerCase())) return true
  const marks = [user.id, user.playerId, user.accountNumber].map((item) => String(item || '').toLowerCase())
  return marks.some((mark) => mark && ids.includes(mark))
}

export function accountBlockReason(user) {
  if (!user || user.deleted) return 'Account not found'
  if (user.banned) return 'This account is banned.'
  if (user.stopped) return 'This account is stopped. Play and login are blocked.'
  return null
}

export function staffLabel(actor) {
  if (!actor) return 'unknown'
  return actor.email || actor.accountNumber || actor.id || 'staff'
}

const LIVE_MS = 90_000
export const presence = new Map()
export const auditLog = []

export function touchPresence(user, { path, screen, inGame } = {}) {
  if (!user) return null
  const row = {
    userId: user.id,
    accountNumber: user.accountNumber,
    playerId: user.playerId,
    email: user.email || '',
    phone: user.phone || '',
    path: String(path || screen || '/'),
    screen: String(screen || path || '/'),
    inGame: Boolean(inGame) || /^\/casino/.test(String(path || '')),
    at: new Date().toISOString(),
  }
  presence.set(user.id, row)
  return row
}

export function livePresence() {
  const now = Date.now()
  const list = []
  for (const [id, row] of presence) {
    if (now - Date.parse(row.at) > LIVE_MS) presence.delete(id)
    else list.push(row)
  }
  return list.sort((a, b) => Date.parse(b.at) - Date.parse(a.at))
}

export function writeAudit(actor, action, target, meta = {}) {
  const row = {
    id: `AUD-${auditLog.length + 1}`,
    at: new Date().toISOString(),
    action,
    actorId: actor?.id || '',
    actor: staffLabel(actor),
    targetId: target?.id || '',
    targetUid: target?.accountNumber || target?.playerId || '',
    targetEmail: target?.email || '',
    meta,
  }
  auditLog.unshift(row)
  if (auditLog.length > 800) auditLog.pop()
  return row
}

export function assertNotPeerAdmin(actor, target, action) {
  if (!isSuperAdminUser(target)) return
  if (['stop', 'ban', 'delete'].includes(action)) {
    const err = new Error('One Super Admin cannot stop, ban, or delete another Super Admin.')
    err.status = 403
    throw err
  }
}

export function sinceHours(iso, hours = 24) {
  return Date.now() - Date.parse(iso || 0) <= hours * 3600 * 1000
}
