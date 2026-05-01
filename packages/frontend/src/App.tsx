import { QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'sonner'
import { queryClient } from './lib/queryClient'
import { useMe } from './hooks/useAuth'
import AuthPage from './components/AuthPage'

function AppContent() {
  const { data, isLoading } = useMe()
  if (isLoading) return <div className="flex items-center justify-center h-screen text-gray-400">Loading…</div>
  if (!data?.user) return <AuthPage />
  return <div className="p-4">BoardPage coming soon — {data.user.email}</div>
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppContent />
      <Toaster position="bottom-right" />
    </QueryClientProvider>
  )
}
