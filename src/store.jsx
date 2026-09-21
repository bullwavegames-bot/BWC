import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { api, clearSession, loadSession, mapAccount, mapClubGame, saveSession } from './api.js'
import { matches as seedMatches } from './data.js'
import { assertSupabase, supabase } from './supabase.js'

const AppContext = createContext(null)

export function AppProvider({ children }) {
  const [betslip, setBetslip] = useState([])
  const [favorites, setFavorites] = useState([])
  const [authMode, setAuthMode] = useState(null)
  const [searchOpen, setSearchOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [loggedIn, setLoggedIn] = useState(false)
  const [token, setToken] = useState(null)
  const [user, setUser] = useState(null)
  const [catalogMatches, setCatalogMatches] = useState(seedMatches)
  const [clubGames, setClubGames] = useState([])
  const [myBets, setMyBets] = useState([])
  const [authError, setAuthError] = useState('')
  const [language, setLanguage] = useState('EN')
  const [langOpen, setLangOpen] = useState(false)
  const [oddsFormat, setOddsFormat] = useState('decimal')
  const [theme, setTheme] = useState('dark')

  const applySession = (nextToken, nextUser) => {
    setToken(nextToken)
    setUser(nextUser)
    setLoggedIn(Boolean(nextToken && nextUser))
    if (nextToken && nextUser) saveSession(nextToken, nextUser)
    else clearSession()
  }

  const hydrateAccount = async (accessToken, extra = {}) => {
    try {
      const data = await api('/api/me', { token: accessToken })
      const mapped = mapAccount(data, extra)
      applySession(accessToken, mapped)
      const bets = await api('/api/me/bets', { token: accessToken }).catch(() => null)
      if (bets?.bets) setMyBets(bets.bets)
      return mapped
    } catch {
      applySession(accessToken, {
        email: extra.email || '',
        phone: extra.phone || '',
        username: extra.username || '',
        balance: 0,
      })
    }
  }

  useEffect(() => {
    api('/api/games')
      .then((data) => {
        if (data.games?.length) setClubGames(data.games.map(mapClubGame))
      })
      .catch(() => {})

    const boot = async () => {
      if (supabase) {
        const { data } = await supabase.auth.getSession()
        const access = data.session?.access_token
        if (access) {
          await hydrateAccount(access, { email: data.session.user?.email, phone: data.session.user?.phone })
          return
        }
      }
      const session = loadSession()
      if (session.token && session.user) {
        await hydrateAccount(session.token, session.user)
      }
    }
    boot()
  }, [])

  const addBet = (bet) => {
    setBetslip((prev) => {
      const exists = prev.find((b) => b.id === bet.id)
      if (exists) return prev.filter((b) => b.id !== bet.id)
      return [...prev, bet]
    })
  }

  const removeBet = (id) => setBetslip((prev) => prev.filter((b) => b.id !== id))
  const clearSlip = () => setBetslip([])

  const toggleFavorite = (id) => {
    setFavorites((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
  }

  const login = async (payload) => {
    setAuthError('')
    const client = assertSupabase()
    const email = payload.email?.trim()
    if (!email) throw new Error('Use your club e-mail to log in.')
    if (!payload.password) throw new Error('Password is required')
    const { data, error } = await client.auth.signInWithPassword({ email, password: payload.password })
    if (error) throw new Error(error.message)
    await hydrateAccount(data.session.access_token, { email: data.user.email, phone: payload.phone })
    setAuthMode(null)
  }

  const register = async (payload) => {
    setAuthError('')
    const client = assertSupabase()
    const email = payload.email?.trim()
    if (!email) throw new Error('E-mail is required for Bullwave Club accounts.')
    if ((payload.method || 'phone') !== 'email' && !payload.phoneVerified) {
      throw new Error('Verify the OTP sent to your phone first.')
    }
    if (!payload.password || payload.password.length < 10) {
      throw new Error('Password must be at least 10 characters.')
    }
    const { data, error } = await client.auth.signUp({
      email,
      password: payload.password,
      options: {
        data: {
          phone: payload.phone || null,
          bonus: payload.bonus || null,
          promo_code: payload.promoCode || null,
        },
      },
    })
    if (error) throw new Error(error.message)
    if (!data.session) {
      throw new Error('Check your e-mail to confirm the account, then log in.')
    }
    await hydrateAccount(data.session.access_token, { email: data.user.email, phone: payload.phone })
    setAuthMode(null)
  }

  const loginWithGoogle = async () => {
    setAuthError('')
    const client = assertSupabase()
    const { error } = await client.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    })
    if (error) throw new Error(error.message)
  }

  const logout = async () => {
    if (supabase) await supabase.auth.signOut()
    applySession(null, null)
    setMyBets([])
  }

  const placeBets = async (stake) => {
    if (!token) {
      setAuthMode('login')
      throw new Error('Log in to place a bet')
    }
    try {
      const data = await api('/api/me/bets', {
        method: 'POST',
        token,
        body: { stake, selections: betslip },
      })
      if (data.user || data.wallet) {
        setUser((prev) => ({ ...prev, ...(data.user || {}), balance: data.wallet?.total ?? prev.balance }))
      }
      setMyBets((prev) => [data.bet || data, ...prev])
      clearSlip()
      return data.bet || data
    } catch (err) {
      throw new Error(err.message || 'Betting is not enabled on this club API.')
    }
  }

  const moveMoney = async (type, amount) => {
    if (!token) {
      setAuthMode('login')
      throw new Error('Log in first')
    }
    if (!Number.isFinite(amount) || amount <= 0) throw new Error('Enter a valid amount')
    try {
      const path = type === 'withdraw' ? '/api/payments/cashout' : '/api/payments/create-deposit'
      const data = await api(path, { method: 'POST', token, body: { amount } })
      await hydrateAccount(token, user)
      return data
    } catch (err) {
      throw new Error(err.message || 'Wallet moves go through Bullwave Club billing.')
    }
  }

  const value = useMemo(
    () => ({
      betslip,
      addBet,
      removeBet,
      clearSlip,
      placeBets,
      favorites,
      toggleFavorite,
      authMode,
      setAuthMode,
      authError,
      setAuthError,
      searchOpen,
      setSearchOpen,
      menuOpen,
      setMenuOpen,
      loggedIn,
      user,
      token,
      login,
      register,
      loginWithGoogle,
      logout,
      myBets,
      moveMoney,
      catalogMatches,
      clubGames,
      language,
      setLanguage,
      langOpen,
      setLangOpen,
      oddsFormat,
      setOddsFormat,
      theme,
      setTheme,
    }),
    [betslip, favorites, authMode, authError, searchOpen, menuOpen, loggedIn, user, token, myBets, catalogMatches, clubGames, language, langOpen, oddsFormat, theme],
  )

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp() {
  return useContext(AppContext)
}
