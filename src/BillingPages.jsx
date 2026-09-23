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
              <small>UTR {r.utr} · paid {inr(r.rupees)} · {new Date(r.createdAt).toLocaleString()}</small>
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

export function AdminDesk() {
  const [key, setKey] = useState(() => sessionStorage.getItem('bwc_admin_key') || '')
  const [query, setQuery] = useState('')
  const [players, setPlayers] = useState([])
  const [picked, setPicked] = useState(null)
  const [rupees, setRupees] = useState(99)
  const [credit, setCredit] = useState(1200)
  const [utr, setUtr] = useState('')
  const [payoutUtr, setPayoutUtr] = useState('')
  const [cashouts, setCashouts] = useState([])
  const [message, setMessage] = useState('')

  const headers = () => ({
    'Content-Type': 'application/json',
    'x-admin-key': key,
    Authorization: `Admin ${key}`,
  })

  const saveKey = () => {
    sessionStorage.setItem('bwc_admin_key', key)
    setMessage('Admin key stored in this browser tab only.')
  }

  const search = async () => {
    const res = await fetch(`/api/admin/players?q=${encodeURIComponent(query)}`, { headers: headers() })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) throw new Error(data.error || 'Admin search failed')
    setPlayers(data.players || [])
  }

  const openPlayer = async (id) => {
    const res = await fetch(`/api/admin/players/${id}`, { headers: headers() })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) throw new Error(data.error || 'Player not found')
    setPicked(data)
  }

  const settle = async () => {
    const res = await fetch('/api/admin/settle-bill', {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify({ userId: picked?.user?.id, rupees, credit, utr }),
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) throw new Error(data.error || 'Settle failed')
    setMessage(`Settled ${data.receipt.id}. Cash is now ${inr(data.user.balance)}.`)
    setUtr('')
    await openPlayer(picked.user.id)
  }

  const loadCashouts = async () => {
    const res = await fetch('/api/admin/cashouts', { headers: headers() })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) throw new Error(data.error || 'Cash-outs failed')
    setCashouts(data.cashouts || [])
  }

  const markPaid = async (id) => {
    const res = await fetch(`/api/admin/cashouts/${id}/paid`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify({ utr: payoutUtr }),
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) throw new Error(data.error || 'Could not mark PAID')
    setMessage(`Cash-out ${id.slice(0, 8)} marked PAID.`)
    setPayoutUtr('')
    await loadCashouts()
  }

  const reject = async (id) => {
    const res = await fetch(`/api/admin/cashouts/${id}/reject`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify({ reason: 'Rejected by Super Admin' }),
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) throw new Error(data.error || 'Could not reject')
    setMessage('Cash-out rejected and cash returned.')
    await loadCashouts()
  }

  const run = (fn) => fn().catch((err) => setMessage(err.message))

  const onPaidChange = (n) => {
    setRupees(n)
    if (n === 49) setCredit(500)
    else if (n === 99) setCredit(1200)
    else if (n === 199) setCredit(3000)
    else setCredit(n)
  }

  return (
    <div className="content-page">
      <div className="content-section-title"><h2>Super Admin</h2><span>Settle bill · unique UTR</span></div>
      <div className="payment-shell">
        <div className="field"><label>ADMIN_KEY</label><input className="input" type="password" value={key} onChange={(e) => setKey(e.target.value)} /></div>
        <button type="button" className="btn btn-ghost" onClick={saveKey}>Save key on this device</button>
        <div className="field"><label>Find player (UID, phone, e-mail)</label><input className="input" value={query} onChange={(e) => setQuery(e.target.value)} /></div>
        <button type="button" className="btn btn-yellow" onClick={() => run(search)}>Search</button>
        {message && <p className="hint">{message}</p>}
        <div className="wallet-tx-list">
          {players.map((p) => (
            <button key={p.id} type="button" className="wallet-tx" onClick={() => run(() => openPlayer(p.id))}>
              <div><strong>{p.accountNumber}</strong><small>{p.phone || p.email} · {inr(p.balance)} cash</small></div>
            </button>
          ))}
        </div>
      </div>
      {picked?.user && (
        <div className="payment-shell">
          <h3>{picked.user.accountNumber}</h3>
          <p className="wallet-user">{picked.user.phone || picked.user.email} · cash {inr(picked.user.balance)}</p>
          <div className="field"><label>INR paid</label><input className="input" type="number" value={rupees} onChange={(e) => onPaidChange(Number(e.target.value))} /></div>
          <div className="field"><label>Cash to credit, ₹</label><input className="input" type="number" value={credit} onChange={(e) => setCredit(Number(e.target.value))} /></div>
          <div className="field"><label>Deposit UTR</label><input className="input" value={utr} onChange={(e) => setUtr(e.target.value)} /></div>
          <button type="button" className="btn btn-yellow btn-block" onClick={() => run(settle)}>Settle bill</button>
        </div>
      )}
      <div className="content-section-title"><h2>Pending cash-outs</h2><span>Pay outside · mark PAID</span></div>
      <div className="payment-shell">
        <button type="button" className="btn btn-ghost" onClick={() => run(loadCashouts)}>Refresh cash-outs</button>
        <div className="field"><label>Payout UTR</label><input className="input" value={payoutUtr} onChange={(e) => setPayoutUtr(e.target.value)} /></div>
        {cashouts.map((c) => (
          <div key={c.id} className="wallet-tx">
            <div>
              <strong>{c.status} · {c.accountNumber} · {inr(c.amount)}</strong>
              <small>{c.destination} · {c.payoutUtr || 'no payout UTR yet'}</small>
            </div>
            {c.status === 'PENDING' && (
              <span className="wallet-actions">
                <button type="button" className="btn btn-yellow" onClick={() => run(() => markPaid(c.id))}>PAID</button>
                <button type="button" className="btn btn-ghost" onClick={() => run(() => reject(c.id))}>Reject</button>
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
