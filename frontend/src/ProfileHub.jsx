import { NavLink, useNavigate } from 'react-router-dom'
import { useApp } from './store.jsx'

export function playerPublicId(user) {
  if (user?.playerId) return String(user.playerId)
  if (user?.accountNumber) return String(user.accountNumber).replace(/^BW/i, '')
  return ''
}

function Row({ to, icon, label, onClick }) {
  const inner = (
    <>
      <span className="profile-row-icon" aria-hidden="true">{icon}</span>
      <span>{label}</span>
      <span className="profile-row-chevron">›</span>
    </>
  )
  if (onClick) {
    return <button type="button" className="profile-row" onClick={onClick}>{inner}</button>
  }
  return <NavLink to={to} className="profile-row">{inner}</NavLink>
}

const Ico = {
  card: (
    <svg viewBox="0 0 24 24" width="20" height="20"><rect x="3" y="6" width="18" height="13" rx="2" fill="none" stroke="currentColor" strokeWidth="1.8" /><path d="M3 10h18" stroke="currentColor" strokeWidth="1.8" /><path d="M7 15h4" stroke="currentColor" strokeWidth="1.8" /></svg>
  ),
  headset: (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M4 13a8 8 0 0 1 16 0" /><rect x="3" y="13" width="4" height="7" rx="1.5" /><rect x="17" y="13" width="4" height="7" rx="1.5" /><path d="M12 21v-2" /></svg>
  ),
  gift: (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="8" width="18" height="13" rx="2" /><path d="M12 8v13M3 12h18M12 8c0-3 4-4 4-1s-4 1-4 1c0-3-4-4-4-1s4 1 4 1" /></svg>
  ),
  person: (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="8" r="3.2" /><path d="M5 19c1.2-3.2 3.5-5 7-5s5.8 1.8 7 5" /></svg>
  ),
  clock: (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="8" /><path d="M12 8v5l3 2" /></svg>
  ),
  ticket: (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M4 9a2 2 0 0 0 2-2h12a2 2 0 0 0 2 2v6a2 2 0 0 0-2 2H6a2 2 0 0 0-2-2z" /></svg>
  ),
  gear: (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="3" /><path d="M12 3v2M12 19v2M4.9 6.5l1.5 1.5M17.6 16l1.5 1.5M3 12h2M19 12h2M4.9 17.5l1.5-1.5M17.6 8l1.5-1.5" /></svg>
  ),
  info: (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="8" /><path d="M12 11v5M12 8h.01" /></svg>
  ),
  logout: (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M10 7V5a2 2 0 0 1 2-2h7v18h-7a2 2 0 0 1-2-2v-2M4 12h11M12 8l4 4-4 4" /></svg>
  ),
}

export function ProfileAvatar({ to = '/profile' }) {
  return (
    <NavLink to={to} className="profile-avatar" aria-label="Open profile">
      <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#0c191b" strokeWidth="1.7">
        <circle cx="12" cy="8.2" r="3.4" />
        <path d="M5 19.2c1.4-3.5 3.8-5.2 7-5.2s5.6 1.7 7 5.2" />
      </svg>
      <i />
    </NavLink>
  )
}

export function ProfileHub() {
  const { user, loggedIn, logout, setAuthMode } = useApp()
  const navigate = useNavigate()
  const cash = Number(user?.balance || 0)
  const id = playerPublicId(user)

  const copyId = async () => {
    try { await navigator.clipboard.writeText(id) } catch { /* ignore */ }
  }

  if (!loggedIn) {
    return (
      <div className="profile-page">
        <p className="profile-guest">Sign in to open your profile.</p>
        <button type="button" className="btn btn-yellow" onClick={() => setAuthMode('login')}>Log in</button>
      </div>
    )
  }

  return (
    <div className="profile-page">
      <div className="profile-id">
        <span>ID {id || '—'}</span>
        <button type="button" className="profile-id-copy" onClick={copyId} aria-label="Copy ID">⧉</button>
      </div>
      <div className="profile-balance-card">
        <NavLink to="/account" className="profile-balance">
          <span className="profile-row-icon">{Ico.card}</span>
          <span>
            <small>Player balance</small>
            <strong>{cash.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} INR</strong>
          </span>
          <span className="profile-row-chevron">›</span>
        </NavLink>
        <div className="profile-cash-actions">
          <NavLink to="/account/deposit" className="profile-dep">+ Deposit</NavLink>
          <NavLink to="/account/withdraw" className="profile-wd">Withdrawal</NavLink>
        </div>
      </div>
      <div className="profile-list">
        <Row to="/faq" icon={Ico.headset} label="Contact Support" />
        <Row to="/promotions" icon={Ico.gift} label="Special Offers" />
        <Row to="/account/verify" icon={Ico.person} label="Personal Data" />
        <Row to="/account/billing" icon={Ico.clock} label="Payments History" />
        <Row to="/account/bets" icon={Ico.ticket} label="My Bets" />
      </div>
      <p className="profile-group">Personalization</p>
      <div className="profile-list">
        <Row to="/account/settings" icon={Ico.gear} label="Settings" />
        <Row to="/faq" icon={Ico.info} label="Help and Information" />
      </div>
      <button
        type="button"
        className="profile-row profile-logout"
        onClick={async () => { await logout(); navigate('/') }}
      >
        <span className="profile-row-icon">{Ico.logout}</span>
        <span>Log out</span>
      </button>
    </div>
  )
}
