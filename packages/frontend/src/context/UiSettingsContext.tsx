import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'

export type ThemeMode = 'light' | 'dark'
export type AnimationSpeed = 'off' | 'fast' | 'normal' | 'slow'
export type CardSize = 'compact' | 'comfortable' | 'large'
export type BoardDensity = 'compact' | 'comfortable' | 'airy'

export interface UiSettings {
  theme: ThemeMode
  animationSpeed: AnimationSpeed
  cardSize: CardSize
  boardDensity: BoardDensity
}

interface UiSettingsContextValue {
  settings: UiSettings
  updateSettings: (next: Partial<UiSettings>) => void
}

const STORAGE_KEY = 'kanban-ui-settings'

export const defaultUiSettings: UiSettings = {
  theme: 'light',
  animationSpeed: 'normal',
  cardSize: 'comfortable',
  boardDensity: 'comfortable',
}

const UiSettingsContext = createContext<UiSettingsContextValue>({
  settings: defaultUiSettings,
  updateSettings: () => undefined,
})

function readStoredSettings() {
  if (typeof window === 'undefined') return defaultUiSettings

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return defaultUiSettings

    const parsed = JSON.parse(raw) as Partial<UiSettings>
    return { ...defaultUiSettings, ...parsed }
  } catch {
    return defaultUiSettings
  }
}

export function UiSettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<UiSettings>(readStoredSettings)

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
  }, [settings])

  useEffect(() => {
    document.documentElement.dataset.theme = settings.theme
  }, [settings.theme])

  const value = useMemo<UiSettingsContextValue>(() => ({
    settings,
    updateSettings: (next) => {
      setSettings((current) => ({ ...current, ...next }))
    },
  }), [settings])

  return <UiSettingsContext.Provider value={value}>{children}</UiSettingsContext.Provider>
}

export function useUiSettings() {
  return useContext(UiSettingsContext)
}
