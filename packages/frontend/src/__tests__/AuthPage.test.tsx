import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import AuthPage from '../components/AuthPage'

function wrap(ui: React.ReactElement) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })
  return render(<QueryClientProvider client={qc}>{ui}</QueryClientProvider>)
}

describe('AuthPage', () => {
  it('shows validation errors on empty submit', async () => {
    wrap(<AuthPage />)
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }))
    expect(screen.getByText('Email is required')).toBeInTheDocument()
    expect(screen.getByText('Password is required')).toBeInTheDocument()
  })

  it('switches from login to register mode', async () => {
    wrap(<AuthPage />)
    expect(screen.getByRole('heading', { name: /sign in/i })).toBeInTheDocument()
    await userEvent.click(screen.getByText(/don't have an account/i))
    expect(screen.getByRole('heading', { name: /create account/i })).toBeInTheDocument()
  })

  it('switches from register back to login mode', async () => {
    wrap(<AuthPage />)
    await userEvent.click(screen.getByText(/don't have an account/i))
    await userEvent.click(screen.getByText(/already have an account/i))
    expect(screen.getByRole('heading', { name: /sign in/i })).toBeInTheDocument()
  })
})
