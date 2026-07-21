import { Bell, LogOut, Menu, Moon, Search, Sun } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { logout } from '@/services/auth.service'
import { useAuthStore } from '@/stores/authStore'
import { useThemeStore } from '@/stores/themeStore'
import { Avatar } from '@/components/ui/Avatar'

interface HeaderProps {
  onMenuClick: () => void
  title: string
}

export function Header({ onMenuClick, title }: HeaderProps) {
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const { dark, toggle } = useThemeStore()

  const handleLogout = async () => {
    try {
      await logout()
      toast.success('Signed out')
      navigate('/login')
    } catch {
      toast.error('Failed to sign out')
    }
  }

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-3 border-b border-slate-200/70 bg-white/85 backdrop-blur-xl px-4 dark:border-slate-800/70 dark:bg-slate-950/85 lg:px-8 shadow-xs transition-colors">

      {/* Left: Mobile Drawer Button + Company Logo + Page Title */}
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <button
          onClick={onMenuClick}
          className="lg:hidden flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-brand-50 hover:text-brand-600 dark:hover:bg-slate-700 transition-all active:scale-95"
          aria-label="Toggle Navigation Menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-3 min-w-0">
          <img
            src="/company_logo1.jpeg"
            alt="Logo"
            className="h-8 w-8 shrink-0 rounded-xl object-cover ring-2 ring-brand-500/20 lg:hidden shadow-sm"
          />
          <div className="min-w-0">
            <h1 className="truncate text-base sm:text-lg font-extrabold tracking-tight text-slate-900 dark:text-white">
              {title}
            </h1>
          </div>
        </div>
      </div>

      {/* Right: Search + Theme Toggle + Bell + Avatar Logout */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        {/* Desktop Search Bar */}
        <div className="relative hidden lg:flex items-center">
          <Search className="absolute left-3.5 h-4 w-4 text-slate-400 pointer-events-none" />
          <input
            type="search"
            placeholder="Search workspace..."
            className="h-9 w-52 rounded-xl border border-slate-200/90 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 pl-10 pr-9 text-xs font-semibold text-slate-700 dark:text-slate-200 placeholder:text-slate-400 focus:w-64 focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all shadow-xs"
          />
          <kbd className="absolute right-3 hidden xl:inline-flex items-center gap-0.5 rounded border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-1.5 text-[10px] font-mono text-slate-400">
            ⌘K
          </kbd>
        </div>

        {/* Quick Theme Toggle (Sun / Moon) */}
        <button
          onClick={toggle}
          title={dark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-amber-50 hover:text-amber-600 dark:hover:bg-slate-700 transition-all active:scale-95 shadow-xs"
        >
          {dark ? <Sun className="h-4.5 w-4.5 text-amber-400" /> : <Moon className="h-4.5 w-4.5 text-slate-600" />}
        </button>

        {/* Notification Bell */}
        <button
          title="Notifications"
          className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-brand-50 hover:text-brand-600 dark:hover:bg-slate-700 transition-all active:scale-95 shadow-xs"
        >
          <Bell className="h-4.5 w-4.5" />
          <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-gradient-to-tr from-brand-500 to-violet-600 text-[9px] font-black text-white ring-2 ring-white dark:ring-slate-950 shadow-sm">
            1
          </span>
        </button>

        {/* User Avatar & Logout */}
        {user && (
          <button
            onClick={handleLogout}
            title="Sign out of workspace"
            className="flex items-center gap-2 rounded-xl bg-slate-100 dark:bg-slate-800 px-2.5 py-1.5 hover:bg-red-50 dark:hover:bg-red-950/40 border border-transparent hover:border-red-200 dark:hover:border-red-900/50 transition-all active:scale-95 group shadow-xs"
          >
            <Avatar name={user.name} size="sm" className="h-7 w-7 text-xs ring-2 ring-brand-500/30" />
            <span className="hidden sm:block text-xs font-bold text-slate-700 dark:text-slate-200 group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors">
              {user.name.split(' ')[0]}
            </span>
            <LogOut className="hidden sm:block h-3.5 w-3.5 text-slate-400 group-hover:text-red-500 transition-colors" />
          </button>
        )}
      </div>
    </header>
  )
}
