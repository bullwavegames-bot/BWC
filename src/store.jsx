import { createContext, useContext, useMemo, useState } from 'react'

const AppContext = createContext(null)

export function AppProvider({ children }) {
  const [betslip, setBetslip] = useState([])
  const [favorites, setFavorites] = useState([])
  const [authMode, setAuthMode] = useState(null)
  const [searchOpen, setSearchOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [loggedIn, setLoggedIn] = useState(false)
  const [language, setLanguage] = useState('EN')
  const [langOpen, setLangOpen] = useState(false)
  const [oddsFormat, setOddsFormat] = useState('decimal')
  const [theme, setTheme] = useState('dark')

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

  const value = useMemo(
    () => ({
      betslip,
      addBet,
      removeBet,
      clearSlip,
      favorites,
      toggleFavorite,
      authMode,
      setAuthMode,
      searchOpen,
      setSearchOpen,
      menuOpen,
      setMenuOpen,
      loggedIn,
      setLoggedIn,
      language,
      setLanguage,
      langOpen,
      setLangOpen,
      oddsFormat,
      setOddsFormat,
      theme,
      setTheme,
    }),
    [betslip, favorites, authMode, searchOpen, menuOpen, loggedIn, language, langOpen, oddsFormat, theme],
  )

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp() {
  return useContext(AppContext)
}
