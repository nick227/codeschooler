import { FormEvent, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useCurrentUser, useLogin, useLogout, useRegister } from '@code-trainer/sdk'
import { localDraftRepository } from '../workspace/persistence/LocalDraftRepository'

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3001'

async function mergeAnonymousProgress(): Promise<void> {
  const payload = localDraftRepository.exportForMerge()
  if (!payload.drafts.length && !payload.evidence.length && !payload.telemetry.length) return
  const response = await fetch(`${API_URL}/progress/merge`, {
    method: 'POST', credentials: 'include', headers: { 'content-type': 'application/json' }, body: JSON.stringify(payload),
  })
  if (!response.ok) throw new Error('Your account is ready, but local progress could not be merged yet.')
  localDraftRepository.clearMergedAnonymousData()
}

export function AuthStatus() {
  const currentUser = useCurrentUser()
  const login = useLogin()
  const register = useRegister()
  const logout = useLogout()
  const [open, setOpen] = useState(false)
  const [mode, setMode] = useState<'login' | 'register'>('register')
  const [mergeError, setMergeError] = useState('')

  useEffect(() => {
    if (currentUser.data) setOpen(false)
  }, [currentUser.data])

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const values = new FormData(event.currentTarget)
    const email = String(values.get('email') ?? '')
    const password = String(values.get('password') ?? '')
    try {
      if (mode === 'register') await register.mutateAsync({ email, password, displayName: String(values.get('displayName') ?? '') })
      else await login.mutateAsync({ email, password })
      try { await mergeAnonymousProgress() } catch (error) { setMergeError(error instanceof Error ? error.message : 'Local progress will retry later.') }
      setOpen(false)
    } catch { /* mutation error is rendered below */ }
  }

  if (currentUser.data) return (
    <div className="account-status">
      <Link to="/profile" className="profile-header-link" title="View your profile and awards">
        <span className="profile-avatar-pill">{currentUser.data.displayName.charAt(0).toUpperCase()}</span>
        <span className="profile-username">{currentUser.data.displayName}</span>
      </Link>
      <button className="quiet-button" onClick={() => void logout.mutateAsync()}>Sign out</button>
    </div>
  )

  return (
    <>
      <div className="account-status">
        <Link to="/profile" className="profile-header-link" title="View your profile and awards">
          <span className="profile-avatar-pill">?</span>
          <span className="profile-username">Profile</span>
        </Link>
        <button className="quiet-button" onClick={() => setOpen(true)}>Save progress</button>
      </div>
      {open && <div className="auth-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setOpen(false) }}>
        <section className="auth-dialog" role="dialog" aria-modal="true" aria-labelledby="auth-title">
          <button className="auth-close" aria-label="Close" onClick={() => setOpen(false)}>×</button>
          <p className="eyebrow">Identity continuity</p>
          <h2 id="auth-title">{mode === 'register' ? 'Keep what you’ve learned' : 'Welcome back'}</h2>
          <p>Your local drafts and strongest evidence merge safely. Rewards are never counted twice.</p>
          <form onSubmit={(event) => void submit(event)}>
            {mode === 'register' && <label>Display name<input name="displayName" autoComplete="name" required maxLength={50} /></label>}
            <label>Email<input name="email" type="email" autoComplete="email" required /></label>
            <label>Password<input name="password" type="password" autoComplete={mode === 'register' ? 'new-password' : 'current-password'} minLength={8} required /></label>
            <button className="primary-button" disabled={login.isPending || register.isPending}>{mode === 'register' ? 'Create account' : 'Sign in'}</button>
          </form>
          {(login.isError || register.isError) && <p role="alert" className="auth-error">We couldn’t sign you in. Check your details and try again.</p>}
          {mergeError && <p role="status" className="auth-error">{mergeError}</p>}
          <button className="text-button" onClick={() => setMode(mode === 'register' ? 'login' : 'register')}>{mode === 'register' ? 'I already have an account' : 'Create a new account'}</button>
        </section>
      </div>}
    </>
  )
}
