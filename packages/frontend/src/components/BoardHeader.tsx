import { useLogout } from '../hooks/useAuth'

interface BoardHeaderProps { user: { email: string } }

export default function BoardHeader({ user }: BoardHeaderProps) {
  const logout = useLogout()
  return (
    <header className="bg-white shadow-sm px-6 py-3 flex items-center justify-between shrink-0">
      <h1 className="text-xl font-bold text-gray-800">Kanban</h1>
      <div className="flex items-center gap-3">
        <span className="text-sm text-gray-500">{user.email}</span>
        <button
          onClick={() => logout.mutate()}
          className="text-sm text-gray-600 border rounded-lg px-3 py-1 hover:bg-gray-50"
        >
          Logout
        </button>
      </div>
    </header>
  )
}
