import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { sendOtp, verifyOtp } from './api.js'
import { isStrongPassword, PASSWORD_HINT } from './authRules.js'
import { playerPublicId } from './ProfileHub.jsx'
import { useApp } from './store.jsx'

const QUESTIONS = [
  'PIN code (first 4 digits of a memorable number)',
  'Mother’s maiden name',
  'First school name',
  'Favourite sports team',
  'Name of first pet',
]

function maskEmail(email) {
  const [name, domain] = String(email || '').split('@')
  if (!name || !domain) return email || '—'
  const keep = name.slice(0, Math.min(3, name.length))
  return `${keep}***@${domain}`
}

export function PersonalData() {
  const { user, loggedIn, setAuthMode, saveProfile, resetPasswordWithPhone } = useApp()
  const [firstName, setFirstName] = useState(user?.firstName || '')
  const [lastName, setLastName] = useState(user?.lastName || '')
  const [dob, setDob] = useState(user?.dob || '')
  const [country, setCountry] = useState(user?.country || 'India')
  const [city, setCity] = useState(user?.city || '')
  const [secretQuestion, setSecretQuestion] = useState(user?.secretQuestion || QUESTIONS[0])
  const [secretAnswer, setSecretAnswer] = useState(user?.secretAnswer || '')
  const [phone, setPhone] = useState(String(user?.phone || '').replace(/\D/g, '').slice(-10))
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)
  const [otp, setOtp] = useState('')
  const [otpHint, setOtpHint] = useState('')
  const [otpOk, setOtpOk] = useState(false)
  const [newPass, setNewPass] = useState('')
  const id = playerPublicId(user)
  const ready = firstName && lastName && dob && country && city && secretQuestion && secretAnswer && phone.length === 10

  if (!loggedIn) {
    return (
      <div className="pdata">
        <p className="hint is-bad">Sign in to edit personal data.</p>
        <button type="button" className="btn btn-yellow" onClick={() => setAuthMode('login')}>Log in</button>
      </div>
    )
  }

  const save = async () => {
    setBusy(true)
    setMessage('')
    try {
      const nextPhone = `+91${phone}`
      if (phone !== String(user?.phone || '').replace(/\D/g, '').slice(-10) && !otpOk) {
        throw new Error('Send OTP and verify this phone before saving a new number.')
      }
      await saveProfile({ firstName, lastName, dob, country, city, secretQuestion, secretAnswer, phone: nextPhone })
      setMessage('Personal data saved.')
    } catch (err) {
      setMessage(err.message)
    } finally {
      setBusy(false)
    }
  }

  const requestResetOtp = async () => {
    setBusy(true)
    setMessage('')
    try {
      const data = await sendOtp(`+91${phone}`)
      setOtpHint(data.test && data.otp ? `Test OTP: ${data.otp}` : data.message || 'OTP sent to your phone.')
      setOtpOk(false)
    } catch (err) {
      setMessage(err.message)
    } finally {
      setBusy(false)
    }
  }

  const checkOtp = async () => {
    setBusy(true)
    setMessage('')
    try {
      await verifyOtp(`+91${phone}`, otp)
      setOtpOk(true)
      setOtpHint('Phone verified. Set a new password.')
    } catch (err) {
      setOtpOk(false)
      setMessage(err.message)
    } finally {
      setBusy(false)
    }
  }

  const savePassword = async () => {
    setBusy(true)
    setMessage('')
    try {
      if (!isStrongPassword(newPass)) throw new Error(`Password must be ${PASSWORD_HINT}.`)
      await resetPasswordWithPhone({ phone: `+91${phone}`, otp, password: newPass })
      setMessage('Password updated. Use it the next time you log in.')
      setNewPass('')
      setOtp('')
      setOtpOk(false)
    } catch (err) {
      setMessage(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="pdata">
      <div className="pdata-head">
        <NavLink to="/profile" className="pdata-back" aria-label="Back">‹</NavLink>
        <h1>Personal data</h1>
      </div>
      <div className="pdata-banner">
        <span className="pdata-idcard" aria-hidden="true">🪪</span>
        <div>
          <strong>Fill in the required fields</strong>
          <p>Attention: Personal data must be real and accurate, matching the information on your Aadhaar card.</p>
        </div>
      </div>
      <p className="pdata-label">Contacts</p>
      <div className="pdata-card">
        <div className="pdata-row">
          <span>
            <small>Account number</small>
            <b>{id || '—'}</b>
          </span>
          <button type="button" className="pdata-copy" onClick={() => navigator.clipboard.writeText(id)} aria-label="Copy account number">⧉</button>
        </div>
        <div className="pdata-row pdata-email">
          <span>
            <small className={user?.email ? 'is-ok' : ''}>{user?.email ? 'E-mail confirmed' : 'E-mail'}</small>
            <b>{maskEmail(user?.email)}</b>
          </span>
        </div>
      </div>
      <p className="pdata-label">Add your details</p>
      <div className="pdata-card pdata-form">
        <label className="pdata-phone">
          <span className="pdata-flag" aria-hidden="true">🇮🇳</span>
          <span>
            <small>Phone *</small>
            <input className="input" inputMode="numeric" maxLength={10} value={phone} onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))} placeholder="+91 (XXXX) XXX - XXX" />
          </span>
        </label>
        <input className="input" placeholder="First name (as specified in your Aadhaar Card) *" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
        <input className="input" placeholder="Last name (as specified in your Aadhaar Card) *" value={lastName} onChange={(e) => setLastName(e.target.value)} />
        <label className="pdata-field">
          <small>Date of birth *</small>
          <input className="input" placeholder="DD.MM.YYYY" value={dob} onChange={(e) => setDob(e.target.value)} />
        </label>
        <label className="pdata-select">
          <small>Country *</small>
          <select className="input" value={country} onChange={(e) => setCountry(e.target.value)}>
            {['India', 'Nepal', 'Bangladesh', 'Sri Lanka', 'United Arab Emirates', 'United Kingdom'].map((c) => <option key={c}>{c}</option>)}
          </select>
        </label>
        <input className="input" placeholder="City *" value={city} onChange={(e) => setCity(e.target.value)} />
        <label className="pdata-select">
          <small>Secret question *</small>
          <select className="input" value={secretQuestion} onChange={(e) => setSecretQuestion(e.target.value)}>
            {QUESTIONS.map((q) => <option key={q}>{q}</option>)}
          </select>
        </label>
        <input className="input" placeholder="Secret answer *" value={secretAnswer} onChange={(e) => setSecretAnswer(e.target.value)} />
        <button type="button" className="btn btn-yellow btn-block" disabled={!ready || busy} onClick={save}>{busy ? 'Saving…' : 'Save'}</button>
      </div>
      <div className="pdata-card pdata-pass">
        <strong>Change password</strong>
        <p>Email cannot reset a password. Verify this phone with OTP, then choose a new one.</p>
        <button type="button" className="btn btn-ghost" disabled={busy || phone.length !== 10} onClick={requestResetOtp}>Send OTP</button>
        {otpHint && <p className="hint is-ok">{otpHint}</p>}
        <input className="input" placeholder="4-digit OTP" value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))} />
        <button type="button" className="btn btn-ghost" disabled={busy || otp.length < 4} onClick={checkOtp}>Verify phone</button>
        {otpOk && (
          <>
            <input className="input" type="password" placeholder={`New password (${PASSWORD_HINT})`} value={newPass} onChange={(e) => setNewPass(e.target.value)} />
            <button type="button" className="btn btn-yellow" disabled={busy} onClick={savePassword}>Save new password</button>
          </>
        )}
      </div>
      {message && <p className={`hint ${/saved|updated/i.test(message) ? 'is-ok' : 'is-bad'}`}>{message}</p>}
      <NavLink className="pdata-help" to="/faq">Problems with personal data? Contact support</NavLink>
    </div>
  )
}
