import { useMemo, useState } from 'react'
import { NavLink, Route, Routes, useParams } from 'react-router-dom'
import { useApp } from './store.jsx'
import { sendOtp, verifyOtp } from './api.js'
import { accountLinks, faqs, games, languages, leagues, matchMarkets, promotions, shortcuts, sports } from './data.js'

function Icon({ name, size = 18 }) {
  const s = { width: size, height: size, fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round' }
  const paths = {
    menu: <path d="M4 6h16M4 12h16M4 18h16" />,
    search: <><circle cx="11" cy="11" r="7" /><path d="m20 20-3-3" /></>,
    live: <path d="M4 12h3l2-6 4 12 2-6h5" />,
    cal: <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M8 3v4M16 3v4M3 10h18" /></>,
    gift: <><rect x="3" y="8" width="18" height="13" rx="2" /><path d="M12 8v13M3 12h18M12 8c0-3 4-4 4-1s-4 1-4 1c0-3-4-4-4-1s4 1 4 1" /></>,
    casino: <><rect x="5" y="3" width="14" height="18" rx="2" /><path d="M9 8h6M9 12h6M9 16h4" /></>,
    zap: <path d="M13 2 4 14h7l-1 8 9-12h-7z" />,
    slots: <><rect x="3" y="4" width="18" height="16" rx="2" /><path d="M8 8v8M12 8v8M16 8v8" /></>,
    tv: <><rect x="3" y="6" width="18" height="12" rx="2" /><path d="M8 21h8" /></>,
    virtual: <><circle cx="12" cy="12" r="8" /><path d="M12 8v4l3 2" /></>,
    star: <path d="m12 3 2.4 6.6H21l-5.4 4 2.1 6.4L12 16.8 6.3 20l2.1-6.4L3 9.6h6.6z" />,
    layers: <path d="m12 3 9 5-9 5-9-5 9-5zM3 13l9 5 9-5M3 17l9 5 9-5" />,
    football: <circle cx="12" cy="12" r="8" />,
    cricket: <path d="M5 19 19 5M8 19h8M5 16V8" />,
    basketball: <><circle cx="12" cy="12" r="8" /><path d="M4.5 12h15M12 4.5c3 3 3 12 0 15M12 4.5c-3 3-3 12 0 15" /></>,
    tennis: <><circle cx="12" cy="12" r="8" /><path d="M6 7c4 2 8 8 10 11" /></>,
    table: <><circle cx="12" cy="12" r="3" /><path d="M4 12h16" /></>,
    horse: <path d="M5 18c2-6 6-10 14-12-2 4-1 8-4 11H8" />,
    ticket: <path d="M4 8a2 2 0 0 0 2-2h12a2 2 0 0 0 2 2v8a2 2 0 0 0-2 2H6a2 2 0 0 0-2-2z" />,
    plus: <path d="M12 5v14M5 12h14" />,
    minus: <path d="M5 12h14" />,
    shield: <path d="M12 3 20 7v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V7z" />,
    gear: <><circle cx="12" cy="12" r="3" /><path d="M12 3v2M12 19v2M4.9 6.5l1.5 1.5M17.6 16l1.5 1.5M3 12h2M19 12h2M4.9 17.5l1.5-1.5M17.6 8l1.5-1.5" /></>,
    heart: <path d="M12 20s-7-4.5-7-10a4 4 0 0 1 7-2 4 4 0 0 1 7 2c0 5.5-7 10-7 10z" />,
    close: <path d="M6 6l12 12M18 6 6 18" />,
  }
  return <svg viewBox="0 0 24 24" {...s}>{paths[name] || paths.star}</svg>
}

function LanguagePicker({ embedded = false }) {
  const { language, setLanguage, langOpen, setLangOpen } = useApp()
  const current = languages.find((l) => l.code === language) || languages[1]
  const pick = (code) => {
    setLanguage(code)
    setLangOpen(false)
    const item = languages.find((l) => l.code === code)
    document.documentElement.lang = code.toLowerCase()
    document.documentElement.dir = item?.dir || 'ltr'
  }
  const list = (
    <div className={`lang-menu ${embedded ? 'in-page' : ''}`}>
      {languages.map((l) => (
        <button key={l.code} type="button" className={`lang-row ${language === l.code ? 'on' : ''}`} onClick={() => pick(l.code)}>
          <span className="lang-flag">{l.flag}</span>
          <span className="lang-name">{l.name}</span>
          <span className="lang-radio" aria-hidden />
        </button>
      ))}
    </div>
  )
  if (embedded) return list
  return (
    <div className="lang-wrap">
      <button className="lang" type="button" onClick={() => setLangOpen(!langOpen)}>
        {current.flag} {current.code}
      </button>
      {langOpen && (
        <>
          <div className="lang-backdrop" onClick={() => setLangOpen(false)} />
          {list}
        </>
      )}
    </div>
  )
}

function Header() {
  const { setMenuOpen, setSearchOpen, setAuthMode, loggedIn, user } = useApp()
  return (
    <header className="header">
      <button className="icon-btn" onClick={() => setMenuOpen(true)} aria-label="Menu"><Icon name="menu" /></button>
      <NavLink to="/" className="logo">BULLWAVECLUB</NavLink>
      <nav className="top-nav">
        <NavLink to="/live"><Icon name="live" size={16} /> Live Events</NavLink>
        <NavLink to="/upcoming"><Icon name="cal" size={16} /> Upcoming events</NavLink>
        <NavLink to="/promotions"><Icon name="gift" size={16} /> Promotions</NavLink>
        <NavLink to="/casino/live-casino"><Icon name="casino" size={16} /> Live Casino</NavLink>
        <NavLink to="/casino/instant-games"><Icon name="zap" size={16} /> Instant Games</NavLink>
        <NavLink to="/casino/slots"><Icon name="slots" size={16} /> Slots</NavLink>
        <NavLink to="/casino/virtual-sports"><Icon name="virtual" size={16} /> Virtual Sport</NavLink>
        <NavLink to="/casino/tv-games"><Icon name="tv" size={16} /> TV Games</NavLink>
      </nav>
      <div className="header-right">
        <button className="icon-btn" onClick={() => setSearchOpen(true)} aria-label="Search"><Icon name="search" /></button>
        <LanguagePicker />
        {loggedIn ? (
          <NavLink to="/account" className="btn btn-ghost">₹ {Number(user?.balance || 0).toFixed(2)}</NavLink>
        ) : (
          <button className="btn btn-ghost" onClick={() => setAuthMode('login')}>Log in</button>
        )}
        {loggedIn ? null : <button className="btn btn-yellow" onClick={() => setAuthMode('signup')}>Sign up</button>}
      </div>
    </header>
  )
}

function Sidebar() {
  return (
    <aside className="sidebar">
      {sports.map((s) => (
        <NavLink key={s.id} to={s.to} className={({ isActive }) => `side-item ${isActive ? 'active' : ''}`}>
          <span className="dot" style={{ color: s.color || '#61D6B0' }}><Icon name={s.icon} size={16} /></span>
          {s.name}
          {s.count ? <span className="side-count">{s.count}</span> : null}
        </NavLink>
      ))}
      {leagues.map((g) => (
        <div key={g.group}>
          <div className="side-group">{g.group}</div>
          {g.items.map((l) => (
            <NavLink key={l.name} to="/sport/football" className="league">
              <span>{l.flag}</span>
              <div>
                <div>{l.name}</div>
                <div className="meta">{l.sub}</div>
              </div>
              <span className="chev">›</span>
            </NavLink>
          ))}
        </div>
      ))}
    </aside>
  )
}

function Betslip() {
  const { betslip, removeBet, placeBets, loggedIn, setAuthMode } = useApp()
  const [stake, setStake] = useState('100')
  const [slipError, setSlipError] = useState('')
  const total = betslip.reduce((a, b) => a * (b.odd || 1), 1)
  return (
    <aside className="betslip">
      <h3>Betslip {betslip.length ? `(${betslip.length})` : ''}</h3>
      {betslip.length === 0 ? (
        <div className="slip-empty">
          <div className="icon"><Icon name="ticket" /></div>
          <div style={{ color: '#fff', marginBottom: 6 }}>Your betslip is empty</div>
          Click on odds to add a bet to the betslip
        </div>
      ) : (
        <>
          {betslip.map((b) => (
            <div key={b.id} className="slip-item">
              <button className="remove" onClick={() => removeBet(b.id)}>✕</button>
              <div style={{ color: '#888', fontSize: 12 }}>{b.event}</div>
              <div style={{ fontWeight: 700 }}>{b.pick}</div>
              <div style={{ color: '#61D6B0', marginTop: 4 }}>{b.odd}</div>
            </div>
          ))}
          <div className="stake">
            <input placeholder="Stake, ₹" value={stake} onChange={(e) => setStake(e.target.value)} />
          </div>
          <div className="slip-foot">
            <div className="row-between"><span>Total odds</span><b>{total.toFixed(2)}</b></div>
            <div className="row-between"><span>Possible win</span><b>₹{(total * Number(stake || 0)).toFixed(2)}</b></div>
            {slipError && <p className="hint" style={{ color: 'var(--coral)' }}>{slipError}</p>}
            <button
              className="btn btn-yellow btn-block"
              onClick={async () => {
                setSlipError('')
                if (!loggedIn) {
                  setAuthMode('login')
                  return
                }
                try {
                  await placeBets(Number(stake))
                } catch (err) {
                  setSlipError(err.message)
                }
              }}
            >
              Place bet
            </button>
          </div>
        </>
      )}
    </aside>
  )
}

function AuthModal() {
  const { authMode, setAuthMode, login, register, loginWithGoogle, authError, setAuthError } = useApp()
  const [loginTab, setLoginTab] = useState('E-mail')
  const [signupTab, setSignupTab] = useState('Phone')
  const [showPass, setShowPass] = useState(false)
  const [promoOpen, setPromoOpen] = useState(false)
  const [bonusOpen, setBonusOpen] = useState(false)
  const [accepted, setAccepted] = useState(true)
  const [bonus, setBonus] = useState('Welcome Casino 100%')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [accountNumber, setAccountNumber] = useState('')
  const [password, setPassword] = useState('')
  const [promoCode, setPromoCode] = useState('')
  const [busy, setBusy] = useState(false)
  const [otp, setOtp] = useState('')
  const [otpHint, setOtpHint] = useState('')
  const [otpSent, setOtpSent] = useState(false)
  const [phoneVerified, setPhoneVerified] = useState(false)
  if (!authMode) return null
  const isLogin = authMode === 'login'

  const requestOtp = async () => {
    setBusy(true)
    setAuthError('')
    setOtpHint('')
    try {
      const data = await sendOtp(phone)
      setOtpSent(true)
      setPhoneVerified(false)
      setOtp('')
      setOtpHint(data.test && data.otp ? `Test OTP: ${data.otp}` : data.message || 'OTP sent.')
    } catch (err) {
      setAuthError(err.message)
    } finally {
      setBusy(false)
    }
  }

  const confirmOtp = async () => {
    setBusy(true)
    setAuthError('')
    try {
      await verifyOtp(phone, otp)
      setPhoneVerified(true)
      setOtpHint('Phone verified.')
    } catch (err) {
      setPhoneVerified(false)
      setAuthError(err.message)
    } finally {
      setBusy(false)
    }
  }

  const submit = async () => {
    setBusy(true)
    setAuthError('')
    try {
      if (isLogin) {
        const method = loginTab === 'E-mail' ? 'email' : loginTab === 'Account number' ? 'account' : 'phone'
        await login({ method, phone, email, accountNumber, password })
      } else {
        await register({
          method: signupTab === 'E-mail' ? 'email' : 'phone',
          phone,
          email,
          password,
          promoCode,
          bonus,
          phoneVerified: signupTab !== 'Phone' || phoneVerified,
        })
      }
    } catch (err) {
      setAuthError(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="overlay" onClick={() => setAuthMode(null)}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <button className="icon-btn" onClick={() => setAuthMode(null)} aria-label="Close"><Icon name="close" /></button>
          <h1>{isLogin ? 'Log in' : 'Sign up'}</h1>
          <button className="icon-btn" type="button" aria-label="Support">🎧</button>
        </div>
        <button className="btn-dark" type="button" onClick={async () => { try { await loginWithGoogle() } catch (err) { setAuthError(err.message) } }}>
          <span className="g-mark">G</span> Continue with Google
        </button>
        <div className="or">or</div>
        {authError && <p className="hint" style={{ color: 'var(--coral)' }}>{authError}</p>}

        {isLogin ? (
          <>
            <div className="tabs tabs-3">
              {['Phone number', 'Account number', 'E-mail'].map((t) => (
                <button key={t} className={loginTab === t ? 'on' : ''} onClick={() => setLoginTab(t)}>{t}</button>
              ))}
            </div>
            <div className="field">
              <div className="field-row">
                {loginTab === 'Phone number' && <input className="input" defaultValue="+91" style={{ maxWidth: 88 }} readOnly />}
                {loginTab === 'Phone number' && <input className="input" placeholder="E-mail" value={email} onChange={(e) => setEmail(e.target.value)} />}
                {loginTab === 'Account number' && <input className="input" placeholder="Account number" value={accountNumber} onChange={(e) => setAccountNumber(e.target.value)} />}
                {loginTab === 'E-mail' && <input className="input" placeholder="E-mail" value={email} onChange={(e) => setEmail(e.target.value)} />}
              </div>
            </div>
            <div className="field pass-wrap">
              <input className="input" type={showPass ? 'text' : 'password'} placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
              <button className="eye" type="button" onClick={() => setShowPass((v) => !v)} aria-label="Show password">👁</button>
            </div>
            <button className="forgot" type="button">Forgot your password?</button>
            <button className="btn btn-yellow btn-block" disabled={busy} onClick={submit}>{busy ? 'Please wait…' : 'Log in'}</button>
            <div className="switch-auth">
              Don't have an account? <button type="button" onClick={() => { setAuthError(''); setAuthMode('signup') }}>Sign up</button>
            </div>
          </>
        ) : (
          <>
            <div className="tabs tabs-2">
              {['Phone', 'E-mail'].map((t) => (
                <button key={t} className={signupTab === t ? 'on' : ''} onClick={() => setSignupTab(t)}>{t}</button>
              ))}
            </div>

            <button className="bonus-box" type="button" onClick={() => setBonusOpen((v) => !v)}>
              <span className="gift">🎁</span>
              <span>
                <small>Have you not chosen it yet?</small>
                <strong>{bonus}</strong>
              </span>
              <span className="chev">{bonusOpen ? '▴' : '▾'}</span>
            </button>
            {bonusOpen && (
              <div className="bonus-list">
                {['Welcome Casino 100%', 'Sports First Bet', 'No bonus'].map((b) => (
                  <button key={b} type="button" onClick={() => { setBonus(b); setBonusOpen(false) }}>{b}</button>
                ))}
              </div>
            )}

            {signupTab === 'Phone' ? (
              <>
                <div className="field field-row">
                  <div className="flag-box" title="India">🇮🇳</div>
                  <label className="float-field">
                    <span>Phone number</span>
                    <input className="input" placeholder="+91(XXXX) XXX - XXX" value={phone} onChange={(e) => { setPhone(e.target.value); setPhoneVerified(false); setOtpSent(false) }} />
                  </label>
                </div>
                <div className="field">
                  <input className="input" type="email" placeholder="E-mail (required)" value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>
                <div className="otp-row">
                  <input
                    className="input"
                    inputMode="numeric"
                    maxLength={4}
                    placeholder="4-digit OTP"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 4))}
                    disabled={!otpSent || phoneVerified}
                  />
                  {otpSent && !phoneVerified ? (
                    <button className="btn btn-yellow" type="button" disabled={busy || otp.length !== 4} onClick={confirmOtp}>Verify</button>
                  ) : (
                    <button className="btn btn-yellow" type="button" disabled={busy || !phone} onClick={requestOtp}>{otpSent ? 'Resend' : 'Send OTP'}</button>
                  )}
                </div>
                {otpHint && <p className="hint" style={{ color: phoneVerified ? 'var(--mint)' : undefined }}>{otpHint}</p>}
              </>
            ) : (
              <div className="field">
                <input className="input" type="email" placeholder="E-mail" value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
            )}

            <div className="field pass-wrap">
              <input className="input" type={showPass ? 'text' : 'password'} placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
              <button className="eye" type="button" onClick={() => setShowPass((v) => !v)} aria-label="Show password">👁</button>
            </div>
            <p className="hint">• at least 10 characters</p>

            <button className="promo-toggle" type="button" onClick={() => setPromoOpen((v) => !v)}>
              <span>▣ I Have a Promo Code</span>
              <span>{promoOpen ? '−' : '+'}</span>
            </button>
            {promoOpen && <div className="field"><input className="input" placeholder="Promo code" value={promoCode} onChange={(e) => setPromoCode(e.target.value)} /></div>}

            <label className="terms-box">
              <span>
                I confirm that I am 18+, and I have read and accept the <b>Public Offer Agreement, Terms &amp; Conditions and other policies.</b>
              </span>
              <input type="checkbox" checked={accepted} onChange={(e) => setAccepted(e.target.checked)} />
            </label>

            <button className="btn btn-yellow btn-block" disabled={!accepted || busy || (signupTab === 'Phone' && !phoneVerified)} onClick={submit}>
              {busy ? 'Please wait…' : signupTab === 'Phone' && !phoneVerified ? 'Verify phone to continue' : 'Create account'}
            </button>
            <div className="switch-auth">
              Already have an account? <button type="button" onClick={() => { setAuthError(''); setAuthMode('login') }}>Log in</button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function MatchCard({ m }) {
  const { addBet, betslip, toggleFavorite, favorites } = useApp()
  const selected = (id) => betslip.some((b) => b.id === id)
  return (
    <article className="card">
      <div className="match-top">
        <span className={m.live ? 'live' : ''}>{m.time}{m.live ? ' • LIVE' : ''}</span>
        <span>{m.extra || m.league.split('.')[0]}</span>
      </div>
      <NavLink to={`/match/${m.id}`}>
        <div className="teams">
          <div className="team"><span>{m.home}</span>{m.score && <span className="score">{m.score[0]} {m.extras?.[0] || ''}</span>}</div>
          <div className="team"><span>{m.away}</span>{m.score && <span className="score">{m.score[1]} {m.extras?.[1] || ''}</span>}</div>
        </div>
      </NavLink>
      {m.markets[0].odd == null ? (
        <NavLink to={`/match/${m.id}`}><button className="odd-more">{m.markets[0].label}</button></NavLink>
      ) : (
        <div className={`odds ${m.markets.length === 2 ? 'two' : ''}`}>
          {m.markets.map((mk) => (
            <button
              key={mk.id}
              className={`odd ${selected(mk.id) ? 'on' : ''}`}
              onClick={() => addBet({ id: mk.id, event: `${m.home} vs ${m.away}`, pick: `${mk.label}`, odd: mk.odd })}
            >
              <b>{mk.odd.toFixed(2)}</b>
              <small>{mk.label}</small>
            </button>
          ))}
        </div>
      )}
      <button className={`star ${favorites.includes(m.id) ? 'on' : ''}`} onClick={() => toggleFavorite(m.id)} type="button">★</button>
    </article>
  )
}

function Footer() {
  return (
    <footer className="footer">
      <div className="footer-links">
        <NavLink to="/account">My Account</NavLink>
        <NavLink to="/promotions">Promotions</NavLink>
        <NavLink to="/vip">Bullwave Club VIP</NavLink>
        <NavLink to="/about">About Bullwave Club</NavLink>
        <NavLink to="/faq">FAQ</NavLink>
        <NavLink to="/more">More</NavLink>
      </div>
      18+ | Play responsibly. Bullwave Club sportsbook and casino UI.
    </footer>
  )
}

function Home() {
  const { catalogMatches: matches, clubGames } = useApp()
  const catalog = clubGames.length ? clubGames : games
  const liveCasino = catalog.filter((g) => g.cat === 'live').slice(0, 6)
  return (
    <div>
      <section className="banner">
        <div>
          <h1>WELCOME BONUS</h1>
          <p>Get Live Casino Bonus 100% up to ₹50,000</p>
          <NavLink to="/promotions" className="btn btn-yellow" style={{ display: 'inline-flex', alignItems: 'center' }}>Get Now</NavLink>
        </div>
      </section>
      <div className="quick-row">
        {shortcuts.map((s) => (
          <NavLink key={s.name} to={s.to} className="quick">
            <div className="orb" style={{ background: s.color }}>{s.name.slice(0, 1)}</div>
            {s.name}
          </NavLink>
        ))}
      </div>
      <div className="section-head">
        <h2>🔥 Hot Matches</h2>
        <NavLink to="/live">All ›</NavLink>
      </div>
      <div className="match-grid">
        {matches.slice(0, 4).map((m) => <MatchCard key={m.id} m={m} />)}
      </div>
      <div className="game-row">
        {catalog.slice(0, 14).map((g) => (
          <NavLink key={g.id} to={`/casino/${g.cat === 'live' ? 'live-casino' : g.cat === 'slots' ? 'slots' : 'instant-games'}`} className="game-circle">
            <div className="thumb" style={{ background: g.cover ? `center/cover url(${g.cover})` : `hsl(${g.hue} 70% 40%)` }}>{g.cover ? '' : '🎮'}</div>
            {g.name}
          </NavLink>
        ))}
      </div>
      <div className="section-head">
        <h2>Club games</h2>
        <NavLink to="/casino/live-casino">All ›</NavLink>
      </div>
      <div className="casino-row">
        {liveCasino.map((g) => (
          <NavLink key={g.id} to="/casino/live-casino" className="game-tile" style={{ background: g.cover ? `linear-gradient(180deg, transparent, #0B121C), center/cover url(${g.cover})` : `linear-gradient(160deg, hsl(${g.hue} 55% 38%), #0B121C)` }}>
            <span>{g.name}</span>
          </NavLink>
        ))}
      </div>
      <Footer />
    </div>
  )
}

function Live() {
  const { catalogMatches: matches } = useApp()
  const live = matches.filter((m) => m.live)
  return (
    <div>
      <h1 className="page-title">Live Events</h1>
      <div className="filters">
        {['All Live', 'Cricket', 'Football', 'Basketball', 'Tennis', 'Table Tennis'].map((c, i) => (
          <button key={c} className={`chip ${i === 0 ? 'on' : ''}`}>{c}</button>
        ))}
      </div>
      <div className="match-grid">
        {(live.length ? live : matches).map((m) => <MatchCard key={m.id} m={m} />)}
      </div>
    </div>
  )
}

function Upcoming() {
  const { catalogMatches: matches } = useApp()
  const upcoming = matches.filter((m) => !m.live)
  return (
    <div>
      <h1 className="page-title">Upcoming events</h1>
      <div className="filters">
        {['All', 'Today', 'Tomorrow', 'Weekend'].map((c, i) => (
          <button key={c} className={`chip ${i === 0 ? 'on' : ''}`}>{c}</button>
        ))}
      </div>
      <div className="match-grid">{upcoming.map((m) => <MatchCard key={m.id} m={m} />)}</div>
    </div>
  )
}

function Promotions() {
  return (
    <div>
      <h1 className="page-title">Promotions</h1>
      <div className="promo-grid">
        {promotions.map((p) => (
          <article key={p.id} className={`promo tone-${p.tone}`}>
            <h3>{p.title}</h3>
            <p>{p.text}</p>
            <NavLink to="/account/deposit" className="btn btn-yellow" style={{ width: 'fit-content', display: 'inline-flex', alignItems: 'center' }}>{p.cta}</NavLink>
          </article>
        ))}
      </div>
    </div>
  )
}

function Casino({ title, cat }) {
  const { clubGames } = useApp()
  const catalog = clubGames.length ? clubGames : games
  const items = catalog.filter((g) => g.cat === cat)
  const shown = items.length ? items : catalog
  return (
    <div>
      <h1 className="page-title">{title}</h1>
      <div className="filters">
        {['All', 'Popular', 'New', 'Bonus buy', 'Jackpot'].map((c, i) => (
          <button key={c} className={`chip ${i === 0 ? 'on' : ''}`}>{c}</button>
        ))}
      </div>
      <div className="casino-row">
        {shown.map((g) => (
          <div key={g.id} className="game-tile" style={{ background: g.cover ? `linear-gradient(180deg, transparent, #0B121C), center/cover url(${g.cover})` : `linear-gradient(160deg, hsl(${g.hue} 55% 36%), #0B121C)` }}>
            <span>{g.name}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function Sport() {
  const { name } = useParams()
  const { catalogMatches: matches } = useApp()
  const key = (name || 'football').replace('-racing', '')
  const list = matches.filter((m) => m.sport === key || m.sport === name)
  const shown = list.length ? list : matches
  return (
    <div>
      <h1 className="page-title" style={{ textTransform: 'capitalize' }}>{(name || '').replaceAll('-', ' ')}</h1>
      <div className="filters">
        {['Live', 'Upcoming', 'Outrights', 'Results'].map((c, i) => (
          <button key={c} className={`chip ${i === 0 ? 'on' : ''}`}>{c}</button>
        ))}
      </div>
      <div className="match-grid">{shown.map((m) => <MatchCard key={m.id} m={m} />)}</div>
    </div>
  )
}

function MatchPage() {
  const { id } = useParams()
  const { addBet, betslip, catalogMatches: matches } = useApp()
  const m = matches.find((x) => x.id === id) || matches[4]
  return (
    <div>
      <div className="card" style={{ marginBottom: 14 }}>
        <div className="event-meta">{m.league} · {m.time}{m.live ? ' LIVE' : ''}</div>
        <h1 style={{ margin: '8px 0 0' }}>{m.home} {m.score?.[0] || ''} — {m.score?.[1] || ''} {m.away}</h1>
      </div>
      {matchMarkets.map((mk) => (
        <div key={mk.name} className="market">
          <h3>{mk.name}</h3>
          {mk.rows.map((row, i) => (
            <div key={i} className="market-row" style={{ gridTemplateColumns: `repeat(${row.length}, 1fr)` }}>
              {row.map((c) => (
                <button
                  key={c.label}
                  className={`odd ${betslip.some((b) => b.id === m.id + c.label) ? 'on' : ''}`}
                  onClick={() => addBet({ id: m.id + c.label, event: `${m.home} vs ${m.away}`, pick: `${mk.name}: ${c.label}`, odd: c.odd })}
                >
                  <b>{c.odd.toFixed(2)}</b>
                  <small>{c.label}</small>
                </button>
              ))}
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}

function Account() {
  const { user, loggedIn, setAuthMode, logout } = useApp()
  return (
    <div>
      <h1 className="page-title">My Account</h1>
      <div className="card" style={{ marginBottom: 16 }}>
        <div style={{ color: '#888' }}>{loggedIn ? (user?.phone || user?.email || user?.accountNumber) : 'Guest'}</div>
        <div style={{ fontSize: 28, fontWeight: 800 }}>₹ {Number(user?.balance || 0).toFixed(2)}</div>
        {loggedIn
          ? <button className="btn btn-ghost" style={{ marginTop: 8 }} onClick={logout}>Log out</button>
          : <button className="btn btn-yellow" style={{ marginTop: 8 }} onClick={() => setAuthMode('login')}>Log in</button>}
      </div>
      <div className="account-grid">
        {accountLinks.map((l) => (
          <NavLink key={l.name} to={l.to} className="account-tile">
            <Icon name={l.icon} />
            <div style={{ marginTop: 10, fontWeight: 700 }}>{l.name}</div>
          </NavLink>
        ))}
      </div>
    </div>
  )
}

function Deposit({ type }) {
  const { moveMoney, setAuthMode, loggedIn } = useApp()
  const [amount, setAmount] = useState('500')
  const [message, setMessage] = useState('')
  return (
    <div>
      <h1 className="page-title">{type === 'withdraw' ? 'Withdraw' : 'Deposit'}</h1>
      <div className="pay-grid">
        {['UPI', 'Paytm', 'PhonePe', 'NetBanking', 'USDT', 'BTC', 'ETH', 'Card'].map((p) => (
          <div key={p} className="pay">{p}</div>
        ))}
      </div>
      <div className="field" style={{ marginTop: 16 }}>
        <label>Amount, ₹</label>
        <input className="input" placeholder="500" value={amount} onChange={(e) => setAmount(e.target.value)} />
      </div>
      {message && <p className="hint">{message}</p>}
      <button
        className="btn btn-yellow btn-block"
        onClick={async () => {
          setMessage('')
          if (!loggedIn) {
            setAuthMode('login')
            return
          }
          try {
            await moveMoney(type === 'withdraw' ? 'withdraw' : 'deposit', Number(amount))
            setMessage(type === 'withdraw' ? 'Withdrawal requested' : 'Deposit added')
          } catch (err) {
            setMessage(err.message)
          }
        }}
      >
        {type === 'withdraw' ? 'Withdraw' : 'Deposit'}
      </button>
    </div>
  )
}

function Bets() {
  const { myBets } = useApp()
  return (
    <div>
      <h1 className="page-title">My bets</h1>
      <div className="filters">
        {['All', 'Open', 'Settled', 'Cash out'].map((c, i) => (
          <button key={c} className={`chip ${i === 0 ? 'on' : ''}`}>{c}</button>
        ))}
      </div>
      {myBets.length === 0 ? (
        <div className="card">No bets yet. Add odds to the betslip to place your first bet.</div>
      ) : myBets.map((b) => (
        <div key={b.id} className="card" style={{ marginBottom: 8 }}>
          <div className="event-meta">{b.status} · {new Date(b.createdAt).toLocaleString()}</div>
          {b.selections.map((s) => <div key={s.id}>{s.event} · {s.pick} @ {s.odd}</div>)}
          <div className="row-between" style={{ marginTop: 8 }}><span>Stake ₹{b.stake}</span><b>To win ₹{b.possibleWin}</b></div>
        </div>
      ))}
    </div>
  )
}

function Vip() {
  return (
    <div>
      <section className="banner">
        <div>
          <h1>BULLWAVE CLUB VIP</h1>
          <p>Personal manager, higher limits, exclusive bonuses</p>
          <button className="btn btn-yellow">Join VIP</button>
        </div>
      </section>
      <div className="promo-grid" style={{ marginTop: 16 }}>
        {['Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond', 'Elite'].map((t, i) => (
          <div key={t} className="account-tile">
            <h3>{t}</h3>
            <p style={{ color: '#999' }}>Level {i + 1} rewards and cashback</p>
          </div>
        ))}
      </div>
    </div>
  )
}

function Faq() {
  return (
    <div className="faq">
      <h1 className="page-title">FAQ</h1>
      {faqs.map((f) => (
        <details key={f.q}>
          <summary>{f.q}</summary>
          <p>{f.a}</p>
        </details>
      ))}
    </div>
  )
}

function Favorites() {
  const { favorites, catalogMatches: matches } = useApp()
  const list = matches.filter((m) => favorites.includes(m.id))
  return (
    <div>
      <h1 className="page-title">Favorites</h1>
      {list.length === 0 ? <div className="card">Star an event to save it here.</div> : (
        <div className="match-grid">{list.map((m) => <MatchCard key={m.id} m={m} />)}</div>
      )}
    </div>
  )
}

function Parlays() {
  const { addBet, catalogMatches: matches } = useApp()
  const combo = useMemo(() => matches.slice(1, 4), [matches])
  const total = combo.reduce((a, m) => a * (m.markets[0]?.odd || 1), 1)
  return (
    <div>
      <h1 className="page-title">Top Parlays</h1>
      <div className="card">
        <div className="event-meta">Ready-made accumulators</div>
        {combo.map((m) => (
          <div key={m.id} style={{ padding: '10px 0', borderBottom: '1px solid #2A3C50' }}>
            {m.home} vs {m.away} · {m.markets[0]?.odd}
          </div>
        ))}
        <div className="row-between" style={{ marginTop: 12 }}><span>Total odds</span><b>{total.toFixed(2)}</b></div>
        <button className="btn btn-yellow btn-block" onClick={() => combo.forEach((m) => addBet({ id: m.markets[0].id, event: `${m.home} vs ${m.away}`, pick: m.markets[0].label, odd: m.markets[0].odd }))}>Add to betslip</button>
      </div>
    </div>
  )
}

function More() {
  const { oddsFormat, setOddsFormat, theme, setTheme } = useApp()
  return (
    <div>
      <h1 className="page-title">More</h1>
      <div className="card menu-item">Theme <select value={theme} onChange={(e) => setTheme(e.target.value)} className="input" style={{ width: 140, height: 36 }}><option value="dark">Dark</option><option value="light">Light</option></select></div>
      <div className="card" style={{ marginTop: 8, padding: 8 }}>
        <div style={{ padding: '8px 10px', color: 'var(--muted)' }}>Language</div>
        <LanguagePicker embedded />
      </div>
      <div className="card menu-item" style={{ marginTop: 8 }}>Odds Format <select value={oddsFormat} onChange={(e) => setOddsFormat(e.target.value)} className="input" style={{ width: 140, height: 36 }}><option value="decimal">2.20</option><option value="fractional">6/5</option><option value="american">+120</option></select></div>
      <div className="card" style={{ marginTop: 8 }}>
        <NavLink className="menu-item" to="/about">About Bullwave Club</NavLink>
        <NavLink className="menu-item" to="/faq">FAQ</NavLink>
        <NavLink className="menu-item" to="/vip">VIP Club</NavLink>
      </div>
    </div>
  )
}

function About() {
  return (
    <div>
      <h1 className="page-title">About Bullwave Club</h1>
      <div className="card">Sportsbook, live betting, casino, instant games and promotions — the Bullwave Club interface.</div>
    </div>
  )
}

function SearchOverlay() {
  const { searchOpen, setSearchOpen, catalogMatches: matches } = useApp()
  const [q, setQ] = useState('')
  if (!searchOpen) return null
  const results = matches.filter((m) => `${m.home} ${m.away} ${m.league}`.toLowerCase().includes(q.toLowerCase()))
  return (
    <div className="search-panel">
      <input autoFocus placeholder="Search events, teams, games" value={q} onChange={(e) => setQ(e.target.value)} />
      <button className="btn btn-ghost" onClick={() => setSearchOpen(false)}>Close</button>
      <div className="list" style={{ marginTop: 16 }}>
        {results.map((m) => (
          <NavLink key={m.id} to={`/match/${m.id}`} onClick={() => setSearchOpen(false)} className="card" style={{ display: 'block' }}>
            {m.home} vs {m.away}
            <div className="event-meta">{m.league}</div>
          </NavLink>
        ))}
      </div>
    </div>
  )
}

function MenuDrawer() {
  const { menuOpen, setMenuOpen, setAuthMode } = useApp()
  if (!menuOpen) return null
  return (
    <div className="overlay" onClick={() => setMenuOpen(false)}>
      <div className="menu-panel" onClick={(e) => e.stopPropagation()}>
        <NavLink className="menu-item" to="/" onClick={() => setMenuOpen(false)}>Sport</NavLink>
        <NavLink className="menu-item" to="/casino/live-casino" onClick={() => setMenuOpen(false)}>Casino</NavLink>
        <NavLink className="menu-item" to="/promotions" onClick={() => setMenuOpen(false)}>Promotions</NavLink>
        <NavLink className="menu-item" to="/vip" onClick={() => setMenuOpen(false)}>Bullwave Club VIP</NavLink>
        <NavLink className="menu-item" to="/account" onClick={() => setMenuOpen(false)}>My Account</NavLink>
        <NavLink className="menu-item" to="/more" onClick={() => setMenuOpen(false)}>More</NavLink>
        <NavLink className="menu-item" to="/faq" onClick={() => setMenuOpen(false)}>FAQ</NavLink>
        <div className="menu-item">
          <button className="btn btn-ghost" onClick={() => { setMenuOpen(false); setAuthMode('login') }}>Log in</button>
          <button className="btn btn-yellow" onClick={() => { setMenuOpen(false); setAuthMode('signup') }}>Sign up</button>
        </div>
      </div>
    </div>
  )
}

export default function App() {
  return (
    <div className="app">
      <Header />
      <div className="shell">
        <Sidebar />
        <main className="main">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/live" element={<Live />} />
            <Route path="/upcoming" element={<Upcoming />} />
            <Route path="/promotions" element={<Promotions />} />
            <Route path="/casino/live-casino" element={<Casino title="Live Casino" cat="live" />} />
            <Route path="/casino/instant-games" element={<Casino title="Instant Games" cat="instant" />} />
            <Route path="/casino/slots" element={<Casino title="Slots" cat="slots" />} />
            <Route path="/casino/virtual-sports" element={<Casino title="Virtual Sport" cat="virtual" />} />
            <Route path="/casino/tv-games" element={<Casino title="TV Games" cat="tv" />} />
            <Route path="/sport/:name" element={<Sport />} />
            <Route path="/match/:id" element={<MatchPage />} />
            <Route path="/account" element={<Account />} />
            <Route path="/account/deposit" element={<Deposit type="deposit" />} />
            <Route path="/account/withdraw" element={<Deposit type="withdraw" />} />
            <Route path="/account/bets" element={<Bets />} />
            <Route path="/account/verify" element={<div><h1 className="page-title">Verification</h1><div className="card">Upload ID and proof of address to verify your account.</div></div>} />
            <Route path="/account/settings" element={<More />} />
            <Route path="/vip" element={<Vip />} />
            <Route path="/faq" element={<Faq />} />
            <Route path="/favorites" element={<Favorites />} />
            <Route path="/parlays" element={<Parlays />} />
            <Route path="/more" element={<More />} />
            <Route path="/about" element={<About />} />
          </Routes>
        </main>
        <Betslip />
      </div>
      <AuthModal />
      <SearchOverlay />
      <MenuDrawer />
    </div>
  )
}
