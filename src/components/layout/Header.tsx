import { Bell, LogOut, Menu, Search } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { logout } from '@/services/auth.service'
import { useAuthStore } from '@/stores/authStore'
import { Avatar } from '@/components/ui/Avatar'

interface HeaderProps {
  onMenuClick: () => void
  title: string
}

export function Header({ onMenuClick, title }: HeaderProps) {
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)

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
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-slate-100 bg-white/95 px-3 backdrop-blur-md dark:border-slate-800 dark:bg-slate-950/95 lg:h-16 lg:px-5 shadow-sm">
      {/* Left: hamburger + logo (mobile) + page title */}
      <div className="flex items-center gap-2 min-w-0">
        <button
          className="shrink-0 rounded-xl p-2 text-slate-500 hover:bg-brand-50 hover:text-brand-600 lg:hidden transition-colors"
          onClick={onMenuClick}
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </button>
        {/* Company logo — mobile only, hidden on desktop (sidebar shows it there) */}
        <img
          src="/company_logo1.jpeg"
          alt="Logo"
          className="h-8 w-8 shrink-0 rounded-lg object-cover ring-1 ring-slate-900/5 lg:hidden"
        />
        <h1 className="truncate text-sm font-bold text-slate-900 dark:text-white lg:text-base">
          {title}
        </h1>
      </div>

      {/* Right: search + bell + user */}
      <div className="flex items-center gap-2 lg:gap-3">
        {/* Search — desktop only */}
        <div className="relative hidden lg:flex items-center">
          <Search className="absolute left-3 h-4 w-4 text-slate-400 pointer-events-none" />
          <input
            type="search"
            placeholder="Search…"
            className="h-9 w-52 rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm text-slate-700 placeholder:text-slate-400 transition-all focus:w-64 focus:border-brand-400 focus:bg-white focus:outline-none focus:ring-4 focus:ring-brand-500/10 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
          />
        </div>

        {/* Notification bell */}
        <button className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-500 hover:border-brand-300 hover:bg-brand-50 hover:text-brand-600 transition-colors dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400">
          <Bell className="h-4 w-4" />
          <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-brand-600 text-[9px] font-bold text-white shadow-sm">1</span>
        </button>

        {/* User avatar pill */}
        {user && (
          <button
            onClick={handleLogout}
            title="Sign out"
            className="flex items-center gap-2.5 rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-1.5 transition-colors hover:border-red-200 hover:bg-red-50 dark:border-slate-700 dark:bg-slate-800 dark:hover:border-red-800 dark:hover:bg-red-900/20 group"
          >
            <Avatar name={user.name} size="sm" className="h-7 w-7 text-[11px]" />
            <div className="hidden text-left sm:block">
              <p className="text-xs font-bold text-slate-800 dark:text-slate-200 group-hover:text-red-700 dark:group-hover:text-red-400 leading-tight">{user.name}</p>
              <p className="text-[10px] capitalize text-slate-500 leading-tight">{user.role}</p>
            </div>
            <LogOut className="h-3.5 w-3.5 text-slate-400 group-hover:text-red-500 transition-colors hidden sm:block" />
          </button>
        )}
      </div>
    </header>
  )
}
