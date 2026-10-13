import { useEffect } from 'react'
import { NavLink, Route, Routes } from 'react-router-dom'
import { BarChart3, BookOpen, Crosshair, Home as HomeIcon, Puzzle, Settings as SettingsIcon, Swords } from 'lucide-react'
import { DEFAULT_PROFILE } from './types'
import { KEYS, useStored } from './lib/storage'
import { getBoardTheme } from './lib/themes'
import ZenToggle from './components/ZenToggle'
import Home from './pages/Home'
import Play from './pages/Play'
import Openings from './pages/Openings'
import Tactics from './pages/Tactics'
import Puzzles from './pages/Puzzles'
import Rating from './pages/Rating'
import Review from './pages/Review'
import Settings from './pages/Settings'
import Dev from './pages/Dev'

const NAV = [
  { to: '/', label: 'Home', icon: HomeIcon, end: true },
  { to: '/play', label: 'Play', icon: Swords },
  { to: '/openings', label: 'Openings', icon: BookOpen },
  { to: '/tactics', label: 'Tactics', icon: Crosshair },
  { to: '/puzzles', label: 'Puzzles', icon: Puzzle },
  { to: '/rating', label: 'My rating', icon: BarChart3 },
]

export default function App() {
  const [profile] = useStored(KEYS.profile, DEFAULT_PROFILE)

  // app theme, board colours and zen mode are applied on <html> so every page picks them up
  useEffect(() => {
    const root = document.documentElement
    root.dataset.appTheme = profile.appTheme
    root.dataset.zen = profile.zenMode ? 'on' : 'off'
    const t = getBoardTheme(profile.boardTheme)
    root.style.setProperty('--sq-light', t.light)
    root.style.setProperty('--sq-dark', t.dark)
  }, [profile.appTheme, profile.boardTheme, profile.zenMode])

  return (
    <div className="app">
      <ZenToggle />
      <nav className="sidebar" aria-label="Main">
        <NavLink to="/" className="brand">
          <svg width="30" height="30" viewBox="0 0 64 64" aria-hidden>
            <path
              fill="currentColor"
              d="M36 8c11 2 20 11 20 24 0 7-2 11-3 16H21c0-6 4-8 8-12 2-3 2-5-1-6-4-1-9 3-14 8l-5-5c3-5 7-10 12-13l-2-7c5-1 8 0 11 2l3-2zM16 52h36v8H16z"
            />
          </svg>
          <span>Chess Coach</span>
        </NavLink>
        {NAV.map(({ to, label, icon: Icon, end }) => (
          <NavLink key={to} to={to} end={end} className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            <Icon size={20} />
            <span>{label}</span>
          </NavLink>
        ))}
        <div className="nav-spacer" />
        <NavLink to="/settings" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
          <SettingsIcon size={20} />
          <span>Settings</span>
        </NavLink>
      </nav>
      <main className="main">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/play/*" element={<Play />} />
          <Route path="/openings/*" element={<Openings />} />
          <Route path="/tactics/*" element={<Tactics />} />
          <Route path="/puzzles/*" element={<Puzzles />} />
          <Route path="/rating/*" element={<Rating />} />
          <Route path="/review/:gameId" element={<Review />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/dev" element={<Dev />} />
          <Route path="*" element={<Home />} />
        </Routes>
      </main>
    </div>
  )
}
