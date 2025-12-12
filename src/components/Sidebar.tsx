import { Link, useLocation } from '@tanstack/react-router'
import { Download, Settings, Moon, Sun } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useTheme } from '@/hooks/use-theme'
import { Button } from '@/components/ui/button'

export default function Sidebar() {
  const location = useLocation()
  const { theme, setTheme } = useTheme()

  const isActive = (path: string) => location.pathname === path

  const toggleTheme = () => {
    if (theme === 'light') {
      setTheme('dark')
    } else if (theme === 'dark') {
      setTheme('system')
    } else {
      setTheme('light')
    }
  }

  const getThemeIcon = () => {
    if (theme === 'dark') {
      return <Moon className="size-4" />
    }
    if (theme === 'system') {
      return <Sun className="size-4" />
    }
    return <Sun className="size-4" />
  }

  return (
    <aside className="fixed left-0 top-0 h-full w-64 border-r bg-background p-6 flex flex-col">
      <div className="flex-1">
        <Link
          to="/download"
          className={cn(
            'flex items-center gap-3 px-4 py-3 rounded-lg transition-colors mb-2',
            isActive('/download')
              ? 'bg-primary text-primary-foreground'
              : 'hover:bg-accent text-foreground'
          )}
        >
          <Download className="size-5" />
          <span className="font-medium">Download</span>
        </Link>
      </div>

      <div className="mt-auto space-y-2">
        <Button
          variant="ghost"
          onClick={toggleTheme}
          className="w-full justify-start gap-3 px-4 py-3 h-auto"
          title={`Theme: ${theme === 'system' ? 'System' : theme === 'dark' ? 'Dark' : 'Light'}`}
        >
          {getThemeIcon()}
          <span className="font-medium">
            {theme === 'system'
              ? 'System'
              : theme === 'dark'
                ? 'Dark'
                : 'Light'}
          </span>
        </Button>
        <Link
          to="/settings"
          className={cn(
            'flex items-center gap-3 px-4 py-3 rounded-lg transition-colors',
            isActive('/settings')
              ? 'bg-primary text-primary-foreground'
              : 'hover:bg-accent text-foreground'
          )}
        >
          <Settings className="size-5" />
          <span className="font-medium">Settings</span>
        </Link>
      </div>
    </aside>
  )
}

