import { createHash, randomInt } from 'node:crypto'
import { isTenDigitPhone } from '../src/authRules.js'

const challenges = new Map()
const TTL_MS = 10 * 60 * 1000
const RESEND_COOLDOWN_MS = 30 * 1000
const MAX_VERIFY_ATTEMPTS = 5

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
    && env('RENDER').toLowerCase() !== 'true'
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
  challenges.set(phone, {
    hash: hashOtp(phone, code),
    expiresAt: Date.now() + TTL_MS,
    sentAt: Date.now(),
    attempts: 0,
    verified: false,
  })
}

export async function sendOtp(rawPhone) {
  const cfg = otpConfig()
  const phone = normalizePhone(rawPhone)
  if (!isTenDigitPhone(rawPhone)) {
    const err = new Error('Enter a 10-digit mobile number.')
    err.status = 400
    throw err
  }
  if (!/^\d{10,15}$/.test(phone)) {
    const err = new Error('Enter a valid mobile number with country code.')
    err.status = 400
    throw err
  }

  const active = challenges.get(phone)
  if (active && Date.now() - active.sentAt < RESEND_COOLDOWN_MS) {
    const err = new Error('Please wait 30 seconds before requesting another OTP.')
    err.status = 429
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

  const sendUrl = new URL('https://control.msg91.com/api/v5/otp')
  sendUrl.searchParams.set('template_id', cfg.template)
  sendUrl.searchParams.set('mobile', phone)
  sendUrl.searchParams.set('authkey', cfg.apiKey)
  sendUrl.searchParams.set('otp_expiry', '10')
  sendUrl.searchParams.set('otp_length', String(cfg.otpLength))
  if (cfg.senderId) sendUrl.searchParams.set('sender', cfg.senderId)

  const res = await fetch(sendUrl, {
    method: 'POST',
    headers: { authkey: cfg.apiKey, Accept: 'application/json', 'Content-Type': 'application/json' },
    body: '{}',
  })
  const data = await res.json().catch(() => ({}))
  const type = String(data.type || data.status || '').toLowerCase()
  if (!res.ok || (type && type !== 'success')) {
    const err = new Error(data.message || data.error || 'Could not send OTP.')
    err.status = res.status >= 400 ? res.status : 502
    throw err
  }
  challenges.set(phone, {
    hash: 'msg91',
    expiresAt: Date.now() + TTL_MS,
    sentAt: Date.now(),
    attempts: 0,
    verified: false,
    provider: 'msg91',
  })
  return { ok: true, phone, length: cfg.otpLength, message: `OTP sent to +${phone}` }
}

export async function verifyOtp(rawPhone, code, { consume = false } = {}) {
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
    challenges.delete(phone)
    const err = new Error('No active OTP. Send a new code first.')
    err.status = 400
    throw err
  }

  row.attempts = Number(row.attempts || 0) + 1
  if (row.attempts > MAX_VERIFY_ATTEMPTS) {
    challenges.delete(phone)
    const err = new Error('Too many incorrect attempts. Send a new OTP.')
    err.status = 429
    throw err
  }

  if (cfg.testEnabled && row.hash !== 'msg91') {
    if (row.hash !== hashOtp(phone, otp)) {
      const err = new Error('Incorrect or expired OTP.')
      err.status = 400
      throw err
    }
    row.verified = true
    if (consume) challenges.delete(phone)
    return { ok: true, phone, verified: true }
  }

  const verifyUrl = new URL('https://control.msg91.com/api/v5/otp/verify')
  verifyUrl.searchParams.set('mobile', phone)
  verifyUrl.searchParams.set('otp', otp)
  const res = await fetch(verifyUrl, {
    method: 'GET',
    headers: { authkey: cfg.apiKey, Accept: 'application/json' },
  })
  const data = await res.json().catch(() => ({}))
  const type = String(data.type || data.status || '').toLowerCase()
  if (!res.ok || (type && type !== 'success')) {
    const err = new Error('Incorrect or expired OTP.')
    err.status = 400
    throw err
  }
  row.verified = true
  if (consume) challenges.delete(phone)
  return { ok: true, phone, verified: true }
}

export function isPhoneVerified(rawPhone) {
  const phone = normalizePhone(rawPhone)
  const row = challenges.get(phone)
  return Boolean(row?.verified && Date.now() <= row.expiresAt)
}

export function consumePhoneVerification(rawPhone) {
  const phone = normalizePhone(rawPhone)
  const row = challenges.get(phone)
  const verified = Boolean(row?.verified && Date.now() <= row.expiresAt)
  if (verified) challenges.delete(phone)
  return verified
}
