import type { ReactNode } from 'react'
import { NavLink } from 'react-router-dom'
import { Brand } from './Brand'
import { AuthStatus } from '../features/auth/AuthStatus'

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="app-shell">
      <header className="site-header">
        <Brand />
        <nav aria-label="Primary navigation">
          <NavLink to="/learn">Learn</NavLink>
          <NavLink to="/progress">Progress</NavLink>
          <NavLink to="/projects">Projects</NavLink>
          <NavLink to="/interview">Interview</NavLink>
          <NavLink to="/knowledge">Knowledge</NavLink>
        </nav>
        <AuthStatus />
      </header>
      <main>{children}</main>
    </div>
  )
}
