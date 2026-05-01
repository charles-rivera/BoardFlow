import { useEffect, useRef, useState } from 'react'
import { LogOut, Settings2, Zap } from 'lucide-react'
import { useLogout } from '../hooks/useAuth'
import { useUiSettings, type AnimationSpeed, type BoardDensity, type CardSize, type ThemeMode } from '../context/UiSettingsContext'
import { cn } from '../lib/utils'

interface BoardHeaderProps { user: { email: string } }

const segmentedButtonClass = 'rounded-lg px-3 py-2 text-xs font-medium transition-colors'

function ChoiceGroup<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string
  value: T
  options: Array<{ label: string; value: T }>
  onChange: (value: T) => void
}) {
  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-text-subtle)]">{label}</p>
      <div className="grid grid-cols-2 gap-2">
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={cn(
              segmentedButtonClass,
              value === option.value
                ? 'bg-[var(--color-accent)] text-white shadow-sm'
                : 'bg-[var(--color-surface-muted)] text-[var(--color-text-muted)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text)]',
            )}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  )
}

export default function BoardHeader({ user }: BoardHeaderProps) {
  const logout = useLogout()
  const { settings, updateSettings } = useUiSettings()
  const [panelOpen, setPanelOpen] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!panelOpen) return undefined

    const handlePointerDown = (event: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        setPanelOpen(false)
      }
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setPanelOpen(false)
    }

    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [panelOpen])

  return (
    <header className="relative flex shrink-0 items-center justify-between border-b border-[var(--color-border)] bg-[var(--color-header-bg)] px-6 py-3 shadow-sm transition-colors duration-300">
      <div className="flex items-center gap-3">
        <div>
          <h1 className="text-xl font-bold text-[var(--color-text)]">Kanban</h1>
          <p className="text-sm text-[var(--color-text-subtle)]">Tune the board to match how you like to work.</p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <span className="hidden text-sm text-[var(--color-text-muted)] sm:inline">{user.email}</span>
        <div ref={panelRef} className="relative">
          <button
            type="button"
            onClick={() => setPanelOpen((open) => !open)}
            className="inline-flex items-center gap-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-text-muted)] shadow-sm transition-colors hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text)]"
            aria-expanded={panelOpen}
            aria-haspopup="dialog"
          >
            <Settings2 size={16} />
            Settings
          </button>
          {panelOpen ? (
            <div
              role="dialog"
              aria-label="Board settings"
              className="absolute right-0 top-[calc(100%+0.75rem)] z-20 w-[22rem] rounded-2xl border border-[var(--color-border)] bg-[var(--color-panel-bg)] p-4 shadow-2xl backdrop-blur"
            >
              <div className="mb-4">
                <h2 className="text-sm font-semibold text-[var(--color-text)]">Workspace settings</h2>
                <p className="mt-1 text-xs text-[var(--color-text-subtle)]">These preferences are saved locally in your browser.</p>
              </div>
              <div className="space-y-4">
                <ChoiceGroup<ThemeMode>
                  label="Theme"
                  value={settings.theme}
                  options={[
                    { label: 'Light', value: 'light' },
                    { label: 'Dark', value: 'dark' },
                  ]}
                  onChange={(theme) => updateSettings({ theme })}
                />
                <ChoiceGroup<AnimationSpeed>
                  label="Animation speed"
                  value={settings.animationSpeed}
                  options={[
                    { label: 'Off', value: 'off' },
                    { label: 'Fast', value: 'fast' },
                    { label: 'Normal', value: 'normal' },
                    { label: 'Slow', value: 'slow' },
                  ]}
                  onChange={(animationSpeed) => updateSettings({ animationSpeed })}
                />
                <ChoiceGroup<CardSize>
                  label="Card size"
                  value={settings.cardSize}
                  options={[
                    { label: 'Compact', value: 'compact' },
                    { label: 'Comfort', value: 'comfortable' },
                    { label: 'Large', value: 'large' },
                  ]}
                  onChange={(cardSize) => updateSettings({ cardSize })}
                />
                <ChoiceGroup<BoardDensity>
                  label="Board density"
                  value={settings.boardDensity}
                  options={[
                    { label: 'Compact', value: 'compact' },
                    { label: 'Comfort', value: 'comfortable' },
                    { label: 'Airy', value: 'airy' },
                  ]}
                  onChange={(boardDensity) => updateSettings({ boardDensity })}
                />
              </div>
            </div>
          ) : null}
        </div>
        <button
          onClick={() => logout.mutate()}
          className="inline-flex items-center gap-2 rounded-xl border border-[var(--color-border)] px-3 py-2 text-sm text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text)]"
        >
          <LogOut size={16} />
          Logout
        </button>
      </div>
    </header>
  )
}
