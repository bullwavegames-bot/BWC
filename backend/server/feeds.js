import { matches as seedMatches } from '../src/data.js'

const ODDS_BASE = 'https://api.the-odds-api.com/v4'
const SPORTMONKS_FOOTBALL = 'https://api.sportmonks.com/v3/football'
const SPORTMONKS_CRICKET = 'https://cricket.sportmonks.com/api/v2.0'
const CACHE_MS = 12 * 60 * 1000
const MAX_ODDS_SPORTS = 7
const MAX_EVENTS_PER_SPORT = 10

const ALWAYS_KEEP = new Set(['camel', 'national', 'replays', 'special'])

const ODDS_PRIORITY = [
  'cricket_ipl',
  'cricket_international_t20',
  'cricket_odi',
  'soccer_epl',
  'soccer_uefa_champs_league',
  'soccer_spain_la_liga',
  'soccer_uefa_europa_league',
  'basketball_nba',
  'tennis_atp_french_open',
  'tennis_atp_wimbledon',
  'tennis_atp_us_open',
  'icehockey_nhl',
  'baseball_mlb',
  'americanfootball_nfl',
  'mma_mixed_martial_arts',
  'boxing_boxing',
  'aussierules_afl',
  'esports_csgo',
  'rugbyunion_six_nations',
]

let cache = { at: 0, payload: null }

function oddsKey() {
  return process.env.THE_ODDS_API_KEY || process.env.ODDS_API_KEY || ''
}

function sportmonksToken() {
  return process.env.SPORTMONKS_API_TOKEN || process.env.SPORTMONKS_TOKEN || ''
}

async function fetchJson(url, headers = {}) {
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), 12000)
  try {
    const res = await fetch(url, { headers, signal: ctrl.signal })
    const text = await res.text()
    let data = null
    try { data = text ? JSON.parse(text) : null } catch { data = { error: text.slice(0, 180) } }
    if (!res.ok) {
      const msg = data?.message || data?.error || `HTTP ${res.status}`
      throw new Error(String(msg))
    }
    return data
  } finally {
    clearTimeout(timer)
  }
}

function mapSport(key = '', group = '') {
  const k = key.toLowerCase()
  const g = group.toLowerCase()
  if (k.startsWith('soccer') || g === 'soccer') return 'football'
  if (k.startsWith('cricket') || g === 'cricket') return 'cricket'
  if (k.startsWith('basketball')) return 'basketball'
  if (k.includes('table_tennis') || k.includes('tabletennis')) return 'table-tennis'
  if (k.startsWith('tennis')) return 'tennis'
  if (k.startsWith('icehockey')) return 'ice-hockey'
  if (k.startsWith('baseball')) return 'baseball'
  if (k.startsWith('americanfootball')) return 'american-football'
  if (k.startsWith('aussierules') || k.startsWith('australianrules')) return 'australian-football'
  if (k.startsWith('rugby')) return 'rugby'
  if (k.startsWith('mma')) return 'mma'
  if (k.startsWith('boxing')) return 'boxing'
  if (k.startsWith('esports')) return 'esports'
  if (k.includes('volleyball')) return 'volleyball'
  if (k.includes('handball')) return 'handball'
  if (k.includes('futsal')) return 'futsal'
  if (k.includes('snooker')) return 'snooker'
  if (k.includes('darts')) return 'darts'
  if (k.includes('motorsport') || k.includes('formula')) return 'motor-sports'
  if (k.includes('horse')) return 'horse'
  return null
}

function formatKickoff(iso) {
  if (!iso) return 'TBD'
  const when = new Date(iso)
  if (Number.isNaN(when.getTime())) return 'TBD'
  const now = new Date()
  const sameDay = when.toDateString() === now.toDateString()
  const tomorrow = new Date(now)
  tomorrow.setDate(now.getDate() + 1)
  const day = sameDay ? 'TODAY' : when.toDateString() === tomorrow.toDateString() ? 'TOMORROW' : when.toLocaleDateString('en-GB', { weekday: 'short' }).toUpperCase()
  const time = when.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false })
  return `${day}, ${time}`
}

function pickBookmaker(bookmakers = []) {
  const preferred = ['pinnacle', 'betfair_ex_eu', 'unibet', 'williamhill', 'bet365', 'draftkings', 'fanduel']
  for (const key of preferred) {
    const found = bookmakers.find((b) => b.key === key)
    if (found) return found
  }
  return bookmakers[0] || null
}

function mapOddsEvent(event, sportId) {
  const book = pickBookmaker(event.bookmakers)
  const h2h = book?.markets?.find((m) => m.key === 'h2h')
  const outcomes = h2h?.outcomes || []
  const home = event.home_team
  const away = event.away_team
  const byName = (name) => outcomes.find((o) => o.name === name)
  const draw = outcomes.find((o) => /draw/i.test(o.name) && o.name !== home && o.name !== away)
  const markets = []
  const homeOdd = byName(home)?.price
  const awayOdd = byName(away)?.price
  if (homeOdd) markets.push({ id: `${event.id}-1`, label: '1', odd: Number(homeOdd) })
  if (draw?.price) markets.push({ id: `${event.id}-x`, label: 'X', odd: Number(draw.price) })
  if (awayOdd) markets.push({ id: `${event.id}-2`, label: '2', odd: Number(awayOdd) })
  if (!markets.length) return null
  const start = new Date(event.commence_time)
  const live = Number.isFinite(start.getTime()) && start.getTime() <= Date.now()
  return {
    id: `odds-${event.id}`,
    sport: sportId,
    league: `${titleCase(sportId)}. ${event.sport_title || 'Markets'}`,
    live,
    time: live ? 'LIVE' : formatKickoff(event.commence_time),
    extra: `+${Math.min(99, markets.length * 8)}`,
    home,
    away,
    markets,
    source: 'odds-api',
  }
}

function titleCase(sport) {
  return String(sport).replaceAll('-', ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

function normName(value) {
  return String(value || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()
}

function sameFixture(a, b) {
  const ah = normName(a.home)
  const aa = normName(a.away)
  const bh = normName(b.home)
  const ba = normName(b.away)
  return (ah && aa && ah === bh && aa === ba) || (ah && aa && ah === ba && aa === bh)
}

async function loadOddsEvents() {
  const key = oddsKey()
  if (!key) return { events: [], error: 'missing-key', remaining: null }
  const list = await fetchJson(`${ODDS_BASE}/sports/?apiKey=${encodeURIComponent(key)}`)
  const ranked = (Array.isArray(list) ? list : [])
    .filter((s) => s.active && mapSport(s.key, s.group))
    .sort((a, b) => {
      const ia = ODDS_PRIORITY.findIndex((p) => a.key === p || a.key.startsWith(p))
      const ib = ODDS_PRIORITY.findIndex((p) => b.key === p || b.key.startsWith(p))
      return (ia === -1 ? 90 : ia) - (ib === -1 ? 90 : ib)
    })
    .slice(0, MAX_ODDS_SPORTS)

  const batches = await Promise.allSettled(ranked.map((sport) => {
    const url = `${ODDS_BASE}/sports/${sport.key}/odds/?apiKey=${encodeURIComponent(key)}&regions=eu&markets=h2h&oddsFormat=decimal`
    return fetchJson(url).then((rows) => ({ sport, rows: Array.isArray(rows) ? rows : [] }))
  }))

  const events = []
  for (const result of batches) {
    if (result.status !== 'fulfilled') continue
    const sportId = mapSport(result.value.sport.key, result.value.sport.group)
    for (const row of result.value.rows.slice(0, MAX_EVENTS_PER_SPORT)) {
      const mapped = mapOddsEvent(row, sportId)
      if (mapped) events.push(mapped)
    }
  }
  return { events, error: null, remaining: null }
}

function sportmonksTeams(row) {
  const parts = Array.isArray(row.participants) && row.participants.length
    ? row.participants
    : [
        row.localteam ? { ...row.localteam, meta: { location: 'home' } } : null,
        row.visitorteam ? { ...row.visitorteam, meta: { location: 'away' } } : null,
      ].filter(Boolean)
  const home = parts.find((p) => p.meta?.location === 'home') || parts[0]
  const away = parts.find((p) => p.meta?.location === 'away') || parts[1]
  return { home: home?.name || 'Home', away: away?.name || 'Away' }
}

function sportmonksScore(row) {
  const scores = row.scores || []
  const current = scores.filter((s) => String(s.description || '').toUpperCase() === 'CURRENT')
  if (!current.length) {
    if (row.runs || row.scoreboards) return null
    return null
  }
  const home = current.find((s) => s.score?.participant === 'home')?.score?.goals
  const away = current.find((s) => s.score?.participant === 'away')?.score?.goals
  if (home == null && away == null) return null
  return [String(home ?? 0), String(away ?? 0)]
}

function mapFootballFixture(row, live) {
  const teams = sportmonksTeams(row)
  const leagueName = row.league?.name || row.league_name || 'Football'
  const score = sportmonksScore(row)
  const kickoff = row.starting_at || row.starting_at_timestamp
  return {
    id: `sm-${row.id}`,
    sport: 'football',
    league: `Football. ${leagueName}`,
    live,
    time: live ? (row.periods?.find((p) => p.ticking)?.minutes ? `${row.periods.find((p) => p.ticking).minutes}’` : 'LIVE') : formatKickoff(typeof kickoff === 'number' ? new Date(kickoff * 1000).toISOString() : kickoff),
    extra: '+24',
    home: teams.home,
    away: teams.away,
    score: score || undefined,
    markets: [
      { id: `sm-${row.id}-1`, label: '1', odd: 1.85 },
      { id: `sm-${row.id}-x`, label: 'X', odd: 3.40 },
      { id: `sm-${row.id}-2`, label: '2', odd: 4.20 },
    ],
    source: 'sportmonks',
  }
}

async function loadSportmonksFootball() {
  const token = sportmonksToken()
  if (!token) return { events: [], error: 'missing-token' }
  const include = 'participants;scores;league;periods'
  const start = new Date().toISOString().slice(0, 10)
  const end = new Date(Date.now() + 2 * 86400000).toISOString().slice(0, 10)
  const [liveRes, upcomingRes] = await Promise.allSettled([
    fetchJson(`${SPORTMONKS_FOOTBALL}/livescores/inplay?api_token=${encodeURIComponent(token)}&include=${include}`),
    fetchJson(`${SPORTMONKS_FOOTBALL}/fixtures/between/${start}/${end}?api_token=${encodeURIComponent(token)}&include=${include}&per_page=40`),
  ])
  const events = []
  if (liveRes.status === 'fulfilled') {
    for (const row of liveRes.value?.data || []) events.push(mapFootballFixture(row, true))
  }
  if (upcomingRes.status === 'fulfilled') {
    for (const row of (upcomingRes.value?.data || []).slice(0, 24)) {
      if (events.some((e) => e.id === `sm-${row.id}`)) continue
      events.push(mapFootballFixture(row, false))
    }
  }
  const err = liveRes.status === 'rejected' && upcomingRes.status === 'rejected'
    ? liveRes.reason?.message || 'sportmonks-failed'
    : null
  return { events, error: err }
}

function mapCricketScore(row) {
  const home = row.localteam?.name || row.localteam_name
  const away = row.visitorteam?.name || row.visitorteam_name
  if (!home || !away) return null
  const live = Number(row.status) === 1 || /live/i.test(row.status_str || row.note || '')
  return {
    id: `smc-${row.id}`,
    sport: 'cricket',
    league: `Cricket. ${row.league?.name || row.season?.name || 'International'}`,
    live,
    time: live ? (row.note || 'LIVE') : formatKickoff(row.starting_at),
    extra: '+18',
    home,
    away,
    markets: [
      { id: `smc-${row.id}-1`, label: '1', odd: 1.80 },
      { id: `smc-${row.id}-2`, label: '2', odd: 2.00 },
    ],
    source: 'sportmonks',
  }
}

async function loadSportmonksCricket() {
  const token = sportmonksToken()
  if (!token) return { events: [], error: 'missing-token' }
  try {
    const data = await fetchJson(`${SPORTMONKS_CRICKET}/livescores?api_token=${encodeURIComponent(token)}&include=localteam,visitorteam,league`)
    const rows = data?.data || []
    return { events: rows.map(mapCricketScore).filter(Boolean), error: null }
  } catch (err) {
    return { events: [], error: err.message }
  }
}

function mergeCatalog({ odds, football, cricket }) {
  const live = []
  const seen = new Set()

  const add = (row) => {
    if (!row?.id || seen.has(row.id)) return
    const dup = live.find((m) => m.sport === row.sport && sameFixture(m, row))
    if (dup) {
      if (row.score && !dup.score) dup.score = row.score
      if (row.live) dup.live = true
      if (row.source === 'odds-api') dup.markets = row.markets
      if (row.source === 'sportmonks' && row.score) dup.score = row.score
      return
    }
    seen.add(row.id)
    live.push(row)
  }

  football.forEach(add)
  cricket.forEach(add)
  odds.forEach(add)

  const apiSports = new Set(live.map((m) => m.sport))
  for (const seed of seedMatches) {
    if (apiSports.has(seed.sport) && !ALWAYS_KEEP.has(seed.sport)) continue
    add({ ...seed, source: seed.source || 'club' })
  }
  return live
}

export async function getLiveCatalog() {
  if (cache.payload && Date.now() - cache.at < CACHE_MS) return cache.payload
  const [odds, football, cricket] = await Promise.all([
    loadOddsEvents().catch((err) => ({ events: [], error: err.message })),
    loadSportmonksFootball().catch((err) => ({ events: [], error: err.message })),
    loadSportmonksCricket().catch((err) => ({ events: [], error: err.message })),
  ])
  const matches = mergeCatalog({ odds: odds.events, football: football.events, cricket: cricket.events })
  const payload = {
    matches,
    feeds: {
      odds: { ok: !odds.error, count: odds.events.length, error: odds.error || undefined },
      sportmonksFootball: { ok: !football.error, count: football.events.length, error: football.error || undefined },
      sportmonksCricket: { ok: !cricket.error, count: cricket.events.length, error: cricket.error || undefined },
      cachedUntil: new Date(Date.now() + CACHE_MS).toISOString(),
    },
  }
  cache = { at: Date.now(), payload }
  return payload
}

export function feedHealth() {
  return {
    oddsConfigured: Boolean(oddsKey()),
    sportmonksConfigured: Boolean(sportmonksToken()),
    last: cache.payload?.feeds || null,
  }
}
