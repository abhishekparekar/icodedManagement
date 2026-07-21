import {
  Activity,
  Briefcase,
  BarChart3,
  Boxes,
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
  Wallet,
  X,
  ChevronRight,
} from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { hasPermission } from '@/lib/permissions'
import { useAuthStore } from '@/stores/authStore'
import { useThemeStore } from '@/stores/themeStore'
import { Avatar } from '@/components/ui/Avatar'

const navItems = [
  { section: 'Main',
    links: [
      { to: '/dashboard', label: 'Dashboard',    icon: LayoutDashboard, permission: 'dashboard:read'   },
      { to: '/activity',  label: 'Activity Logs', icon: Activity,        permission: 'activity:read'    },
    ]},
  { section: 'Workspace',
    links: [
      { to: '/employees', label: 'Employees',    icon: Users,     permission: 'employees:read'  },
      { to: '/leads',     label: 'Leads',        icon: Target,    permission: 'leads:read'      },
      { to: '/projects',  label: 'Projects',     icon: Briefcase, permission: 'projects:read'   },
      { to: '/users',     label: 'Team Roles',   icon: UserCog,   permission: 'employees:write' },
    ]},
  { section: 'IT & Finance',
    links: [
      { to: '/expenses',   label: 'IT Expenses',    icon: Wallet,      permission: 'expenses:read'   },
      { to: '/inventory',  label: 'IT Assets',      icon: Boxes,       permission: 'inventory:read'  },
      { to: '/quotations', label: 'Quotations',     icon: FileText,    permission: 'quotations:read' },
      { to: '/bills',      label: 'Bills & Invoice', icon: ReceiptText, permission: 'bills:read'      },
    ]},
  { section: 'Analytics',
    links: [
      { to: '/goals',   label: 'Goals',   icon: Flag,     permission: 'goals:read'     },
      { to: '/reports', label: 'Reports', icon: BarChart3, permission: 'dashboard:full' },
    ]},
]

interface SidebarProps {
  open: boolean
  onClose: () => void
}

export function Sidebar({ open, onClose }: SidebarProps) {
  const user = useAuthStore((s) => s.user)
  const { dark, toggle } = useThemeStore()

  return (
    <>
      {/* Full-screen backdrop — blocks all content behind sidebar */}
      <div
        className={cn(
          'fixed inset-0 z-[90] bg-black/60 lg:hidden transition-opacity duration-300',
          open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none',
        )}
        onClick={onClose}
        style={{ touchAction: 'none' }}
      />

      {/* Sidebar drawer panel */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-[100] flex flex-col bg-white dark:bg-slate-950 shadow-2xl border-r border-slate-200 dark:border-slate-800 transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0 lg:shadow-none lg:z-auto',
          'w-[280px] max-w-[85vw] lg:w-64',
          open ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        {/* Brand header */}
        <div className="flex h-16 items-center justify-between px-4 border-b border-slate-100 dark:border-slate-800 bg-slate-900 dark:bg-slate-950 rounded-tr-2xl lg:rounded-none">
          <div className="flex items-center gap-3">
            <img
              src="/company_logo1.jpeg"
              alt="Logo"
              className="h-9 w-9 rounded-xl object-cover ring-2 ring-white/20"
            />
            <div>
              <p className="text-xs font-black text-white uppercase tracking-wider">ICODED AUTOMATION</p>
              <p className="text-[10px] font-extrabold text-brand-400 uppercase tracking-widest">MANAGEMENT SOFTWARE</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="lg:hidden rounded-xl p-1.5 text-slate-400 hover:bg-white/10 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Nav links */}
        <nav className="flex-1 overflow-y-auto py-3 px-3 space-y-4 no-scrollbar">
          {navItems.map((group) => {
            const visible = group.links.filter((l) => hasPermission(user, l.permission as any))
            if (!visible.length) return null
            return (
              <div key={group.section}>
                <p className="px-2 mb-1 text-[11px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
                  {group.section}
                </p>
                <div className="space-y-0.5">
                  {visible.map(({ to, label, icon: Icon }) => (
                    <NavLink
                      key={to}
                      to={to}
                      onClick={onClose}
                      className={({ isActive }) =>
                        cn(
                          'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all',
                          isActive
                            ? 'bg-brand-600 text-white shadow-md shadow-brand-600/30'
                            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white',
                        )
                      }
                    >
                      {({ isActive }) => (
                        <>
                          <Icon className={`h-5 w-5 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                          <span className="truncate">{label}</span>
                        </>
                      )}
                    </NavLink>
                  ))}
                </div>
              </div>
            )
          })}
        </nav>

        {/* Bottom controls */}
        <div className="border-t border-slate-100 dark:border-slate-800 p-3 space-y-2">
          <div className="flex gap-2">
            <NavLink
              to="/settings"
              onClick={onClose}
              className={({ isActive }) =>
                cn(
                  'flex flex-1 items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium transition-all',
                  isActive
                    ? 'bg-brand-600 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700',
                )
              }
            >
              <Settings className="h-5 w-5" />
              <span>Settings</span>
            </NavLink>
            <button
              onClick={toggle}
              className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            >
              {dark ? <Sun className="h-5 w-5 text-amber-500" /> : <Moon className="h-5 w-5" />}
            </button>
          </div>

          {user && (
            <div className="flex items-center gap-3 rounded-xl bg-slate-50 dark:bg-slate-900 p-3 border border-slate-200 dark:border-slate-800">
              <Avatar name={user.name} size="sm" className="h-9 w-9 text-sm" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">{user.name}</p>
                <p className="text-xs capitalize text-slate-400">{user.role}</p>
              </div>
              <ChevronRight className="h-4 w-4 text-slate-400" />
            </div>
          )}
        </div>
      </aside>
    </>
  )
}
