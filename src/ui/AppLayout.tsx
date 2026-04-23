import type { PropsWithChildren } from 'react'
import { useEffect } from 'react'
import { NavLink } from 'react-router-dom'
import { enableOfflinePersistence, ensureSignedIn, isDemoMode } from '../lib/firebase'

export function AppLayout({ children }: PropsWithChildren) {
  useEffect(() => {
    void ensureSignedIn()
    void enableOfflinePersistence()
  }, [])

  return (
    <div className="appShell">
      <aside className="sidebar">
        <div className="brand">
          <h1>ReliefSync AI</h1>
          <p>Smart volunteer coordination</p>
          {isDemoMode ? <p className="muted">Demo mode (no Firebase env)</p> : null}
        </div>

        <nav className="nav">
          <NavLink to="/dashboard">Dashboard</NavLink>
          <NavLink to="/report">Report input</NavLink>
        </nav>

        <div style={{ padding: 10 }}>
          <p className="muted">
            Flow: report → AI → assignment → volunteer view
          </p>
        </div>
      </aside>

      <main className="main">
        <div className="container">{children}</div>
      </main>
    </div>
  )
}

