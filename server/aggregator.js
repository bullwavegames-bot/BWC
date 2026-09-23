const CACHE_MS = 30 * 60 * 1000
const INSTANT_CAP = 80
const SLOT_CAP = 160

let cache = { at: 0, games: [] }

function aggregatorKey() {
  return String(process.env.GAME_AGGREGATOR_API_KEY || process.env.BIGBANG_API_KEY || '').trim()
}

function aggregatorBase() {
  return String(process.env.GAME_AGGREGATOR_BASE_URL || process.env.BIGBANG_BASE_URL || 'https://api.bigbangcasino.bet/api/v1').replace(/\/$/, '')
}

function clubCat(gameType = '') {
  const type = String(gameType).toLowerCase()
  if (type === 'crash') return 'instant'
  if (type === 'slot') return 'slots'
  return ''
}

function mapLobbyGame(item) {
  const cat = clubCat(item?.game_type)
  if (!cat || item?.id == null) return null
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

export async function getAggregatorLobby() {
  if (!aggregatorKey()) return []
  if (cache.games.length && Date.now() - cache.at < CACHE_MS) return cache.games
  const data = await aggregatorFetch('/games?limit=500&offset=0')
  const rows = Array.isArray(data.data) ? data.data : []
  const instant = []
  const slots = []
  for (const row of rows) {
    const mapped = mapLobbyGame(row)
    if (!mapped) continue
    if (mapped.cat === 'instant' && instant.length < INSTANT_CAP) instant.push(mapped)
    if (mapped.cat === 'slots' && slots.length < SLOT_CAP) slots.push(mapped)
    if (instant.length >= INSTANT_CAP && slots.length >= SLOT_CAP) break
  }
  cache = { at: Date.now(), games: [...instant, ...slots] }
  return cache.games
}

export async function clubGameCatalog(seed = []) {
  try {
    const remote = await getAggregatorLobby()
    if (!remote.length) return seed
    const keep = seed.filter((game) => game.cat !== 'instant' && game.cat !== 'slots')
    const remoteInstant = remote.filter((game) => game.cat === 'instant')
    const remoteSlots = remote.filter((game) => game.cat === 'slots')
    const seedInstant = seed.filter((game) => game.cat === 'instant')
    const seedSlots = seed.filter((game) => game.cat === 'slots')
    return [
      ...keep,
      ...(remoteInstant.length ? remoteInstant : seedInstant),
      ...(remoteSlots.length ? remoteSlots : seedSlots),
    ]
  } catch {
    return seed
  }
}

export async function launchAggregatorGame({ gameId, demo = true, userToken, language = 'en', returnUrl, device } = {}) {
  const id = Number(String(gameId || '').replace(/^bb-/i, ''))
  if (!Number.isFinite(id) || id < 1) throw Object.assign(new Error('Choose a game from Instant Games or Slots.'), { status: 400 })
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
