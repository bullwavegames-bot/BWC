import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { api, clearSession, loadSession, loginWithPhoneOtp, mapAccount, mapClubGame, saveSession } from './api.js'
import { matches as seedMatches } from './data.js'
import { assertSupabase, supabase } from './supabase.js'
import { isTenDigitPhone, passwordError } from './authRules.js'

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
  const [theme, setTheme] = useState(() => (typeof localStorage !== 'undefined' && localStorage.getItem('bwc_theme') === 'light' ? 'light' : 'dark'))

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
      applySession(null, null)
      setMyBets([])
      return null
    }
  }

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    localStorage.setItem('bwc_theme', theme)
  }, [theme])

  useEffect(() => {
    api('/api/games')
      .then((data) => {
        if (data.games?.length) setClubGames(data.games.map(mapClubGame))
      })
      .catch(() => {})

    const boot = async () => {
      const session = loadSession()
      if (session.token && session.user) {
        const restored = await hydrateAccount(session.token, session.user)
        if (restored) return
      }
      if (supabase) {
        const { data } = await supabase.auth.getSession()
        const access = data.session?.access_token
        if (access) {
          await hydrateAccount(access, { email: data.session.user?.email, phone: data.session.user?.phone })
          return
        }
      }
    }
    boot()
    const { data: authListener } = supabase?.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') setAuthMode('update-password')
    }) || {}
    return () => authListener?.subscription.unsubscribe()
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
    const email = payload.email?.trim()
    if (!email) throw new Error('Use your club e-mail to log in.')
    if (!payload.password) throw new Error('Password is required')
    const data = await api('/api/auth/login', {
      method: 'POST',
      body: { method: 'email', email, password: payload.password },
    })
    const mapped = mapAccount(data, { email, phone: payload.phone })
    applySession(data.token, mapped)
    setAuthMode(null)
  }

  const loginWithPhone = async ({ phone, otp }) => {
    setAuthError('')
    if (!phone) throw new Error('Phone number is required')
    if (!otp) throw new Error('Enter the OTP sent to your phone')
    const data = await loginWithPhoneOtp(phone, otp)
    const mapped = mapAccount(data, { phone })
    applySession(data.token, mapped)
    setAuthMode(null)
    return mapped
  }

  const requestPasswordReset = async (email) => {
    const client = assertSupabase()
    const address = email?.trim()
    if (!address) throw new Error('Enter your account e-mail first.')
    const { error } = await client.auth.resetPasswordForEmail(address, { redirectTo: window.location.origin })
    if (error) throw new Error(error.message)
  }

  const updatePassword = async (password) => {
    const client = assertSupabase()
    if (!password) throw new Error('Password is required')
    const nextPasswordError = passwordError(password)
    if (nextPasswordError) throw new Error(nextPasswordError)
    const { error } = await client.auth.updateUser({ password })
    if (error) throw new Error(error.message)
    setAuthMode(null)
  }

  const register = async (payload) => {
    setAuthError('')
    const email = payload.email?.trim()
    if (!email) throw new Error('E-mail is required for Bullwave Club accounts.')
    if ((payload.method || 'phone') !== 'email') {
      if (!isTenDigitPhone(payload.phone)) throw new Error('Enter a 10-digit mobile number.')
      if (!payload.phoneVerified) throw new Error('Verify the OTP sent to your phone first.')
    }
    const nextPasswordError = passwordError(payload.password)
    if (nextPasswordError) throw new Error(nextPasswordError)
    const data = await api('/api/auth/register', {
      method: 'POST',
      body: {
        method: payload.method || 'phone',
        phone: payload.phone || null,
        email,
        password: payload.password,
        bonus: payload.bonus || null,
        promoCode: payload.promoCode || null,
      },
    })
    const mapped = mapAccount(data, { email, phone: payload.phone })
    applySession(data.token, mapped)
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

  const moveMoney = async (type, amount, extra = {}) => {
    if (!token) {
      setAuthMode('login')
      throw new Error('Log in first')
    }
    if (!Number.isFinite(amount) || amount <= 0) throw new Error('Enter a valid amount')
    const paths = type === 'withdraw'
      ? ['/api/wallet/withdraw', '/api/payments/cashout']
      : ['/api/wallet/deposit', '/api/payments/create-deposit']
    let lastErr
    for (const path of paths) {
      try {
        const data = await api(path, { method: 'POST', token, body: { amount, ...extra } })
        await hydrateAccount(token, user)
        return data
      } catch (err) {
        lastErr = err
        if (!/not found|404/i.test(String(err.message))) break
      }
    }
    throw new Error(lastErr?.message || 'Wallet moves go through Bullwave Club billing.')
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
      loginWithPhone,
      requestPasswordReset,
      updatePassword,
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
