import { useEffect, useState } from 'react'

type Theme = 'light' | 'dark' | 'system'

function getInitialTheme(): Theme {
  if (typeof window === 'undefined') return 'system'
  return (localStorage.getItem('theme') as Theme) || 'system'
}

function applyTheme(themeValue: Theme) {
  const root = window.document.documentElement
  root.classList.remove('light', 'dark')

  if (themeValue === 'system') {
    const systemTheme = window.matchMedia('(prefers-color-scheme: dark)')
      .matches
      ? 'dark'
      : 'light'
    root.classList.add(systemTheme)
  } else {
    root.classList.add(themeValue)
  }
}

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(getInitialTheme)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    applyTheme(theme)
  }, [])

  useEffect(() => {
    if (!mounted) return

    applyTheme(theme)

    // Écouter les changements de préférence système
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handleChange = () => {
      if (theme === 'system') {
        applyTheme('system')
      }
    }

    mediaQuery.addEventListener('change', handleChange)

    return () => {
      mediaQuery.removeEventListener('change', handleChange)
    }
  }, [theme, mounted])

  const setThemeValue = (newTheme: Theme) => {
    setTheme(newTheme)
    localStorage.setItem('theme', newTheme)
    applyTheme(newTheme)
  }

  return { theme, setTheme: setThemeValue, mounted }
}

