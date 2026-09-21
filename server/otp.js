import { createHash, randomInt } from 'node:crypto'

const challenges = new Map()
const TTL_MS = 10 * 60 * 1000

function env(name, fallback = '') {
  return String(process.env[name] ?? fallback).trim().replace(/^['"]+|['"]+$/g, '')
}

function otpConfig() {
  const apiKey = env('MSG91_AUTH_KEY')
  const template = env('MSG91_TEMPLATE_ID')
  const senderId = env('MSG91_SENDER_ID') || 'CBW'
  const otpLength = Number(env('MSG91_OTP_LENGTH')) === 6 ? 6 : 4
  const testEnabled = ['1', 'true', 'yes', 'on'].includes(env('OTP_TEST_ENABLED').toLowerCase())
    && env('NODE_ENV').toLowerCase() !== 'production'
  return {
    apiKey,
    template,
    senderId,
    otpLength,
    testEnabled,
    ready: Boolean(apiKey && template),
  }
}

export function normalizePhone(raw) {
  let digits = String(raw || '').replace(/\D/g, '')
  if (digits.length === 10) digits = `91${digits}`
  if (digits.startsWith('0') && digits.length === 11) digits = `91${digits.slice(1)}`
  return digits
}

function hashOtp(phone, code) {
  return createHash('sha256').update(`${phone}:${code}:${env('JWT_SECRET', 'otp')}`).digest('hex')
}

function saveChallenge(phone, code) {
  challenges.set(phone, { hash: hashOtp(phone, code), expiresAt: Date.now() + TTL_MS, verified: false })
}

export async function sendOtp(rawPhone) {
  const cfg = otpConfig()
  const phone = normalizePhone(rawPhone)
  if (!/^\d{10,15}$/.test(phone)) {
    const err = new Error('Enter a valid mobile number with country code.')
    err.status = 400
    throw err
  }

  if (cfg.testEnabled) {
    const max = 10 ** cfg.otpLength
    const min = 10 ** (cfg.otpLength - 1)
    const code = String(randomInt(min, max))
    saveChallenge(phone, code)
    return { ok: true, phone, test: true, otp: code, length: cfg.otpLength, message: `Test OTP sent to +${phone}` }
  }

  if (!cfg.ready) {
    const err = new Error('MSG91 is not configured on the server.')
    err.status = 500
    throw err
  }

  const res = await fetch('https://control.msg91.com/api/v5/otp', {
    method: 'POST',
    headers: { authkey: cfg.apiKey, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      mobile: phone,
      template_id: cfg.template,
      sender: cfg.senderId,
      otp_expiry: 10,
      otp_length: cfg.otpLength,
      realTimeResponse: 1,
    }),
  })
  const data = await res.json().catch(() => ({}))
  const type = String(data.type || data.status || '').toLowerCase()
  if (!res.ok || (type && type !== 'success')) {
    const err = new Error(data.message || data.error || 'Could not send OTP.')
    err.status = res.status >= 400 ? res.status : 502
    throw err
  }
  challenges.set(phone, { hash: 'msg91', expiresAt: Date.now() + TTL_MS, verified: false, provider: 'msg91' })
  return { ok: true, phone, length: cfg.otpLength, message: `OTP sent to +${phone}` }
}

export async function verifyOtp(rawPhone, code) {
  const cfg = otpConfig()
  const phone = normalizePhone(rawPhone)
  const otp = String(code || '').replace(/\D/g, '')
  if (otp.length !== cfg.otpLength) {
    const err = new Error(`Enter the ${cfg.otpLength}-digit OTP.`)
    err.status = 400
    throw err
  }

  const row = challenges.get(phone)
  if (!row || Date.now() > row.expiresAt) {
    const err = new Error('No active OTP. Send a new code first.')
    err.status = 400
    throw err
  }

  if (cfg.testEnabled && row.hash !== 'msg91') {
    if (row.hash !== hashOtp(phone, otp)) {
      const err = new Error('Incorrect or expired OTP.')
      err.status = 400
      throw err
    }
    row.verified = true
    return { ok: true, phone, verified: true }
  }

  const res = await fetch('https://control.msg91.com/api/v5/otp/verify', {
    method: 'POST',
    headers: { authkey: cfg.apiKey, 'Content-Type': 'application/json' },
    body: JSON.stringify({ mobile: phone, otp }),
  })
  const data = await res.json().catch(() => ({}))
  const type = String(data.type || data.status || '').toLowerCase()
  if (!res.ok || (type && type !== 'success')) {
    const err = new Error('Incorrect or expired OTP.')
    err.status = 400
    throw err
  }
  row.verified = true
  return { ok: true, phone, verified: true }
}

export function isPhoneVerified(rawPhone) {
  const phone = normalizePhone(rawPhone)
  const row = challenges.get(phone)
  return Boolean(row?.verified && Date.now() <= row.expiresAt)
}
