import { QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'sonner'
import { queryClient } from './lib/queryClient'
import { useMe } from './hooks/useAuth'
import { UiSettingsProvider, useUiSettings } from './context/UiSettingsContext'
import AuthPage from './components/AuthPage'
import BoardPage from './components/BoardPage'

function AppContent() {
  const { data, isLoading } = useMe()
  if (isLoading) return <div className="flex h-screen items-center justify-center text-[var(--color-text-muted)]">Loading…</div>
  if (!data?.user) return <AuthPage />
  return <BoardPage user={data.user} />
}

function AppShell() {
  const { settings } = useUiSettings()

  return (
    <>
      <AppContent />
      <Toaster position="bottom-right" theme={settings.theme} richColors />
    </>
  )
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <UiSettingsProvider>
        <AppShell />
      </UiSettingsProvider>
    </QueryClientProvider>
  )
}
