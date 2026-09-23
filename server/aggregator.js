const CACHE_MS = 30 * 60 * 1000
const CAPS = { instant: 80, slots: 160, virtual: 80, tv: 80, live: 80 }

const VIRTUAL_RE = /\b(virtual|e-?football|e-?soccer|e-?cricket|e-?sport|greyhound|harness|kiron|golden race|leap gaming|virtual horse|virtual tennis|virtual basketball|virtual football|virtual cricket|esoccer)\b/i
const TV_RE = /\b(keno|bingo|lottery|lotto|wheel|monopoly|crazy time|dream catcher|mega ball|lightning|deal or no deal|funky time|candy land|game show|tv game|xxxtreme|raffle|trivia|quiz|extra chilli|gold vault roulette|money time|sic bo)\b/i

let cache = { at: 0, games: [] }

function aggregatorKey() {
  return String(process.env.GAME_AGGREGATOR_API_KEY || process.env.BIGBANG_API_KEY || '').trim()
}

function aggregatorBase() {
  return String(process.env.GAME_AGGREGATOR_BASE_URL || process.env.BIGBANG_BASE_URL || 'https://api.bigbangcasino.bet/api/v1').replace(/\/$/, '')
}

function haystack(item) {
  return [item?.title, item?.name, item?.provider, item?.category, item?.category_title].filter(Boolean).join(' ')
}

function clubCat(item) {
  const type = String(item?.game_type || '').toLowerCase()
  const text = haystack(item)
  if (VIRTUAL_RE.test(text)) return 'virtual'
  if (TV_RE.test(text) || (type === 'live' && /\b(show|wheel|baller|roulette)\b/i.test(text))) return 'tv'
  if (type === 'crash') return 'instant'
  if (type === 'live') return 'live'
  if (type === 'slot') return 'slots'
  return 'slots'
}

function mapLobbyGame(item) {
  if (item?.id == null) return null
  const cat = clubCat(item)
  const launchId = String(item.id)
  return {
    id: `bb-${launchId}`,
    launchId,
    name: item.title || item.name || `Game ${launchId}`,
    cat,
    cover: item.thumbnail || null,
    provider: item.provider || item.category_title || item.category || '',
    source: 'aggregator',
  }
}

async function aggregatorFetch(path, { method = 'GET', body } = {}) {
  const key = aggregatorKey()
  if (!key) throw Object.assign(new Error('Game aggregator is not configured'), { status: 503 })
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), 14000)
  try {
    const res = await fetch(`${aggregatorBase()}${path}`, {
      method,
      headers: {
        'X-API-Key': key,
        Accept: 'application/json',
        ...(body ? { 'Content-Type': 'application/json' } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
      signal: ctrl.signal,
    })
    const text = await res.text()
    let data = {}
    try { data = text ? JSON.parse(text) : {} } catch { data = { error: text.slice(0, 180) } }
    if (!res.ok || data.success === false) {
      const msg = data?.error?.message || data?.error || data?.message || `Aggregator ${res.status}`
      throw Object.assign(new Error(String(msg)), { status: res.status >= 400 ? res.status : 502 })
    }
    return data
  } finally {
    clearTimeout(timer)
  }
}

async function listGames(query = '') {
  const suffix = query ? `&${query}` : ''
  const data = await aggregatorFetch(`/games?limit=400&offset=0${suffix}`)
  return Array.isArray(data.data) ? data.data : []
}

export async function getAggregatorLobby() {
  if (!aggregatorKey()) return []
  if (cache.games.length && Date.now() - cache.at < CACHE_MS) return cache.games
  const batches = await Promise.allSettled([
    listGames(),
    listGames('search=virtual'),
    listGames('search=keno'),
    listGames('search=lightning'),
    listGames('search=bingo'),
    listGames('search=racing'),
  ])
  const byId = new Map()
  for (const batch of batches) {
    if (batch.status !== 'fulfilled') continue
    for (const row of batch.value) {
      if (row?.id == null || byId.has(row.id)) continue
      byId.set(row.id, row)
    }
  }
  const buckets = { instant: [], slots: [], virtual: [], tv: [], live: [] }
  for (const row of byId.values()) {
    const mapped = mapLobbyGame(row)
    if (!mapped || !buckets[mapped.cat]) continue
    if (buckets[mapped.cat].length >= CAPS[mapped.cat]) continue
    buckets[mapped.cat].push(mapped)
  }
  cache = {
    at: Date.now(),
    games: [...buckets.instant, ...buckets.slots, ...buckets.virtual, ...buckets.tv, ...buckets.live],
  }
  return cache.games
}

export async function clubGameCatalog(seed = []) {
  const replace = new Set(['instant', 'slots', 'virtual', 'tv', 'live'])
  try {
    const remote = await getAggregatorLobby()
    if (!remote.length) return seed
    const keep = seed.filter((game) => !replace.has(game.cat))
    const out = [...keep]
    for (const cat of replace) {
      const fromRemote = remote.filter((game) => game.cat === cat)
      const fromSeed = seed.filter((game) => game.cat === cat)
      out.push(...(fromRemote.length ? fromRemote : fromSeed))
    }
    return out
  } catch {
    return seed
  }
}

export async function launchAggregatorGame({ gameId, demo = true, userToken, language = 'en', returnUrl, device } = {}) {
  const id = Number(String(gameId || '').replace(/^bb-/i, ''))
  if (!Number.isFinite(id) || id < 1) throw Object.assign(new Error('Choose a game from the club lobby.'), { status: 400 })
  const payload = {
    game_id: id,
    language,
    demo: Boolean(demo),
  }
  if (returnUrl) payload.return_url = returnUrl
  if (device) payload.device = device
  if (!payload.demo && userToken) payload.user_token = String(userToken)
  if (payload.demo) payload.user_token = 'demo'
  const data = await aggregatorFetch('/games/launch', { method: 'POST', body: payload })
  const url = data.game_url || data.url
  if (!url) throw Object.assign(new Error('The aggregator did not return a play URL.'), { status: 502 })
  return { url, demo: Boolean(data.demo || payload.demo), gameId: data.game_id || id, gameName: data.game_name || '' }
}

export function aggregatorHealth() {
  return { configured: Boolean(aggregatorKey()) }
}
