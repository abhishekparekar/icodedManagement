import { useState } from 'react'
import { Outlet, useLocation, NavLink } from 'react-router-dom'
import { LayoutDashboard, Briefcase, Target, FileText, Menu } from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { hasPermission } from '@/lib/permissions'
import { Header } from './Header'
import { Sidebar } from './Sidebar'

const titles: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/employees': 'Employees',
  '/leads': 'Leads',
  '/projects': 'Projects',
  '/reports': 'Reports',
  '/goals': 'Goals & Milestones',
  '/quotations': 'Quotations',
  '/bills': 'Bills & Invoices',
  '/activity': 'Activity Logs',
  '/users': 'Team',
  '/settings': 'Settings',
}

const bottomNavItems = [
  { to: '/dashboard', label: 'Home', icon: LayoutDashboard, permission: 'dashboard:read' as const },
  { to: '/projects', label: 'Projects', icon: Briefcase, permission: 'projects:read' as const },
  { to: '/leads', label: 'Leads', icon: Target, permission: 'leads:read' as const },
  { to: '/quotations', label: 'Quotes', icon: FileText, permission: 'quotations:read' as const },
]

export function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const user = useAuthStore((s) => s.user)
  const location = useLocation()
  const basePath = '/' + location.pathname.split('/')[1]
  const title = titles[basePath] ?? 'OfficeFlow'

  const activeTabs = bottomNavItems.filter((item) => hasPermission(user, item.permission))

  return (
    <div className="flex h-screen w-full overflow-hidden bg-slate-50 dark:bg-slate-950">
      {/* Sidebar: fixed left column */}
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Right column: sticky header + scrollable content area only */}
      <div className="flex flex-1 flex-col min-w-0 overflow-hidden">
        <Header title={title} onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 overflow-y-auto p-4 pb-20 sm:p-5 lg:p-6 lg:pb-6 min-w-0 animate-fade-in">
          <Outlet />
        </main>
      </div>

      {/* Android-style Bottom Navigation Bar for Mobile */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-slate-100 bg-white/98 pb-safe backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/98 lg:hidden shadow-[0_-2px_16px_rgba(0,0,0,0.06)]">
        <div className="flex h-14 items-center justify-around px-2">
          {activeTabs.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center flex-1 py-1 px-2 text-center transition-colors ${
                  isActive
                    ? 'text-brand-600 dark:text-brand-400'
                    : 'text-slate-400 hover:text-slate-700 dark:text-slate-500'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <div className={`flex h-7 w-7 items-center justify-center rounded-xl transition-colors ${isActive ? 'bg-brand-50' : ''}`}>
                    <item.icon className="h-4.5 w-4.5 shrink-0" />
                  </div>
                  <span className={`mt-0.5 text-[10px] font-semibold tracking-tight ${isActive ? 'text-brand-600' : ''}`}>{item.label}</span>
                </>
              )}
            </NavLink>
          ))}
          {/* "More" menu button to open side drawer */}
          <button
            onClick={() => setSidebarOpen(true)}
            className="flex flex-col items-center justify-center flex-1 py-1 px-2 text-slate-400 hover:text-slate-700 dark:text-slate-500 focus:outline-none"
          >
            <div className="flex h-7 w-7 items-center justify-center rounded-xl">
              <Menu className="h-4.5 w-4.5 shrink-0" />
            </div>
            <span className="mt-0.5 text-[10px] font-semibold tracking-tight">More</span>
          </button>
        </div>
      </nav>
    </div>
  )
}
