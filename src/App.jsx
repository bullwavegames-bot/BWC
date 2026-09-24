import { useEffect, useMemo, useRef, useState } from 'react'
import { NavLink, Route, Routes, useLocation, useNavigate, useParams } from 'react-router-dom'
import { useApp } from './store.jsx'
import { api, sendOtp, verifyOtp } from './api.js'
import { BillingPage, TelegramCashIn } from './BillingPages.jsx'
import { OpsHealth, PresencePing, SuperAdmin } from './SuperAdmin.jsx'
import { PayLogo } from './PayLogo.jsx'
import { PersonalData } from './PersonalData.jsx'
import { ProfileHub } from './ProfileHub.jsx'
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

function casinoLobbyFor(game) {
  if (game?.cat === 'slots') return { to: '/casino/slots', label: 'Slots' }
  if (game?.cat === 'virtual') return { to: '/casino/virtual-sports', label: 'Virtual Sport' }
  if (game?.cat === 'tv') return { to: '/casino/tv-games', label: 'TV Games' }
  if (game?.cat === 'live') return { to: '/casino/live-casino', label: 'Live Casino' }
  return { to: '/casino/instant-games', label: 'Instant Games' }
}

function casinoGameTo(g) {
  if (g?.launchId) return `/casino/play/${g.launchId}`
  return casinoLobbyFor(g).to
}

function GameArtwork({ game }) {
  if (game?.cover) {
    return (
      <div className="game-artwork game-artwork-photo">
        <img src={game.cover} alt="" loading="lazy" decoding="async" />
      </div>
    )
  }
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
    esports: <><rect x="3" y="8" width="18" height="10" rx="3" /><path d="M8 13h2M7 12v2M15 12.5h.01M17 12.5h.01M8 21h8" /></>,
    volleyball: <><circle cx="12" cy="12" r="9" /><path d="M4.2 9c3 1.2 8.6.6 12.4-3.2M4.4 15.2c3.6-1 8.2.4 12.8 4.2M12.2 3.1c1.6 3.4 1.4 8.2-1.2 13.4" /></>,
    hockey: <><path d="M4 5h5l7 12h4" /><path d="M15 17h5v3h-6z" /><circle cx="7" cy="18" r="2.2" /></>,
    boxing: <><path d="M5 10c0-3 2.2-5 5-5h3c2.4 0 4 1.6 4 4v2c2.2.4 4 2.2 4 4.4C21 18 18.8 20 16 20H9c-2.8 0-5-2-5-5.2V10z" /><path d="M9 9v7" /></>,
    mma: <><path d="M7 8h10v4c0 3.5-2.2 6-5 6s-5-2.5-5-6V8z" /><path d="M9 8V6h6v2M8 12h8" /></>,
    handball: <><circle cx="12" cy="12" r="9" /><path d="M8 5c2 3 2 6 0 10M16 4.8c-1.4 3.2-1.2 7.2 1.4 11.2M7 16c2.4 1.8 6.4 2.2 10 .4" /></>,
    futsal: <><circle cx="12" cy="12" r="9" /><path d="m12 8 3.6 2.6-1.4 4.2H9.8l-1.4-4.2z" /></>,
    baseball: <><circle cx="12" cy="12" r="9" /><path d="M6 5.2c2.8 2.4 3.6 6.2 3.6 9.8 0 2.2-.4 4.2-1.4 6M18 5.2c-2.8 2.4-3.6 6.2-3.6 9.8 0 2.2.4 4.2 1.4 6" /></>,
    american: <><path d="M7 7c4-3 10-3 14 2-4 5-10 8-15 5-2-1.2-3-4-1.6-6.4z" /><path d="M9 10h8M11.5 8v7M14.5 8.5v6" /></>,
    australian: <><ellipse cx="12" cy="12" rx="9" ry="6" transform="rotate(-35 12 12)" /><path d="M8 10.5h8M10 8.8v6.2M14 8.8v6.2" /></>,
    rugby: <><ellipse cx="12" cy="12" rx="9" ry="5.5" transform="rotate(28 12 12)" /><path d="M8.5 12h7M10 9.5v5M14 9.5v5" /></>,
    motor: <><path d="M5 16h14l-1.5-5H8z" /><circle cx="8" cy="17.5" r="2" /><circle cx="16.5" cy="17.5" r="2" /><path d="M9 11 11 6h5l2 5" /></>,
    snooker: <><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="3" /><path d="M12 3v4M12 17v4" /></>,
    darts: <><circle cx="12" cy="12" r="8" /><circle cx="12" cy="12" r="4" /><path d="M12 2v4M20.5 7.5 12 12" /></>,
    chess: <><path d="M9 20h6M10 20V9h4v11M8 9h8M12 4v3M9.5 7h5" /><circle cx="12" cy="4" r="1.4" /></>,
    biathlon: <><path d="M6 19 12 5l6 14M9 13h6" /><circle cx="7" cy="19" r="1.4" /><circle cx="17" cy="19" r="1.4" /></>,
    national: <><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3c2.8 2.8 4.2 5.8 4.2 9S14.8 18.2 12 21C9.2 18.2 7.8 15.2 7.8 12S9.2 5.8 12 3z" /></>,
    special: <path d="m12 3 1.6 5.4H19l-4.4 3.2 1.7 5.4L12 14.6 7.7 17l1.7-5.4L5 8.4h5.4z" />,
    replays: <><circle cx="12" cy="12" r="8" /><path d="M10 9v6l5-3zM16 5.2A9 9 0 0 0 5.5 9" /></>,
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
    back: <path d="m15 5-7 7 7 7" />,
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

function AnnouncementStrip() {
  return <aside className="announcement-strip" aria-label="Club announcement"><span><Icon name="gift" size={14} /> New member offer: explore today's boosted markets and club rewards.</span><NavLink to="/promotions">View offers <Icon name="chevron" size={13} /></NavLink></aside>
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
  const aliases = {
    'table-tennis': 'table',
    table: 'table',
    'camel-racing': 'camel',
    'horse-racing': 'horse',
    'ice-hockey': 'hockey',
    'american-football': 'american',
    'australian-football': 'australian',
    'motor-sports': 'motor',
    'virtual-cricket': 'virtual',
    esports: 'esports',
    'e-sports': 'esports',
  }
  return aliases[sport] || sport || 'live'
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
  const { setMenuOpen, setSearchOpen, setAuthMode, loggedIn, user, myBets, logout, theme, setTheme } = useApp()
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [accountOpen, setAccountOpen] = useState(false)
  const light = theme === 'light'
  const points = Number(user?.points || user?.bonusCoins || 0)
  const exposure = (myBets || []).filter((bet) => !['won', 'lost', 'settled'].includes(String(bet.status || '').toLowerCase())).reduce((sum, bet) => sum + Number(bet.stake || 0), 0)
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
        <NavLink to="/" end>Exchange</NavLink>
        <NavLink to="/casino/live-casino">Live Casino</NavLink>
        <NavLink to="/casino/slots">Slots</NavLink>
        <NavLink to="/casino/virtual-sports">Fantasy</NavLink>
        <NavLink to="/casino/tv-games">Lottery</NavLink>
        <NavLink to="/casino/instant-games">Crash</NavLink>
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
          <div className="header-account">
            <NavLink to="/account" className="header-wallet"><span><small>Balance</small><b>₹{Number(user?.balance || 0).toFixed(2)}</b></span><span><small>Points</small><b>{points}</b></span><span><small>Exposure</small><b>₹{exposure.toFixed(2)}</b></span></NavLink>
            <button type="button" className="profile-avatar" onClick={() => setAccountOpen((open) => !open)} aria-label="Open account menu" aria-expanded={accountOpen}><Icon name="shield" size={20} /><i /></button>
            {accountOpen && <div className="account-menu" role="menu"><NavLink to="/account" onClick={() => setAccountOpen(false)}>Account</NavLink><NavLink to="/account/bets" onClick={() => setAccountOpen(false)}>Statement</NavLink><NavLink to="/more" onClick={() => setAccountOpen(false)}>Rules</NavLink><NavLink to="/responsible-play" onClick={() => setAccountOpen(false)}>Responsible play</NavLink><NavLink to="/account/settings" onClick={() => setAccountOpen(false)}>Settings</NavLink><button type="button" onClick={async () => { setAccountOpen(false); await logout() }}>Log out</button></div>}
          </div>
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
  const { setAuthMode, setSearchOpen, catalogMatches } = useApp()
  const liveCount = catalogMatches.filter((m) => m.live).length
  return (
    <aside className="sidebar">
      <button className="sidebar-search" type="button" onClick={() => setSearchOpen(true)}><Icon name="search" size={16} /><span>Search sports</span></button>
      <NavLink to="/" end className={({ isActive }) => `side-item side-home ${isActive ? 'active' : ''}`}><span className="dot"><Icon name="home" size={19} /></span>Home</NavLink>
      {sports.filter((s) => !['promos', 'parlays'].includes(s.id)).map((s) => {
        const count = s.id === 'all-live' ? (liveCount || s.count || 0) : catalogMatches.filter((match) => match.sport === s.id || match.sport === s.id.replace('-racing', '')).length
        return (
          <NavLink key={s.id} to={s.to} className={({ isActive }) => `side-item ${isActive ? 'active' : ''}`}>
            <span className="dot" style={{ color: s.color || '#61D6B0' }}>
              <Icon name={s.icon} size={18} />
            </span>
            <span className="side-label">{s.name}</span>
            {s.live ? <span className="side-live">Live</span> : null}
            {count ? <span className="side-count">{count}</span> : null}
          </NavLink>
        )
      })}
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

function Betslip({ embedded = false }) {
  const { betslip, removeBet, clearSlip, placeBets, loggedIn, setAuthMode, slipOpen, setSlipOpen, lastAddedBetId } = useApp()
  const [stake, setStake] = useState('100')
  const [slipError, setSlipError] = useState('')
  const [mode, setMode] = useState('Single')
  const [oddsAcceptance, setOddsAcceptance] = useState('all')
  const total = betslip.reduce((a, b) => a * (b.odd || 1), 1)
  const stakeValue = Number(stake)
  const stakeError = stake !== '' && (!Number.isFinite(stakeValue) || stakeValue < 10) ? 'Minimum stake is ₹10.' : ''
  const swipe = useSwipeDismiss(() => setSlipOpen(false), 'down')
  const panel = (
      <div className="slip-panel">
      {!embedded && <span className="sheet-grabber" aria-hidden="true" />}
      <h3><Icon name="ticket" size={21} /> Bet Slip {betslip.length ? `(${betslip.length})` : ''}{betslip.length > 0 && <button type="button" className="slip-clear" onClick={clearSlip}>Clear</button>}{!embedded && <button type="button" className="slip-close" onClick={() => setSlipOpen(false)} aria-label="Close bet slip"><Icon name="close" size={18} /></button>}</h3>
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
            <label htmlFor={embedded ? 'bet-stake-rail' : 'bet-stake'}>Stake</label>
            <div className="stake-input"><span>₹</span><input id={embedded ? 'bet-stake-rail' : 'bet-stake'} type="number" min="10" inputMode="decimal" placeholder="100" value={stake} onChange={(e) => { setStake(e.target.value); setSlipError('') }} /></div>
            <div className="stake-quick">{[100, 500, 1000].map((amount) => <button key={amount} type="button" className={stakeValue === amount ? 'on' : ''} onClick={() => setStake(String(amount))}>₹{amount}</button>)}</div>
            {stakeError && <p className="stake-error">{stakeError}</p>}
          </div>
          <div className="slip-foot">
            <label className="odds-preference"><span>Odds changes</span><select value={oddsAcceptance} onChange={(event) => setOddsAcceptance(event.target.value)}><option value="all">Accept all changes</option><option value="higher">Accept higher only</option><option value="fixed">Reject changes</option></select></label>
            {mode !== 'Single' && <p className="hint">{mode} bets are not available yet. Select Single to place a bet.</p>}
            <div className="row-between"><span>Total odds</span><b>{total.toFixed(2)}</b></div>
            <div className="row-between"><span>Maximum exposure</span><b>₹{Number(stake || 0).toFixed(2)}</b></div>
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
  )
  if (embedded) {
    return <div className="betslip is-embedded">{panel}</div>
  }
  return (
    <>
    {slipOpen && <div className="slip-backdrop" onClick={() => setSlipOpen(false)} />}
    <aside className={`betslip ${slipOpen ? 'is-open' : ''}`} {...swipe}>
      {panel}
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
      {m.markets?.[0]?.odd == null ? (
        <NavLink to={`/match/${m.id}`}><button className="odd-more">View markets</button></NavLink>
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

function ExchangeOdd({ match, market, side, price, locked = false }) {
  const { addBet, betslip } = useApp()
  const id = `${match.id}-${market}-${side}`
  const selected = betslip.some((bet) => bet.id === id)
  if (locked || price == null) return <button className="exchange-price is-locked" disabled aria-label={`${market} suspended`}><Icon name="shield" size={12} /><span>Suspended</span></button>
  return <button type="button" className={`exchange-price is-${side} ${selected ? 'is-selected' : ''}`} aria-pressed={selected} onClick={() => addBet({ id, event: `${match.home} vs ${match.away}`, pick: `${side === 'back' ? 'Back' : 'Lay'} ${market}`, odd: price })}><strong>{Number(price).toFixed(2)}</strong><small>{side}</small></button>
}

function ExchangeTable({ matches, title = 'Match odds', emptyTitle = 'No events found' }) {
  const { favorites, toggleFavorite } = useApp()
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('All')
  const [sort, setSort] = useState('Start time')
  const [expanded, setExpanded] = useState([])
  const [marketViews, setMarketViews] = useState({})
  const shown = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    const filtered = matches.filter((match) => {
      const statusMatch = status === 'All' || (status === 'Live' ? match.live : !match.live)
      const queryMatch = !normalized || `${match.home} ${match.away} ${match.league}`.toLowerCase().includes(normalized)
      return statusMatch && queryMatch
    })
    if (sort === 'Popularity') return [...filtered].sort((a, b) => Number(String(b.extra || '').replace(/\D/g, '')) - Number(String(a.extra || '').replace(/\D/g, '')))
    if (sort === 'Competition') return [...filtered].sort((a, b) => a.league.localeCompare(b.league))
    return filtered
  }, [matches, query, status, sort])
  const toggleExpanded = (id) => setExpanded((items) => items.includes(id) ? items.filter((item) => item !== id) : [...items, id])
  return <section className="exchange" aria-label={title}>
    <header className="exchange-tools">
      <div><span className="eyebrow">SPORTSBOOK</span><h2>{title}</h2><small>{shown.length} events</small></div>
      <label className="exchange-search"><Icon name="search" size={16} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search events or leagues" aria-label="Search events or leagues" />{query && <button type="button" onClick={() => setQuery('')} aria-label="Clear search"><Icon name="close" size={14} /></button>}</label>
      <div className="exchange-filters" role="group" aria-label="Event status">{['All', 'Live', 'Upcoming'].map((item) => <button type="button" key={item} className={status === item ? 'on' : ''} onClick={() => setStatus(item)}>{item}</button>)}</div>
      <label className="exchange-sort"><span>Sort</span><select value={sort} onChange={(event) => setSort(event.target.value)}><option>Start time</option><option>Popularity</option><option>Competition</option></select></label>
    </header>
    <div className="exchange-scroll" tabIndex="0" aria-label="Scrollable betting markets">
      <div className="exchange-table">
        <div className="exchange-head"><span>Event</span><span>1</span><span>X</span><span>2</span><span>Markets</span></div>
        {shown.map((match, index) => {
          const markets = match.markets || []
          const marketFor = (label) => markets.find((item) => item.label === label)
          const base = (label) => marketFor(label)?.odd
          const isLocked = marketFor('1')?.odd == null || (index > 0 && index % 5 === 0)
          const open = expanded.includes(match.id)
          const marketView = marketViews[match.id] || 'Match odds'
          const marketOptions = {
            'Match odds': ['Home', 'Draw', 'Away'],
            Bookmaker: ['Home book', 'Draw book', 'Away book'],
            Fancy: ['Over 2.5', 'Under 2.5', 'Both score'],
            Related: ['First score', 'Half-time', 'Winning margin'],
          }
          return <article className={`exchange-event ${open ? 'is-open' : ''}`} key={match.id}>
            <div className="exchange-row">
              <button type="button" className={`exchange-star ${favorites.includes(match.id) ? 'on' : ''}`} onClick={() => toggleFavorite(match.id)} aria-label={favorites.includes(match.id) ? 'Remove from favorites' : 'Add to favorites'}>★</button>
              <NavLink className="exchange-event-copy" to={`/match/${match.id}`}><span className={match.live ? 'exchange-live' : ''}>{match.live ? '● LIVE' : match.time}</span><strong>{match.home} <i>vs</i> {match.away}</strong><small>{match.league}</small><em><Icon name="tv" size={12} /> F1 · BM {match.live ? '· In-play' : ''}</em></NavLink>
              {['1', 'X', '2'].map((label) => <div className="exchange-pair" key={label}><ExchangeOdd match={match} market={label} side="back" price={base(label)} locked={isLocked} /><ExchangeOdd match={match} market={label} side="lay" price={base(label) ? base(label) + .04 : null} locked={isLocked} /></div>)}
              <button type="button" className="exchange-more" aria-expanded={open} onClick={() => toggleExpanded(match.id)}><span>{match.extra || '+18'}</span><Icon name="chevron" size={15} /></button>
            </div>
            {open && <div className="exchange-market-drawer"><div className="exchange-market-tabs" role="tablist" aria-label={`${match.home} market groups`}>{Object.keys(marketOptions).map((item) => <button key={item} type="button" role="tab" aria-selected={marketView === item} className={marketView === item ? 'on' : ''} onClick={() => setMarketViews((views) => ({ ...views, [match.id]: item }))}>{item}</button>)}</div><div className="exchange-expanded"><span><Icon name="layers" size={15} /> {marketView}</span>{marketOptions[marketView].map((label, option) => <ExchangeOdd key={label} match={match} market={label} side="back" price={Number(((base('1') || base('2') || 1.75) + option * .36).toFixed(2))} />)}<NavLink to={`/match/${match.id}`}>View all <Icon name="chevron" size={14} /></NavLink></div></div>}
          </article>
        })}
        {!shown.length && <div className="exchange-empty"><Icon name="search" size={25} /><strong>{emptyTitle}</strong><span>Change the filters or search for another team.</span><button type="button" onClick={() => { setQuery(''); setStatus('All') }}>Clear filters</button></div>}
      </div>
    </div>
    <p className="exchange-key"><span className="back-key" /> Back <span className="lay-key" /> Lay <Icon name="shield" size={12} /> Suspended</p>
  </section>
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
        <NavLink to="/responsible-play">Responsible Gaming</NavLink>
        <NavLink to="/more">Rules &amp; Terms</NavLink>
        <NavLink to="/more">Privacy</NavLink>
      </div>
      18+ | Play responsibly. Support is available from the Help centre. Bullwave Club sportsbook and casino UI.
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

function PageIntro({ eyebrow = 'BULLWAVE CLUB', title, description, icon = 'star', stats = [], action, backTo = '/', cover }) {
  const navigate = useNavigate()
  const goBack = () => {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      navigate(-1)
      return
    }
    navigate(backTo)
  }
  const coverSrc = cover ? `${import.meta.env.BASE_URL}images/hero/${cover}` : ''
  return <section className={`page-intro${cover ? ' has-cover' : ''}`}>
    {coverSrc ? <img className="page-intro-photo" src={coverSrc} alt="" /> : null}
    <div className="page-intro-copy">
      <button type="button" className="page-back" onClick={goBack}><Icon name="back" size={16} /> Back</button>
      {!cover && <>
        <span className="eyebrow">{eyebrow}</span>
        <h1>{title}</h1>
        <p>{description}</p>
        {action && <NavLink className="page-intro-action" to={action.to}>{action.label}<span aria-hidden="true">↗</span></NavLink>}
      </>}
      {cover ? <h1 className="sr-only">{title}</h1> : null}
    </div>
    {!cover && <div className="page-intro-detail">
      <div className="page-intro-emblem" aria-hidden="true"><Icon name={icon} size={42} /></div>
      {stats.length > 0 && <div className="page-intro-stats">{stats.map((item) => <div key={item.label}><b>{item.value}</b><span>{item.label}</span></div>)}</div>}
    </div>}
  </section>
}

const homeSportIds = ['cricket', 'football', 'basketball', 'tennis', 'table-tennis', 'horse', 'esports', 'camel']
const sportCovers = {
  tennis: 'sport-tennis.jpg',
  football: 'sport-football.jpg',
  basketball: 'sport-basketball.jpg',
  'table-tennis': 'sport-table-tennis.jpg',
  horse: 'sport-horse.jpg',
  'horse-racing': 'sport-horse.jpg',
}

function SportFilter({ current, showBack = false }) {
  const navigate = useNavigate()
  const goBack = () => {
    if (typeof window !== 'undefined' && window.history.length > 1) navigate(-1)
    else navigate('/')
  }
  return (
    <nav className="sport-filter" aria-label="Browse by sport">
      {showBack ? <button type="button" className="sport-filter-back" onClick={goBack}><Icon name="back" size={16} /> Back</button> : null}
      {sports.filter((s) => homeSportIds.includes(s.id)).map((s) => (
        <NavLink key={s.id} to={s.to} className={({ isActive }) => (isActive || current === s.id ? 'featured-sport' : '')}>
          <span className={`sport-filter-icon sport-${s.id}`}><Icon name={s.icon} size={22} /></span>{s.name}
        </NavLink>
      ))}
      <NavLink to="/live"><span className="sport-more">•••</span>More</NavLink>
    </nav>
  )
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

function FeaturedEventStrip() {
  const items = [
    { sport: 'tennis', label: 'Vukic v Jacquet', to: '/sport/tennis', tone: 'orange' },
    { sport: 'table', label: 'Dulich v Melnik', to: '/sport/table-tennis', tone: 'pink' },
    { sport: 'table', label: 'Pavel v Navedla', to: '/sport/table-tennis', tone: 'rose' },
    { sport: 'motor', label: 'Dubai Grand Prix', to: '/sport/motor-sports', tone: 'violet' },
  ]
  return <nav className="featured-event-strip" aria-label="Featured fixtures">{items.map((item) => <NavLink key={item.label} to={item.to} className={`featured-event-tile tone-${item.tone}`}><Icon name={item.sport} size={22} /><span>{item.label}</span></NavLink>)}</nav>
}

function HomePromoRail() {
  const ads = [
    { image: 'casino-hero-v2.webp', title: 'Live Casino', to: '/casino/live-casino' },
    { image: 'royal-v1.webp', title: 'Club Rewards', to: '/vip' },
    { image: 'wheel-v1.webp', title: 'Weekly Offers', to: '/promotions' },
  ]
  return (
    <aside className="home-promo-rail" aria-label="Bet slip and promotions">
      <Betslip embedded />
      {ads.map((ad) => (
        <NavLink key={ad.title} to={ad.to} className="promo-rail-ad">
          <img src={`${import.meta.env.BASE_URL}images/promotions/${ad.image}`} alt="" />
          <span>{ad.title}<Icon name="chevron" size={14} /></span>
        </NavLink>
      ))}
    </aside>
  )
}

function GameCarousel({ catalog }) {
  const { rowRef, edges, move } = useCarouselControls()
  return <nav className="game-carousel" aria-label="Browse games">
    <CarouselArrow direction="previous" label="Previous games" onClick={() => move(-1)} disabled={edges.start} />
    <div className="game-row" ref={rowRef}>
      {catalog.slice(0, 14).map((g) => {
        const iconKind = getGameIconKind(g)
        return <NavLink key={g.id} to={casinoGameTo(g)} className="game-circle">
          <div className="thumb">{iconKind ? <GameIcon game={g} kind={iconKind} /> : <GameArtwork game={g} />}</div>
          {g.name}
        </NavLink>
      })}
    </div>
    <CarouselArrow direction="next" label="Next games" onClick={() => move(1)} disabled={edges.end} />
  </nav>
}

function HomeRailHead({ title, to, live }) {
  return (
    <div className="home-rail-head">
      <h2>{title}{live ? <span className="home-rail-live">Live</span> : null}</h2>
      <NavLink to={to}>All <span aria-hidden="true">›</span></NavLink>
    </div>
  )
}

function HomeGameRail({ title, to, items }) {
  return (
    <section className="home-rail">
      <HomeRailHead title={title} to={to} />
      <div className="home-game-scroller">
        {items.map((g) => {
          const iconKind = getGameIconKind(g)
          return (
            <NavLink key={g.id} to={casinoGameTo(g)} className="home-game-tile">
              <div className="home-game-art">{iconKind ? <GameIcon game={g} kind={iconKind} /> : <GameArtwork game={g} />}</div>
              <span>{g.name}</span>
            </NavLink>
          )
        })}
      </div>
    </section>
  )
}

function HomeGameShowcase({ catalog, loading }) {
  const categories = [
    { id: 'slots', label: 'Slots', to: '/casino/slots' },
    { id: 'live', label: 'Live Casino', to: '/casino/live-casino' },
    { id: 'instant', label: 'Instant Games', to: '/casino/instant-games' },
    { id: 'virtual', label: 'Virtual Sport', to: '/casino/virtual-sports' },
    { id: 'tv', label: 'TV Games', to: '/casino/tv-games' },
  ]
  const [active, setActive] = useState('slots')
  const current = categories.find((category) => category.id === active) || categories[0]
  const items = catalog.filter((game) => game.cat === active).slice(0, 18)

  return (
    <section className="home-game-showcase" aria-labelledby="featured-games-title">
      <div className="home-game-showcase-head">
        <div><span className="eyebrow">PLAY IN DEMO MODE</span><h2 id="featured-games-title">Featured Games</h2></div>
        <NavLink to={current.to}>View all <Icon name="chevron" size={15} /></NavLink>
      </div>
      <div className="home-game-tabs" role="tablist" aria-label="Game categories">
        {categories.map((category) => <button key={category.id} type="button" role="tab" aria-selected={active === category.id} className={active === category.id ? 'active' : ''} onClick={() => setActive(category.id)}>{category.label}</button>)}
      </div>
      {loading ? <SkeletonGrid count={12} type="games" /> : items.length ? (
        <div className="home-game-grid">
          {items.map((game, index) => (
            <NavLink key={game.id} to={casinoGameTo(game)} className="home-featured-game" aria-label={`Play ${game.name}`}>
              <div className="home-featured-game-art"><GameArtwork game={game} /></div>
              <span className="home-featured-game-copy"><strong>{game.name}</strong>{game.provider ? <small>{game.provider}</small> : <small>Play demo</small>}</span>
              {index < 6 ? <span className="home-featured-badge">Featured</span> : null}
            </NavLink>
          ))}
        </div>
      ) : <EmptyState icon="casino" title="Games are loading" detail="Try another category while this collection is being updated." action={{ to: '/casino/slots', label: 'Browse games' }} />}
    </section>
  )
}

function HomeEventCard({ m }) {
  const { addBet, betslip } = useApp()
  const selected = (id) => betslip.some((b) => b.id === id)
  const priced = (m.markets || []).filter((mk) => mk.odd != null)
  return (
    <article className="home-event-card">
      <NavLink to={`/match/${m.id}`} className="home-event-meta">
        <small>{m.league}</small>
        {m.extra ? <em>{m.extra} ›</em> : null}
      </NavLink>
      <NavLink to={`/match/${m.id}`} className="home-event-teams">
        <div>
          <strong>{m.home}</strong>
          <strong>{m.away}</strong>
        </div>
        <div className="home-event-score">
          <span className={m.live ? 'is-live' : ''}>{m.time}</span>
          {m.score ? <b>{m.score[0]} · {m.score[1]}</b> : null}
        </div>
      </NavLink>
      {priced.length ? (
        <div className={`home-event-odds ${priced.length === 2 ? 'two' : ''}`}>
          {priced.map((mk) => (
            <OddButton key={mk.id} id={mk.id} odd={mk.odd} label={mk.label} selected={selected(mk.id)} onSelect={(price) => addBet({ id: mk.id, event: `${m.home} vs ${m.away}`, pick: mk.label, odd: price })} />
          ))}
        </div>
      ) : (
        <NavLink to={`/match/${m.id}`} className="home-event-more">View markets</NavLink>
      )}
    </article>
  )
}

function HomeMatchRail({ title, to, live, list }) {
  if (!list.length) return null
  return (
    <section className="home-rail">
      <HomeRailHead title={title} to={to} live={live} />
      <div className="home-match-scroller">
        {list.slice(0, 6).map((m) => <HomeEventCard key={m.id} m={m} />)}
      </div>
    </section>
  )
}

function HomeSportBoard({ matches }) {
  const chips = sports.filter((s) => ['cricket', 'football', 'tennis', 'basketball', 'table-tennis', 'volleyball', 'esports', 'mma'].includes(s.id))
  const [sport, setSport] = useState('cricket')
  const list = matches.filter((m) => m.sport === sport).slice(0, 6)
  return (
    <section className="home-rail home-sport-board">
      <HomeRailHead title="Sport" to="/live" />
      <div className="home-sport-chips">
        {chips.map((s) => (
          <button key={s.id} type="button" className={sport === s.id ? 'on' : ''} onClick={() => setSport(s.id)}>
            <Icon name={s.icon} size={16} />{s.name}
          </button>
        ))}
      </div>
      <div className="home-sport-list">
        {list.length ? list.map((m) => <HomeEventCard key={m.id} m={m} />) : <p className="home-sport-empty">No events in this sport right now.</p>}
      </div>
      <NavLink to="/live" className="home-all-events">All events</NavLink>
    </section>
  )
}

function ClubHomeFooter() {
  return (
    <footer className="club-home-footer">
      <div className="club-foot-cols">
        <div>
          <strong>Bullwave Club</strong>
          <NavLink to="/about">About the club</NavLink>
          <NavLink to="/promotions">Public offers</NavLink>
          <NavLink to="/about">Privacy policy</NavLink>
          <NavLink to="/faq">Terms and conditions</NavLink>
        </div>
        <div>
          <strong>Help</strong>
          <NavLink to="/faq">Betting rules</NavLink>
          <NavLink to="/account">Wallet</NavLink>
          <NavLink to="/account/withdraw">Withdrawal</NavLink>
          <NavLink to="/account/deposit">Deposit</NavLink>
          <NavLink to="/faq">Support</NavLink>
        </div>
        <div>
          <strong>Info</strong>
          <NavLink to="/responsible-play">Responsible play</NavLink>
          <NavLink to="/responsible-play">Self-exclusion</NavLink>
          <NavLink to="/faq">Player complaints</NavLink>
        </div>
      </div>
      <div className="club-foot-block">
        <strong>Available payment methods</strong>
        <div className="club-pay-row">
          {['upi', 'paytm', 'phonepe', 'card', 'netbanking', 'usdt'].map((id) => <span key={id} className="club-pay-mark"><PayLogo id={id} /></span>)}
        </div>
      </div>
      <div className="club-foot-bottom">
        <span>Play with a clear head. 18+ only.</span>
        <div className="club-licenses"><b>18+</b><Icon name="shield" size={16} /></div>
      </div>
    </footer>
  )
}

function Home() {
  const { catalogMatches: matches, clubGames, favorites, recentMatches, catalogLoading } = useApp()
  const featured = matches.find((m) => m.live) || matches[0]
  const [matchDay, setMatchDay] = useState('Today')
  const [campaign, setCampaign] = useState(0)
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
  const catalog = clubGames.length ? clubGames : games
  const instantGames = catalog.filter((g) => g.cat === 'instant').slice(0, 10)
  const slotGames = catalog.filter((g) => g.cat === 'slots').slice(0, 10)
  const exclusiveGames = catalog.filter((g) => g.cat === 'live' || g.cat === 'instant').slice(0, 8)
  const virtualCricket = matches.filter((m) => m.sport === 'virtual-cricket')
  const footballRail = matches.filter((m) => m.sport === 'football').slice(0, 6)
  const campaigns = [
    { kicker: 'BIGGER GAMES. HIGHER THRILLS.', title: <>RIDE THE <span>WAVE</span></>, detail: 'Live sports. Real action. Bigger rewards.', cta: 'Explore Live Events', to: '/live', image: 'sports-exchange-v2.png', position: 'center' },
    { kicker: 'RACING FROM DUBAI', title: <>DESERT <span>SPEED</span></>, detail: 'Professional camel racing and live exchange markets.', cta: 'Open Camel Racing', to: '/sport/camel-racing', image: 'camel-racing-dubai-v1.png', position: 'center' },
    { kicker: 'LIVE CRICKET MARKETS', title: <>FOLLOW EVERY <span>BALL</span></>, detail: 'Scores, fixtures and markets in one focused view.', cta: 'View Cricket', to: '/sport/cricket', image: 'cricket-champion-v1.png', position: 'center 42%' },
  ]
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined
    const timer = window.setInterval(() => setCampaign((current) => (current + 1) % campaigns.length), 6500)
    return () => window.clearInterval(timer)
  }, [])
  return (
    <div className="home-desk reference-home">
      <FeaturedEventStrip />
      <section className="home-hero" aria-label="Featured campaigns" aria-roledescription="carousel">
        {campaigns.map((slide, index) => <article key={slide.image} className={`home-campaign-slide ${campaign === index ? 'is-active' : ''}`} aria-hidden={campaign !== index} style={{ backgroundImage: `linear-gradient(90deg,rgba(4,13,16,.9),rgba(4,13,16,.08) 66%),url('${import.meta.env.BASE_URL}images/hero/${slide.image}')`, backgroundPosition: slide.position }}><div className="hero-message"><p>{slide.kicker}</p><h1>{slide.title}</h1><div>{slide.detail}</div><NavLink to={slide.to} tabIndex={campaign === index ? 0 : -1}>{slide.cta} <span aria-hidden="true">→</span></NavLink></div></article>)}
        <div className="hero-mantra" aria-hidden="true">PLAY<br />WATCH<br />BET<br />WIN<i /></div>
        <div className="home-campaign-controls"><button type="button" onClick={() => setCampaign((campaign - 1 + campaigns.length) % campaigns.length)} aria-label="Previous campaign"><span aria-hidden="true">‹</span></button><div>{campaigns.map((slide, index) => <button key={slide.image} type="button" className={campaign === index ? 'on' : ''} onClick={() => setCampaign(index)} aria-label={`Show campaign ${index + 1}`} aria-pressed={campaign === index} />)}</div><button type="button" onClick={() => setCampaign((campaign + 1) % campaigns.length)} aria-label="Next campaign"><span aria-hidden="true">›</span></button></div>
      </section>
      <SportFilter />
      <HomeGameShowcase catalog={catalog} loading={catalogLoading} />
      <ExchangeTable matches={matches} title="Sports exchange" />
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
      <div className="home-discover">
        <HomeGameRail title="Instant Games" to="/casino/instant-games" items={instantGames} />
        <HomeMatchRail title="Virtual Cricket" to="/casino/virtual-sports" live list={virtualCricket} />
        <HomeGameRail title="Top Slots" to="/casino/slots" items={slotGames} />
        <HomeMatchRail title="Football" to="/sport/football" list={footballRail} />
        <HomeGameRail title="Club Exclusive" to="/casino/live-casino" items={exclusiveGames} />
        <HomeSportBoard matches={matches} />
        <ClubHomeFooter />
      </div>
    </div>
  )
}

function Live() {
  const { catalogMatches: matches, catalogLoading } = useApp()
  const live = matches.filter((m) => m.live)
  const [sport, setSport] = useState('all-live')
  const liveSports = sports.filter((s) => s.id === 'all-live' || (s.live && s.id !== 'virtual-cricket'))
  const current = liveSports.find((s) => s.id === sport) || liveSports[0]
  const filtered = sport === 'all-live' ? live : live.filter((m) => m.sport === sport || m.sport === current?.id)
  return (
    <div className="content-page">
      <PageIntro eyebrow="IN PLAY" title="Live Events" description="Follow the action as it happens and explore the markets available now." icon="live" stats={[{ label: 'Live events', value: live.length }, { label: 'Sports', value: new Set(live.map((m) => m.sport)).size }]} action={{ to: '/upcoming', label: 'Upcoming events' }} />
      <div className="filters sticky-filters">
        {liveSports.map((s) => (
          <button key={s.id} type="button" className={`chip ${sport === s.id ? 'on' : ''}`} onClick={() => setSport(s.id)}>{s.name}</button>
        ))}
      </div>
      {catalogLoading ? <SkeletonGrid count={4} /> : <ExchangeTable matches={filtered} title={sport === 'all-live' ? 'Live right now' : `${current?.name || 'Sport'} live`} emptyTitle="No live events in this sport" />}
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
      {catalogLoading ? <SkeletonGrid count={6} /> : <ExchangeTable matches={filtered} title={when === 'All' ? 'On the calendar' : when} emptyTitle="No fixtures in this window" />}
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
  const descriptions = { live: 'Explore club tables and live-style games.', instant: 'Quick rounds, bright visuals and games you can pick up in a moment.', slots: 'Browse the reels, puzzles and colorful club favorites.', virtual: 'Football, cricket, tennis, racing and other sports titles in one lobby.', tv: 'Game shows, wheels, keno and trivia in the Bullwave collection.' }
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
          <NavLink key={g.id} to={casinoGameTo(g)} className="game-tile">
            <GameArtwork game={g} />
            <span>{g.name}</span>
          </NavLink>
        ))}
      </div> : <EmptyState icon="casino" title="More games are on the way" detail="Browse another collection while this one is being updated." action={{ to: '/casino/live-casino', label: 'Browse live casino' }} />}
    </div>
  )
}

function PlayCasino() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { token, clubGames } = useApp()
  const [frame, setFrame] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const game = clubGames.find((item) => String(item.launchId) === String(id) || item.id === id || item.id === `bb-${id}`)
  const lobby = casinoLobbyFor(game)
  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError('')
    setFrame('')
    api('/api/games/launch', { method: 'POST', body: { gameId: id, demo: true, returnUrl: window.location.origin + lobby.to }, token })
      .then((data) => {
        if (!cancelled) setFrame(data.url)
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || 'This game could not be opened.')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => { cancelled = true }
  }, [id, token, lobby.to])
  return (
    <div className="content-page play-casino">
      <div className="play-casino-bar">
        <button type="button" className="chip" onClick={() => navigate(lobby.to)}>Back to {lobby.label}</button>
        <h1>{game?.name || 'Club game'}</h1>
        {game?.provider ? <span>{game.provider}</span> : null}
      </div>
      {loading ? <p className="hint">Opening the game table…</p> : null}
      {error ? <EmptyState icon="casino" title="Game unavailable" detail={error} action={{ to: lobby.to, label: 'Browse games' }} /> : null}
      {frame ? <iframe className="play-casino-frame" title={game?.name || 'Club game'} src={frame} allow="autoplay; fullscreen; payment" /> : null}
    </div>
  )
}

function Sport() {
  const { name } = useParams()
  const { catalogMatches: matches, catalogLoading } = useApp()
  const [view, setView] = useState('All')
  const key = (name || 'football').replace('-racing', '')
  const aliases = { hockey: 'ice-hockey', american: 'american-football', australian: 'australian-football', motor: 'motor-sports' }
  const list = matches.filter((m) => m.sport === key || m.sport === name || m.sport === aliases[key])
  const shown = view === 'All' ? list : list.filter((m) => view === 'Live' ? m.live : !m.live)
  const title = (name || '').replaceAll('-', ' ')
  useEffect(() => setView('All'), [name])
  return (
    <div className="content-page">
      <PageIntro eyebrow="SPORTSBOOK" title={title} description={`Browse ${title} fixtures, live scores and available markets.`} icon={sportIcon(name)} stats={[{ label: 'Events', value: list.length }, { label: 'Live now', value: list.filter((m) => m.live).length }]} action={{ to: '/live', label: 'All live events' }} cover={sportCovers[name] || sportCovers[key]} />
      <SportFilter current={name} showBack />
      {key === 'camel' && <section className="camel-racing-banner" aria-label="Dubai camel racing"><div><span>Dubai race programme</span><h2>Desert speed. Live markets.</h2><p>Follow professional camel racing fixtures and available exchange markets.</p></div></section>}
      <div className="filters sticky-filters">
        {['All', 'Live', 'Upcoming'].map((c) => (
          <button key={c} type="button" className={`chip ${view === c ? 'on' : ''}`} onClick={() => setView(c)}>{c}</button>
        ))}
      </div>
      {catalogLoading ? <SkeletonGrid count={6} /> : <ExchangeTable matches={shown} title={view === 'All' ? `${title} exchange` : `${view} ${title}`} emptyTitle="No events in this view" />}
    </div>
  )
}

function MatchPage() {
  const { id } = useParams()
  const { addBet, betslip, catalogMatches: matches, catalogLoading, recordMatchView } = useApp()
  const [marketTab, setMarketTab] = useState('Popular')
  const m = matches.find((x) => x.id === id) || matches[4]
  const liveWinner = (m.markets || []).filter((mk) => mk.odd != null).map((mk) => ({ label: mk.label, odd: mk.odd }))
  const visibleMarkets = [
    ...(marketTab === 'Popular' && liveWinner.length ? [{ name: 'Match winner', categories: ['Popular'], rows: [liveWinner] }] : []),
    ...matchMarkets.filter((market) => market.categories?.includes(marketTab)),
  ]
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
    <>
    {betslip.length > 0 && <button type="button" className="mobile-slip-summary" onClick={() => setSlipOpen(true)}><span><Icon name="ticket" size={16} /> {betslip.length} selection{betslip.length === 1 ? '' : 's'}</span><strong>Open bet slip <Icon name="chevron" size={14} /></strong></button>}
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
    </>
  )
}

export default function App() {
  const location = useLocation()
  const home = location.pathname === '/'
  return (
    <div className={`app ${home ? 'is-home' : ''}`}>
      <Header />
      <PresencePing />
      <LiveTicker />
      <AnnouncementStrip />
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
            <Route path="/casino/play/:id" element={<PlayCasino />} />
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
            <Route path="/ops/health" element={<OpsHealth />} />
            <Route path="/ops/*" element={<SuperAdmin />} />
            <Route path="/vip" element={<Vip />} />
            <Route path="/faq" element={<Faq />} />
            <Route path="/favorites" element={<Favorites />} />
            <Route path="/parlays" element={<Parlays />} />
            <Route path="/more" element={<More />} />
            <Route path="/about" element={<About />} />
            <Route path="/responsible-play" element={<ResponsiblePlay />} />
          </Routes>
          <Footer />
        </main>
        {home && <HomePromoRail />}
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
