import { useState } from 'react'
import { useLogin, useRegister } from '../hooks/useAuth'

type Mode = 'login' | 'register'

export default function AuthPage() {
  const [mode, setMode] = useState<Mode>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({})

  const login = useLogin()
  const register = useRegister()
  const mutation = mode === 'login' ? login : register

  const validate = () => {
    const e: typeof errors = {}
    if (!email.trim()) e.email = 'Email is required'
    if (!password) e.password = 'Password is required'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = (ev: React.FormEvent) => {
    ev.preventDefault()
    if (!validate()) return
    mutation.mutate({ email, password })
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--color-app-bg)] px-4 transition-colors duration-300">
      <div className="w-full max-w-md rounded-3xl border border-[var(--color-border)] bg-[var(--color-panel-bg)] p-8 shadow-xl">
        <h1 className="mb-6 text-2xl font-bold text-[var(--color-text)]">{mode === 'login' ? 'Sign In' : 'Create Account'}</h1>
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div>
            <label className="mb-1 block text-sm font-medium text-[var(--color-text-muted)]">Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full rounded-lg border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3 py-2 text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
            />
            {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-[var(--color-text-muted)]">Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full rounded-lg border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3 py-2 text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
            />
            {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
          </div>
          {mutation.error && (
            <p className="text-red-500 text-sm">{(mutation.error as Error).message}</p>
          )}
          <button
            type="submit"
            disabled={mutation.isPending}
            className="w-full rounded-lg bg-[var(--color-accent)] py-2 font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {mode === 'login' ? 'Sign In' : 'Create Account'}
          </button>
        </form>
        <button
          type="button"
          className="mt-4 text-sm text-[var(--color-accent)] hover:underline"
          onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setErrors({}) }}
        >
          {mode === 'login' ? "Don't have an account? Register" : 'Already have an account? Sign in'}
        </button>
      </div>
    </div>
  )
}
