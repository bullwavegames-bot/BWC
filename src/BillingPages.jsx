import { useEffect, useState } from 'react'
import { NavLink } from 'react-router-dom'
import { api } from './api.js'
import { useApp } from './store.jsx'

function inr(n) {
  return `₹\u00a0${Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function packCredit(pack, rupees) {
  if (pack?.credit) return pack.credit
  return Number(rupees || 0)
}

export function TelegramCashIn({ user, token }) {
  const [config, setConfig] = useState(null)
  const [rupees, setRupees] = useState(99)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    api('/api/billing/config').then(setConfig).catch(() => {
      setConfig({
        packs: [
          { id: 'p49', rupees: 49, credit: 500 },
          { id: 'p99', rupees: 99, credit: 1200 },
          { id: 'p199', rupees: 199, credit: 3000 },
        ],
        telegramChannel: 'https://t.me/bullwaveclub',
        cashoutHours: 12,
      })
    })
  }, [])

  const packs = config?.packs || []
  const pack = packs.find((p) => p.rupees === Number(rupees))
  const credit = packCredit(pack, rupees)
  const channel = config?.telegramChannel || 'https://t.me/bullwaveclub'
  const uid = user?.accountNumber || '—'
  const username = user?.username || user?.email || user?.phone || '—'
  const proof = [
    'Bullwave Club cash-in proof',
    `Username: ${username}`,
    `UID: ${uid}`,
    `Pay: ₹${rupees} → cash credit ₹${credit}`,
    'UTR: ',
    'Screenshot: attached',
  ].join('\n')

  const copyProof = async () => {
    await navigator.clipboard.writeText(proof)
    setCopied(true)
    setTimeout(() => setCopied(false), 1600)
  }

  return (
    <div className="payment-shell">
      <div className="content-section-title"><h2>Telegram UPI packs</h2><span>Cash in INR</span></div>
      <p className="wallet-method-note">Pay the official UPI QR in Telegram. This site never auto-credits from a static QR. Super Admin settles one unique UTR into cash.</p>
      <div className="wallet-quick">
        {packs.map((p) => (
          <button key={p.id} type="button" className={`chip ${Number(rupees) === p.rupees ? 'on' : ''}`} onClick={() => setRupees(p.rupees)}>
            Pay ₹{p.rupees} · get {inr(p.credit)}
          </button>
        ))}
      </div>
      <div className="field">
        <label>Custom rupees</label>
        <input className="input" type="number" min="49" value={rupees} onChange={(e) => setRupees(Number(e.target.value))} />
      </div>
      <div className="wallet-summary">
        <span>You pay</span><b>{inr(rupees)}</b>
        <span>Cash credited</span><b>{inr(credit)}</b>
        <span>When</span><b>After Settle bill</b>
      </div>
      <ol className="wallet-notes">
        <li>Open the official channel and pay that QR only.</li>
        <li>Copy the proof template, add UTR, attach the screenshot.</li>
        <li>Wait for Super Admin. Same UTR cannot pay twice.</li>
      </ol>
      <div className="wallet-actions">
        <a className="btn btn-yellow" href={channel} target="_blank" rel="noreferrer">Open Telegram channel</a>
        <button type="button" className="btn btn-ghost" onClick={copyProof} disabled={!token}>{copied ? 'Proof copied' : 'Copy proof template'}</button>
        <NavLink className="btn btn-ghost" to="/account/billing">Billing receipts</NavLink>
      </div>
      <pre className="billing-proof">{proof}</pre>
    </div>
  )
}

export function BillingPage() {
  const { token, user, loggedIn, setAuthMode } = useApp()
  const [data, setData] = useState({ receipts: [], cashouts: [] })
  const [error, setError] = useState('')

  useEffect(() => {
    if (!token) return
    api('/api/billing/me', { token }).then(setData).catch((err) => setError(err.message))
  }, [token])

  if (!loggedIn) {
    return (
      <div className="content-page">
        <p className="hint is-bad">Sign in to see receipts.</p>
        <button type="button" className="btn btn-yellow" onClick={() => setAuthMode('login')}>Log in</button>
      </div>
    )
  }

  const download = async (id) => {
    const res = await fetch(`/api/billing/receipts/${id}.pdf`, { headers: { Authorization: `Bearer ${token}` } })
    if (!res.ok) throw new Error('Could not download PDF')
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${id}.pdf`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="content-page">
      <div className="content-section-title"><h2>Billing</h2><span>Cash · unique UTR</span></div>
      <p className="wallet-user">UID {user?.accountNumber} · cash {inr(user?.balance)}</p>
      {error && <p className="hint is-bad">{error}</p>}
      {!data.receipts.length && <p className="wallet-empty-tx">No cash-in receipts yet. Telegram UPI credits only after Super Admin Settle bill.</p>}
      <div className="wallet-tx-list">
        {data.receipts.map((r) => (
          <div key={r.id} className="wallet-tx">
            <div>
              <strong>{r.id} · {inr(r.credit)}</strong>
              <small>UTR {r.utr} · paid {inr(r.rupees)} · GST {inr(r.gst || 0)} · {new Date(r.createdAt).toLocaleString()}</small>
            </div>
            <button type="button" className="btn btn-ghost" onClick={() => download(r.id).catch((e) => setError(e.message))}>PDF</button>
          </div>
        ))}
      </div>
      <div className="content-section-title"><h2>Cash-outs</h2><span>PENDING then PAID</span></div>
      <div className="wallet-tx-list">
        {data.cashouts.map((c) => (
          <div key={c.id} className="wallet-tx">
            <div>
              <strong>{c.status} · {inr(c.amount)}</strong>
              <small>{c.destination} · {c.payoutUtr || 'UTR after staff pay'} · {c.note}</small>
            </div>
            <b className="is-out">−{inr(c.amount)}</b>
          </div>
        ))}
      </div>
    </div>
  )
}
