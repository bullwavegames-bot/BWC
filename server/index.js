import express from 'express'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import { randomUUID } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { consumePhoneVerification, normalizePhone, sendOtp, verifyOtp, isPhoneVerified } from './otp.js'
import { createDepositOrder, razorpayPublicConfig, verifyDepositPayment } from './razorpay.js'
import {
  buildReceiptPdf,
  cashouts,
  cashForRupees,
  markCashoutPaid,
  publicBillingConfig,
  receipts,
  rejectCashout,
  requestCashout,
  settleBill,
} from './billing.js'
import { games, matchMarkets, matches, promotions } from '../src/data.js'
import { feedHealth, getLiveCatalog } from './feeds.js'
import { aggregatorHealth, clubGameCatalog, launchAggregatorGame } from './aggregator.js'
import { isStrongPassword, isTenDigitPhone, passwordError } from '../src/authRules.js'
import {
  accountBlockReason,
  assertNotPeerAdmin,
  auditLog,
  isSuperAdminUser,
  livePresence,
  sinceHours,
  touchPresence,
  writeAudit,
} from './staff.js'

function loadEnvFile() {
  const dir = dirname(fileURLToPath(import.meta.url))
  for (const file of [join(dir, '.env'), join(dir, '..', '.env')]) {
    try {
      const text = readFileSync(file, 'utf8')
      for (const line of text.split(/\r?\n/)) {
        const trimmed = line.trim()
        if (!trimmed || trimmed.startsWith('#')) continue
        const i = trimmed.indexOf('=')
        if (i < 1) continue
        const key = trimmed.slice(0, i).trim()
        let val = trimmed.slice(i + 1).trim()
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
          val = val.slice(1, -1)
        }
        if (process.env[key] === undefined) process.env[key] = val
      }
    } catch {
      /* missing env file is fine */
    }
  }
}

loadEnvFile()

const app = express()
const PORT = process.env.PORT || 4000
const JWT_SECRET = process.env.JWT_SECRET || 'dev-bullwave-secret-change-me'
app.use((req, res, next) => {
  const origin = req.headers.origin
  if (origin) {
    res.setHeader('Access-Control-Allow-Origin', origin)
    res.setHeader('Access-Control-Allow-Credentials', 'true')
  } else {
    res.setHeader('Access-Control-Allow-Origin', '*')
  }
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-admin-key')
  res.setHeader('Access-Control-Allow-Methods', 'GET,HEAD,POST,PUT,PATCH,DELETE,OPTIONS')
  res.setHeader('Vary', 'Origin')
  if (req.method === 'OPTIONS') return res.sendStatus(204)
  next()
})
app.use(express.json())
app.set('trust proxy', 1)

const users = new Map()
const adminAttempts = new Map()
const usedPlayerIds = new Set()
let playerSeq = 100000000

function nextPlayerId() {
  let id
  do {
    playerSeq += 1
    id = String(playerSeq)
  } while (usedPlayerIds.has(id))
  usedPlayerIds.add(id)
  return id
}

function ensurePlayerId(user) {
  if (!user) return null
  if (user.playerId) {
    usedPlayerIds.add(String(user.playerId))
    return user.playerId
  }
  user.playerId = nextPlayerId()
  return user.playerId
}
const bets = []
const otpRequests = new Map()
const OTP_WINDOW_MS = 10 * 60 * 1000
const OTP_REQUEST_LIMIT = 10

function limitOtpRequests(req, res, next) {
  const key = req.ip || req.socket.remoteAddress || 'unknown'
  const now = Date.now()
  const current = otpRequests.get(key)
  const entry = !current || now - current.startedAt >= OTP_WINDOW_MS
    ? { startedAt: now, count: 0 }
    : current
  entry.count += 1
  otpRequests.set(key, entry)
  if (entry.count > OTP_REQUEST_LIMIT) {
    return res.status(429).json({ error: 'Too many OTP requests. Please try again later.' })
  }
  next()
}

function publicUser(user) {
  ensurePlayerId(user)
  const cash = Number(user.balance || 0)
  const bonusCoins = Number(user.bonusCoins || 0)
  return {
    id: user.id,
    playerId: user.playerId,
    phone: user.phone || null,
    email: user.email || null,
    username: user.username || null,
    accountNumber: user.accountNumber,
    firstName: user.firstName || '',
    lastName: user.lastName || '',
    dob: user.dob || '',
    country: user.country || 'India',
    city: user.city || '',
    secretQuestion: user.secretQuestion || '',
    secretAnswer: user.secretAnswer || '',
    stopped: Boolean(user.stopped),
    banned: Boolean(user.banned),
    deleted: Boolean(user.deleted),
    superAdmin: isSuperAdminUser(user),
    phoneConfirmed: Boolean(user.phone),
    emailConfirmed: Boolean(user.email),
    bonus: user.bonus,
    bonusCoins,
    promoCode: user.promoCode || null,
    balance: cash,
    cash,
    createdAt: user.createdAt,
  }
}

function goneCreateDeposit(_req, res) {
  return res.status(410).json({
    error: 'Razorpay checkout cannot mint cash here. Pay the Telegram UPI QR, send proof, and wait for Super Admin to Settle bill on a unique UTR.',
  })
}

function incomingAdminKey(req) {
  const header = String(req.headers['x-admin-key'] || '').trim()
  if (header) return header
  const auth = String(req.headers.authorization || '').trim()
  if (/^Admin\s+/i.test(auth)) return auth.replace(/^Admin\s+/i, '').trim()
  const bodyKey = req.body?.adminKey
  if (bodyKey) return String(bodyKey).trim()
  return ''
}

function jwtUserFromReq(req) {
  const header = req.headers.authorization || ''
  const token = header.startsWith('Bearer ') ? header.slice(7) : null
  if (!token) return null
  try {
    const payload = jwt.verify(token, JWT_SECRET)
    return users.get(payload.id) || null
  } catch {
    return null
  }
}

function admin(req, res, next) {
  const adminId = String(process.env.ADMIN_ID || '').trim()
  const authHeader = String(req.headers.authorization || '')
  if (adminId && authHeader.startsWith('Bearer ')) {
    try {
      const payload = jwt.verify(authHeader.slice(7), JWT_SECRET)
      if (payload.role === 'admin' && payload.adminId === adminId) {
        req.adminUser = { id: adminId, email: adminId }
        return next()
      }
    } catch {
      return res.status(401).json({ error: 'Admin session expired. Sign in again.' })
    }
  }
  if (adminId) return res.status(401).json({ error: 'Admin sign-in required.' })
  const bearerUser = jwtUserFromReq(req)
  if (bearerUser && isSuperAdminUser(bearerUser) && !accountBlockReason(bearerUser)) {
    req.adminUser = bearerUser
    return next()
  }
  const envKey = String(process.env.ADMIN_KEY || process.env.SUPER_ADMIN_KEY || '').trim()
  const got = incomingAdminKey(req)
  if (envKey && got && got === envKey) {
    req.adminUser = { id: 'admin-key', email: 'ADMIN_KEY' }
    return next()
  }
  const allowlist = String(process.env.SUPER_ADMIN_EMAILS || process.env.SUPER_ADMIN_USER_IDS || '').trim()
  if (!envKey && !allowlist) {
    return res.status(503).json({ error: 'Set SUPER_ADMIN_EMAILS or ADMIN_KEY on Render, then redeploy.' })
  }
  if (bearerUser && !isSuperAdminUser(bearerUser)) {
    return res.status(403).json({ error: 'Ordinary accounts cannot open Super Admin.' })
  }
  return res.status(401).json({ error: 'Sign in with a Super Admin account, or paste ADMIN_KEY.' })
}

function findUsers(q) {
  const needle = String(q || '').trim().toLowerCase()
  const list = [...users.values()].filter((u) => !u.deleted)
  if (!needle) return list.slice(0, 40)
  return list.filter((u) => (
    u.id.toLowerCase().includes(needle)
    || String(u.playerId || '').includes(needle)
    || String(u.accountNumber || '').toLowerCase().includes(needle)
    || String(u.phone || '').includes(needle)
    || String(u.email || '').toLowerCase().includes(needle)
    || String(u.country || '').toLowerCase().includes(needle)
    || String(u.username || '').toLowerCase().includes(needle)
  )).slice(0, 40)
}

function sign(user) {
  return jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: '7d' })
}

function auth(req, res, next) {
  const header = req.headers.authorization || ''
  const token = header.startsWith('Bearer ') ? header.slice(7) : null
  if (!token) return res.status(401).json({ error: 'Sign in required' })
  try {
    const payload = jwt.verify(token, JWT_SECRET)
    const user = users.get(payload.id)
    if (!user) return res.status(401).json({ error: 'Account not found' })
    const blocked = accountBlockReason(user)
    if (blocked) return res.status(401).json({ error: blocked })
    req.user = user
    next()
  } catch {
    return res.status(401).json({ error: 'Invalid or expired session' })
  }
}

function findUser({ phone, email, accountNumber }) {
  for (const user of users.values()) {
    if (phone && user.phone === phone) return user
    if (email && user.email?.toLowerCase() === email.toLowerCase()) return user
    if (accountNumber && user.accountNumber === accountNumber) return user
  }
  return null
}

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, service: 'bullwave-club', payments: true, time: new Date().toISOString(), feeds: feedHealth(), games: aggregatorHealth() })
})

app.get('/api/catalog', async (_req, res) => {
  const lobby = await clubGameCatalog(games)
  try {
    const live = await getLiveCatalog()
    res.json({ matches: live.matches, games: lobby, promotions, matchMarkets, feeds: live.feeds, aggregator: aggregatorHealth() })
  } catch {
    res.json({ matches, games: lobby, promotions, matchMarkets, feeds: { fallback: 'club' }, aggregator: aggregatorHealth() })
  }
})

app.get('/api/matches', async (req, res) => {
  const { sport, live } = req.query
  let list = matches
  try {
    list = (await getLiveCatalog()).matches
  } catch {
    list = matches
  }
  if (sport) list = list.filter((m) => m.sport === sport)
  if (live === 'true') list = list.filter((m) => m.live)
  if (live === 'false') list = list.filter((m) => !m.live)
  res.json({ matches: list })
})

app.get('/api/matches/:id', async (req, res) => {
  let list = matches
  try {
    list = (await getLiveCatalog()).matches
  } catch {
    list = matches
  }
  const match = list.find((m) => m.id === req.params.id)
  if (!match) return res.status(404).json({ error: 'Match not found' })
  res.json({ match, markets: matchMarkets })
})

app.get('/api/games', async (req, res) => {
  const { cat } = req.query
  const lobby = await clubGameCatalog(games)
  res.json({ games: cat ? lobby.filter((g) => g.cat === cat) : lobby })
})

app.post('/api/games/launch', async (req, res) => {
  try {
    const launched = await launchAggregatorGame({
      gameId: req.body?.gameId || req.body?.id,
      demo: req.body?.demo !== false,
      userToken: req.user?.playerId || req.user?.id,
      language: req.body?.language || 'en',
      returnUrl: req.body?.returnUrl,
      device: /mobile|android|iphone/i.test(String(req.headers['user-agent'] || '')) ? 'mobile' : 'desktop',
    })
    res.json(launched)
  } catch (err) {
    res.status(err.status || 502).json({ error: err.message || 'Could not open this game.' })
  }
})

app.get('/api/promotions', (_req, res) => {
  res.json({ promotions })
})

app.post('/api/otp/send', limitOtpRequests, async (req, res) => {
  try {
    const data = await sendOtp(req.body?.phone)
    res.json(data)
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message })
  }
})

app.post('/api/otp/verify', async (req, res) => {
  try {
    const data = await verifyOtp(req.body?.phone, req.body?.otp)
    res.json(data)
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message })
  }
})

async function loginWithOtp(req, res) {
  try {
    const phone = normalizePhone(req.body?.phone)
    await verifyOtp(phone, req.body?.otp, { consume: true })

    let user = findUser({ phone })
    const isNew = !user
    if (!user) {
      user = {
        id: randomUUID(),
        phone,
        email: null,
        accountNumber: `BW${Math.floor(10000000 + Math.random() * 90000000)}`,
        playerId: nextPlayerId(),
        passwordHash: null,
        bonus: 'Welcome Casino 100%',
        bonusCoins: 0,
        promoCode: null,
        balance: 0,
        createdAt: new Date().toISOString(),
      }
      users.set(user.id, user)
    }

    const blocked = accountBlockReason(user)
    if (blocked) return res.status(401).json({ error: blocked })

    res.json({ token: sign(user), user: publicUser(user), isNew })
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message })
  }
}

app.post('/api/otp/login', loginWithOtp)
app.post('/api/auth/otp-login', loginWithOtp)

app.post('/api/auth/register', async (req, res) => {
  const { method = 'phone', phone, email, password, promoCode, bonus } = req.body || {}
  if (!isStrongPassword(password)) {
    return res.status(400).json({ error: passwordError(password) })
  }
  const cleanEmail = email?.trim().toLowerCase()
  const identifier = method === 'email' ? cleanEmail : normalizePhone(phone)
  if (!identifier) {
    return res.status(400).json({ error: method === 'email' ? 'E-mail is required' : 'Phone number is required' })
  }
  if (method === 'email' && findUser({ email: identifier })) {
    return res.status(409).json({ error: 'E-mail already registered' })
  }
  if (method !== 'email' && cleanEmail && findUser({ email: cleanEmail })) {
    return res.status(409).json({ error: 'E-mail already registered' })
  }
  if (method !== 'email' && !isTenDigitPhone(phone)) {
    return res.status(400).json({ error: 'Enter a 10-digit mobile number.' })
  }
  if (method !== 'email' && findUser({ phone: identifier })) {
    return res.status(409).json({ error: 'Phone number already registered' })
  }
  if (method !== 'email' && !isPhoneVerified(identifier)) {
    return res.status(400).json({ error: 'Verify the OTP sent to your phone first.' })
  }

  const user = {
    id: randomUUID(),
    phone: method === 'email' ? null : identifier,
    email: method === 'email' ? identifier : cleanEmail || null,
    accountNumber: `BW${Math.floor(10000000 + Math.random() * 90000000)}`,
    playerId: nextPlayerId(),
    passwordHash: await bcrypt.hash(password, 10),
    bonus: bonus || 'Welcome Casino 100%',
    bonusCoins: 0,
    promoCode: promoCode || null,
    balance: 0,
    createdAt: new Date().toISOString(),
  }
  users.set(user.id, user)
  if (method !== 'email') consumePhoneVerification(identifier)
  res.status(201).json({ token: sign(user), user: publicUser(user) })
})

app.post('/api/auth/login', async (req, res) => {
  const { method = 'phone', phone, email, accountNumber, password } = req.body || {}
  if (!password) return res.status(400).json({ error: 'Password is required' })
  const user = findUser({
    phone: method === 'phone' ? normalizePhone(phone) : undefined,
    email: method === 'email' ? email?.trim() : undefined,
    accountNumber: method === 'account' ? accountNumber?.trim() : undefined,
  })
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    return res.status(401).json({ error: 'Invalid login details' })
  }
  const blocked = accountBlockReason(user)
  if (blocked) return res.status(401).json({ error: blocked })
  res.json({ token: sign(user), user: publicUser(user) })
})

app.get('/api/me', auth, (req, res) => {
  res.json({ user: publicUser(req.user) })
})

app.post('/api/presence', auth, (req, res) => {
  const row = touchPresence(req.user, req.body || {})
  res.json({ ok: true, presence: row })
})

app.post('/api/admin/login', async (req, res) => {
  const ip = req.ip || req.socket.remoteAddress || 'unknown'
  const now = Date.now()
  const current = adminAttempts.get(ip)
  const attempt = !current || now - current.startedAt > 15 * 60 * 1000 ? { startedAt: now, count: 0 } : current
  attempt.count += 1
  adminAttempts.set(ip, attempt)
  if (attempt.count > 5) return res.status(429).json({ error: 'Too many admin sign-in attempts. Try again in 15 minutes.' })
  const adminId = String(process.env.ADMIN_ID || '').trim()
  const passwordHash = String(process.env.ADMIN_PASSWORD_HASH || '').trim()
  const plainPassword = String(process.env.ADMIN_PASSWORD || '').trim()
  if (!adminId || (!passwordHash && !plainPassword)) {
    return res.status(503).json({ error: 'Configure ADMIN_ID and ADMIN_PASSWORD or ADMIN_PASSWORD_HASH on Render.' })
  }
  const idOk = String(req.body?.adminId || '').trim() === adminId
  const submitted = String(req.body?.password || '')
  const passwordOk = passwordHash
    ? await bcrypt.compare(submitted, passwordHash).catch(() => false)
    : submitted === plainPassword
  if (!idOk || !passwordOk) return res.status(401).json({ error: 'Admin ID or password is incorrect.' })
  adminAttempts.delete(ip)
  writeAudit({ id: adminId, email: adminId }, 'admin-login', null, { ip })
  res.json({ token: jwt.sign({ role: 'admin', adminId }, JWT_SECRET, { expiresIn: '2h' }), admin: { id: adminId }, expiresIn: 7200 })
})

app.get('/api/admin/me', admin, (req, res) => {
  res.json({
    ok: true,
    staff: req.adminUser?.email || req.adminUser?.id,
    via: req.adminUser?.id === String(process.env.ADMIN_ID || '').trim() ? 'admin-id' : req.adminUser?.id === 'admin-key' ? 'key' : 'allowlist',
  })
})

app.patch('/api/me/profile', auth, (req, res) => {
  const body = req.body || {}
  const firstName = String(body.firstName || '').trim()
  const lastName = String(body.lastName || '').trim()
  const dob = String(body.dob || '').trim()
  const country = String(body.country || 'India').trim()
  const city = String(body.city || '').trim()
  const secretQuestion = String(body.secretQuestion || '').trim()
  const secretAnswer = String(body.secretAnswer || '').trim()
  const phone = body.phone ? normalizePhone(body.phone) : req.user.phone
  if (!firstName || !lastName || !dob || !country || !city || !secretQuestion || !secretAnswer) {
    return res.status(400).json({ error: 'Fill every required personal-data field.' })
  }
  if (phone && !isTenDigitPhone(phone)) {
    return res.status(400).json({ error: 'Enter a 10-digit mobile number.' })
  }
  if (phone && phone !== normalizePhone(req.user.phone) && !isPhoneVerified(phone)) {
    return res.status(400).json({ error: 'Verify the new mobile number with OTP before saving.' })
  }
  Object.assign(req.user, { firstName, lastName, dob, country, city, secretQuestion, secretAnswer, phone: phone || req.user.phone })
  res.json({ user: publicUser(req.user) })
})

app.post('/api/auth/reset-password', async (req, res) => {
  const phone = normalizePhone(req.body?.phone)
  const password = req.body?.password
  if (!isTenDigitPhone(phone)) {
    return res.status(400).json({ error: 'Verify your mobile number with OTP first. Email cannot reset a password.' })
  }
  if (!isStrongPassword(password)) {
    return res.status(400).json({ error: passwordError(password) })
  }
  if (!isPhoneVerified(phone)) {
    try {
      await verifyOtp(phone, req.body?.otp, { consume: false })
    } catch (err) {
      return res.status(400).json({ error: err.message || 'Verify the OTP sent to your phone first.' })
    }
  }
  const user = findUser({ phone })
  if (!user) return res.status(400).json({ error: 'No club account uses this mobile number.' })
  if (!consumePhoneVerification(phone)) {
    return res.status(400).json({ error: 'Verify the OTP sent to your phone first.' })
  }
  user.passwordHash = await bcrypt.hash(password, 10)
  res.json({ ok: true, message: 'Password updated. Log in with your phone or e-mail and the new password.' })
})

app.get('/api/me/bets', auth, (req, res) => {
  res.json({ bets: bets.filter((b) => b.userId === req.user.id) })
})

app.get('/api/payments/config', (_req, res) => {
  res.json({ ...razorpayPublicConfig(), billing: publicBillingConfig() })
})

app.get('/api/billing/config', (_req, res) => {
  res.json(publicBillingConfig())
})

app.post('/api/payments/create-deposit', goneCreateDeposit)

app.post('/api/payments/create-order', auth, async (req, res) => {
  try {
    const order = await createDepositOrder(req.user, req.body?.amount, req.body?.method)
    res.json(order)
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message || 'Could not create Razorpay order' })
  }
})

app.post('/api/payments/verify', auth, (req, res) => {
  try {
    const result = verifyDepositPayment(req.user, req.body)
    res.json({ user: publicUser(req.user), ...result })
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message || 'Could not verify payment' })
  }
})

app.post('/api/wallet/deposit', auth, async (req, res) => {
  try {
    const order = await createDepositOrder(req.user, req.body?.amount, req.body?.method)
    res.json(order)
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message || 'Could not start deposit' })
  }
})

function handleCashout(req, res) {
  try {
    const blocked = accountBlockReason(req.user)
    if (blocked) return res.status(401).json({ error: blocked })
    const rupees = Number(req.body?.amount)
    const row = requestCashout(req.user, {
      amount: rupees,
      destination: req.body?.destination || req.body?.upi || req.body?.account,
      method: req.body?.method || 'upi',
    })
    res.status(201).json({
      cashout: row,
      user: publicUser(req.user),
      message: 'Cash locked. Settlement is within 12 hours. Staff pay outside the site.',
    })
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message || 'Could not request cash-out' })
  }
}

app.post('/api/wallet/withdraw', auth, handleCashout)
app.post('/api/payments/cashout', auth, handleCashout)

app.get('/api/billing/me', auth, (req, res) => {
  res.json({
    receipts: receipts.filter((r) => r.userId === req.user.id),
    cashouts: cashouts.filter((c) => c.userId === req.user.id),
    user: publicUser(req.user),
  })
})

app.get('/api/billing/receipts/:id.pdf', auth, (req, res) => {
  const receipt = receipts.find((r) => r.id === req.params.id && r.userId === req.user.id)
  if (!receipt) return res.status(404).json({ error: 'Receipt not found' })
  const pdf = buildReceiptPdf(receipt)
  res.setHeader('Content-Type', 'application/pdf')
  res.setHeader('Content-Disposition', `attachment; filename="${receipt.id}.pdf"`)
  res.send(pdf)
})

function resolvePlayer(id) {
  return users.get(id) || findUser({ accountNumber: id }) || [...users.values()].find((u) => String(u.playerId) === String(id))
}

function csvEscape(value) {
  const text = String(value ?? '')
  if (/[",\n]/.test(text)) return `"${text.replace(/"/g, '""')}"`
  return text
}

function recordsCsv() {
  const lines = [['type', 'id', 'uid', 'phone', 'email', 'amount', 'credit', 'utr', 'status', 'note', 'at'].join(',')]
  receipts.forEach((r) => {
    lines.push([ 'bill', r.id, r.accountNumber, r.phone, r.email, r.rupees, r.credit, r.utr, 'SETTLED', r.note, r.createdAt ].map(csvEscape).join(','))
  })
  cashouts.forEach((c) => {
    lines.push([ 'cashout', c.id, c.accountNumber, c.phone, c.email, c.amount, '', c.payoutUtr || '', c.status, c.note, c.createdAt ].map(csvEscape).join(','))
  })
  return `${lines.join('\n')}\n`
}

function listAdminPlayers(req, res) {
  res.json({
    players: findUsers(req.query.q || req.body?.q).map((u) => publicUser(u)),
  })
}

app.get('/api/admin/overview', admin, (_req, res) => {
  const live = livePresence()
  const dayBets = bets.filter((b) => sinceHours(b.createdAt, 24))
  const dayBills = receipts.filter((r) => sinceHours(r.createdAt, 24))
  res.json({
    registered: [...users.values()].filter((u) => !u.deleted).length,
    live: live.length,
    inGame: live.filter((row) => row.inGame).length,
    bets24h: dayBets.length,
    betsStake24h: dayBets.reduce((sum, b) => sum + Number(b.stake || 0), 0),
    deposits24h: dayBills.length,
    depositCash24h: dayBills.reduce((sum, r) => sum + Number(r.credit || 0), 0),
  })
})

app.get('/api/admin/live', admin, (_req, res) => {
  res.json({ live: livePresence() })
})

app.get('/api/admin/activity', admin, (_req, res) => {
  res.json({
    bets: [...bets].slice(-80).reverse(),
    receipts: [...receipts].slice(-80).reverse(),
    cashouts: [...cashouts].slice(-80).reverse(),
  })
})

app.get('/api/admin/records', admin, (_req, res) => {
  const billTotal = receipts.reduce((sum, r) => sum + Number(r.credit || 0), 0)
  const paidTotal = cashouts.filter((c) => c.status === 'PAID').reduce((sum, c) => sum + Number(c.amount || 0), 0)
  res.json({ receipts: [...receipts].reverse(), cashouts: [...cashouts].reverse(), billTotal, paidTotal })
})

app.get('/api/admin/records.csv', admin, (_req, res) => {
  res.setHeader('Content-Type', 'text/csv')
  res.setHeader('Content-Disposition', 'attachment; filename="bwc-records.csv"')
  res.send(recordsCsv())
})

app.get('/api/admin/audit', admin, (_req, res) => {
  res.json({ audit: auditLog.slice(0, 200) })
})

app.get('/api/admin/players', admin, listAdminPlayers)
app.post('/api/admin/players', admin, listAdminPlayers)

app.get('/api/admin/players/:id', admin, (req, res) => {
  const user = resolvePlayer(req.params.id)
  if (!user || user.deleted) return res.status(404).json({ error: 'Player not found' })
  const live = livePresence().find((row) => row.userId === user.id) || null
  res.json({
    user: publicUser(user),
    presence: live,
    bets: bets.filter((b) => b.userId === user.id),
    receipts: receipts.filter((r) => r.userId === user.id),
    cashouts: cashouts.filter((c) => c.userId === user.id),
  })
})

app.post('/api/admin/players/:id/:action', admin, (req, res) => {
  const action = String(req.params.action || '').toLowerCase()
  const user = resolvePlayer(req.params.id)
  if (!user || user.deleted) return res.status(404).json({ error: 'Player not found' })
  try {
    assertNotPeerAdmin(req.adminUser, user, action)
    if (action === 'stop') user.stopped = true
    else if (action === 'resume') user.stopped = false
    else if (action === 'ban') user.banned = true
    else if (action === 'unban') user.banned = false
    else if (action === 'delete') {
      user.deleted = true
      user.stopped = true
      user.banned = true
    } else {
      return res.status(400).json({ error: 'Unknown account control.' })
    }
    writeAudit(req.adminUser, action, user, {})
    res.json({ user: publicUser(user) })
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message })
  }
})

app.post('/api/admin/settle-bill', admin, (req, res) => {
  try {
    const user = resolvePlayer(req.body?.userId) || findUser({ accountNumber: req.body?.uid || req.body?.accountNumber })
    if (!user || user.deleted) return res.status(404).json({ error: 'Player not found' })
    const rupees = Number(req.body?.rupees ?? req.body?.amount)
    const credit = Number(req.body?.credit ?? req.body?.coins) > 0
      ? Number(req.body?.credit ?? req.body?.coins)
      : cashForRupees(rupees)
    const receipt = settleBill(user, {
      rupees,
      credit,
      utr: req.body?.utr,
      note: req.body?.note,
      settledBy: req.adminUser?.email || req.adminUser?.id,
    })
    writeAudit(req.adminUser, 'settle-bill', user, { utr: receipt.utr, credit: receipt.credit, rupees: receipt.rupees })
    res.status(201).json({ receipt, user: publicUser(user) })
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message || 'Could not settle bill' })
  }
})

app.get('/api/admin/cashouts', admin, (_req, res) => {
  res.json({ cashouts: [...cashouts].reverse() })
})

app.post('/api/admin/cashouts/:id/paid', admin, (req, res) => {
  try {
    const row = markCashoutPaid(req.params.id, req.body?.utr)
    const user = users.get(row.userId)
    writeAudit(req.adminUser, 'settle-cashout', user, { utr: row.payoutUtr, amount: row.amount })
    res.json({ cashout: row })
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message || 'Could not mark paid' })
  }
})

app.post('/api/admin/cashouts/:id/reject', admin, (req, res) => {
  try {
    const row = cashouts.find((c) => c.id === req.params.id)
    const user = row ? users.get(row.userId) : null
    const result = rejectCashout(req.params.id, req.body?.reason, user)
    writeAudit(req.adminUser, 'reject-cashout', user, { amount: result.amount })
    res.json({ cashout: result, user: user ? publicUser(user) : null })
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message || 'Could not reject cash-out' })
  }
})

app.get('/api/admin/receipts/:id.pdf', admin, (req, res) => {
  const receipt = receipts.find((r) => r.id === req.params.id)
  if (!receipt) return res.status(404).json({ error: 'Receipt not found' })
  const pdf = buildReceiptPdf(receipt)
  res.setHeader('Content-Type', 'application/pdf')
  res.setHeader('Content-Disposition', `attachment; filename="${receipt.id}.pdf"`)
  res.send(pdf)
})

function placeBet(req, res) {
  const blocked = accountBlockReason(req.user)
  if (blocked) return res.status(401).json({ error: blocked })
  const selections = Array.isArray(req.body?.selections) ? req.body.selections : []
  const stake = Number(req.body?.stake)
  if (!selections.length) return res.status(400).json({ error: 'Add at least one selection' })
  if (!Number.isFinite(stake) || stake <= 0) return res.status(400).json({ error: 'Enter a valid stake' })
  if (stake > req.user.balance) return res.status(400).json({ error: 'Insufficient balance' })

  const odds = selections.reduce((acc, s) => acc * Number(s.odd || 1), 1)
  req.user.balance = Number((req.user.balance - stake).toFixed(2))
  const bet = {
    id: randomUUID(),
    userId: req.user.id,
    selections,
    stake,
    odds: Number(odds.toFixed(2)),
    possibleWin: Number((odds * stake).toFixed(2)),
    status: 'open',
    createdAt: new Date().toISOString(),
  }
  bets.push(bet)
  res.status(201).json({ bet, user: publicUser(req.user) })
}

app.get('/api/bets', auth, (req, res) => {
  res.json({ bets: bets.filter((b) => b.userId === req.user.id) })
})

app.post('/api/bets', auth, placeBet)
app.post('/api/me/bets', auth, placeBet)

app.listen(PORT, () => {
  console.log(`Bullwave Club API on port ${PORT}`)
})
