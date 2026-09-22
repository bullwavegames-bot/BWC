import express from 'express'
import cors from 'cors'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import { randomUUID } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { consumePhoneVerification, normalizePhone, sendOtp, verifyOtp, isPhoneVerified } from './otp.js'
import { games, matchMarkets, matches, promotions } from '../src/data.js'

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
const CORS_ORIGIN = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map((s) => s.trim())
  : true

app.use(cors({ origin: CORS_ORIGIN, credentials: true }))
app.use(express.json())
app.set('trust proxy', 1)

const users = new Map()
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
  return {
    id: user.id,
    phone: user.phone || null,
    email: user.email || null,
    accountNumber: user.accountNumber,
    bonus: user.bonus,
    promoCode: user.promoCode || null,
    balance: user.balance,
    createdAt: user.createdAt,
  }
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
  res.json({ ok: true, service: 'bullwave-club', time: new Date().toISOString() })
})

app.get('/api/catalog', (_req, res) => {
  res.json({ matches, games, promotions, matchMarkets })
})

app.get('/api/matches', (req, res) => {
  const { sport, live } = req.query
  let list = matches
  if (sport) list = list.filter((m) => m.sport === sport)
  if (live === 'true') list = list.filter((m) => m.live)
  if (live === 'false') list = list.filter((m) => !m.live)
  res.json({ matches: list })
})

app.get('/api/matches/:id', (req, res) => {
  const match = matches.find((m) => m.id === req.params.id)
  if (!match) return res.status(404).json({ error: 'Match not found' })
  res.json({ match, markets: matchMarkets })
})

app.get('/api/games', (req, res) => {
  const { cat } = req.query
  res.json({ games: cat ? games.filter((g) => g.cat === cat) : games })
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
        passwordHash: null,
        bonus: 'Welcome Casino 100%',
        promoCode: null,
        balance: 0,
        createdAt: new Date().toISOString(),
      }
      users.set(user.id, user)
    }

    res.json({ token: sign(user), user: publicUser(user), isNew })
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message })
  }
}

app.post('/api/otp/login', loginWithOtp)
app.post('/api/auth/otp-login', loginWithOtp)

app.post('/api/auth/register', async (req, res) => {
  const { method = 'phone', phone, email, password, promoCode, bonus } = req.body || {}
  if (!password || String(password).length < 4) {
    return res.status(400).json({ error: 'Password must be at least 4 characters' })
  }
  const identifier = method === 'email' ? email?.trim() : normalizePhone(phone)
  if (!identifier) {
    return res.status(400).json({ error: method === 'email' ? 'E-mail is required' : 'Phone number is required' })
  }
  if (method === 'email' && findUser({ email: identifier })) {
    return res.status(409).json({ error: 'E-mail already registered' })
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
    email: method === 'email' ? identifier : null,
    accountNumber: `BW${Math.floor(10000000 + Math.random() * 90000000)}`,
    passwordHash: await bcrypt.hash(password, 10),
    bonus: bonus || 'Welcome Casino 100%',
    promoCode: promoCode || null,
    balance: 1000,
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
  res.json({ token: sign(user), user: publicUser(user) })
})

app.get('/api/me', auth, (req, res) => {
  res.json({ user: publicUser(req.user) })
})

app.post('/api/wallet/deposit', auth, (req, res) => {
  const amount = Number(req.body?.amount)
  if (!Number.isFinite(amount) || amount <= 0) {
    return res.status(400).json({ error: 'Enter a valid amount' })
  }
  req.user.balance = Number((req.user.balance + amount).toFixed(2))
  res.json({ user: publicUser(req.user) })
})

app.post('/api/wallet/withdraw', auth, (req, res) => {
  const amount = Number(req.body?.amount)
  if (!Number.isFinite(amount) || amount <= 0) {
    return res.status(400).json({ error: 'Enter a valid amount' })
  }
  if (amount > req.user.balance) return res.status(400).json({ error: 'Insufficient balance' })
  req.user.balance = Number((req.user.balance - amount).toFixed(2))
  res.json({ user: publicUser(req.user) })
})

app.get('/api/bets', auth, (req, res) => {
  res.json({ bets: bets.filter((b) => b.userId === req.user.id) })
})

app.post('/api/bets', auth, (req, res) => {
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
})

app.listen(PORT, () => {
  console.log(`Bullwave Club API on port ${PORT}`)
})
