import { useEffect, useMemo, useRef, useState } from 'react'
import { NavLink, Route, Routes, useNavigate, useParams } from 'react-router-dom'
import { useApp } from './store.jsx'
import { sendOtp, verifyOtp } from './api.js'
import { AdminDesk, BillingPage, TelegramCashIn } from './BillingPages.jsx'
import { PayLogo } from './PayLogo.jsx'
import { PersonalData } from './PersonalData.jsx'
import { ProfileAvatar, ProfileHub } from './ProfileHub.jsx'
import { isStrongPassword, PASSWORD_HINT } from './authRules.js'
import { accountLinks, faqs, games, languages, leagues, matchMarkets, promotions, shortcuts, sports } from './data.js'
import GameIcon, { getGameIconKind } from './GameIcon.jsx'

const gameVisuals = {
  aviator: { glyph: '✈', tag: 'FLIGHT', colors: ['#ff6b6b', '#601d32'] },
  jetx: { glyph: '🚀', tag: 'TURBO', colors: ['#42d9ff', '#153665'] },
  rummy: { glyph: '♠', tag: 'CARDS', colors: ['#ffb44c', '#6f251e'] },
  aviatrix: { glyph: '🛩', tag: 'SKY RUSH', colors: ['#cf83ff', '#442070'] },
  garuda: { glyph: '◆', tag: 'FORTUNE', colors: ['#ffd66b', '#724b12'] },
  orizon: { glyph: '◉', tag: 'PORTAL', colors: ['#62e6dc', '#135469'] },
  andar: { glyph: '♣', tag: 'LIVE CARDS', colors: ['#ff9a64', '#5e2837'] },
  ultimate: { glyph: '7', tag: 'HOT SLOT', colors: ['#ff5f89', '#761d48'] },
  money: { glyph: '◷', tag: 'GAME SHOW', colors: ['#f4cf65', '#3e6c42'] },
  coins: { glyph: '777', tag: 'JACKPOT', colors: ['#ffce50', '#704412'] },
  pmslots: { glyph: '◇', tag: 'BULLWAVE', colors: ['#61d6b0', '#164d52'] },
  instants: { glyph: '⚡', tag: 'QUICK PLAY', colors: ['#48dfff', '#243c79'] },
  coinflip: { glyph: '●', tag: 'HEADS / TAILS', colors: ['#f2c45a', '#755226'] },
  mines: { glyph: '💎', tag: 'GEM HUNT', colors: ['#b982ff', '#3b2768'] },
  ice: { glyph: '🐟', tag: 'FROZEN WIN', colors: ['#65eaff', '#18507e'] },
  wonderland: { glyph: '♛', tag: 'MAGIC', colors: ['#ee91ff', '#502477'] },
  lightning: { glyph: 'ϟ', tag: 'LIVE WHEEL', colors: ['#66edff', '#24347d'] },
  monopoly: { glyph: '●', tag: 'BIG BALLER', colors: ['#ffbd63', '#6a2730'] },
  reddoor: { glyph: '▯', tag: 'LIVE WHEEL', colors: ['#ff656b', '#651e27'] },
  crash: { glyph: '↗', tag: 'MULTIPLIER', colors: ['#ff755d', '#63213e'] },
  plinko: { glyph: '▽', tag: 'DROP & WIN', colors: ['#59e1c7', '#174d64'] },
  keno: { glyph: '●', tag: 'LUCKY DRAW', colors: ['#77a7ff', '#28396d'] },
  virtualc: { glyph: '🏏', tag: 'VIRTUAL', colors: ['#73df8b', '#205941'] },
  efootball: { glyph: '⚽', tag: 'E-SPORT', colors: ['#7fe899', '#1a5365'] },
}

const gameIconTags = {
  '2048': 'NUMBER PUZZLE', aim: 'SKILL', blob: 'ARENA', bubble: 'ARCADE', carrom: 'BOARD GAME',
  chess: 'STRATEGY', crossword: 'WORD GAME', draw: 'CREATIVE', runner: 'ARCADE', knowledge: 'TRIVIA',
  city: 'SIMULATION', jigsaw: 'PUZZLE', kite: 'ARCADE', lantern: 'PUZZLE', ludo: 'BOARD GAME',
  rooms: 'MULTIPLAYER', rummy: 'CARDS',
}

function GameArtwork({ game }) {
  const fallback = Object.values(gameVisuals)[Math.abs([...String(game.name)].reduce((sum, char) => sum + char.charCodeAt(0), 0)) % Object.keys(gameVisuals).length]
  const visual = gameVisuals[game.id] || fallback
  const iconKind = getGameIconKind(game)
  const safeId = String(game.id).replace(/[^a-z0-9]/gi, '-')
  const gradientId = `game-gradient-${safeId}`
  const glowId = `game-glow-${safeId}`
  const patternId = `game-pattern-${safeId}`
  return (
    <svg className="game-artwork" viewBox="0 0 160 110" role="img" aria-label={`${game.name} artwork`}>
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
          <stop stopColor={visual.colors[0]} />
          <stop offset="1" stopColor={visual.colors[1]} />
        </linearGradient>
        <radialGradient id={glowId} cx="50%" cy="42%" r="62%">
          <stop stopColor="#fff" stopOpacity=".32" />
          <stop offset=".52" stopColor={visual.colors[0]} stopOpacity=".12" />
          <stop offset="1" stopColor="#020913" stopOpacity=".48" />
        </radialGradient>
        <pattern id={patternId} width="14" height="14" patternUnits="userSpaceOnUse" patternTransform="rotate(35)">
          <path d="M0 0v14" stroke="#fff" strokeWidth="1" opacity=".055" />
        </pattern>
      </defs>
      <rect width="160" height="110" rx="14" fill={`url(#${gradientId})`} />
      <rect width="160" height="110" rx="14" fill={`url(#${glowId})`} />
      <rect width="160" height="110" rx="14" fill={`url(#${patternId})`} />
      <circle cx="139" cy="12" r="34" fill="#fff" opacity=".09" />
      <circle cx="13" cy="104" r="46" fill="#020916" opacity=".28" />
      <path d="M-8 83c31-27 55 18 88-7s59-8 88 4" fill="none" stroke="#fff" strokeWidth="3" opacity=".18" />
      <path d="M-4 92c34-21 58 18 94-8s54-6 76 3" fill="none" stroke={visual.colors[0]} strokeWidth="2" opacity=".42" />
      <rect x="10" y="9" width="58" height="17" rx="8.5" fill="#03101d" opacity=".68" stroke="#fff" strokeOpacity=".16" />
      <circle cx="20" cy="17.5" r="3" fill={visual.colors[0]} />
      <text x="28" y="20.5" className="game-art-tag">{iconKind ? gameIconTags[iconKind] : visual.tag || game.cat || 'PLAY'}</text>
      {iconKind ? <GameIcon game={game} kind={iconKind} tile /> : <>
        <g className="game-art-ring">
          <circle cx="80" cy="61" r="31" fill="#05111f" opacity=".34" stroke="#fff" strokeOpacity=".18" />
          <circle cx="80" cy="61" r="25" fill="none" stroke="#fff" strokeWidth="1.5" strokeDasharray="5 5" opacity=".28" />
          <circle cx="105" cy="61" r="3" fill={visual.colors[0]} />
        </g>
        <text x="80" y="75" textAnchor="middle" className="game-glyph">{visual.glyph}</text>
      </>}
      <g fill="#fff">
        <circle cx="130" cy="84" r="2" opacity=".7" />
        <circle cx="140" cy="75" r="1.4" opacity=".45" />
        <circle cx="124" cy="71" r="1" opacity=".5" />
      </g>
    </svg>
  )
}

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
    football: <><circle cx="12" cy="12" r="9" /><path d="m12 8 3.6 2.6-1.4 4.2H9.8l-1.4-4.2zM12 8V3.1M15.6 10.6l4.7-1.5M14.2 14.8l2.9 4M9.8 14.8l-2.9 4M8.4 10.6 3.7 9.1" /></>,
    cricket: <><path d="m14.7 3.5 3.8 2.2-8.2 14.2-3.8-2.2zM8.2 19l-1.5 2.5" /><path d="M3.5 8v12M6 8v12M2.5 8h4.5M2.5 20h4.5" /><circle cx="19.2" cy="17.7" r="1.8" fill="currentColor" stroke="none" /></>,
    basketball: <><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3c2.7 2.5 4.1 5.5 4.1 9S14.7 18.5 12 21M12 3C9.3 5.5 7.9 8.5 7.9 12S9.3 18.5 12 21M5.8 5.7c3.3 2.1 9.1 2.1 12.4 0M5.8 18.3c3.3-2.1 9.1-2.1 12.4 0" /></>,
    tennis: <><circle cx="12" cy="12" r="9" /><path d="M5.7 5.7c3.2 2 4.7 4.1 5 6.5.3 2.5 2 4.5 5.6 6.1M18.3 5.7c-3.2 2-4.7 4.1-5 6.5-.3 2.5-2 4.5-5.6 6.1" /></>,
    table: <><path d="M4 14h16M5.5 14l-1 6M18.5 14l1 6M12 14v6M4 17h16" /><path d="M8.4 4.2a4 4 0 1 1-3.7 6.6A4 4 0 0 1 8.4 4.2Z" /><path d="m7 11 2 4" /><circle cx="17.8" cy="7" r="1.4" fill="currentColor" stroke="none" /></>,
    horse: <><path d="M5 19c.8-4.9 3.4-8 7.7-9.5L15 4l2.3 4.2 2.7 1.5-1.8 3.6-4.1.5-2.5 5.2Z" /><path d="m12.7 9.5 2.8 2.5M8.2 12.2l-3-1.7M8.5 19l-2.7 2M12.2 19l2.1 2M16.7 8.3l2-3.3" /><circle cx="17" cy="10.1" r=".7" fill="currentColor" stroke="none" /></>,
    camel: <><path d="M4 18c1.2-5 3.2-8 7-9.2.4-3.2 1.8-6.2 4.8-7.2 2.2-.2 3.4 1.6 3.6 3.6 2.4-.4 4.6.8 6 2.8 2 .8 3.6 2.8 3.6 5.2V16h-3.2c-.4 2.2-2.2 3.8-4.4 3.8H7.2C5.4 19.8 4.2 19.2 4 18Z" /><path d="M9.2 10.4C7 11.4 5.8 13.6 5.4 16M15.4 9.2c2.2-.2 4.4 1.2 5.6 3.2" /><circle cx="18.2" cy="10.2" r=".7" fill="currentColor" stroke="none" /></>,
    ticket: <path d="M4 8a2 2 0 0 0 2-2h12a2 2 0 0 0 2 2v8a2 2 0 0 0-2 2H6a2 2 0 0 0-2-2z" />,
    plus: <path d="M12 5v14M5 12h14" />,
    minus: <path d="M5 12h14" />,
    shield: <path d="M12 3 20 7v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V7z" />,
    gear: <><circle cx="12" cy="12" r="3" /><path d="M12 3v2M12 19v2M4.9 6.5l1.5 1.5M17.6 16l1.5 1.5M3 12h2M19 12h2M4.9 17.5l1.5-1.5M17.6 8l1.5-1.5" /></>,
    heart: <path d="M12 20s-7-4.5-7-10a4 4 0 0 1 7-2 4 4 0 0 1 7 2c0 5.5-7 10-7 10z" />,
    eye: <><path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6z" /><circle cx="12" cy="12" r="2.5" /></>,
    close: <path d="M6 6l12 12M18 6 6 18" />,
    home: <><path d="m3 10 9-7 9 7v10H3z" /><path d="M9 20v-7h6v7" /></>,
    bell: <><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4" /></>,
    chevron: <path d="m9 5 7 7-7 7" />,
    help: <><circle cx="12" cy="12" r="9" /><path d="M9.5 9a2.5 2.5 0 1 1 4.5 1.5c-1.3 1.4-2 1.5-2 3M12 17h.01" /></>,
    clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
    sun: <><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></>,
    moon: <path d="M20 14.5A8.5 8.5 0 1 1 9.5 4 7 7 0 0 0 20 14.5z" />,
  }
  return <svg viewBox="0 0 24 24" {...s}>{paths[name] || paths.star}</svg>
}

function CountryFlag({ code, className = '' }) {
  return <img className={`country-flag-image ${className}`} src={`${import.meta.env.BASE_URL}images/flags/${code.toLowerCase()}.svg`} alt="" width="24" height="18" />
}

function stableNumber(value) {
  return [...String(value)].reduce((sum, char) => ((sum * 31) + char.charCodeAt(0)) % 997, 7)
}

function OddButton({ id, odd, label, selected, onSelect }) {
  const seed = useMemo(() => stableNumber(id), [id])
  const [quote, setQuote] = useState({ value: odd, direction: 0 })
  useEffect(() => {
    setQuote({ value: odd, direction: 0 })
    const interval = window.setInterval(() => {
      const direction = ((Math.floor(Date.now() / 8000) + seed) % 3) - 1
      if (direction === 0) return
      setQuote((current) => ({ value: Math.max(1.01, Number((current.value + direction * 0.01).toFixed(2))), direction }))
    }, 8000 + (seed % 4) * 700)
    return () => window.clearInterval(interval)
  }, [id, odd, seed])
  return (
    <button className={`odd ${selected ? 'on' : ''} ${quote.direction > 0 ? 'odd-up' : quote.direction < 0 ? 'odd-down' : ''}`} onClick={() => onSelect(quote.value)} aria-label={`${label}, odds ${quote.value.toFixed(2)}${quote.direction ? `, moved ${quote.direction > 0 ? 'up' : 'down'}` : ''}`}>
      <b>{quote.value.toFixed(2)}{quote.direction !== 0 && <i aria-hidden="true">{quote.direction > 0 ? '↑' : '↓'}</i>}</b>
      <small>{label}</small>
    </button>
  )
}

function SkeletonGrid({ count = 6, type = 'matches' }) {
  return <div className={`skeleton-grid skeleton-${type}`} aria-label="Loading content" aria-busy="true">
    {Array.from({ length: count }, (_, index) => <div key={index} className="skeleton-card"><span /><span /><span /><div><i /><i /><i /></div></div>)}
  </div>
}

function LiveTicker() {
  const { catalogMatches: matches } = useApp()
  const live = matches.filter((match) => match.live)
  if (!live.length) return null
  return <section className="live-ticker" aria-label="Live score ticker">
    <NavLink to="/live" className="ticker-label"><span />Live now</NavLink>
    <div className="ticker-track">
      <div className="ticker-items">
        {live.map((match) => <NavLink key={match.id} to={`/match/${match.id}`} className="ticker-event"><small>{match.time}</small><strong>{match.home}</strong><b>{match.score?.[0] || 'Live'}</b><span>vs</span><strong>{match.away}</strong><b>{match.score?.[1] || ''}</b></NavLink>)}
      </div>
    </div>
    <NavLink to="/live" className="ticker-all" aria-label="View all live events"><Icon name="chevron" size={16} /></NavLink>
  </section>
}

function BetNotice() {
  const { betNotice, setBetNotice, setSlipOpen } = useApp()
  if (!betNotice) return null
  return <div className={`bet-toast is-${betNotice.type}`} role="status">
    <span>{betNotice.type === 'success' ? '✓' : betNotice.type === 'warning' ? '!' : '–'}</span>
    <p>{betNotice.message}</p>
    {betNotice.type === 'success' && <button type="button" onClick={() => setSlipOpen(true)}>View slip</button>}
    <button type="button" className="toast-close" onClick={() => setBetNotice(null)} aria-label="Dismiss notification"><Icon name="close" size={15} /></button>
  </div>
}

function useSwipeDismiss(onDismiss, direction = 'left') {
  const touchStart = useRef(null)
  return {
    onTouchStart: (event) => {
      const touch = event.touches[0]
      touchStart.current = { x: touch.clientX, y: touch.clientY }
    },
    onTouchEnd: (event) => {
      if (!touchStart.current) return
      const touch = event.changedTouches[0]
      const dx = touch.clientX - touchStart.current.x
      const dy = touch.clientY - touchStart.current.y
      touchStart.current = null
      if (direction === 'left' && dx < -70 && Math.abs(dx) > Math.abs(dy) * 1.25) onDismiss()
      if (direction === 'down' && dy > 80 && Math.abs(dy) > Math.abs(dx) * 1.25) onDismiss()
    },
  }
}

function ConnectivityBanner() {
  const [online, setOnline] = useState(() => navigator.onLine)
  useEffect(() => {
    const update = () => setOnline(navigator.onLine)
    window.addEventListener('online', update)
    window.addEventListener('offline', update)
    return () => {
      window.removeEventListener('online', update)
      window.removeEventListener('offline', update)
    }
  }, [])
  return online ? null : <div className="connectivity-banner" role="status"><span />You're offline. Saved content is still available.</div>
}

function CatalogNotice() {
  const { catalogError, reloadCatalog } = useApp()
  if (!catalogError) return null
  return <div className="catalog-notice" role="alert"><Icon name="live" size={17} /><span>{catalogError}</span><button type="button" onClick={reloadCatalog}>Retry</button></div>
}

function SessionReminder() {
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const settings = loadPlaySettings()
    if (!settings.reminder) return undefined
    const timer = window.setTimeout(() => setVisible(true), Number(settings.reminder) * 60 * 1000)
    return () => window.clearTimeout(timer)
  }, [])
  if (!visible) return null
  return <div className="session-reminder" role="alertdialog" aria-modal="true" aria-label="Session time reminder"><span className="feature-icon"><Icon name="clock" size={20} /></span><div><strong>Time check</strong><p>You have been active for a while. Review your play and take a break if you need one.</p></div><NavLink to="/responsible-play" onClick={() => setVisible(false)}>Review limits</NavLink><button type="button" onClick={() => setVisible(false)}>Continue</button></div>
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
          <CountryFlag code={l.country} className="lang-flag" />
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
        <CountryFlag code={current.country} /> {current.code}
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

function sportIcon(sport) {
  if (sport === 'table-tennis' || sport === 'table') return 'table'
  if (sport === 'camel-racing') return 'camel'
  if (sport === 'horse-racing') return 'horse'
  return sport || 'live'
}

const notificationSeed = [
  { id: 'n1', group: 'Today', type: 'match', title: 'Camel race starts in 15 minutes', detail: 'Desert King vs Sand Storm', time: '12:15 PM', icon: 'clock' },
  { id: 'n2', group: 'Today', type: 'odds', title: 'Odds moved on your selection', detail: 'India U-19 shortened from 1.82 to 1.76', time: '11:42 AM', icon: 'live' },
  { id: 'n3', group: 'Today', type: 'bet', title: 'Bet settled', detail: 'Your football single was won', time: '10:08 AM', icon: 'ticket' },
  { id: 'n4', group: 'Yesterday', type: 'wallet', title: 'Deposit completed', detail: '₹1,000 added through UPI', time: '6:31 PM', icon: 'plus' },
  { id: 'n5', group: 'Yesterday', type: 'wallet', title: 'Withdrawal processing', detail: '₹500 is being reviewed', time: '3:12 PM', icon: 'minus' },
  { id: 'n6', group: 'Earlier', type: 'promo', title: 'Weekend odds boost', detail: 'A new member promotion is available', time: 'Mon', icon: 'gift' },
]

function NotificationCenter({ onClose }) {
  const [filter, setFilter] = useState('All')
  const [read, setRead] = useState(() => {
    try { return JSON.parse(localStorage.getItem('bwc_read_notifications')) || [] } catch { return [] }
  })
  const shown = notificationSeed.filter((item) => filter === 'All' || item.type === filter)
  const groups = [...new Set(shown.map((item) => item.group))]
  const markRead = (id) => {
    const next = read.includes(id) ? read : [...read, id]
    setRead(next)
    localStorage.setItem('bwc_read_notifications', JSON.stringify(next))
  }
  const markAll = () => {
    const next = notificationSeed.map((item) => item.id)
    setRead(next)
    localStorage.setItem('bwc_read_notifications', JSON.stringify(next))
  }
  return <section className="notifications-popover" role="dialog" aria-label="Notification centre">
    <header><div><strong>Notifications</strong><small>{notificationSeed.length - read.length} unread</small></div><button type="button" onClick={onClose} aria-label="Close notifications"><Icon name="close" size={17} /></button></header>
    <div className="notification-filters" role="tablist" aria-label="Notification types">{['All', 'match', 'bet', 'wallet', 'promo'].map((item) => <button key={item} type="button" role="tab" aria-selected={filter === item} className={filter === item ? 'on' : ''} onClick={() => setFilter(item)}>{item}</button>)}</div>
    <div className="notification-list">{groups.map((group) => <div key={group} className="notification-group"><h3>{group}</h3>{shown.filter((item) => item.group === group).map((item) => <button key={item.id} type="button" className={read.includes(item.id) ? 'is-read' : ''} onClick={() => markRead(item.id)}><span className="notification-icon"><Icon name={item.icon} size={17} /></span><span><strong>{item.title}</strong><small>{item.detail}</small></span><time>{item.time}</time></button>)}</div>)}</div>
    <footer><button type="button" onClick={markAll}>Mark all as read</button><NavLink to="/account/settings" onClick={onClose}>Preferences</NavLink></footer>
  </section>
}

function Header() {
  const { setMenuOpen, setSearchOpen, setAuthMode, loggedIn, user, theme, setTheme } = useApp()
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const light = theme === 'light'
  return (
    <header className="header">
      <button className="icon-btn mobile-menu" onClick={() => setMenuOpen(true)} aria-label="Menu"><Icon name="menu" /></button>
      <NavLink to="/" className="logo" aria-label="Bullwave Club home">
        <img
          className="logo-img"
          src={`${import.meta.env.BASE_URL}images/brand/${light ? 'bullwave-header-light.png' : 'bullwave-header.png'}?v=4`}
          alt="Bullwave Club"
        />
      </NavLink>
      <nav className="top-nav">
        <NavLink to="/" end>Sports</NavLink>
        <NavLink to="/live">Live</NavLink>
        <NavLink to="/casino/live-casino">Games</NavLink>
        <NavLink to="/vip">Rewards</NavLink>
        <NavLink to="/promotions">Promotions</NavLink>
      </nav>
      <div className="header-right">
        <button className="header-search" onClick={() => setSearchOpen(true)} aria-label="Search sports, teams or leagues"><Icon name="search" size={20} /><span>Search sports, teams or leagues...</span></button>
        <button className="icon-btn notification-btn" onClick={() => setNotificationsOpen((open) => !open)} aria-label="Notifications" aria-expanded={notificationsOpen}><Icon name="bell" size={21} /><i /></button>
        {notificationsOpen && <NotificationCenter onClose={() => setNotificationsOpen(false)} />}
        <button
          type="button"
          className={`theme-toggle${light ? ' is-light' : ''}`}
          onClick={() => setTheme(light ? 'dark' : 'light')}
          aria-label={light ? 'Switch to dark theme' : 'Switch to light theme'}
          aria-pressed={light}
          title={light ? 'Dark theme' : 'Light theme'}
        >
          <span className="theme-toggle-knob" aria-hidden="true" />
          <Icon name="moon" size={13} />
          <Icon name="sun" size={13} />
        </button>
        <LanguagePicker />
        {loggedIn ? (
          <>
            <NavLink to="/account" className="btn btn-ghost header-cash">₹ {Number(user?.balance || 0).toFixed(2)}</NavLink>
            <ProfileAvatar />
          </>
        ) : (
          <button className="btn btn-ghost" onClick={() => setAuthMode('login')}>Log in</button>
        )}
        {loggedIn ? null : <button className="btn btn-yellow" onClick={() => setAuthMode('signup')}>Sign up</button>}
      </div>
    </header>
  )
}

function Sidebar() {
  const [leaguesOpen, setLeaguesOpen] = useState(false)
  const { setAuthMode } = useApp()
  return (
    <aside className="sidebar">
      <NavLink to="/" end className={({ isActive }) => `side-item side-home ${isActive ? 'active' : ''}`}><span className="dot"><Icon name="home" size={19} /></span>Home</NavLink>
      {sports.filter((s) => !['promos', 'parlays'].includes(s.id)).map((s) => (
        <NavLink key={s.id} to={s.to} className={({ isActive }) => `side-item ${isActive ? 'active' : ''}`}>
          <span className="dot" style={{ color: s.color || '#61D6B0' }}>
            <Icon name={s.icon} size={18} />
          </span>
          {s.name}
          {s.count ? <span className="side-count">{s.count}</span> : null}
        </NavLink>
      ))}
      <NavLink to="/casino/virtual-sports" className="side-item"><span className="dot"><Icon name="virtual" size={18} /></span>Esports</NavLink>
      <NavLink to="/live" className="side-item"><span className="dot"><Icon name="layers" size={18} /></span>All Sports</NavLink>
      <button className="league-toggle" type="button" aria-expanded={leaguesOpen} onClick={() => setLeaguesOpen((open) => !open)}>Leagues <Icon name="chevron" size={16} /></button>
      {leaguesOpen && leagues.map((g) => (
        <div key={g.group} className="league-section">
          <div className="side-group">{g.group}</div>
          <div className="league-list">
            {g.items.map((l, i) => (
              <NavLink key={`${l.name}-${i}`} to={g.to} className="league">
                <span className={`league-mark mark-${l.code}`} aria-hidden="true"><i /></span>
                <div className="league-copy">
                  <div className="meta">{l.sub}</div>
                  <div className="league-name">{l.name}</div>
                </div>
                <span className="chev">›</span>
              </NavLink>
            ))}
          </div>
        </div>
      ))}
      <div className="side-utility">
        <NavLink to="/account/settings" className="side-item"><span className="dot"><Icon name="gear" size={18} /></span>Settings</NavLink>
        <NavLink to="/responsible-play" className="side-item"><span className="dot"><Icon name="shield" size={18} /></span>Responsible play</NavLink>
        <NavLink to="/faq" className="side-item"><span className="dot"><Icon name="help" size={18} /></span>Help</NavLink>
      </div>
      <div className="side-club"><span aria-hidden="true">♛</span><strong>Join Bullwave Club</strong><p>Get exclusive rewards,<br />boosted odds and more!</p><button type="button" onClick={() => setAuthMode('signup')}>Create Account</button></div>
    </aside>
  )
}

function Betslip() {
  const { betslip, removeBet, clearSlip, placeBets, loggedIn, setAuthMode, slipOpen, setSlipOpen, lastAddedBetId } = useApp()
  const [stake, setStake] = useState('100')
  const [slipError, setSlipError] = useState('')
  const [mode, setMode] = useState('Single')
  const total = betslip.reduce((a, b) => a * (b.odd || 1), 1)
  const stakeValue = Number(stake)
  const stakeError = stake !== '' && (!Number.isFinite(stakeValue) || stakeValue < 10) ? 'Minimum stake is ₹10.' : ''
  const swipe = useSwipeDismiss(() => setSlipOpen(false), 'down')
  return (
    <>
    {slipOpen && <div className="slip-backdrop" onClick={() => setSlipOpen(false)} />}
    <aside className={`betslip ${slipOpen ? 'is-open' : ''}`} {...swipe}>
      <div className="slip-panel">
      <span className="sheet-grabber" aria-hidden="true" />
      <h3><Icon name="ticket" size={21} /> Bet Slip {betslip.length ? `(${betslip.length})` : ''}{betslip.length > 0 && <button type="button" className="slip-clear" onClick={clearSlip}>Clear</button>}<button type="button" className="slip-close" onClick={() => setSlipOpen(false)} aria-label="Close bet slip"><Icon name="close" size={18} /></button></h3>
      <div className="slip-modes" role="tablist" aria-label="Bet type">{['Single', 'Combo', 'System'].map((item) => <button key={item} type="button" role="tab" aria-selected={mode === item} className={mode === item ? 'selected' : ''} onClick={() => setMode(item)}>{item}</button>)}</div>
      {betslip.length === 0 ? (
        <div className="slip-empty">
          <div className="icon"><Icon name="ticket" /></div>
          <strong>Your bet slip is empty</strong>
          <span>Click on odds to add a selection<br />to your bet slip.</span>
          {!loggedIn && <div className="slip-login"><strong>Log in to start betting</strong><button type="button" onClick={() => setAuthMode('login')}>Log in</button><small>Don't have an account? <button type="button" onClick={() => setAuthMode('signup')}>Sign up</button></small></div>}
        </div>
      ) : (
        <>
          {betslip.map((b) => (
            <div key={b.id} className={`slip-item ${lastAddedBetId === b.id ? 'just-added' : ''}`}>
              <button className="remove" onClick={() => removeBet(b.id)} aria-label={`Remove ${b.pick}`}><Icon name="close" size={15} /></button>
              <div className="slip-event">{b.event}</div>
              <div className="slip-pick"><strong>{b.pick}</strong><b>{Number(b.odd).toFixed(2)}</b></div>
            </div>
          ))}
          <div className="stake">
            <label htmlFor="bet-stake">Stake</label>
            <div className="stake-input"><span>₹</span><input id="bet-stake" type="number" min="10" inputMode="decimal" placeholder="100" value={stake} onChange={(e) => { setStake(e.target.value); setSlipError('') }} /></div>
            <div className="stake-quick">{[100, 500, 1000].map((amount) => <button key={amount} type="button" className={stakeValue === amount ? 'on' : ''} onClick={() => setStake(String(amount))}>₹{amount}</button>)}</div>
            {stakeError && <p className="stake-error">{stakeError}</p>}
          </div>
          <div className="slip-foot">
            {mode !== 'Single' && <p className="hint">{mode} bets are not available yet. Select Single to place a bet.</p>}
            <div className="row-between"><span>Total odds</span><b>{total.toFixed(2)}</b></div>
            <div className="slip-payout"><span>Potential payout</span><b>₹{(total * Number(stake || 0)).toFixed(2)}</b></div>
            {slipError && <p className="hint" style={{ color: 'var(--coral)' }}>{slipError}</p>}
            <button
              className="btn btn-yellow btn-block"
              disabled={mode !== 'Single' || Boolean(stakeError) || !stakeValue}
              onClick={async () => {
                setSlipError('')
                if (!loggedIn) {
                  setAuthMode('login')
                  return
                }
                try {
                  await placeBets(Number(stake))
                  setSlipOpen(false)
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
      </div>
      <div className="slip-rewards"><span className="reward-crown" aria-hidden="true">♛</span><h3>Exclusive Rewards<br />for Members</h3><ul><li>Higher Odds</li><li>Early Access</li><li>Exclusive Promotions</li><li>Fast Withdrawals</li></ul><NavLink to="/vip">Join Now <span aria-hidden="true">→</span></NavLink></div>
    </aside>
    </>
  )
}

const dialingCountries = [
  { iso: 'IN', name: 'India', dial: '+91' },
  { iso: 'AE', name: 'United Arab Emirates', dial: '+971' },
  { iso: 'US', name: 'United States', dial: '+1' },
  { iso: 'CA', name: 'Canada', dial: '+1' },
  { iso: 'GB', name: 'United Kingdom', dial: '+44' },
  { iso: 'AU', name: 'Australia', dial: '+61' },
  { iso: 'SG', name: 'Singapore', dial: '+65' },
  { iso: 'SA', name: 'Saudi Arabia', dial: '+966' },
  { iso: 'PK', name: 'Pakistan', dial: '+92' },
  { iso: 'BD', name: 'Bangladesh', dial: '+880' },
  { iso: 'NP', name: 'Nepal', dial: '+977' },
  { iso: 'LK', name: 'Sri Lanka', dial: '+94' },
  { iso: 'DE', name: 'Germany', dial: '+49' },
  { iso: 'FR', name: 'France', dial: '+33' },
]

function AuthModal() {
  const { authMode, setAuthMode, login, loginWithPhone, register, loginWithGoogle, resetPasswordWithPhone, authError, setAuthError } = useApp()
  const [loginTab, setLoginTab] = useState('Phone')
  const [signupTab, setSignupTab] = useState('Phone')
  const [showPass, setShowPass] = useState(false)
  const [promoOpen, setPromoOpen] = useState(false)
  const [bonusOpen, setBonusOpen] = useState(false)
  const [accepted, setAccepted] = useState(true)
  const [bonus, setBonus] = useState('Welcome Casino 100%')
  const [phone, setPhone] = useState('')
  const [country, setCountry] = useState(dialingCountries[0])
  const [countryOpen, setCountryOpen] = useState(false)
  const [countryQuery, setCountryQuery] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [recoveryDone, setRecoveryDone] = useState(false)
  const [promoCode, setPromoCode] = useState('')
  const [busy, setBusy] = useState(false)
  const [otp, setOtp] = useState('')
  const [otpLength, setOtpLength] = useState(4)
  const [otpHint, setOtpHint] = useState('')
  const [otpSent, setOtpSent] = useState(false)
  const [phoneVerified, setPhoneVerified] = useState(false)
  const [resendSeconds, setResendSeconds] = useState(0)
  const fullPhone = `${country.dial}${phone.replace(/\D/g, '')}`
  const filteredCountries = dialingCountries.filter((item) => `${item.name} ${item.iso} ${item.dial}`.toLowerCase().includes(countryQuery.trim().toLowerCase()))

  useEffect(() => {
    if (resendSeconds <= 0) return undefined
    const timer = window.setTimeout(() => setResendSeconds((seconds) => Math.max(0, seconds - 1)), 1000)
    return () => window.clearTimeout(timer)
  }, [resendSeconds])

  if (!authMode) return null
  const isLogin = authMode === 'login'
  const isRecover = authMode === 'recover' || authMode === 'update-password'

  const requestOtp = async () => {
    setBusy(true)
    setAuthError('')
    setOtpHint('')
    try {
      if (phone.replace(/\D/g, '').length !== 10) throw new Error('Enter a 10-digit mobile number.')
      const data = await sendOtp(fullPhone)
      setOtpSent(true)
      setOtpLength(Number(data.length) === 6 ? 6 : 4)
      setResendSeconds(30)
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
      if (isLogin) {
        await loginWithPhone({ phone: fullPhone, otp })
      } else {
        await verifyOtp(fullPhone, otp)
        setPhoneVerified(true)
        setOtpHint(isRecover ? 'Phone verified. Set a new password.' : 'Phone verified.')
      }
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
        if (loginTab === 'Phone') {
          if (phone.replace(/\D/g, '').length !== 10) throw new Error('Enter a 10-digit mobile number.')
          return await loginWithPhone({ phone: fullPhone, otp })
        }
        await login({ method: 'email', email, password })
      } else {
        if (signupTab === 'Phone' && phone.replace(/\D/g, '').length !== 10) {
          throw new Error('Enter a 10-digit mobile number.')
        }
        if (!isStrongPassword(password)) {
          throw new Error(`Password must be ${PASSWORD_HINT}.`)
        }
        await register({
          method: signupTab === 'E-mail' ? 'email' : 'phone',
          phone: signupTab === 'Phone' ? fullPhone : '',
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

  const saveRecoveredPassword = async () => {
    setBusy(true)
    setAuthError('')
    try {
      if (phone.replace(/\D/g, '').length !== 10) throw new Error('Enter the 10-digit mobile number on your account.')
      if (!phoneVerified) throw new Error('Verify your phone with OTP first. Email cannot reset a password.')
      if (!isStrongPassword(password)) throw new Error(`Password must be ${PASSWORD_HINT}.`)
      await resetPasswordWithPhone({ phone: fullPhone, otp, password })
      setRecoveryDone(true)
      setPassword('')
      setOtp('')
      setPhoneVerified(false)
      setOtpSent(false)
    } catch (err) {
      setAuthError(err.message)
    } finally {
      setBusy(false)
    }
  }

  const renderPhoneField = () => (
    <div className="field field-row phone-field" onBlurCapture={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setCountryOpen(false) }}>
      <button className="flag-box country-trigger" type="button" aria-label={`Country code: ${country.name} ${country.dial}`} aria-expanded={countryOpen} onClick={() => setCountryOpen((open) => !open)}>
        <CountryFlag code={country.iso} /><b>{country.dial}</b><small>▾</small>
      </button>
      <label className="float-field">
        <span>Phone number</span>
        <input className="input" type="tel" inputMode="numeric" autoComplete="tel-national" maxLength={10} placeholder="10-digit mobile number" value={phone} onChange={(e) => { setPhone(e.target.value.replace(/\D/g, '').slice(0, 10)); setPhoneVerified(false); setOtpSent(false); setOtpHint(''); setOtp('') }} />
      </label>
      {countryOpen && (
        <div className="country-menu">
          <input className="country-search" type="search" autoFocus placeholder="Search country or code" aria-label="Search country or dial code" value={countryQuery} onChange={(e) => setCountryQuery(e.target.value)} onKeyDown={(e) => { if (e.key === 'Escape') setCountryOpen(false) }} />
          <div className="country-list" role="listbox" aria-label="Country calling codes">
            {filteredCountries.map((item) => (
              <button key={item.iso} className={item.iso === country.iso ? 'selected' : ''} type="button" role="option" aria-selected={item.iso === country.iso} onClick={() => { setCountry(item); setCountryOpen(false); setCountryQuery(''); setPhoneVerified(false); setOtpSent(false); setOtpHint(''); setOtp('') }}>
                <CountryFlag code={item.iso} /><span className="country-name">{item.name}</span><b>{item.dial}</b>
              </button>
            ))}
            {!filteredCountries.length && <p className="country-empty">No matching country</p>}
          </div>
        </div>
      )}
    </div>
  )

  return (
    <div className="overlay" onClick={() => setAuthMode(null)}>
      <div className={`modal ${isLogin || isRecover ? 'login-modal' : ''}`} role="dialog" aria-modal="true" aria-label={isLogin ? 'Log in' : isRecover ? 'Reset password' : 'Sign up'} onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <button className="icon-btn" onClick={() => setAuthMode(null)} aria-label="Close"><Icon name="close" /></button>
          <h1>{isLogin ? 'Log in' : isRecover ? 'Reset password' : 'Sign up'}</h1>
          <button className="icon-btn" type="button" aria-label="Support">🎧</button>
        </div>
        {(isLogin || authMode === 'signup') && (
          <>
            {isLogin && <div className="login-intro"><span>WELCOME BACK</span><p>Sign in to your Bullwave Club account</p></div>}
            <button className="btn-dark" type="button" onClick={async () => { try { await loginWithGoogle() } catch (err) { setAuthError(err.message) } }}>
              <span className="g-mark">G</span> Continue with Google
            </button>
            <div className="or">or choose a login method</div>
          </>
        )}
        {authError && <p className="hint" style={{ color: 'var(--coral)' }}>{authError}</p>}

        {isRecover ? (
          <div className="recovery-panel">
            {recoveryDone ? (
              <p className="recovery-message">Password updated. Log in with your e-mail or phone and the new password. E-mail is only for creating and signing in — it cannot reset a password.</p>
            ) : (
              <>
                <p>E-mail cannot reset a password. Confirm the mobile number on your account with OTP, then choose a new password. New members can still create an account with e-mail.</p>
                {renderPhoneField()}
                <div className="otp-row login-otp-row">
                  <input
                    className="input"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={otpLength}
                    placeholder={`${otpLength}-digit OTP`}
                    aria-label="One-time password"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, otpLength))}
                    disabled={!otpSent}
                    onKeyDown={(e) => { if (e.key === 'Enter' && otp.length === otpLength) confirmOtp() }}
                  />
                  {otpSent ? (
                    <button className="btn btn-yellow" type="button" disabled={busy || otp.length !== otpLength || phoneVerified} onClick={confirmOtp}>{busy ? 'Checking…' : phoneVerified ? 'Verified' : 'Verify phone'}</button>
                  ) : (
                    <button className="btn btn-yellow" type="button" disabled={busy || phone.replace(/\D/g, '').length !== 10} onClick={requestOtp}>{busy ? 'Sending…' : 'Send OTP'}</button>
                  )}
                </div>
                {otpSent && <button className="otp-resend" type="button" disabled={busy || resendSeconds > 0} onClick={requestOtp}>{resendSeconds > 0 ? `Resend in ${resendSeconds}s` : 'Send a new code'}</button>}
                {otpHint && <p className="hint otp-status">{otpHint}</p>}
                {phoneVerified && (
                  <>
                    <label className="auth-label" htmlFor="new-password">New password</label>
                    <input id="new-password" className="input" type="password" autoComplete="new-password" placeholder={PASSWORD_HINT} value={password} onChange={(e) => setPassword(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') saveRecoveredPassword() }} />
                    <button className="btn btn-yellow btn-block" type="button" disabled={busy || !isStrongPassword(password)} onClick={saveRecoveredPassword}>{busy ? 'Saving…' : 'Save new password'}</button>
                  </>
                )}
              </>
            )}
            <button className="auth-back" type="button" onClick={() => { setAuthError(''); setRecoveryDone(false); setAuthMode('login') }}>← Back to log in</button>
          </div>
        ) : isLogin ? (
          <>
            <div className="tabs tabs-2 login-method-tabs">
              {['Phone', 'E-mail'].map((method) => (
                <button key={method} type="button" className={loginTab === method ? 'on' : ''} onClick={() => { setLoginTab(method); setAuthError(''); setOtpHint(''); setOtpSent(false); setOtp('') }}>{method}</button>
              ))}
            </div>
            {loginTab === 'Phone' ? (
              <>
                {renderPhoneField()}
                <div className="otp-row login-otp-row">
                  <input
                    className="input"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={otpLength}
                    placeholder={`${otpLength}-digit OTP`}
                    aria-label="One-time password"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, otpLength))}
                    disabled={!otpSent}
                    onKeyDown={(e) => { if (e.key === 'Enter' && otp.length === otpLength) confirmOtp() }}
                  />
                  {otpSent ? (
                    <button className="btn btn-yellow" type="button" disabled={busy || otp.length !== otpLength} onClick={confirmOtp}>{busy ? 'Checking…' : 'Log in'}</button>
                  ) : (
                    <button className="btn btn-yellow" type="button" disabled={busy || phone.replace(/\D/g, '').length !== 10} onClick={requestOtp}>{busy ? 'Sending…' : 'Send OTP'}</button>
                  )}
                </div>
                {otpSent && <button className="otp-resend" type="button" disabled={busy || resendSeconds > 0} onClick={requestOtp}>{resendSeconds > 0 ? `Resend in ${resendSeconds}s` : 'Send a new code'}</button>}
                {otpHint && <p className="hint otp-status">{otpHint}</p>}
              </>
            ) : (
              <>
                <div className="field">
                  <label className="auth-label" htmlFor="login-email">E-mail address</label>
                  <input id="login-email" className="input" type="email" autoComplete="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') submit() }} />
                </div>
                <div className="field pass-wrap">
                  <label className="auth-label" htmlFor="login-password">Password</label>
                  <input id="login-password" className="input" type={showPass ? 'text' : 'password'} autoComplete="current-password" placeholder="Enter your password" value={password} onChange={(e) => setPassword(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') submit() }} />
                  <button className="eye" type="button" onClick={() => setShowPass((v) => !v)} aria-label={showPass ? 'Hide password' : 'Show password'}><Icon name={showPass ? 'close' : 'eye'} size={18} /></button>
                </div>
                <button className="forgot" type="button" onClick={() => { setAuthError(''); setRecoveryDone(false); setPhoneVerified(false); setOtpSent(false); setOtpHint(''); setOtp(''); setPassword(''); setAuthMode('recover') }}>Forgot your password?</button>
                <button className="btn btn-yellow btn-block" disabled={busy || !email.trim() || !password} onClick={submit}>{busy ? 'Please wait…' : 'Log in to Bullwave Club'}</button>
              </>
            )}
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
                {renderPhoneField()}
                <div className="field">
                  <input className="input" type="email" placeholder="E-mail (required)" value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>
                <div className="otp-row">
                  <input
                    className="input"
                    inputMode="numeric"
                    maxLength={otpLength}
                    placeholder={`${otpLength}-digit OTP`}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, otpLength))}
                    disabled={!otpSent || phoneVerified}
                  />
                  {otpSent && !phoneVerified ? (
                    <button className="btn btn-yellow" type="button" disabled={busy || otp.length !== otpLength} onClick={confirmOtp}>Verify</button>
                  ) : (
                    <button className="btn btn-yellow" type="button" disabled={busy || phone.replace(/\D/g, '').length !== 10} onClick={requestOtp}>{otpSent ? 'Resend' : 'Send OTP'}</button>
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
            <p className="hint">• {PASSWORD_HINT}</p>

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

            <button className="btn btn-yellow btn-block" disabled={!accepted || busy || !isStrongPassword(password) || (signupTab === 'Phone' && !phoneVerified)} onClick={submit}>
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
    <article className="card match-card">
      <div className="match-top">
        <span className={m.live ? 'live' : ''}>{m.live ? '● LIVE' : m.time}</span>
        <span className="match-league">{m.league.split('.').slice(1).join(' · ').trim() || m.league}</span>
      </div>
      <NavLink to={`/match/${m.id}`}>
        <div className="teams">
          <div className="team"><span>{m.home}</span>{m.score && <span className="score">{m.score[0]}</span>}</div>
          <div className="team"><span>{m.away}</span>{m.score && <span className="score">{m.score[1]}</span>}</div>
        </div>
      </NavLink>
      {m.markets[0].odd == null ? (
        <NavLink to={`/match/${m.id}`}><button className="odd-more">{m.markets[0].label}</button></NavLink>
      ) : (
        <div className={`odds ${m.markets.length === 2 ? 'two' : ''}`}>
          {m.markets.map((mk) => (
            <OddButton
              key={mk.id}
              id={mk.id}
              odd={mk.odd}
              label={mk.label}
              selected={selected(mk.id)}
              onSelect={(price) => addBet({ id: mk.id, event: `${m.home} vs ${m.away}`, pick: `${mk.label}`, odd: price })}
            />
          ))}
        </div>
      )}
      <button className={`star ${favorites.includes(m.id) ? 'on' : ''}`} onClick={() => toggleFavorite(m.id)} type="button" aria-label={favorites.includes(m.id) ? 'Remove from favorites' : 'Add to favorites'}>★</button>
    </article>
  )
}

function Footer() {
  return (
    <footer className="footer">
      <img className="footer-logo" src={`${import.meta.env.BASE_URL}images/brand/bullwave-transparent.png`} alt="Bullwave Club - Higher Minds, Brighter Tomorrows" width="160" height="160" />
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

const heroPromotions = [
  { kicker: 'New player offer', title: 'WELCOME BONUS', detail: 'Get Sports Bonus 100% up to ₹50,000', cta: 'Claim bonus', image: 'images/hero/cricket-champion-v1.png', position: 'center' },
  { kicker: 'Bullwave rewards', title: 'SPIN THE WHEEL', detail: 'A fresh surprise is waiting in Promotions', cta: 'Explore rewards', image: 'images/promotions/wheel-v1.webp', position: 'center, right center', size: 'cover, auto 100%' },
  { kicker: 'Live casino', title: 'CASINO RELOAD', detail: 'Discover live tables and new club offers', cta: 'See promotions', image: 'images/promotions/casino-hero-v2.webp', position: 'center, right center', size: 'cover, auto 100%' },
]

function PromotionSlider() {
  const [active, setActive] = useState(0)
  const [paused, setPaused] = useState(false)
  useEffect(() => {
    if (paused || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined
    const timer = window.setInterval(() => setActive((current) => (current + 1) % heroPromotions.length), 6000)
    return () => window.clearInterval(timer)
  }, [paused])
  const move = (step) => setActive((current) => (current + step + heroPromotions.length) % heroPromotions.length)
  return (
    <section className="banner hero-slider" aria-label="Featured promotions" aria-roledescription="carousel" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)} onFocusCapture={() => setPaused(true)} onBlurCapture={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setPaused(false) }}>
      {heroPromotions.map((slide, index) => (
        <div key={slide.title} className={`hero-slide ${active === index ? 'is-active' : ''}`} aria-hidden={active !== index} inert={active !== index ? true : undefined} style={{ backgroundImage: `linear-gradient(90deg, rgba(4,13,24,.98) 0%, rgba(4,13,24,.82) 37%, rgba(4,13,24,.18) 78%), url('${import.meta.env.BASE_URL}${slide.image}')`, backgroundPosition: slide.position, backgroundSize: slide.size || 'cover' }}>
          <div className="banner-content">
            <span className="banner-kicker">{slide.kicker}</span>
            <h1>{slide.title}</h1>
            <p>{slide.detail}</p>
            <NavLink to="/promotions" className="btn btn-yellow banner-cta">{slide.cta}</NavLink>
          </div>
        </div>
      ))}
      <button className="hero-arrow hero-prev" type="button" aria-label="Previous promotion" onClick={() => move(-1)}>‹</button>
      <button className="hero-arrow hero-next" type="button" aria-label="Next promotion" onClick={() => move(1)}>›</button>
      <div className="hero-dots" aria-label="Choose promotion">
        {heroPromotions.map((slide, index) => (
          <button key={slide.title} type="button" className={active === index ? 'is-active' : ''} aria-label={`Show promotion ${index + 1}: ${slide.title}`} aria-current={active === index ? 'true' : undefined} onClick={() => setActive(index)} />
        ))}
      </div>
    </section>
  )
}

function PageIntro({ eyebrow = 'BULLWAVE CLUB', title, description, icon = 'star', stats = [], action }) {
  return <section className="page-intro">
    <div className="page-intro-copy">
      <span className="eyebrow">{eyebrow}</span>
      <h1>{title}</h1>
      <p>{description}</p>
      {action && <NavLink className="page-intro-action" to={action.to}>{action.label}<span aria-hidden="true">↗</span></NavLink>}
    </div>
    <div className="page-intro-detail">
      <div className="page-intro-emblem" aria-hidden="true"><Icon name={icon} size={42} /></div>
      {stats.length > 0 && <div className="page-intro-stats">{stats.map((item) => <div key={item.label}><b>{item.value}</b><span>{item.label}</span></div>)}</div>}
    </div>
  </section>
}

function FeatureCards({ items }) {
  return <div className="feature-grid">{items.map((item) => {
    const content = <><span className="feature-icon"><Icon name={item.icon} size={23} /></span><strong>{item.title}</strong><span className="feature-detail">{item.detail}</span>{item.to && <span className="feature-link">Explore <span aria-hidden="true">↗</span></span>}</>
    return item.to ? <NavLink key={item.title} to={item.to} className="feature-card">{content}</NavLink> : <div key={item.title} className="feature-card">{content}</div>
  })}</div>
}

function EmptyState({ icon = 'star', title, detail, action, type = 'empty', onRetry }) {
  return <div className={`empty-state is-${type}`}><span className="empty-state-icon"><Icon name={icon} size={30} /></span><h2>{title}</h2><p>{detail}</p><div className="empty-state-actions">{onRetry && <button type="button" className="btn btn-yellow" onClick={onRetry}>Try again</button>}{action && <NavLink to={action.to} className={onRetry ? 'btn btn-ghost' : 'btn btn-yellow'}>{action.label}</NavLink>}</div></div>
}

function useCarouselControls() {
  const rowRef = useRef(null)
  const [edges, setEdges] = useState({ start: true, end: false })

  useEffect(() => {
    const row = rowRef.current
    if (!row) return undefined
    const updateEdges = () => setEdges({
      start: row.scrollLeft <= 2,
      end: row.scrollLeft + row.clientWidth >= row.scrollWidth - 2,
    })
    updateEdges()
    row.addEventListener('scroll', updateEdges, { passive: true })
    const observer = new ResizeObserver(updateEdges)
    observer.observe(row)
    const contentObserver = new MutationObserver(updateEdges)
    contentObserver.observe(row, { childList: true })
    return () => {
      row.removeEventListener('scroll', updateEdges)
      observer.disconnect()
      contentObserver.disconnect()
    }
  }, [])

  const move = (direction) => {
    const row = rowRef.current
    if (!row) return
    row.scrollBy({ left: direction * Math.max(260, row.clientWidth * 0.7), behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' })
  }

  return { rowRef, edges, move }
}

function CarouselArrow({ direction, label, onClick, disabled }) {
  return <button className="quick-arrow" type="button" aria-label={label} onClick={onClick} disabled={disabled}>
    <svg viewBox="0 0 24 24" aria-hidden="true"><path d={direction === 'previous' ? 'm14.5 5-7 7 7 7' : 'm9.5 5 7 7-7 7'} /></svg>
  </button>
}

function ShortcutCarousel() {
  const { rowRef, edges, move } = useCarouselControls()

  return (
    <nav className="quick-carousel" aria-label="Explore Bullwave Club">
      <CarouselArrow direction="previous" label="Previous shortcuts" onClick={() => move(-1)} disabled={edges.start} />
      <div className="quick-row" ref={rowRef}>
        {shortcuts.map((s) => (
          <NavLink key={s.name} to={s.to} className="quick" style={{ '--orb-accent': s.color }}>
            <div className="orb" style={{ background: s.color }}>
              <img src={`${import.meta.env.BASE_URL}images/shortcuts/${s.image}.svg`} alt="" width="54" height="54" />
            </div>
            <span>{s.name}</span>
          </NavLink>
        ))}
      </div>
      <CarouselArrow direction="next" label="Next shortcuts" onClick={() => move(1)} disabled={edges.end} />
    </nav>
  )
}

function GameCarousel({ catalog }) {
  const { rowRef, edges, move } = useCarouselControls()
  return <nav className="game-carousel" aria-label="Browse games">
    <CarouselArrow direction="previous" label="Previous games" onClick={() => move(-1)} disabled={edges.start} />
    <div className="game-row" ref={rowRef}>
      {catalog.slice(0, 14).map((g) => {
        const iconKind = getGameIconKind(g)
        return <NavLink key={g.id} to={`/casino/${g.cat === 'live' ? 'live-casino' : g.cat === 'slots' ? 'slots' : 'instant-games'}`} className="game-circle">
          <div className="thumb">{iconKind ? <GameIcon game={g} kind={iconKind} /> : <GameArtwork game={g} />}</div>
          {g.name}
        </NavLink>
      })}
    </div>
    <CarouselArrow direction="next" label="Next games" onClick={() => move(1)} disabled={edges.end} />
  </nav>
}

function Home() {
  const { catalogMatches: matches, clubGames, favorites, recentMatches } = useApp()
  const featured = matches.find((m) => m.live) || matches[0]
  const [matchDay, setMatchDay] = useState('Today')
  const todayMatches = [matches.find((m) => m.sport === 'cricket' && m.live), matches.find((m) => m.sport === 'football' && !m.live), matches.find((m) => m.sport === 'tennis'), matches.find((m) => m.sport === 'basketball')].filter(Boolean)
  const topMatches = matchDay === 'Today' ? (todayMatches.length ? todayMatches : matches.slice(0, 4)) : matchDay === 'Tomorrow' ? matches.filter((m) => /TOMORROW/.test(m.time)).slice(0, 4) : matches.slice(0, 4)
  const personalIds = [...recentMatches, ...favorites]
  const personalMatches = personalIds.map((matchId) => matches.find((match) => match.id === matchId)).filter((match, index, list) => match && list.findIndex((item) => item.id === match.id) === index).slice(0, 4)
  const forYou = personalMatches.length ? personalMatches : matches.filter((match) => match.live).slice(0, 4)
  const leagueCards = [
    { name: 'IPL', sport: 'Cricket', mark: 'IPL', className: 'ipl', to: '/sport/cricket' },
    { name: 'Premier League', sport: 'Football', mark: '♛', className: 'premier', to: '/sport/football' },
    { name: 'NBA', sport: 'Basketball', mark: 'NBA', className: 'nba', to: '/sport/basketball' },
    { name: 'ATP Tour', sport: 'Tennis', mark: 'ATP', className: 'atp', to: '/sport/tennis' },
    { name: 'La Liga', sport: 'Football', mark: 'L', className: 'laliga', to: '/sport/football' },
    { name: 'Formula 1', sport: 'Motorsport', mark: 'F1', className: 'f1', to: '/live' },
  ]
  return (
    <div className="home-desk reference-home">
      <section className="home-hero" aria-label="Bullwave Club sports">
        <div className="hero-message"><p>BIGGER GAMES. HIGHER THRILLS.</p><h1>RIDE THE <span>WAVE</span></h1><div>Live sports. Real action. Bigger rewards.</div><NavLink to="/live">Explore Live Events <span aria-hidden="true">→</span></NavLink></div>
        <div className="hero-mantra" aria-hidden="true">PLAY<br />WATCH<br />BET<br />WIN<i /></div>
      </section>
      <nav className="sport-filter" aria-label="Browse by sport">
        {sports.filter((s) => ['cricket', 'football', 'basketball', 'tennis', 'table-tennis', 'horse', 'camel'].includes(s.id)).map((s, index) => <NavLink key={s.id} to={s.to} className={index === 0 ? 'featured-sport' : ''}><span className={`sport-filter-icon sport-${s.id}`}><Icon name={s.icon} size={22} /></span>{s.name}</NavLink>)}
        <NavLink to="/live"><span className="sport-more">•••</span>More</NavLink>
      </nav>
      <section className="personalized-home">
        <div className="personalized-head"><div><span className="eyebrow">YOUR CLUB</span><h2>{personalMatches.length ? 'Picked for you' : 'Popular right now'}</h2></div><small>{personalMatches.length ? 'Based on favourites and recently viewed matches' : 'Your recommendations adapt as you explore'}</small></div>
        <div className="personalized-row">{forYou.map((match) => <NavLink key={match.id} to={`/match/${match.id}`} className="personalized-match"><span className={`top-match-icon sport-${match.sport}`}><Icon name={sportIcon(match.sport)} size={18} /></span><span><small>{match.live ? 'LIVE' : match.time}</small><strong>{match.home} vs {match.away}</strong><em>{match.league}</em></span><Icon name="chevron" size={15} /></NavLink>)}</div>
      </section>
      <div className="home-content-grid">
        <section className="live-feature-area">
          <h2 className="home-section-title"><Icon name="zap" size={24} /> Featured Live</h2>
          {featured && <article className="live-feature-card">
            <div className="live-card-top"><span className="live-badge">★ LIVE</span><span className="live-card-league">Youth teams • ODI U-19 • 2nd ODI</span><span className="live-card-innings">● &nbsp;Innings 1&nbsp; <i /> &nbsp;37.2 overs</span></div>
            <div className="live-scoreboard"><div className="live-team"><CountryFlag code="IN" /><strong>{featured.home}</strong></div><div className="live-center-score"><strong>{featured.score?.[0] || '0/0'}</strong><span>(37.2)</span></div><div className="live-team"><CountryFlag code="AU" /><strong>{featured.away}</strong><span>{featured.score?.[1]?.split(' (')[0] || '0/0'}</span></div></div>
            <div className="live-lead">Australia U-19 lead by 188 runs</div>
            <div className="live-card-actions"><NavLink to={`/match/${featured.id}`}>Open Match Center <span aria-hidden="true">→</span></NavLink><NavLink to={`/match/${featured.id}`}>View Odds</NavLink></div>
          </article>}
        </section>
        <section className="top-matches-panel"><div className="top-matches-head"><h2><Icon name="cal" size={20} /> Top Matches</h2><NavLink to="/live">View all live <span aria-hidden="true">→</span></NavLink></div><div className="day-tabs" role="tablist" aria-label="Match day">{['Today', 'Tomorrow', 'This Week'].map((day) => <button key={day} type="button" role="tab" aria-selected={matchDay === day} className={matchDay === day ? 'active' : ''} onClick={() => setMatchDay(day)}>{day}</button>)}</div><div className="top-match-list">{topMatches.length ? topMatches.map((m) => <NavLink to={`/match/${m.id}`} key={m.id} className="top-match-row"><span className={`top-match-icon sport-${m.sport}`}><Icon name={sportIcon(m.sport)} size={19} /></span><span className="top-match-copy"><small>{m.live ? 'LIVE' : m.time}</small><strong>{m.home} vs {m.away}</strong>{!m.live && <em>{m.league.split('.').slice(-1)[0].trim()}</em>}</span>{m.live && <span className="top-match-score">{m.score?.[0]}{m.sport === 'cricket' ? ' (37.2)' : ''}</span>}<Icon name="chevron" size={15} /></NavLink>) : <p className="top-match-empty">No matches scheduled for this day.</p>}</div></section>
      </div>
      <section className="popular-leagues"><h2 className="home-section-title"><span aria-hidden="true">🏆</span> Popular Leagues</h2><div className="popular-league-grid">{leagueCards.map((league) => <NavLink to={league.to} key={league.name} className="popular-league"><span className={`league-logo ${league.className}`}>{league.mark}</span><span><strong>{league.name}</strong><small>{league.sport}</small></span></NavLink>)}</div></section>
      <footer className="home-brand-strip"><span>SPORTS BRING US TOGETHER.<br /><b>BULLWAVE</b> KEEPS US AHEAD.</span><div className="strip-brand"><span className="logo-emblem" aria-hidden="true" /><strong>BULL<span>WAVE</span><small>CLUB</small></strong></div><p>SPORTS<br />PEOPLE<br />PASSION<br />PROGRESS</p></footer>
    </div>
  )
}

function Live() {
  const { catalogMatches: matches, catalogLoading } = useApp()
  const live = matches.filter((m) => m.live)
  const [sport, setSport] = useState('All Live')
  const liveKey = { 'Camel Riding': 'camel', 'Horse Racing': 'horse', 'Table Tennis': 'table-tennis' }
  const filtered = sport === 'All Live' ? live : live.filter((m) => m.sport === (liveKey[sport] || sport.toLowerCase().replaceAll(' ', '-')))
  return (
    <div className="content-page">
      <PageIntro eyebrow="IN PLAY" title="Live Events" description="Follow the action as it happens and explore the markets available now." icon="live" stats={[{ label: 'Live events', value: live.length }, { label: 'Sports', value: new Set(live.map((m) => m.sport)).size }]} action={{ to: '/upcoming', label: 'Upcoming events' }} />
      <div className="filters sticky-filters">
        {['All Live', 'Cricket', 'Football', 'Basketball', 'Tennis', 'Horse Racing', 'Camel Riding'].map((c) => (
          <button key={c} type="button" className={`chip ${sport === c ? 'on' : ''}`} onClick={() => setSport(c)}>{c}</button>
        ))}
      </div>
      <div className="content-section-title"><h2>{sport === 'All Live' ? 'Live right now' : `${sport} live`}</h2><span>{filtered.length} events</span></div>
      {catalogLoading ? <SkeletonGrid count={4} /> : filtered.length ? <div className="match-grid">{filtered.map((m) => <MatchCard key={m.id} m={m} />)}</div> : <EmptyState icon="live" title="No live events in this sport" detail="Try another sport or browse upcoming fixtures." action={{ to: '/upcoming', label: 'See upcoming events' }} />}
    </div>
  )
}

function Upcoming() {
  const { catalogMatches: matches, catalogLoading } = useApp()
  const upcoming = matches.filter((m) => !m.live)
  const [when, setWhen] = useState('All')
  const filtered = when === 'All' ? upcoming : upcoming.filter((m) => String(m.time || '').toUpperCase().startsWith(when.toUpperCase()))
  return (
    <div className="content-page">
      <PageIntro eyebrow="NEXT UP" title="Upcoming events" description="Plan ahead with the fixtures and markets on the schedule." icon="cal" stats={[{ label: 'Fixtures', value: upcoming.length }, { label: 'Sports', value: new Set(upcoming.map((m) => m.sport)).size }]} action={{ to: '/live', label: 'Explore live events' }} />
      <div className="filters sticky-filters">
        {['All', 'Today', 'Tomorrow'].map((c) => (
          <button key={c} type="button" className={`chip ${when === c ? 'on' : ''}`} onClick={() => setWhen(c)}>{c}</button>
        ))}
      </div>
      <div className="content-section-title"><h2>{when === 'All' ? 'On the calendar' : when}</h2><span>{filtered.length} fixtures</span></div>
      {catalogLoading ? <SkeletonGrid count={6} /> : filtered.length ? <div className="match-grid">{filtered.map((m) => <MatchCard key={m.id} m={m} />)}</div> : <EmptyState icon="cal" title="No fixtures in this window" detail="Check all upcoming events for more matches." action={{ to: '/upcoming', label: 'All fixtures' }} />}
    </div>
  )
}

function Promotions() {
  const [category, setCategory] = useState('All offers')
  const shown = category === 'All offers' ? promotions : promotions.filter((p) => p.category === category)
  return (
    <div className="promotions-page">
      <PageIntro eyebrow="BULLWAVE REWARDS" title="Promotions" description="Fresh boosts, free bets and member offers in one place." icon="gift" stats={[{ label: 'Offers', value: promotions.length }, { label: 'Categories', value: new Set(promotions.map((p) => p.category)).size }]} />
      <div className="filters promo-tabs">
        {['All offers', 'Sports', 'Casino', 'Instant'].map((c) => <button key={c} type="button" className={`chip ${category === c ? 'on' : ''}`} onClick={() => setCategory(c)}>{c}</button>)}
      </div>
      <div className="content-section-title"><h2>{category === 'All offers' ? 'Latest offers' : `${category} offers`}</h2><span>{shown.length} available</span></div>
      <div className="promo-grid">
        {shown.map((p) => (
          <article key={p.id} className={`promo tone-${p.tone}`}>
            <div className="promo-glow" />
            <div className="promo-main">
              <div className="promo-copy">
                <div className="promo-meta"><span>{p.category}</span><b>● {p.expires}</b></div>
                <h3>{p.title}</h3>
                <p>{p.text}</p>
              </div>
              <PromoArtwork type={p.art} />
            </div>
            <NavLink to="/account/deposit" className="promo-action">
              <span><b>{p.cta}</b><small>Terms apply</small></span>
              <i aria-hidden="true">→</i>
            </NavLink>
          </article>
        ))}
      </div>
    </div>
  )
}

function PromoArtwork({ type }) {
  const pictures = {
    wheel: 'wheel-v1.webp',
    shield: 'shield-v1.webp',
    scratch: 'scratch-v1.webp',
    trophy: 'cricket-v1.webp',
    chips: 'casino-card-v2.webp',
    gift: 'dash-v1.webp',
    coin: '777-v1.webp',
    cricket: 'welcome-v1.webp',
    crown: 'royal-v1.webp',
    rocket: 'crash-v1.webp',
  }
  return (
    <div className={`promo-art promo-art-${type}`} aria-hidden="true">
      <img src={`/images/promotions/${pictures[type] || pictures.wheel}`} alt="" loading="lazy" decoding="async" />
    </div>
  )
}

function Casino({ title, cat }) {
  const { clubGames, catalogLoading } = useApp()
  const catalog = clubGames.length ? clubGames : games
  const items = catalog.filter((g) => g.cat === cat)
  const descriptions = { live: 'Explore club tables and live-style games.', instant: 'Quick rounds, bright visuals and games you can pick up in a moment.', slots: 'Browse the reels, puzzles and colorful club favorites.', virtual: 'Explore digital sports and strategy games.', tv: 'Game shows and trivia in the Bullwave collection.' }
  const categories = [{ label: 'Live Casino', to: '/casino/live-casino', cat: 'live' }, { label: 'Instant Games', to: '/casino/instant-games', cat: 'instant' }, { label: 'Slots', to: '/casino/slots', cat: 'slots' }, { label: 'Virtual Sport', to: '/casino/virtual-sports', cat: 'virtual' }, { label: 'TV Games', to: '/casino/tv-games', cat: 'tv' }]
  return (
    <div className="content-page">
      <PageIntro eyebrow="CLUB GAMES" title={title} description={descriptions[cat]} icon={cat === 'virtual' ? 'virtual' : cat === 'tv' ? 'tv' : cat === 'slots' ? 'slots' : 'casino'} stats={[{ label: 'Games', value: items.length }, { label: 'Collection', value: title }]} action={{ to: '/promotions', label: 'View promotions' }} />
      <div className="filters category-tabs">
        {categories.map((category) => <NavLink key={category.cat} to={category.to} className={`chip ${cat === category.cat ? 'on' : ''}`}>{category.label}</NavLink>)}
      </div>
      {items.length > 0 && <div className="game-spotlight"><div className="game-spotlight-art"><GameArtwork game={items[0]} /></div><div className="game-spotlight-copy"><span className="eyebrow">FEATURED IN {title.toUpperCase()}</span><h2>{items[0].name}</h2><p>Take a closer look at this club favorite, then browse the full collection below.</p><a href="#game-collection" className="page-intro-action">Browse games <span aria-hidden="true">↘</span></a></div></div>}
      <div className="content-section-title" id="game-collection"><h2>Explore {title}</h2><span>{items.length} games</span></div>
      {catalogLoading ? <SkeletonGrid count={6} type="games" /> : items.length ? <div className="casino-row">
        {items.map((g) => (
          <div key={g.id} className="game-tile">
            <GameArtwork game={g} />
            <span>{g.name}</span>
          </div>
        ))}
      </div> : <EmptyState icon="casino" title="More games are on the way" detail="Browse another collection while this one is being updated." action={{ to: '/casino/live-casino', label: 'Browse live casino' }} />}
    </div>
  )
}

function Sport() {
  const { name } = useParams()
  const { catalogMatches: matches, catalogLoading } = useApp()
  const [view, setView] = useState('All')
  const key = (name || 'football').replace('-racing', '')
  const list = matches.filter((m) => m.sport === key || m.sport === name)
  const shown = view === 'All' ? list : list.filter((m) => view === 'Live' ? m.live : !m.live)
  const title = (name || '').replaceAll('-', ' ')
  useEffect(() => setView('All'), [name])
  return (
    <div className="content-page">
      <PageIntro eyebrow="SPORTSBOOK" title={title} description={`Browse ${title} fixtures, live scores and available markets.`} icon={sportIcon(name)} stats={[{ label: 'Events', value: list.length }, { label: 'Live now', value: list.filter((m) => m.live).length }]} action={{ to: '/live', label: 'All live events' }} />
      <div className="filters sticky-filters">
        {['All', 'Live', 'Upcoming'].map((c) => (
          <button key={c} type="button" className={`chip ${view === c ? 'on' : ''}`} onClick={() => setView(c)}>{c}</button>
        ))}
      </div>
      <div className="content-section-title"><h2>{view === 'All' ? 'All events' : view}</h2><span>{shown.length} events</span></div>
      {catalogLoading ? <SkeletonGrid count={6} /> : shown.length ? <div className="match-grid">{shown.map((m) => <MatchCard key={m.id} m={m} />)}</div> : <EmptyState icon="cal" title="No events in this view" detail="Try another tab or see all live events." action={{ to: '/live', label: 'Browse live events' }} />}
    </div>
  )
}

function MatchPage() {
  const { id } = useParams()
  const { addBet, betslip, catalogMatches: matches, catalogLoading, recordMatchView } = useApp()
  const [marketTab, setMarketTab] = useState('Popular')
  const m = matches.find((x) => x.id === id) || matches[4]
  const visibleMarkets = matchMarkets.filter((market) => market.categories?.includes(marketTab))
  useEffect(() => {
    if (m?.id) recordMatchView(m.id)
  }, [m?.id])
  if (catalogLoading) return <div className="content-page"><SkeletonGrid count={4} /></div>
  return (
    <div className="content-page">
      <PageIntro eyebrow={m.live ? 'LIVE MATCH' : 'MATCH CENTER'} title={`${m.home} vs ${m.away}`} description={`${m.league} · ${m.time}`} icon={sportIcon(m.sport)} stats={[{ label: 'Markets', value: matchMarkets.length }, { label: 'Status', value: m.live ? 'Live' : 'Upcoming' }]} action={{ to: '/live', label: 'All events' }} />
      <div className="card match-summary" style={{ marginBottom: 14 }}>
        <div className="event-meta">{m.league} · {m.time}{m.live ? ' LIVE' : ''}</div>
        <h1 style={{ margin: '8px 0 0' }}>{m.home} {m.score?.[0] || ''} — {m.score?.[1] || ''} {m.away}</h1>
      </div>
      <div className="market-tabs-wrap">
        <nav className="market-tabs" role="tablist" aria-label="Betting market categories">
          {['Popular', 'Match', 'Goals', 'Specials'].map((tab) => <button key={tab} type="button" role="tab" aria-selected={marketTab === tab} className={marketTab === tab ? 'active' : ''} onClick={() => setMarketTab(tab)}>{tab}{tab === 'Popular' && <span>★</span>}</button>)}
        </nav>
        <span className="odds-live-note"><i /> Odds update automatically</span>
      </div>
      {visibleMarkets.map((mk) => (
        <div key={mk.name} className="market">
          <h3>{mk.name}<span>{mk.rows.flat().length} selections</span></h3>
          {mk.rows.map((row, i) => (
            <div key={i} className="market-row" style={{ gridTemplateColumns: `repeat(${row.length}, 1fr)` }}>
              {row.map((c) => <OddButton key={c.label} id={`${m.id}-${mk.name}-${c.label}`} odd={c.odd} label={c.label} selected={betslip.some((b) => b.id === `${m.id}-${mk.name}-${c.label}`)} onSelect={(price) => addBet({ id: `${m.id}-${mk.name}-${c.label}`, event: `${m.home} vs ${m.away}`, pick: `${mk.name}: ${c.label}`, odd: price })} />)}
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}

function rupees(value) {
  return `₹\u00a0${Number(value || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function bonusCash(user) {
  const n = Number(user?.bonusCoins)
  if (Number.isFinite(n) && n > 0) return n
  const legacy = Number(user?.bonus)
  return Number.isFinite(legacy) ? legacy : 0
}

function formatWalletPhone(phone) {
  const digits = String(phone || '').replace(/\D/g, '')
  if (digits.length === 12 && digits.startsWith('91')) {
    return `+91 ${digits.slice(2, 7)} ${digits.slice(7)}`
  }
  if (digits.length === 10) return `+91 ${digits.slice(0, 5)} ${digits.slice(5)}`
  return String(phone || '').trim()
}

function walletIdentity(user) {
  const bits = [
    formatWalletPhone(user?.phone),
    user?.email,
    user?.accountNumber ? `A/c ${user.accountNumber}` : '',
  ].filter(Boolean)
  return bits.join('  ·  ')
}

function loadWalletTx(userId) {
  try {
    const all = JSON.parse(localStorage.getItem('bwc_wallet_tx') || '[]')
    return all.filter((t) => t.userId === userId)
  } catch {
    return []
  }
}

function saveWalletTx(entry) {
  try {
    const all = JSON.parse(localStorage.getItem('bwc_wallet_tx') || '[]')
    localStorage.setItem('bwc_wallet_tx', JSON.stringify([entry, ...all].slice(0, 40)))
  } catch { /* ignore */ }
}

const PAY_METHODS = [
  { id: 'telegram', name: 'Telegram UPI', mark: 'TG', time: 'Manual', min: 49, max: 200000, fee: 'Free', manual: true, note: 'Cash-in is manual UPI. Pay the official Telegram QR, send screenshot + UTR + UID. Super Admin Settle bill credits cash once per UTR.' },
  { id: 'upi', name: 'UPI', mark: 'UPI', time: 'Instant', min: 100, max: 100000, fee: 'Free', note: 'Paid through Razorpay test checkout. Use any UPI app in the test flow.' },
  { id: 'paytm', name: 'Paytm', mark: 'PT', time: 'Instant', min: 100, max: 50000, fee: 'Free', note: 'Razorpay wallet/UPI test. Failed payments do not credit the club wallet.' },
  { id: 'phonepe', name: 'PhonePe', mark: 'Pe', time: 'Instant', min: 100, max: 100000, fee: 'Free', note: 'Razorpay UPI test. Keep the checkout open until Success.' },
  { id: 'netbanking', name: 'Net banking', mark: 'NB', time: 'Instant', min: 100, max: 200000, fee: 'Free', note: 'Razorpay net banking test. Success credits cash immediately after verify.' },
  { id: 'card', name: 'Debit card', mark: 'DC', time: 'Instant', min: 100, max: 50000, fee: 'Free', note: 'Razorpay test card: 4111 1111 1111 1111 · any future expiry · CVV 123.' },
  { id: 'usdt', name: 'USDT', mark: '₮', time: '—', min: 800, max: 500000, fee: 'Network', crypto: true, note: 'Crypto is not collected by Razorpay. Use UPI or card for test deposits.' },
  { id: 'btc', name: 'Bitcoin', mark: '₿', time: '—', min: 2000, max: 500000, fee: 'Network', crypto: true, note: 'Crypto is not collected by Razorpay. Use UPI or card for test deposits.' },
  { id: 'eth', name: 'Ethereum', mark: 'Ξ', time: '—', min: 2000, max: 500000, fee: 'Network', crypto: true, note: 'Crypto is not collected by Razorpay. Use UPI or card for test deposits.' },
]

const WALLET_FACTS = [
  { title: 'Min. deposit', body: '₹100 on UPI · ₹500 on bank/card' },
  { title: 'Min. withdrawal', body: '₹200 cash. Bonus cannot be cashed out.' },
  { title: 'Daily cashout cap', body: '₹2,00,000 until VIP Gold' },
  { title: 'First cashout', body: 'Name on UPI or bank must match the mobile number on this account' },
  { title: 'Timing', body: 'UPI minutes · Bank up to 24h · Crypto after network confirm' },
  { title: '18+ only', body: 'Play with money you can afford to lose. Set limits anytime.' },
]

function WalletActivity({ userId, bets = [], bonus = 0 }) {
  const [rows, setRows] = useState(() => loadWalletTx(userId))
  const [filter, setFilter] = useState('All')
  useEffect(() => { setRows(loadWalletTx(userId)) }, [userId])
  const betRows = bets.map((bet) => ({ id: `bet-${bet.id}`, type: 'bet', method: `${bet.selections?.length || 1} selection bet`, amount: Number(bet.stake || 0), status: bet.status || 'Open', at: bet.createdAt, detail: `Potential return ${rupees(bet.possibleWin)}` }))
  const bonusRows = bonus > 0 ? [{ id: 'bonus-balance', type: 'bonus', method: 'Club bonus balance', amount: bonus, status: 'Available', at: new Date().toISOString(), detail: 'Bonus funds may have wagering requirements.' }] : []
  const timeline = [...rows, ...betRows, ...bonusRows].sort((a, b) => new Date(b.at) - new Date(a.at))
  const filtered = timeline.filter((item) => filter === 'All' || item.type === filter)
  if (!timeline.length) {
    return <p className="wallet-empty-tx">No wallet activity yet. Deposits and withdrawals will show up here.</p>
  }
  return (
    <div className="wallet-timeline-wrap">
      <div className="wallet-timeline-filters" role="tablist" aria-label="Transaction types">{['All', 'deposit', 'withdraw', 'bonus', 'bet'].map((item) => <button key={item} type="button" role="tab" aria-selected={filter === item} className={filter === item ? 'on' : ''} onClick={() => setFilter(item)}>{item}</button>)}</div>
      <div className="wallet-timeline">
        {filtered.map((t) => {
          const incoming = ['deposit', 'bonus'].includes(t.type)
          const label = t.type === 'withdraw' ? 'Withdrawal' : t.type === 'bet' ? 'Bet placed' : t.type === 'bonus' ? 'Bonus' : 'Deposit'
          return <details key={t.id} className={`wallet-tx tx-${t.type}`}>
            <summary><span className="tx-marker"><Icon name={incoming ? 'plus' : t.type === 'bet' ? 'ticket' : 'minus'} size={16} /></span><span><strong>{label}</strong><small>{t.method} · {new Date(t.at).toLocaleString()}</small></span><span className={`tx-status status-${String(t.status).toLowerCase()}`}>{t.status}</span><b className={incoming ? 'is-in' : 'is-out'}>{incoming ? '+' : '−'}{rupees(t.amount)}</b><Icon name="chevron" size={15} /></summary>
            <div className="tx-details"><span>Reference</span><b>{String(t.id).slice(-10).toUpperCase()}</b><span>Details</span><b>{t.detail || `${label} through ${t.method}`}</b></div>
          </details>
        })}
      </div>
    </div>
  )
}

function Account() {
  const { user, loggedIn, setAuthMode, logout, myBets } = useApp()
  const cash = Number(user?.balance || 0)
  const bonus = bonusCash(user)
  const bonusLabel = typeof user?.bonus === 'string' && user.bonus && !Number(user.bonus) ? user.bonus : null
  return (
    <div className="content-page">
      <PageIntro
        eyebrow="WALLET"
        title="My wallet"
        description="Cash you can bet or withdraw, plus bonus funds, limits and the details every member should know before moving money."
        icon="shield"
        stats={[{ label: 'Status', value: loggedIn ? 'Active' : 'Guest' }, { label: 'Cash', value: rupees(cash) }]}
      />
      <div className="card wallet-card">
        <div className="wallet-top">
          <span className="eyebrow">AVAILABLE CASH</span>
          <span className={`wallet-status ${loggedIn ? 'is-active' : ''}`}>{loggedIn ? 'Active' : 'Sign in'}</span>
        </div>
        <div className="wallet-balance">{rupees(cash)}</div>
        <div className="wallet-user">{loggedIn ? walletIdentity(user) || 'Member account' : 'Sign in to deposit, withdraw and track activity'}</div>
        {bonusLabel ? <div className="wallet-promo">{bonusLabel}</div> : null}
        <div className="wallet-split">
          <div><span>Cash</span><b>{rupees(cash)}</b></div>
          <div><span>Bonus</span><b>{rupees(bonus)}</b></div>
          <div><span>Withdrawable</span><b>{rupees(cash)}</b></div>
        </div>
        <div className="wallet-actions">
          {loggedIn ? (
            <>
              <NavLink to="/account/deposit" className="btn btn-yellow">Deposit</NavLink>
              <NavLink to="/account/withdraw" className="btn btn-ghost">Withdraw</NavLink>
              <button type="button" className="btn btn-ghost" onClick={logout}>Log out</button>
            </>
          ) : <button type="button" className="btn btn-yellow" onClick={() => setAuthMode('login')}>Log in to open wallet</button>}
        </div>
      </div>
      <div className="wallet-facts">
        {WALLET_FACTS.map((f) => (
          <div key={f.title} className="wallet-fact"><strong>{f.title}</strong><span>{f.body}</span></div>
        ))}
      </div>
      <div className="content-section-title"><h2>Know before you pay</h2><span>Club wallet rules</span></div>
      <ul className="wallet-notes">
        <li>Only cash in Available can be withdrawn. Welcome and reload bonuses stay locked until wagering is done.</li>
        <li>Send withdrawals only to a UPI or bank account in your name. Third-party accounts are rejected.</li>
        <li>Never share SMS OTPs, UPI PINs or wallet QR codes. Club staff will not ask for them.</li>
        <li>Winnings may be subject to tax under Indian law. Keep deposit and cashout records for your own filing.</li>
        <li>If a payment fails, wait for the bank reversal (usually 1–3 working days) before paying again.</li>
        <li>You must be 18+. Use deposit limits and take a break from Settings if play stops being fun.</li>
      </ul>
      {loggedIn && (
        <>
          <div className="content-section-title"><h2>Recent activity</h2><span>This device</span></div>
          <WalletActivity userId={user?.id} bets={myBets} bonus={bonus} />
        </>
      )}
      <div className="content-section-title"><h2>Quick access</h2><span>Manage your club account</span></div>
      <div className="account-grid">
        {accountLinks.map((l) => (
          <NavLink key={l.name} to={l.to} className="account-tile">
            <span className="feature-icon"><Icon name={l.icon} size={18} /></span>
            <span className="account-tile-copy">
              <strong>{l.name}</strong>
              {l.hint ? <small>{l.hint}</small> : null}
            </span>
            <span className="account-tile-arrow" aria-hidden="true"><Icon name="chevron" size={16} /></span>
          </NavLink>
        ))}
      </div>
    </div>
  )
}

function loadRazorpay() {
  if (typeof window === 'undefined') return Promise.reject(new Error('Checkout only runs in the browser.'))
  if (window.Razorpay) return Promise.resolve(window.Razorpay)
  return new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.async = true
    script.onload = () => (window.Razorpay ? resolve(window.Razorpay) : reject(new Error('Razorpay failed to load.')))
    script.onerror = () => reject(new Error('Could not load Razorpay Checkout.'))
    document.body.appendChild(script)
  })
}

function Deposit({ type }) {
  const { moveMoney, startRazorpayDeposit, confirmRazorpayDeposit, token, setAuthMode, loggedIn, user } = useApp()
  const withdrawing = type === 'withdraw'
  const [method, setMethod] = useState(withdrawing ? 'upi' : 'telegram')
  const [amount, setAmount] = useState(withdrawing ? '200' : '500')
  const [destination, setDestination] = useState('')
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)
  const [tick, setTick] = useState(0)
  const pay = PAY_METHODS.find((p) => p.id === method) || PAY_METHODS[0]
  const cash = Number(user?.balance || 0)
  const value = Number(amount)
  const min = withdrawing ? 200 : pay.min
  const overMax = Number.isFinite(value) && value > pay.max
  const underMin = Number.isFinite(value) && value > 0 && value < min
  const overCash = withdrawing && Number.isFinite(value) && value > cash
  const quick = withdrawing ? [200, 500, 1000, 2000, 5000] : [100, 500, 1000, 2000, 5000, 10000]

  const submit = async () => {
    setMessage('')
    if (!loggedIn) {
      setAuthMode('login')
      return
    }
    if (!Number.isFinite(value) || value <= 0) {
      setMessage('Enter a valid amount.')
      return
    }
    if (underMin) {
      setMessage(`Minimum ${withdrawing ? 'withdrawal' : 'deposit'} is ${rupees(min)}.`)
      return
    }
    if (overMax) {
      setMessage(`This method allows up to ${rupees(pay.max)} per transfer.`)
      return
    }
    if (overCash) {
      setMessage('You can only withdraw available cash, not bonus.')
      return
    }
    if (withdrawing && !destination.trim()) {
      setMessage('Add the UPI ID or account where we should send the money.')
      return
    }
    setBusy(true)
    try {
      if (withdrawing) {
        await moveMoney('withdraw', value, { method: pay.id, destination: destination.trim() })
        saveWalletTx({
          id: `${Date.now()}`,
          userId: user?.id,
          type: 'withdraw',
          method: pay.name,
          amount: value / 10,
          status: 'PENDING · 12 hours',
          at: new Date().toISOString(),
        })
        setMessage(`${rupees(value)} locked. Staff pay outside the site within 12 hours. Bonus cannot leave.`)
        setTick((n) => n + 1)
        return
      }
      if (pay.manual) {
        setMessage('This is not in-app checkout. Pay the Telegram QR, send proof, and wait for Settle bill.')
        return
      }
      if (pay.crypto) {
        setMessage('Razorpay test checkout is INR only. Use UPI, card, PhonePe, Paytm or net banking.')
        return
      }
      const Razorpay = await loadRazorpay()
      const order = await startRazorpayDeposit(value, pay.id)
      await new Promise((resolve, reject) => {
        const checkout = new Razorpay({
          key: order.keyId,
          amount: order.amount,
          currency: order.currency || 'INR',
          name: 'Bullwave Club',
          description: `Wallet deposit ${rupees(value)}`,
          order_id: order.orderId,
          prefill: {
            name: 'Bullwave member',
            email: user?.email || '',
            contact: String(user?.phone || '').replace(/^\+91/, ''),
          },
          notes: { method: pay.id },
          theme: { color: '#61D6B0' },
          modal: { ondismiss: () => reject(new Error('Payment cancelled.')) },
          handler: async (response) => {
            try {
              await confirmRazorpayDeposit(response)
              saveWalletTx({
                id: response.razorpay_payment_id || `${Date.now()}`,
                userId: user?.id,
                type: 'deposit',
                method: `Razorpay · ${pay.name}`,
                amount: value,
                status: 'Credited',
                at: new Date().toISOString(),
              })
              setMessage(`${rupees(value)} added via Razorpay (${pay.name}).`)
              setTick((n) => n + 1)
              resolve()
            } catch (err) {
              reject(err)
            }
          },
        })
        checkout.open()
      })
    } catch (err) {
      setMessage(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="content-page">
      <PageIntro
        eyebrow="WALLET"
        title={withdrawing ? 'Withdraw' : 'Deposit'}
        description={withdrawing ? 'Only cash can leave. Funds lock immediately as PENDING. Staff pay outside the site within 12 hours.' : 'Telegram UPI is manual. Razorpay remains available as a separate method and does not mint via create-deposit.'}
        icon={withdrawing ? 'minus' : 'plus'}
        action={{ to: '/account', label: 'Back to wallet' }}
        stats={[{ label: 'Cash', value: rupees(cash) }, { label: 'Method', value: pay.time }]}
      />
      <div className="content-section-title"><h2>Payment method</h2><span>Time · limits · fee</span></div>
      <div className="pay-grid">
        {PAY_METHODS.map((p) => (
          <button key={p.id} type="button" className={`pay ${method === p.id ? 'on' : ''}`} onClick={() => setMethod(p.id)}>
            <span className={`pay-mark pay-mark-${p.id}`}><PayLogo id={p.id} /></span>
            <strong>{p.name}</strong>
            <small>{p.time} · {p.fee}</small>
          </button>
        ))}
      </div>
      <p className="wallet-method-note">{pay.note} Min {rupees(withdrawing ? 200 : pay.min)} · Max {rupees(pay.max)}.</p>
      {!withdrawing && pay.manual ? (
        <TelegramCashIn user={user} token={token} />
      ) : (
      <div className="payment-shell">
        <div className="content-section-title"><h2>Enter amount</h2><span>INR</span></div>
        <div className="wallet-quick">
          {quick.map((n) => (
            <button key={n} type="button" className={`chip ${Number(amount) === n ? 'on' : ''}`} onClick={() => setAmount(String(n))}>{rupees(n).replace('.00', '')}</button>
          ))}
        </div>
        <div className="field"><label>Amount, ₹</label><input className="input" type="number" min={min} max={pay.max} inputMode="decimal" placeholder={String(min)} value={amount} onChange={(e) => setAmount(e.target.value)} /></div>
        {withdrawing && (
          <div className="field">
            <label>{method === 'upi' || method === 'paytm' || method === 'phonepe' || method === 'telegram' ? 'UPI ID' : method === 'netbanking' || method === 'card' ? 'Account / IFSC' : 'Wallet address'}</label>
            <input className="input" value={destination} onChange={(e) => setDestination(e.target.value)} placeholder={method === 'upi' || method === 'paytm' || method === 'phonepe' || method === 'telegram' ? 'name@upi' : method === 'netbanking' || method === 'card' ? 'Account number and IFSC' : `${pay.name} address`} />
          </div>
        )}
        <div className="wallet-summary">
          <span>You {withdrawing ? 'lock now' : 'pay'}</span><b>{Number.isFinite(value) && value > 0 ? rupees(value) : '—'}</b>
          <span>Fee</span><b>{pay.fee}</b>
          <span>{withdrawing ? 'ETA' : 'Credited'}</span><b>{withdrawing ? '12 hours' : pay.time}</b>
        </div>
        {message && <p className={`hint ${/fail|error|invalid|only|minimum|add |locked|not in-app/i.test(message) ? 'is-bad' : 'is-ok'}`}>{message}</p>}
        <button className="btn btn-yellow btn-block" disabled={busy} onClick={submit}>
          {busy ? 'Please wait…' : withdrawing ? 'Lock cash-out' : 'Pay with Razorpay'}
        </button>
        <p className="wallet-legal">By continuing you confirm you are 18+, the payment account is yours, and you have read the wallet notes below.</p>
      </div>
      )}
      <div className="content-section-title"><h2>Need to know</h2><span>{withdrawing ? 'Cashout' : 'Top-up'}</span></div>
      <ul className="wallet-notes">
        {withdrawing ? (
          <>
            <li>Only cash is deducted. Bonus/promo cannot leave.</li>
            <li>Cash locks immediately as PENDING. Auto RazorpayX payout is off.</li>
            <li>Staff pay UPI/bank outside the site, then Super Admin marks PAID with a unique payout UTR.</li>
            <li>Settlement is within 12 hours. Same payout UTR cannot close two cash-outs.</li>
            <li>Rejected cash-outs return the locked cash.</li>
          </>
        ) : (
          <>
            <li>Telegram UPI is manual. The site does not auto-credit from the channel QR.</li>
            <li>Send screenshot, UTR, username and UID in Telegram. Super Admin Settle bill credits cash once per UTR.</li>
            <li>POST /api/payments/create-deposit is gone (410). Razorpay checkout cannot mint cash that way.</li>
            <li>Other methods still open Razorpay Checkout and credit the paid INR as cash.</li>
            <li>Receipts live under Billing as a PDF after settle.</li>
          </>
        )}
      </ul>
      {loggedIn && (
        <>
          <div className="content-section-title"><h2>Recent activity</h2><span>This device</span></div>
          <WalletActivity key={tick} userId={user?.id} />
        </>
      )}
    </div>
  )
}

function Bets() {
  const { myBets } = useApp()
  const [filter, setFilter] = useState('All')
  const shown = filter === 'All' ? myBets : myBets.filter((b) => filter === 'Open' ? ['open', 'pending'].includes(String(b.status).toLowerCase()) : ['settled', 'won', 'lost'].includes(String(b.status).toLowerCase()))
  return (
    <div className="content-page">
      <PageIntro eyebrow="BET HISTORY" title="My bets" description="Review your open and settled bets in one place." icon="ticket" stats={[{ label: 'Total bets', value: myBets.length }, { label: 'Open', value: myBets.filter((b) => ['open', 'pending'].includes(String(b.status).toLowerCase())).length }]} action={{ to: '/live', label: 'Explore events' }} />
      <div className="filters">
        {['All', 'Open', 'Settled'].map((c) => (
          <button key={c} type="button" className={`chip ${filter === c ? 'on' : ''}`} onClick={() => setFilter(c)}>{c}</button>
        ))}
      </div>
      {shown.length === 0 ? (
        <EmptyState icon="ticket" title={filter === 'All' ? 'No bets yet' : `No ${filter.toLowerCase()} bets`} detail="Add an outcome to your betslip when you find a match you like." action={{ to: '/live', label: 'Browse live events' }} />
      ) : shown.map((b) => (
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
  const tiers = ['Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond', 'Elite']
  return (
    <div className="content-page">
      <PageIntro eyebrow="MEMBER REWARDS" title="Bullwave Club VIP" description="A club journey with tiered rewards and exclusive offers." icon="shield" stats={[{ label: 'Tiers', value: tiers.length }, { label: 'Top tier', value: 'Elite' }]} action={{ to: '/account', label: 'My account' }} />
      <FeatureCards items={[{ icon: 'gift', title: 'Club offers', detail: 'Explore current rewards and promotions.', to: '/promotions' }, { icon: 'shield', title: 'Member area', detail: 'Keep track of your account and activity.', to: '/account' }, { icon: 'star', title: 'VIP tiers', detail: 'Browse the club journey below.' }]} />
      <div className="content-section-title"><h2>VIP tiers</h2><span>Find your level</span></div>
      <div className="tier-grid">
        {tiers.map((t, i) => (
          <div key={t} className={`tier-card tier-${t.toLowerCase()}`}>
            <span className="tier-number">0{i + 1}</span><span className="tier-medal"><Icon name="star" size={26} /></span>
            <h3>{t}</h3><p>Level {i + 1} club rewards</p>
          </div>
        ))}
      </div>
    </div>
  )
}

function Faq() {
  return (
    <div className="faq content-page">
      <PageIntro eyebrow="HELP CENTER" title="Frequently asked questions" description="Quick answers to common questions about using Bullwave Club." icon="gear" stats={[{ label: 'Answers', value: faqs.length }, { label: 'Topics', value: 'Club help' }]} action={{ to: '/more', label: 'More options' }} />
      <div className="content-section-title"><h2>Popular questions</h2><span>Select a question to expand</span></div>
      <div className="faq-list">{faqs.map((f) => (
        <details key={f.q}><summary>{f.q}<span aria-hidden="true">+</span></summary><p>{f.a}</p></details>
      ))}</div>
      <FeatureCards items={[{ icon: 'gift', title: 'Promotions', detail: 'See the current club offers.', to: '/promotions' }, { icon: 'gear', title: 'Preferences', detail: 'Review language and odds settings.', to: '/more' }]} />
    </div>
  )
}

function Favorites() {
  const { favorites, catalogMatches: matches } = useApp()
  const list = matches.filter((m) => favorites.includes(m.id))
  return (
    <div className="content-page">
      <PageIntro eyebrow="YOUR PICKS" title="Favorites" description="Keep the matches you care about close at hand." icon="star" stats={[{ label: 'Saved events', value: list.length }, { label: 'Available', value: matches.length }]} action={{ to: '/live', label: 'Explore events' }} />
      {list.length === 0 ? <EmptyState icon="star" title="No favorites yet" detail="Tap the star on a match to save it here." action={{ to: '/live', label: 'Find live events' }} /> : (
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
    <div className="content-page">
      <PageIntro eyebrow="MATCH COMBINATIONS" title="Top Parlays" description="Explore a ready-made match combination and review each selection." icon="layers" stats={[{ label: 'Selections', value: combo.length }, { label: 'Combined odds', value: total.toFixed(2) }]} action={{ to: '/live', label: 'Explore events' }} />
      <div className="card parlay-card">
        <div className="eyebrow">FEATURED COMBINATION</div>
        {combo.map((m) => (
          <div key={m.id} className="parlay-pick"><span className="feature-icon"><Icon name={m.sport === 'football' ? 'football' : 'live'} size={18} /></span><span>{m.home} vs {m.away}</span><b>{m.markets[0]?.odd?.toFixed(2)}</b></div>
        ))}
        <div className="row-between" style={{ marginTop: 12 }}><span>Total odds</span><b>{total.toFixed(2)}</b></div>
        <button className="btn btn-yellow btn-block" onClick={() => combo.forEach((m) => addBet({ id: m.markets[0].id, event: `${m.home} vs ${m.away}`, pick: m.markets[0].label, odd: m.markets[0].odd }))}>Add to betslip</button>
      </div>
    </div>
  )
}

function More({ settings = false }) {
  const { oddsFormat, setOddsFormat, theme, setTheme } = useApp()
  return (
    <div className="content-page">
      <PageIntro eyebrow="YOUR CLUB" title={settings ? 'Settings' : 'More'} description="Personalize the display and find more from Bullwave Club." icon="gear" stats={[{ label: 'Preferences', value: '3' }, { label: 'Club', value: 'Bullwave' }]} />
      <div className="content-section-title"><h2>Preferences</h2><span>Make it yours</span></div>
      <div className="card menu-item">Theme <select value={theme} onChange={(e) => setTheme(e.target.value)} className="input" style={{ width: 140, height: 36 }}><option value="dark">Dark</option><option value="light">Light</option></select></div>
      <div className="card" style={{ marginTop: 8, padding: 8 }}>
        <div style={{ padding: '8px 10px', color: 'var(--muted)' }}>Language</div>
        <LanguagePicker embedded />
      </div>
      <div className="card menu-item" style={{ marginTop: 8 }}>Odds Format <select value={oddsFormat} onChange={(e) => setOddsFormat(e.target.value)} className="input" style={{ width: 140, height: 36 }}><option value="decimal">2.20</option><option value="fractional">6/5</option><option value="american">+120</option></select></div>
      <div className="card more-links" style={{ marginTop: 8 }}>
        <NavLink className="menu-item" to="/responsible-play">Responsible play</NavLink>
        <NavLink className="menu-item" to="/about">About Bullwave Club</NavLink>
        <NavLink className="menu-item" to="/faq">FAQ</NavLink>
        <NavLink className="menu-item" to="/vip">VIP Club</NavLink>
      </div>
    </div>
  )
}

function loadPlaySettings() {
  try {
    return { depositLimit: 5000, reminder: 60, coolOff: 'None', ...JSON.parse(localStorage.getItem('bwc_play_settings') || '{}') }
  } catch {
    return { depositLimit: 5000, reminder: 60, coolOff: 'None' }
  }
}

function ResponsiblePlay() {
  const [settings, setSettings] = useState(loadPlaySettings)
  const [saved, setSaved] = useState(false)
  const update = (field, value) => setSettings((current) => ({ ...current, [field]: value }))
  const save = () => {
    localStorage.setItem('bwc_play_settings', JSON.stringify(settings))
    setSaved(true)
    window.setTimeout(() => setSaved(false), 2200)
  }
  return <div className="content-page responsible-page">
    <PageIntro eyebrow="PLAY WITHIN LIMITS" title="Responsible play" description="Set practical boundaries, check your time, and step away whenever play stops feeling enjoyable." icon="shield" stats={[{ label: 'Age requirement', value: '18+' }, { label: 'Support', value: 'Always' }]} action={{ to: '/faq', label: 'Get help' }} />
    <div className="age-message"><strong>18+ only</strong><span>Betting is entertainment, not a way to make money. Never chase losses or borrow to play.</span></div>
    <div className="responsible-grid">
      <section className="responsible-control"><span className="feature-icon"><Icon name="plus" size={20} /></span><div><h2>Deposit limit</h2><p>Set the most this device should allow you to deposit in a rolling 24-hour period.</p></div><label>Daily limit (₹)<input className="input" type="number" min="0" step="500" value={settings.depositLimit} onChange={(event) => update('depositLimit', Number(event.target.value))} /></label></section>
      <section className="responsible-control"><span className="feature-icon"><Icon name="clock" size={20} /></span><div><h2>Session reminder</h2><p>Receive a visible reminder after you have been active for the selected time.</p></div><label>Reminder<select className="input" value={settings.reminder} onChange={(event) => update('reminder', Number(event.target.value))}><option value="30">Every 30 minutes</option><option value="60">Every 60 minutes</option><option value="120">Every 2 hours</option></select></label></section>
      <section className="responsible-control"><span className="feature-icon"><Icon name="minus" size={20} /></span><div><h2>Take a break</h2><p>Pause betting controls on this device for a defined cooling-off period.</p></div><label>Cooling-off period<select className="input" value={settings.coolOff} onChange={(event) => update('coolOff', event.target.value)}><option>None</option><option>24 hours</option><option>7 days</option><option>30 days</option></select></label></section>
      <section className="responsible-control self-exclusion"><span className="feature-icon"><Icon name="shield" size={20} /></span><div><h2>Self-exclusion</h2><p>For account-wide exclusion, contact support. This action must be verified and cannot be reversed early.</p></div><NavLink className="btn btn-ghost" to="/faq">Contact support</NavLink></section>
    </div>
    <div className="responsible-save"><button type="button" className="btn btn-yellow" onClick={save}>Save limits</button>{saved && <span role="status">Preferences saved on this device.</span>}</div>
    <p className="responsible-disclaimer">Device preferences support safer play but do not replace account-level controls. Contact support for permanent self-exclusion or help with gambling-related harm.</p>
  </div>
}

function About() {
  return (
    <div className="content-page">
      <PageIntro eyebrow="OUR CLUB" title="About Bullwave Club" description="Sports, games and rewards brought together in one club interface." icon="shield" stats={[{ label: 'Explore', value: 'Sports' }, { label: 'Discover', value: 'Games' }]} />
      <FeatureCards items={[{ icon: 'live', title: 'Sports', detail: 'Follow live events and upcoming fixtures.', to: '/live' }, { icon: 'casino', title: 'Games', detail: 'Browse the club game collections.', to: '/casino/live-casino' }, { icon: 'gift', title: 'Rewards', detail: 'See the current promotions.', to: '/promotions' }]} />
    </div>
  )
}


function Highlight({ text, query }) {
  const value = String(text)
  const index = value.toLowerCase().indexOf(query.trim().toLowerCase())
  if (!query.trim() || index < 0) return value
  return <>{value.slice(0, index)}<mark>{value.slice(index, index + query.trim().length)}</mark>{value.slice(index + query.trim().length)}</>
}

function SearchOverlay() {
  const { searchOpen, setSearchOpen, catalogMatches: matches } = useApp()
  const navigate = useNavigate()
  const [q, setQ] = useState('')
  const [sport, setSport] = useState('All')
  const [activeIndex, setActiveIndex] = useState(0)
  const [recent, setRecent] = useState(() => {
    try { return JSON.parse(localStorage.getItem('bwc_recent_searches')) || [] } catch { return [] }
  })
  const sportsInCatalog = ['All', ...new Set(matches.map((match) => match.sport))]
  const filtered = matches.filter((match) => {
    const copy = `${match.home} ${match.away} ${match.league} ${match.sport}`.toLowerCase()
    return (!q.trim() || copy.includes(q.trim().toLowerCase())) && (sport === 'All' || match.sport === sport)
  })
  const results = (q.trim() || sport !== 'All' ? filtered : matches.filter((match) => match.live)).slice(0, 8)
  const close = () => setSearchOpen(false)
  const selectResult = (match) => {
    const term = q.trim() || `${match.home} vs ${match.away}`
    const next = [term, ...recent.filter((item) => item !== term)].slice(0, 5)
    setRecent(next)
    localStorage.setItem('bwc_recent_searches', JSON.stringify(next))
    close()
    navigate(`/match/${match.id}`)
  }
  useEffect(() => setActiveIndex(0), [q, sport])
  if (!searchOpen) return null
  return (
    <div className="search-panel" role="dialog" aria-modal="true" aria-label="Search matches">
      <div className="search-shell">
        <div className="search-field"><Icon name="search" size={21} /><input autoFocus role="combobox" aria-expanded="true" aria-controls="search-results" placeholder="Search teams, leagues or sports" value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(event) => {
          if (event.key === 'Escape') close()
          if (event.key === 'ArrowDown') { event.preventDefault(); setActiveIndex((index) => Math.min(results.length - 1, index + 1)) }
          if (event.key === 'ArrowUp') { event.preventDefault(); setActiveIndex((index) => Math.max(0, index - 1)) }
          if (event.key === 'Enter' && results[activeIndex]) selectResult(results[activeIndex])
        }} />{q && <button type="button" onClick={() => setQ('')} aria-label="Clear search"><Icon name="close" size={16} /></button>}</div>
        <button className="search-cancel" type="button" onClick={close}>Cancel</button>
      </div>
      <div className="search-sports">{sportsInCatalog.map((item) => <button key={item} type="button" className={sport === item ? 'on' : ''} onClick={() => setSport(item)}>{item.replaceAll('-', ' ')}</button>)}</div>
      {!q && recent.length > 0 && <div className="recent-searches"><div><strong>Recent searches</strong><button type="button" onClick={() => { setRecent([]); localStorage.removeItem('bwc_recent_searches') }}>Clear</button></div><nav>{recent.map((term) => <button key={term} type="button" onClick={() => setQ(term)}><Icon name="clock" size={15} />{term}</button>)}</nav></div>}
      <div className="search-results-head"><strong>{q ? 'Search results' : 'Live and trending'}</strong><span>{results.length} matches</span></div>
      <div className="search-results" id="search-results" role="listbox">
        {results.map((match, index) => <button key={match.id} type="button" role="option" aria-selected={activeIndex === index} className={activeIndex === index ? 'active' : ''} onMouseEnter={() => setActiveIndex(index)} onClick={() => selectResult(match)}><span className={`search-result-icon sport-${match.sport}`}><Icon name={sportIcon(match.sport)} size={19} /></span><span><small>{match.live ? 'LIVE' : match.time} · {match.sport.replaceAll('-', ' ')}</small><strong><Highlight text={`${match.home} vs ${match.away}`} query={q} /></strong><em><Highlight text={match.league} query={q} /></em></span><Icon name="chevron" size={16} /></button>)}
        {!results.length && <EmptyState icon="search" title="No matching events" detail="Try a team, league, or a different sport filter." />}
      </div>
    </div>
  )
}

function MenuDrawer() {
  const { menuOpen, setMenuOpen, setAuthMode, loggedIn } = useApp()
  if (!menuOpen) return null
  const close = () => setMenuOpen(false)
  const swipe = useSwipeDismiss(close, 'left')
  const sportsList = sports.filter((s) => !['promos', 'parlays', 'all-live', 'favorites'].includes(s.id))
  return (
    <div className="overlay menu-overlay" onClick={close}>
      <div className="menu-panel" onClick={(e) => e.stopPropagation()} {...swipe}>
        <div className="menu-head">
          <strong>Browse</strong>
          <button type="button" className="icon-btn" onClick={close} aria-label="Close menu"><Icon name="close" /></button>
        </div>
        <NavLink className="menu-item" to="/" onClick={close}>Home</NavLink>
        <NavLink className="menu-item" to="/live" onClick={close}>Live</NavLink>
        <NavLink className="menu-item" to="/upcoming" onClick={close}>Upcoming</NavLink>
        {sportsList.map((s) => (
          <NavLink key={s.id} className="menu-item" to={s.to} onClick={close}>{s.name}</NavLink>
        ))}
        <NavLink className="menu-item" to="/casino/live-casino" onClick={close}>Games</NavLink>
        <NavLink className="menu-item" to="/promotions" onClick={close}>Promotions</NavLink>
        <NavLink className="menu-item" to="/account" onClick={close}>Wallet</NavLink>
        <NavLink className="menu-item" to="/account/bets" onClick={close}>My bets</NavLink>
        <NavLink className="menu-item" to="/vip" onClick={close}>VIP</NavLink>
        <NavLink className="menu-item" to="/responsible-play" onClick={close}>Responsible play</NavLink>
        <NavLink className="menu-item" to="/faq" onClick={close}>Help</NavLink>
        <div className="menu-auth">
          {loggedIn ? (
            <NavLink className="btn btn-yellow btn-block" to="/account" onClick={close}>My account</NavLink>
          ) : (
            <>
              <button className="btn btn-ghost" onClick={() => { close(); setAuthMode('login') }}>Log in</button>
              <button className="btn btn-yellow" onClick={() => { close(); setAuthMode('signup') }}>Sign up</button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

function MobileDock() {
  const { betslip, setMenuOpen, setSlipOpen, setSearchOpen, loggedIn } = useApp()
  return (
    <nav className="mobile-dock" aria-label="Mobile navigation">
      <NavLink to="/" end><Icon name="home" size={20} /><span>Home</span></NavLink>
      <NavLink to="/live"><Icon name="live" size={20} /><span>Live</span></NavLink>
      <button type="button" onClick={() => setSearchOpen(true)}><Icon name="search" size={20} /><span>Search</span></button>
      <button type="button" className="dock-slip" onClick={() => setSlipOpen(true)}>
        <Icon name="ticket" size={20} />
        <span>Slip</span>
        {betslip.length > 0 && <i>{betslip.length}</i>}
      </button>
      {loggedIn ? <NavLink to="/account"><Icon name="shield" size={20} /><span>Wallet</span></NavLink> : <button type="button" onClick={() => setMenuOpen(true)}><Icon name="menu" size={20} /><span>More</span></button>}
    </nav>
  )
}

export default function App() {
  return (
    <div className="app">
      <Header />
      <LiveTicker />
      <ConnectivityBanner />
      <CatalogNotice />
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
            <Route path="/profile" element={<ProfileHub />} />
            <Route path="/account" element={<Account />} />
            <Route path="/account/deposit" element={<Deposit type="deposit" />} />
            <Route path="/account/withdraw" element={<Deposit type="withdraw" />} />
            <Route path="/account/billing" element={<BillingPage />} />
            <Route path="/account/bets" element={<Bets />} />
            <Route path="/account/verify" element={<PersonalData />} />
            <Route path="/account/personal-data" element={<PersonalData />} />
            <Route path="/account/settings" element={<More settings />} />
            <Route path="/ops" element={<AdminDesk />} />
            <Route path="/vip" element={<Vip />} />
            <Route path="/faq" element={<Faq />} />
            <Route path="/favorites" element={<Favorites />} />
            <Route path="/parlays" element={<Parlays />} />
            <Route path="/more" element={<More />} />
            <Route path="/about" element={<About />} />
            <Route path="/responsible-play" element={<ResponsiblePlay />} />
          </Routes>
        </main>
        <Betslip />
      </div>
      <AuthModal />
      <SearchOverlay />
      <MenuDrawer />
      <MobileDock />
      <BetNotice />
      <SessionReminder />
      <NavLink className="responsible-float" to="/responsible-play"><Icon name="shield" size={15} />18+ Responsible play</NavLink>
    </div>
  )
}
