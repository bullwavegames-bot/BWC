import { useEffect, useState } from 'react'
import { NavLink, Route, Routes, useLocation, useNavigate, useParams } from 'react-router-dom'
import { useApp } from './store.jsx'

const PACKS = [
  { rupees: 49, credit: 500 },
  { rupees: 99, credit: 1200 },
  { rupees: 199, credit: 3000 },
]

function inr(n) {
  return `₹\u00a0${Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function when(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString()
}

export function SuperAdmin() {
  const { loggedIn, token, user, setAuthMode } = useApp()
  const [key, setKey] = useState(() => sessionStorage.getItem('bwc_admin_key') || '')
  const [staff, setStaff] = useState(null)
  const [gate, setGate] = useState('')
  const [message, setMessage] = useState('')

  const headers = () => ({
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(key.trim() ? { 'x-admin-key': key.trim(), Authorization: token ? `Bearer ${token}` : `Admin ${key.trim()}` } : {}),
  })

  const cleanError = (err) => {
    const raw = String(err || '')
    if (/<!DOCTYPE|Cannot GET|Cannot POST/i.test(raw)) {
      return 'The API has not picked up the Super Admin routes yet. Paste ADMIN_KEY, or wait for Render to finish deploying.'
    }
    return raw || 'Request failed'
  }

  const call = async (path, { method = 'GET', body } = {}) => {
    const res = await fetch(path, {
      method,
      headers: headers(),
      body: method === 'GET' ? undefined : JSON.stringify({ ...(body || {}), ...(key.trim() ? { adminKey: key.trim() } : {}) }),
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) throw new Error(cleanError(data.error || `Request failed (${res.status})`))
    return data
  }

  const download = async (path, filename) => {
    const res = await fetch(path, { headers: headers() })
    if (!res.ok) throw new Error('Download failed')
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  }

  useEffect(() => {
    if (!loggedIn && !key.trim()) return
    call('/api/admin/me')
      .then((data) => { setStaff(data); setGate('') })
      .catch((err) => { setStaff(null); setGate(err.message) })
  }, [loggedIn, token, key])

  const ctx = { call, download, message, setMessage, run: (fn) => fn().catch((err) => setMessage(err.message)) }

  if (!loggedIn && !key.trim()) {
    return (
      <div className="ops">
        <h1>Super Admin</h1>
        <p className="ops-lead">Staff console for people listed in SUPER_ADMIN_EMAILS or SUPER_ADMIN_USER_IDS. It is not a player wallet. Ordinary accounts cannot open it.</p>
        <button type="button" className="btn btn-yellow" onClick={() => setAuthMode('login')}>Staff log in</button>
      </div>
    )
  }

  if (!staff) {
    return (
      <div className="ops">
        <h1>Super Admin</h1>
        <p className="ops-lead">Sign in as allowlisted staff. ADMIN_KEY still works as a fallback for settle if the allowlist is not set.</p>
        {gate && <p className="hint is-bad">{gate}</p>}
        <div className="field"><label>ADMIN_KEY fallback</label><input className="input" type="password" value={key} onChange={(e) => setKey(e.target.value)} autoComplete="off" /></div>
        <button type="button" className="btn btn-ghost" onClick={() => { sessionStorage.setItem('bwc_admin_key', key.trim()); setGate('') }}>Save key on this device</button>
        {loggedIn && <p className="hint">Signed in as {user?.email || user?.phone}. This account is not Super Admin unless it is on the Render allowlist.</p>}
      </div>
    )
  }

  return (
    <div className="ops">
      <div className="ops-head">
        <div>
          <p className="ops-kicker">Staff console</p>
          <h1>Super Admin</h1>
        </div>
        <span className="ops-staff">{staff.staff} · {staff.via}</span>
      </div>
      <p className="ops-lead">Watch the club, find a player, move cash by hand, and freeze abuse. One Super Admin cannot stop, ban, or delete another Super Admin.</p>
      <nav className="ops-nav">
        {[
          ['', 'Overview'],
          ['users', 'Users'],
          ['live', 'Live'],
          ['activity', 'Activity'],
          ['records', 'Records'],
          ['audit', 'Audit'],
          ['health', 'Health'],
        ].map(([to, label]) => (
          <NavLink key={label} end={to === ''} to={to ? `/ops/${to}` : '/ops'}>{label}</NavLink>
        ))}
      </nav>
      {message && <p className="hint">{message}</p>}
      <Routes>
        <Route index element={<Overview ctx={ctx} />} />
        <Route path="users" element={<Users ctx={ctx} />} />
        <Route path="users/:id" element={<Player ctx={ctx} />} />
        <Route path="live" element={<LiveDesk ctx={ctx} />} />
        <Route path="activity" element={<Activity ctx={ctx} />} />
        <Route path="records" element={<Records ctx={ctx} />} />
        <Route path="audit" element={<Audit ctx={ctx} />} />
        <Route path="health" element={<HealthProbe />} />
      </Routes>
    </div>
  )
}

function Overview({ ctx }) {
  const [data, setData] = useState(null)
  useEffect(() => { ctx.run(() => ctx.call('/api/admin/overview').then(setData)) }, [])
  if (!data) return <p className="hint">Loading overview…</p>
  const cards = [
    ['Registered', data.registered],
    ['Live now', data.live],
    ['In a game', data.inGame],
    ['Bets 24h', data.bets24h],
    ['Stake 24h', inr(data.betsStake24h)],
    ['Deposits 24h', `${data.deposits24h} · ${inr(data.depositCash24h)}`],
  ]
  return (
    <div className="ops-grid">
      {cards.map(([label, value]) => (
        <div key={label} className="ops-stat"><small>{label}</small><strong>{value}</strong></div>
      ))}
      <NavLink className="btn btn-ghost" to="/ops/health">Open health check</NavLink>
    </div>
  )
}

function Users({ ctx }) {
  const navigate = useNavigate()
  const [q, setQ] = useState('')
  const [players, setPlayers] = useState([])
  const search = async () => {
    const data = await ctx.call('/api/admin/players', { method: 'POST', body: { q } })
    setPlayers(data.players || [])
    if (!(data.players || []).length) ctx.setMessage('No live players matched. They must exist since the last Render restart.')
  }
  return (
    <div className="payment-shell ops-panel">
      <div className="field"><label>Search email, phone, username, UID, or country</label><input className="input" value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') ctx.run(search) }} /></div>
      <button type="button" className="btn btn-yellow" onClick={() => ctx.run(search)}>Search</button>
      <div className="wallet-tx-list">
        {players.map((p) => (
          <button key={p.id} type="button" className="wallet-tx" onClick={() => navigate(`/ops/users/${p.id}`)}>
            <div>
              <strong>{p.accountNumber} · ID {p.playerId}</strong>
              <small>{p.email || p.phone} · {p.country} · {inr(p.balance)} {p.stopped ? '· STOPPED' : ''} {p.banned ? '· BANNED' : ''} {p.superAdmin ? '· STAFF' : ''}</small>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}

function Player({ ctx }) {
  const { id } = useParams()
  const [picked, setPicked] = useState(null)
  const [tab, setTab] = useState('profile')
  const [rupees, setRupees] = useState(99)
  const [credit, setCredit] = useState(1200)
  const [utr, setUtr] = useState('')
  const [note, setNote] = useState('')
  const [payoutUtr, setPayoutUtr] = useState('')

  const load = async () => {
    const data = await ctx.call(`/api/admin/players/${id}`)
    setPicked(data)
  }
  useEffect(() => { ctx.run(load) }, [id])

  const onPaidChange = (n) => {
    setRupees(n)
    const pack = PACKS.find((p) => p.rupees === n)
    setCredit(pack ? pack.credit : n)
  }

  if (!picked?.user) return <p className="hint">Opening player…</p>
  const u = picked.user

  return (
    <div className="ops-player">
      <NavLink to="/ops/users">← Users</NavLink>
      <h2>{u.accountNumber}</h2>
      <p className="wallet-user">{u.firstName} {u.lastName} · {u.email || u.phone} · {u.country} · cash {inr(u.balance)}</p>
      {u.superAdmin && <p className="hint is-ok">This is Super Admin staff. Stop, ban, and delete are blocked.</p>}
      <div className="ops-nav">
        {['profile', 'wallet', 'bets', 'payments', 'cashouts', 'presence'].map((t) => (
          <button key={t} type="button" className={tab === t ? 'on' : ''} onClick={() => setTab(t)}>{t}</button>
        ))}
      </div>
      {tab === 'profile' && (
        <div className="payment-shell ops-panel">
          <p>UID {u.accountNumber} · player ID {u.playerId}</p>
          <p>Stopped: {u.stopped ? 'yes' : 'no'} · Banned: {u.banned ? 'yes' : 'no'}</p>
          <div className="ops-actions">
            <button type="button" className="btn btn-ghost" onClick={() => ctx.run(async () => { await ctx.call(`/api/admin/players/${u.id}/stop`, { method: 'POST' }); await load() })}>Stop</button>
            <button type="button" className="btn btn-ghost" onClick={() => ctx.run(async () => { await ctx.call(`/api/admin/players/${u.id}/resume`, { method: 'POST' }); await load() })}>Resume</button>
            <button type="button" className="btn btn-ghost" onClick={() => ctx.run(async () => { await ctx.call(`/api/admin/players/${u.id}/ban`, { method: 'POST' }); await load() })}>Ban</button>
            <button type="button" className="btn btn-ghost" onClick={() => ctx.run(async () => { await ctx.call(`/api/admin/players/${u.id}/unban`, { method: 'POST' }); await load() })}>Unban</button>
            <button type="button" className="btn btn-ghost" onClick={() => ctx.run(async () => { await ctx.call(`/api/admin/players/${u.id}/delete`, { method: 'POST' }); await load() })}>Delete</button>
          </div>
        </div>
      )}
      {tab === 'wallet' && (
        <div className="payment-shell ops-panel">
          <strong>Settle bill (UPI deposit)</strong>
          <p>Pack or custom rupees. Cash credits at once. GST bill lands on their Billing tab. Same UTR will not credit twice.</p>
          <div className="wallet-quick">
            {PACKS.map((p) => (
              <button key={p.rupees} type="button" className={`chip ${rupees === p.rupees ? 'on' : ''}`} onClick={() => onPaidChange(p.rupees)}>Pay ₹{p.rupees} · cash {inr(p.credit)}</button>
            ))}
          </div>
          <div className="field"><label>INR paid</label><input className="input" type="number" value={rupees} onChange={(e) => onPaidChange(Number(e.target.value))} /></div>
          <div className="field"><label>Cash to credit, ₹</label><input className="input" type="number" value={credit} onChange={(e) => setCredit(Number(e.target.value))} /></div>
          <div className="field"><label>Deposit UTR</label><input className="input" value={utr} onChange={(e) => setUtr(e.target.value)} /></div>
          <div className="field"><label>Note (optional)</label><input className="input" value={note} onChange={(e) => setNote(e.target.value)} /></div>
          <button type="button" className="btn btn-yellow" onClick={() => ctx.run(async () => {
            const data = await ctx.call('/api/admin/settle-bill', { method: 'POST', body: { userId: u.id, rupees, credit, utr: utr.trim(), note } })
            ctx.setMessage(`Settled ${data.receipt.id}. Cash is now ${inr(data.user.balance)}.`)
            setUtr('')
            await load()
          })}>Settle bill</button>
        </div>
      )}
      {tab === 'bets' && (
        <div className="wallet-tx-list">
          {(picked.bets || []).map((b) => (
            <div key={b.id} className="wallet-tx"><div><strong>{b.status} · {inr(b.stake)}</strong><small>{when(b.createdAt)} · win {inr(b.possibleWin)}</small></div></div>
          ))}
          {!(picked.bets || []).length && <p className="hint">No bets.</p>}
        </div>
      )}
      {tab === 'payments' && (
        <div className="wallet-tx-list">
          {(picked.receipts || []).map((r) => (
            <div key={r.id} className="wallet-tx"><div><strong>{r.id} · {inr(r.credit)}</strong><small>UTR {r.utr} · GST {inr(r.gst)} · {when(r.createdAt)}</small></div></div>
          ))}
          {!(picked.receipts || []).length && <p className="hint">No cash-in bills.</p>}
        </div>
      )}
      {tab === 'cashouts' && (
        <div className="payment-shell ops-panel">
          <p>Cash is already taken when they request cash-out. Mark PAID after you send UPI/bank, or Reject to return cash.</p>
          <div className="field"><label>Payout UTR</label><input className="input" value={payoutUtr} onChange={(e) => setPayoutUtr(e.target.value)} /></div>
          {(picked.cashouts || []).map((c) => (
            <div key={c.id} className="wallet-tx">
              <div><strong>{c.status} · {inr(c.amount)}</strong><small>{c.destination} · {c.payoutUtr || 'no payout UTR'}</small></div>
              {c.status === 'PENDING' && (
                <span className="wallet-actions">
                  <button type="button" className="btn btn-yellow" onClick={() => ctx.run(async () => { await ctx.call(`/api/admin/cashouts/${c.id}/paid`, { method: 'POST', body: { utr: payoutUtr.trim() } }); setPayoutUtr(''); await load() })}>PAID</button>
                  <button type="button" className="btn btn-ghost" onClick={() => ctx.run(async () => { await ctx.call(`/api/admin/cashouts/${c.id}/reject`, { method: 'POST', body: { reason: 'Rejected by Super Admin' } }); await load() })}>Reject</button>
                </span>
              )}
            </div>
          ))}
        </div>
      )}
      {tab === 'presence' && (
        <p>{picked.presence ? `${picked.presence.screen} · ${when(picked.presence.at)}${picked.presence.inGame ? ' · in game' : ''}` : 'Not live.'}</p>
      )}
    </div>
  )
}

function LiveDesk({ ctx }) {
  const [live, setLive] = useState([])
  useEffect(() => { ctx.run(() => ctx.call('/api/admin/live').then((d) => setLive(d.live || []))) }, [])
  return (
    <div className="wallet-tx-list">
      {live.map((row) => (
        <NavLink key={row.userId} className="wallet-tx" to={`/ops/users/${row.userId}`}>
          <div><strong>{row.accountNumber}</strong><small>{row.screen} {row.inGame ? '· game' : ''} · {when(row.at)}</small></div>
        </NavLink>
      ))}
      {!live.length && <p className="hint">Nobody live in the last 90 seconds.</p>}
    </div>
  )
}

function Activity({ ctx }) {
  const [data, setData] = useState({ bets: [], receipts: [], cashouts: [] })
  useEffect(() => { ctx.run(() => ctx.call('/api/admin/activity').then(setData)) }, [])
  return (
    <div className="ops-cols">
      <section>
        <h3>Bets</h3>
        {(data.bets || []).map((b) => <p key={b.id}>{when(b.createdAt)} · {inr(b.stake)} · {b.status}</p>)}
      </section>
      <section>
        <h3>Cash in</h3>
        {(data.receipts || []).map((r) => <p key={r.id}>{when(r.createdAt)} · {inr(r.credit)} · {r.utr}</p>)}
      </section>
      <section>
        <h3>Cash-out</h3>
        {(data.cashouts || []).map((c) => <p key={c.id}>{when(c.createdAt)} · {c.status} · {inr(c.amount)}</p>)}
      </section>
    </div>
  )
}

function Records({ ctx }) {
  const [data, setData] = useState({ receipts: [], cashouts: [], billTotal: 0, paidTotal: 0 })
  useEffect(() => { ctx.run(() => ctx.call('/api/admin/records').then(setData)) }, [])
  return (
    <div>
      <p>Bills {inr(data.billTotal)} · Paid cash-outs {inr(data.paidTotal)}</p>
      <div className="ops-actions">
        <button type="button" className="btn btn-ghost" onClick={() => ctx.run(() => ctx.download('/api/admin/records.csv', 'bwc-records.csv'))}>Download CSV</button>
      </div>
      <div className="wallet-tx-list">
        {(data.receipts || []).map((r) => (
          <div key={r.id} className="wallet-tx">
            <div><strong>BILL {r.id} · {inr(r.credit)}</strong><small>{r.phone || r.email} · UTR {r.utr} · GST {inr(r.gst)} · {when(r.createdAt)}</small></div>
            <button type="button" className="btn btn-ghost" onClick={() => ctx.run(() => ctx.download(`/api/admin/receipts/${r.id}.pdf`, `${r.id}.pdf`))}>PDF</button>
          </div>
        ))}
        {(data.cashouts || []).map((c) => (
          <div key={c.id} className="wallet-tx"><div><strong>OUT {c.status} · {inr(c.amount)}</strong><small>{c.phone || c.email} · {c.payoutUtr || '—'} · {when(c.createdAt)}</small></div></div>
        ))}
      </div>
    </div>
  )
}

function Audit({ ctx }) {
  const [audit, setAudit] = useState([])
  useEffect(() => { ctx.run(() => ctx.call('/api/admin/audit').then((d) => setAudit(d.audit || []))) }, [])
  return (
    <div className="wallet-tx-list">
      {audit.map((row) => (
        <div key={row.id} className="wallet-tx"><div><strong>{row.action} · {row.targetUid || row.targetId}</strong><small>{row.actor} · {when(row.at)}</small></div></div>
      ))}
      {!audit.length && <p className="hint">No stop/ban/settle actions yet this process.</p>}
    </div>
  )
}

export function OpsHealth() {
  return <HealthProbe />
}

function HealthProbe() {
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  const ping = () => {
    fetch('/api/health').then((r) => r.json()).then(setData).catch((err) => setError(err.message))
  }
  useEffect(() => { ping() }, [])
  return (
    <div className="ops">
      <h2>Health check</h2>
      <p className="ops-lead">Separate probe from Overview. Hits the live API without opening the staff desk.</p>
      <button type="button" className="btn btn-yellow" onClick={ping}>Ping API</button>
      {error && <p className="hint is-bad">{error}</p>}
      {data && <pre className="billing-proof">{JSON.stringify(data, null, 2)}</pre>}
    </div>
  )
}

export function PresencePing() {
  const { token, loggedIn } = useApp()
  const loc = useLocation()
  useEffect(() => {
    if (!loggedIn || !token) return undefined
    const inGame = loc.pathname.startsWith('/casino')
    const send = () => fetch('/api/presence', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ path: loc.pathname, screen: loc.pathname, inGame }),
    }).catch(() => {})
    send()
    const timer = window.setInterval(send, 25000)
    return () => window.clearInterval(timer)
  }, [loggedIn, token, loc.pathname])
  return null
}
