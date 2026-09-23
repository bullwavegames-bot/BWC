import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { api, clearSession, loadSession, loginWithPhoneOtp, mapAccount, mapClubGame, saveSession } from './api.js'
import { matches as seedMatches } from './data.js'
import { assertSupabase, supabase } from './supabase.js'
import { isTenDigitPhone, passwordError } from './authRules.js'

const AppContext = createContext(null)

export function AppProvider({ children }) {
  const [betslip, setBetslip] = useState([])
  const [favorites, setFavorites] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('bwc_favorites')) || []
    } catch {
      return []
    }
  })
  const [recentMatches, setRecentMatches] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('bwc_recent_matches')) || []
    } catch {
      return []
    }
  })
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
  const [slipOpen, setSlipOpen] = useState(false)
  const [catalogLoading, setCatalogLoading] = useState(true)
  const [catalogError, setCatalogError] = useState('')
  const [betNotice, setBetNotice] = useState(null)
  const [lastAddedBetId, setLastAddedBetId] = useState(null)

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

  const reloadCatalog = async () => {
    setCatalogLoading(true)
    setCatalogError('')
    try {
      const data = await api('/api/catalog')
      if (data.matches?.length) setCatalogMatches(data.matches)
      if (data.games?.length) setClubGames(data.games.map(mapClubGame))
    } catch {
      setCatalogError('Live catalogue unavailable. Showing saved markets.')
    } finally {
      setCatalogLoading(false)
    }
  }

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    localStorage.setItem('bwc_theme', theme)
  }, [theme])

  useEffect(() => {
    reloadCatalog()

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
    const { data: authListener } = supabase?.auth.onAuthStateChange(() => {}) || {}
    return () => authListener?.subscription.unsubscribe()
  }, [])

  useEffect(() => {
    localStorage.setItem('bwc_favorites', JSON.stringify(favorites))
  }, [favorites])

  useEffect(() => {
    localStorage.setItem('bwc_recent_matches', JSON.stringify(recentMatches))
  }, [recentMatches])

  useEffect(() => {
    if (!betNotice) return undefined
    const timer = window.setTimeout(() => setBetNotice(null), 2600)
    return () => window.clearTimeout(timer)
  }, [betNotice])

  const addBet = (bet) => {
    if (betslip.some((item) => item.id === bet.id)) {
      setBetNotice({ type: 'warning', message: 'This selection is already in your bet slip.' })
      return
    }
    setBetslip((prev) => [...prev, bet])
    setLastAddedBetId(bet.id)
    setBetNotice({ type: 'success', message: `${bet.pick} added to your bet slip.` })
    if (typeof window !== 'undefined' && window.matchMedia('(max-width: 1200px)').matches) setSlipOpen(true)
  }

  const removeBet = (id) => {
    setBetslip((prev) => prev.filter((b) => b.id !== id))
    setBetNotice({ type: 'info', message: 'Selection removed.' })
  }
  const clearSlip = () => {
    setBetslip([])
    setBetNotice({ type: 'info', message: 'Bet slip cleared.' })
  }

  const toggleFavorite = (id) => {
    setFavorites((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
  }

  const recordMatchView = (id) => {
    setRecentMatches((current) => [id, ...current.filter((item) => item !== id)].slice(0, 6))
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

  const saveProfile = async (fields) => {
    if (!token) throw new Error('Log in first')
    const data = await api('/api/me/profile', { method: 'PATCH', token, body: fields })
    const mapped = mapAccount(data, user)
    applySession(token, mapped)
    return mapped
  }

  const resetPasswordWithPhone = async ({ phone, otp, password }) => {
    setAuthError('')
    if (!isTenDigitPhone(phone)) throw new Error('Verify your mobile number with OTP first. Email cannot reset a password.')
    const err = passwordError(password)
    if (err) throw new Error(err)
    await api('/api/auth/reset-password', { method: 'POST', body: { phone, otp, password } })
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
      : ['/api/payments/create-order']
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

  const startRazorpayDeposit = async (amount, method = 'upi') => {
    if (!token) {
      setAuthMode('login')
      throw new Error('Log in first')
    }
    if (!Number.isFinite(amount) || amount < 100) throw new Error('Minimum Razorpay deposit is ₹100.')
    return api('/api/payments/create-order', { method: 'POST', token, body: { amount, method } })
  }

  const confirmRazorpayDeposit = async (payload) => {
    if (!token) throw new Error('Log in first')
    const data = await api('/api/payments/verify', { method: 'POST', token, body: payload })
    await hydrateAccount(token, user)
    return data
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
      recentMatches,
      recordMatchView,
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
      requestPasswordReset: resetPasswordWithPhone,
      resetPasswordWithPhone,
      saveProfile,
      updatePassword: async () => {
        throw new Error('Email cannot reset a password. Verify your phone with OTP first.')
      },
      register,
      loginWithGoogle,
      logout,
      myBets,
      moveMoney,
      startRazorpayDeposit,
      confirmRazorpayDeposit,
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
      slipOpen,
      setSlipOpen,
      catalogLoading,
      catalogError,
      reloadCatalog,
      betNotice,
      setBetNotice,
      lastAddedBetId,
    }),
    [betslip, favorites, recentMatches, authMode, authError, searchOpen, menuOpen, loggedIn, user, token, myBets, catalogMatches, clubGames, language, langOpen, oddsFormat, theme, slipOpen, catalogLoading, catalogError, betNotice, lastAddedBetId],
  )

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp() {
  return useContext(AppContext)
}
