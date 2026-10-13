import { Component, lazy, Suspense, useEffect, type ReactNode } from 'react'
import { NavLink, Route, Routes, useLocation } from 'react-router-dom'
import { BarChart3, BookOpen, Crosshair, Home as HomeIcon, Puzzle, Settings as SettingsIcon, Swords } from 'lucide-react'
import { DEFAULT_PROFILE } from './types'
import { KEYS, useStored } from './lib/storage'
import { getBoardTheme } from './lib/themes'
import ZenToggle from './components/ZenToggle'

// Every page is its own download. The first visit only fetches the app frame and the page you
// opened, so the app appears quickly even on a phone. The other pages are fetched quietly a moment
// later (see usePreloadPages), so moving between pages afterwards feels instant.
const PAGE_LOADERS = {
  home: () => import('./pages/Home'),
  play: () => import('./pages/Play'),
  openings: () => import('./pages/Openings'),
  tactics: () => import('./pages/Tactics'),
  puzzles: () => import('./pages/Puzzles'),
  rating: () => import('./pages/Rating'),
  review: () => import('./pages/Review'),
  settings: () => import('./pages/Settings'),
}
const Home = lazy(PAGE_LOADERS.home)
const Play = lazy(PAGE_LOADERS.play)
const Openings = lazy(PAGE_LOADERS.openings)
const Tactics = lazy(PAGE_LOADERS.tactics)
const Puzzles = lazy(PAGE_LOADERS.puzzles)
const Rating = lazy(PAGE_LOADERS.rating)
const Review = lazy(PAGE_LOADERS.review)
const Settings = lazy(PAGE_LOADERS.settings)
// The dev lab is a tool for testing the board and engine while building the app. It only exists
// in development (npm run dev); the public site leaves it out completely.
const Dev = import.meta.env.DEV ? lazy(() => import('./pages/Dev')) : null

// Tab titles, by the first part of the address (#/play -> "Play · Chess Coach").
const PAGE_TITLES: Record<string, string> = {
  play: 'Play',
  openings: 'Openings',
  tactics: 'Tactics',
  puzzles: 'Puzzles',
  rating: 'My rating',
  review: 'Game review',
  settings: 'Settings',
}

const KNIGHT_PATH =
  'M36 8c11 2 20 11 20 24 0 7-2 11-3 16H21c0-6 4-8 8-12 2-3 2-5-1-6-4-1-9 3-14 8l-5-5c3-5 7-10 12-13l-2-7c5-1 8 0 11 2l3-2zM16 52h36v8H16z'

const NAV = [
  { to: '/', label: 'Home', icon: HomeIcon, end: true },
  { to: '/play', label: 'Play', icon: Swords },
  { to: '/openings', label: 'Openings', icon: BookOpen },
  { to: '/tactics', label: 'Tactics', icon: Crosshair },
  { to: '/puzzles', label: 'Puzzles', icon: Puzzle },
  { to: '/rating', label: 'My rating', icon: BarChart3 },
]

/** Shown in the page area while a page is being fetched. It fades in after a short pause, so a fast load shows nothing. */
function PageLoading() {
  return (
    <div className="route-loading" role="status">
      <svg className="route-loading-mark" width="44" height="44" viewBox="0 0 64 64" aria-hidden>
        <path fill="currentColor" d={KNIGHT_PATH} />
      </svg>
      <span>Setting up the board…</span>
    </div>
  )
}

/**
 * If a page fails to load (the internet dropped, or the app was updated while it was open) or crashes,
 * only the page area shows a friendly message. The top bar keeps working so you can go elsewhere.
 */
class PageErrorBoundary extends Component<{ pathname: string; children: ReactNode }, { failed: boolean; pathname: string }> {
  state = { failed: false, pathname: this.props.pathname }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  // going to another page clears the message and tries again
  static getDerivedStateFromProps(props: { pathname: string }, state: { pathname: string }) {
    return props.pathname === state.pathname ? null : { failed: false, pathname: props.pathname }
  }

  render() {
    if (!this.state.failed) return this.props.children
    return (
      <div className="page">
        <div className="card route-error" role="alert">
          <h2>This page could not open</h2>
          <p>
            Maybe the internet dropped for a moment, or the app was just updated. Reloading usually fixes it. Your
            progress is safe: it is saved in this browser.
          </p>
          <button className="btn primary" onClick={() => window.location.reload()}>
            Reload the page
          </button>
        </div>
      </div>
    )
  }
}

/** Fetch the other pages in the background once the first one has had time to appear. */
function usePreloadPages() {
  useEffect(() => {
    const preload = () => {
      for (const load of Object.values(PAGE_LOADERS)) load().catch(() => undefined)
    }
    const timer = window.setTimeout(() => {
      if ('requestIdleCallback' in window) window.requestIdleCallback(preload, { timeout: 3000 })
      else preload()
    }, 2500)
    return () => window.clearTimeout(timer)
  }, [])
}

export default function App() {
  const [profile] = useStored(KEYS.profile, DEFAULT_PROFILE)
  const { pathname } = useLocation()
  usePreloadPages()

  // a new page starts at the top and names the browser tab after itself
  useEffect(() => {
    window.scrollTo(0, 0)
    const title = PAGE_TITLES[pathname.split('/')[1] ?? '']
    document.title = title ? `${title} · Chess Coach` : 'Chess Coach'
  }, [pathname])

  // app theme, board colours and zen mode are applied on <html> so every page picks them up
  useEffect(() => {
    const root = document.documentElement
    root.dataset.appTheme = profile.appTheme
    root.dataset.zen = profile.zenMode ? 'on' : 'off'
    const t = getBoardTheme(profile.boardTheme)
    root.style.setProperty('--sq-light', t.light)
    root.style.setProperty('--sq-dark', t.dark)
    root.style.setProperty('--sq-last', t.highlight ?? 'rgba(255, 214, 90, 0.45)')
    root.style.setProperty('--sq-select', t.select ?? 'rgba(255, 214, 90, 0.6)')
    root.style.setProperty('--coord-on-light', t.coordOnLight ?? t.dark)
    root.style.setProperty('--coord-on-dark', t.coordOnDark ?? t.light)
    // the phone's status bar and the installed app's title bar take the page colour of the chosen theme
    const pageColour = getComputedStyle(root).getPropertyValue('--bg-0').trim()
    if (pageColour) document.querySelector('meta[name="theme-color"]')?.setAttribute('content', pageColour)
  }, [profile.appTheme, profile.boardTheme, profile.zenMode])

  return (
    <div className="app">
      <ZenToggle />
      <header className="topbar">
        <NavLink to="/" className="brand" aria-label="Chess Coach home">
          <svg width="30" height="30" viewBox="0 0 64 64" aria-hidden>
            <path fill="currentColor" d={KNIGHT_PATH} />
          </svg>
          <span>Chess Coach</span>
        </NavLink>
        <nav className="topnav" aria-label="Main">
          {NAV.map(({ to, label, icon: Icon, end }) => (
            <NavLink key={to} to={to} end={end} className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              <Icon size={18} />
              <span>{label}</span>
            </NavLink>
          ))}
          <div className="nav-spacer" />
          <NavLink to="/settings" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            <SettingsIcon size={18} />
            <span>Settings</span>
          </NavLink>
        </nav>
      </header>
      <main className="main">
        <PageErrorBoundary pathname={pathname}>
          <Suspense fallback={<PageLoading />}>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/play/*" element={<Play />} />
              <Route path="/openings/*" element={<Openings />} />
              <Route path="/tactics/*" element={<Tactics />} />
              <Route path="/puzzles/*" element={<Puzzles />} />
              <Route path="/rating/*" element={<Rating />} />
              <Route path="/review/:gameId" element={<Review />} />
              <Route path="/settings" element={<Settings />} />
              {Dev && <Route path="/dev" element={<Dev />} />}
              <Route path="*" element={<Home />} />
            </Routes>
          </Suspense>
        </PageErrorBoundary>
      </main>
    </div>
  )
}
