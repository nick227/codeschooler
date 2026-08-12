import type { ReactNode } from 'react'

export function LoadingState({ label = 'Loading your lesson…' }: { label?: string }) {
  return <div className="async-state" role="status"><span className="loader" aria-hidden="true" />{label}</div>
}

export function ErrorState({ message, retry }: { message: string; retry?: () => void }) {
  return (
    <div className="async-state error-state" role="alert">
      <strong>We couldn’t load this yet.</strong>
      <span>{message}</span>
      {retry && <button className="secondary-button" type="button" onClick={retry}>Try again</button>}
    </div>
  )
}

export function EmptyState({ children }: { children: ReactNode }) {
  return <div className="async-state">{children}</div>
}
