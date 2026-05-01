import { QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'sonner'
import { queryClient } from './lib/queryClient'
import { useMe } from './hooks/useAuth'

function AppContent() {
  const { data, isLoading } = useMe()
  if (isLoading) return <div className="flex items-center justify-center h-screen text-gray-400">Loading…</div>
  if (!data?.user) return <div>AuthPage placeholder</div>
  return <div>BoardPage placeholder — logged in as {data.user.email}</div>
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppContent />
      <Toaster position="bottom-right" />
    </QueryClientProvider>
  )
}
