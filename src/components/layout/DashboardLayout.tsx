import { useState } from 'react'
import { Outlet, useLocation, NavLink } from 'react-router-dom'
import { LayoutDashboard, Briefcase, Wallet, Boxes, AlignJustify } from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { hasPermission } from '@/lib/permissions'
import { Header } from './Header'
import { Sidebar } from './Sidebar'

const titles: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/employees': 'Employees',
  '/leads':     'Leads Pipeline',
  '/projects':  'Projects',
  '/expenses':  'IT Expenses',
  '/inventory': 'IT Assets',
  '/reports':   'Reports',
  '/goals':     'Goals',
  '/quotations':'Quotations',
  '/bills':     'Bills & Invoices',
  '/activity':  'Activity Logs',
  '/users':     'Team Roles',
  '/settings':  'Settings',
}

const bottomNavItems = [
  { to: '/dashboard', label: 'Home',     icon: LayoutDashboard, permission: 'dashboard:read' as const },
  { to: '/projects',  label: 'Projects', icon: Briefcase,        permission: 'projects:read'  as const },
  { to: '/expenses',  label: 'Expenses', icon: Wallet,           permission: 'expenses:read'  as const },
  { to: '/inventory', label: 'Assets',   icon: Boxes,            permission: 'inventory:read' as const },
]

export function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const user     = useAuthStore((s) => s.user)
  const location = useLocation()
  const basePath = '/' + location.pathname.split('/')[1]
  const title    = titles[basePath] ?? 'OfficeFlow'

  const activeTabs = bottomNavItems.filter((item) => hasPermission(user, item.permission))

  return (
    <div className="flex h-[100dvh] w-full overflow-hidden bg-slate-50 dark:bg-slate-950 transition-colors">

      {/* Desktop & Mobile Drawer Sidebar */}
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col min-w-0 overflow-hidden">
        <Header title={title} onMenuClick={() => setSidebarOpen(true)} />

        <main
          className="flex-1 overflow-y-auto overflow-x-hidden p-4 sm:p-6 lg:p-8 pb-24 lg:pb-8"
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
          <div className="mx-auto max-w-7xl">
            <Outlet />
          </div>
        </main>
      </div>

      {/* ── Mobile Floating Glass Bottom Dock (Visible only on mobile lg:hidden) ── */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 lg:hidden p-3 pb-safe bg-gradient-to-t from-slate-100/80 via-slate-100/40 to-transparent dark:from-slate-950/90 dark:via-slate-950/50 dark:to-transparent pointer-events-none">
        <div
          className="pointer-events-auto mx-auto max-w-md rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white/90 dark:bg-slate-900/90 backdrop-blur-2xl shadow-2xl p-1.5"
        >
          <div className="flex items-center justify-around">
            {activeTabs.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `relative flex flex-1 flex-col items-center justify-center py-2 px-1 rounded-xl transition-all duration-200 ${
                    isActive
                      ? 'text-brand-600 dark:text-brand-400 font-extrabold'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <div className={`flex h-9 w-9 items-center justify-center rounded-xl transition-all duration-300 ${
                      isActive
                        ? 'bg-gradient-to-tr from-brand-600 to-violet-600 text-white shadow-glow-brand scale-105'
                        : 'bg-transparent'
                    }`}>
                      <item.icon className={`h-5 w-5 ${isActive ? 'text-white stroke-[2.5]' : 'stroke-2'}`} />
                    </div>
                    <span className={`text-[10px] mt-1 font-bold leading-none tracking-tight ${isActive ? 'text-brand-600 dark:text-brand-400' : ''}`}>
                      {item.label}
                    </span>
                  </>
                )}
              </NavLink>
            ))}

            {/* Menu More Trigger */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="flex flex-1 flex-col items-center justify-center py-2 px-1 rounded-xl text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800/80">
                <AlignJustify className="h-5 w-5 stroke-2" />
              </div>
              <span className="text-[10px] mt-1 font-bold leading-none tracking-tight">More</span>
            </button>
          </div>
        </div>
      </nav>

    </div>
  )
}
