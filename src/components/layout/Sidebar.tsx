import {
  Activity,
  Briefcase,
  BarChart3,
  FileText,
  Flag,
  LayoutDashboard,
  Moon,
  ReceiptText,
  Settings,
  Sun,
  Target,
  Users,
  UserCog,
  X,
} from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { hasPermission } from '@/lib/permissions'
import { useAuthStore } from '@/stores/authStore'
import { useThemeStore } from '@/stores/themeStore'
import { Avatar } from '@/components/ui/Avatar'

const navItems = [
  {
    to: '/dashboard',
    label: 'Dashboard',
    icon: LayoutDashboard,
    permission: 'dashboard:read' as const,
  },
  {
    to: '/employees',
    label: 'Employees',
    icon: Users,
    permission: 'employees:read' as const,
  },
  {
    to: '/leads',
    label: 'Leads',
    icon: Target,
    permission: 'leads:read' as const,
  },
  {
    to: '/projects',
    label: 'Projects',
    icon: Briefcase,
    permission: 'projects:read' as const,
  },
  {
    to: '/quotations',
    label: 'Quotations',
    icon: FileText,
    permission: 'quotations:read' as const,
  },
  {
    to: '/bills',
    label: 'Bills',
    icon: ReceiptText,
    permission: 'bills:read' as const,
  },
  {
    to: '/goals',
    label: 'Goals',
    icon: Flag,
    permission: 'goals:read' as const,
  },
  {
    to: '/reports',
    label: 'Reports',
    icon: BarChart3,
    permission: 'dashboard:full' as const,
  },
  {
    to: '/activity',
    label: 'Activity',
    icon: Activity,
    permission: 'activity:read' as const,
  },
  {
    to: '/users',
    label: 'Team',
    icon: UserCog,
    permission: 'employees:write' as const,
  },
]

interface SidebarProps {
  open: boolean
  onClose: () => void
}

export function Sidebar({ open, onClose }: SidebarProps) {
  const user = useAuthStore((s) => s.user)
  const { dark, toggle } = useThemeStore()

  const links = navItems.filter((item) => hasPermission(user, item.permission))

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/45 backdrop-blur-sm lg:hidden transition-all"
          onClick={onClose}
          aria-hidden
        />
      )}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex w-64 shrink-0 flex-col border-r border-slate-100 bg-white transition-transform duration-300 dark:border-slate-800 dark:bg-slate-950 lg:static lg:h-full lg:translate-x-0 shadow-lg lg:shadow-none',
          open ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        {/* Logo */}
        <div className="flex h-16 items-center justify-between border-b border-slate-100 px-4 dark:border-slate-800">
          <div className="flex items-center gap-2.5 min-w-0">
            <img
              src="/company_logo1.jpeg"
              alt="Company Logo"
              className="h-9 w-9 shrink-0 rounded-xl object-cover shadow-sm ring-1 ring-slate-900/5"
            />
            <div className="min-w-0">
              <span className="block truncate text-[15px] font-extrabold leading-tight tracking-tight text-slate-900 dark:text-white">OfficeFlow</span>
              <span className="block text-[9px] font-bold uppercase tracking-widest text-brand-500">Workspace</span>
            </div>
          </div>
          <button
            className="ml-2 shrink-0 rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 lg:hidden dark:hover:bg-slate-800 transition-colors"
            onClick={onClose}
            aria-label="Close menu"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 space-y-0.5 overflow-y-auto p-3 pt-2">
          {links.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              onClick={onClose}
              className={({ isActive }) =>
                cn(
                  'group flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-semibold transition-all duration-200',
                  isActive
                    ? 'bg-brand-600 text-white shadow-md shadow-brand-600/25'
                    : 'text-slate-500 hover:bg-brand-50 hover:text-brand-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white',
                )
              }
            >
              {({ isActive }) => (
                <>
                  <Icon className={cn('h-[18px] w-[18px] shrink-0 transition-colors', isActive ? 'text-white' : 'text-slate-400 group-hover:text-brand-600 dark:group-hover:text-white')} />
                  {label}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Bottom section */}
        <div className="border-t border-slate-100 p-3 dark:border-slate-800 space-y-1">
          {/* Settings link */}
          <NavLink
            to="/settings"
            onClick={onClose}
            className={({ isActive }) =>
              cn(
                'group flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-semibold transition-all duration-200',
                isActive
                  ? 'bg-brand-600 text-white shadow-md shadow-brand-600/25'
                  : 'text-slate-500 hover:bg-brand-50 hover:text-brand-700 dark:text-slate-400 dark:hover:bg-slate-800',
              )
            }
          >
            {({ isActive }) => (
              <>
                <Settings className={cn('h-[18px] w-[18px] shrink-0', isActive ? 'text-white' : 'text-slate-400 group-hover:text-brand-600')} />
                Settings
              </>
            )}
          </NavLink>

          {/* Dark mode toggle */}
          <button
            onClick={toggle}
            className="group flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-slate-500 hover:bg-brand-50 hover:text-brand-700 dark:text-slate-400 dark:hover:bg-slate-800 transition-all duration-200"
          >
            {dark
              ? <Sun className="h-[18px] w-[18px] shrink-0 text-slate-400 group-hover:text-brand-600" />
              : <Moon className="h-[18px] w-[18px] shrink-0 text-slate-400 group-hover:text-brand-600" />}
            {dark ? 'Light mode' : 'Dark mode'}
          </button>

          {/* User info */}
          {user && (
            <div className="mt-2 flex items-center gap-3 rounded-2xl bg-gradient-to-br from-brand-50 to-blue-50 p-3 dark:from-slate-800 dark:to-slate-800 border border-brand-100 dark:border-slate-700">
              <Avatar name={user.name} size="sm" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-bold text-slate-900 dark:text-white">{user.name}</p>
                <p className="truncate text-[10px] font-semibold capitalize text-brand-600 dark:text-brand-400 mt-0.5">{user.role}</p>
              </div>
            </div>
          )}
        </div>
      </aside>
    </>
  )
}
