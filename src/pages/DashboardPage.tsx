import {
  Activity,
  ArrowRight,
  BarChart3,
  Boxes,
  Briefcase,
  CheckCircle2,
  FileText,
  ReceiptText,
  Settings,
  Target,
  TrendingUp,
  Users,
  Wallet,
} from 'lucide-react'
import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  Bar, BarChart, CartesianGrid, Cell, Pie, PieChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts'
import { Card, CardHeader } from '@/components/ui/Card'
import { StatCard } from '@/components/ui/StatCard'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { useEmployeeScopedProjects } from '@/hooks/useFilteredData'
import { hasPermission } from '@/lib/permissions'
import { useAuthStore } from '@/stores/authStore'
import { useDataStore } from '@/stores/dataStore'
import { formatDate } from '@/lib/utils'

const PIE_COLORS = ['#6366f1', '#f59e0b', '#10b981', '#ef4444']

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-xl border border-slate-200/80 bg-white/95 backdrop-blur px-3 py-2 shadow-xl dark:border-slate-800 dark:bg-slate-900/95">
        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">{label}</p>
        <p className="text-sm font-black text-brand-600 dark:text-brand-400">{payload[0].value}</p>
      </div>
    )
  }
  return null
}

const CustomPieTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-xl border border-slate-200/80 bg-white/95 backdrop-blur px-3 py-2 shadow-xl dark:border-slate-800 dark:bg-slate-900/95">
        <p className="text-xs font-semibold capitalize text-slate-700 dark:text-white">{payload[0].name}</p>
        <p className="text-sm font-black text-brand-600 dark:text-brand-400">{payload[0].value}</p>
      </div>
    )
  }
  return null
}

const quickShortcuts = [
  { to: '/employees', label: 'Employees', icon: Users, color: 'from-blue-500 to-cyan-500', permission: 'employees:read' as const },
  { to: '/leads', label: 'Leads', icon: Target, color: 'from-amber-500 to-orange-500', permission: 'leads:read' as const },
  { to: '/projects', label: 'Projects', icon: Briefcase, color: 'from-indigo-500 to-violet-600', permission: 'projects:read' as const },
  { to: '/expenses', label: 'Expenses', icon: Wallet, color: 'from-emerald-500 to-teal-600', permission: 'expenses:read' as const },
  { to: '/inventory', label: 'Assets', icon: Boxes, color: 'from-sky-500 to-blue-600', permission: 'inventory:read' as const },
  { to: '/quotations', label: 'Quotations', icon: FileText, color: 'from-purple-500 to-pink-500', permission: 'quotations:read' as const },
  { to: '/bills', label: 'Bills', icon: ReceiptText, color: 'from-rose-500 to-red-600', permission: 'bills:read' as const },
  { to: '/reports', label: 'Reports', icon: BarChart3, color: 'from-violet-600 to-indigo-700', permission: 'dashboard:full' as const },
  { to: '/activity', label: 'Logs', icon: Activity, color: 'from-slate-600 to-slate-800', permission: 'activity:read' as const },
  { to: '/settings', label: 'Settings', icon: Settings, color: 'from-brand-600 to-violet-600' },
]

export function DashboardPage() {
  const user = useAuthStore((s) => s.user)
  const employees = useDataStore((s) => s.employees)
  const leads = useDataStore((s) => s.leads)
  const allProjects = useDataStore((s) => s.projects)
  const activityLogs = useDataStore((s) => s.activityLogs)
  const scopedProjects = useEmployeeScopedProjects(user)

  const projects = user?.role === 'employee' ? scopedProjects : allProjects

  const stats = useMemo(() => ({
    employees: hasPermission(user, 'employees:read') ? employees.length : '—',
    activeProjects: projects.filter((p) => p.status === 'ongoing').length,
    totalLeads: hasPermission(user, 'leads:read') ? leads.length : '—',
    completedProjects: projects.filter((p) => p.status === 'completed').length,
  }), [employees.length, leads.length, projects, user])

  const recentLogs = useMemo(() => activityLogs.slice(0, 4), [activityLogs])
  const ongoingProjects = useMemo(() => projects.filter((p) => p.status === 'ongoing').slice(0, 3), [projects])

  const leadChart = useMemo(() => {
    const counts: Record<string, number> = { new: 0, in_progress: 0, converted: 0, lost: 0 }
    leads.forEach((l) => { counts[l.status] = (counts[l.status] ?? 0) + 1 })
    return Object.entries(counts).map(([name, value]) => ({ name: name.replace('_', ' '), value }))
  }, [leads])

  const projectChart = useMemo(() => {
    const counts: Record<string, number> = { pending: 0, ongoing: 0, completed: 0 }
    projects.forEach((p) => { counts[p.status] = (counts[p.status] ?? 0) + 1 })
    return Object.entries(counts).map(([status, count]) => ({ status, count }))
  }, [projects])

  const visibleShortcuts = useMemo(() => {
    return quickShortcuts.filter((s) => !s.permission || hasPermission(user, s.permission))
  }, [user])

  return (
    <div className="space-y-5 sm:space-y-6">
      {/* ── User-Friendly Page Shortcut Buttons ── */}
      <div className="animate-fade-up delay-75">
        {/* Shortcuts Grid (10 columns on desktop, 5 columns on mobile) */}
        <div className="grid grid-cols-5 sm:grid-cols-5 lg:grid-cols-10 gap-2 sm:gap-3">
          {visibleShortcuts.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="group flex flex-col items-center justify-center rounded-2xl border border-slate-200/80 bg-white/90 p-2.5 sm:p-3 text-center shadow-xs backdrop-blur-xl transition-all duration-200 hover:-translate-y-1 hover:border-brand-300 hover:shadow-md dark:border-slate-800/80 dark:bg-slate-900/90 dark:hover:border-brand-800 active:scale-95"
            >
              <div className={`flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-xl bg-gradient-to-br ${item.color} text-white shadow-xs transition-transform duration-200 group-hover:scale-110`}>
                <item.icon className="h-5 w-5 stroke-[2.2]" />
              </div>
              <span className="mt-2 truncate text-[11px] font-bold text-slate-700 dark:text-slate-200 group-hover:text-brand-600 dark:group-hover:text-brand-400 leading-tight">
                {item.label}
              </span>
            </Link>
          ))}
        </div>
      </div>

      {/* ── Stat Cards Grid (2 cols on Mobile, 4 cols on PC/Desktop) ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-5">
        {hasPermission(user, 'employees:read') && (
          <StatCard
            title="Employees"
            value={stats.employees}
            icon={Users}
            to="/employees"
            gradient="from-blue-500 to-cyan-500"
            delay="delay-75"
          />
        )}
        <StatCard
          title="Active Projects"
          value={stats.activeProjects}
          icon={Briefcase}
          to="/projects"
          gradient="from-indigo-500 to-violet-600"
          delay="delay-150"
        />
        {hasPermission(user, 'leads:read') && (
          <StatCard
            title="Leads Pipeline"
            value={stats.totalLeads}
            icon={Target}
            to="/leads"
            gradient="from-amber-500 to-orange-500"
            delay="delay-225"
          />
        )}
        <StatCard
          title="Completed"
          value={stats.completedProjects}
          icon={CheckCircle2}
          to="/projects"
          gradient="from-emerald-500 to-teal-600"
          delay="delay-300"
        />
      </div>

      {/* ── Middle Row: Ongoing Projects & Recent Activity (Side-by-side on PC) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">

        {/* Ongoing Projects Card */}
        <Card className="!p-0 overflow-hidden flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200/60 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-900/50">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-400">
                  <Briefcase className="h-4.5 w-4.5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">Ongoing Projects</h3>
                  <p className="text-[11px] text-slate-400">Active team assignments</p>
                </div>
              </div>
              <Link to="/projects" className="flex items-center gap-1 text-xs font-extrabold text-brand-600 dark:text-brand-400 hover:underline">
                View all <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {ongoingProjects.length === 0 ? (
                <p className="py-8 text-center text-sm text-slate-400">No ongoing projects currently.</p>
              ) : ongoingProjects.map((project) => (
                <Link
                  key={project.id}
                  to={`/projects/${project.id}`}
                  className="flex flex-col gap-2 px-5 py-3.5 hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-sm font-bold text-slate-900 dark:text-white">{project.name}</p>
                    <span className="shrink-0 rounded-lg bg-brand-100 dark:bg-brand-950/80 px-2.5 py-0.5 text-xs font-black text-brand-700 dark:text-brand-300">
                      {project.progress}%
                    </span>
                  </div>
                  <ProgressBar value={project.progress} className="h-2" />
                  <p className="text-[11px] font-semibold text-slate-400">Due {formatDate(project.endDate)}</p>
                </Link>
              ))}
            </div>
          </div>
        </Card>

        {/* Recent Activity Card */}
        <Card className="!p-0 overflow-hidden flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200/60 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-900/50">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-violet-50 dark:bg-violet-950/60 text-violet-600 dark:text-violet-400">
                  <Activity className="h-4.5 w-4.5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">Recent Activity</h3>
                  <p className="text-[11px] text-slate-400">Live audit log stream</p>
                </div>
              </div>
              {hasPermission(user, 'activity:read') && (
                <Link to="/activity" className="flex items-center gap-1 text-xs font-extrabold text-brand-600 dark:text-brand-400 hover:underline">
                  View all <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              )}
            </div>

            <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {recentLogs.length === 0 ? (
                <p className="py-8 text-center text-sm text-slate-400">No activity recorded yet.</p>
              ) : recentLogs.map((log) => (
                <div key={log.id} className="flex items-start gap-3.5 px-5 py-3.5">
                  <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 text-brand-600 dark:text-brand-400 shadow-xs">
                    <TrendingUp className="h-3.5 w-3.5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 line-clamp-1">{log.action}</p>
                    <p className="text-[11px] font-semibold text-slate-400 mt-0.5">
                      {log.userName || 'System'} · {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>

      </div>

      {/* ── Bottom Row: Analytics Charts (Side-by-side on PC) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">

        {/* Lead Pipeline Chart */}
        {hasPermission(user, 'leads:read') && leadChart.some((d) => d.value > 0) && (
          <Card className="!p-5">
            <CardHeader title="Lead Pipeline" subtitle="Breakdown by current sales stage" />
            <div style={{ height: 210 }}>
              <ResponsiveContainer width="100%" height={210} minHeight={120}>
                <PieChart>
                  <Pie
                    data={leadChart}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={78}
                    paddingAngle={4}
                    strokeWidth={0}
                  >
                    {leadChart.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                  </Pie>
                  <Tooltip content={<CustomPieTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-3 flex flex-wrap justify-center gap-x-5 gap-y-2 border-t border-slate-100 dark:border-slate-800 pt-3">
              {leadChart.filter((d) => d.value > 0).map((entry, i) => (
                <span key={entry.name} className="flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-300 capitalize">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                  {entry.name} ({entry.value})
                </span>
              ))}
            </div>
          </Card>
        )}

        {/* Projects Status Bar Chart */}
        <Card className="!p-5">
          <CardHeader title="Projects Status Distribution" subtitle="Overview of project lifecycle states" />
          <div style={{ height: 210 }}>
            <ResponsiveContainer width="100%" height={210} minHeight={120}>
              <BarChart data={projectChart} margin={{ top: 12, right: 8, left: -16, bottom: 0 }}>
                <defs>
                  <linearGradient id="barGradientColor" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#6366f1" />
                    <stop offset="100%" stopColor="#4f46e5" />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.15)" />
                <XAxis dataKey="status" tickLine={false} axisLine={false} tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 700 }} />
                <YAxis allowDecimals={false} tickLine={false} axisLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} width={24} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(99, 102, 241, 0.06)', radius: 8 }} />
                <Bar dataKey="count" fill="url(#barGradientColor)" radius={[8, 8, 0, 0]} maxBarSize={52} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

      </div>

      {/* ── Support Banner ── */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-5 sm:p-6 text-white border border-slate-800 shadow-lg">
        <div className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full bg-brand-500/20 blur-xl" />
        <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-extrabold text-white">OfficeFlow Workspace Support</h3>
            <p className="mt-0.5 text-xs sm:text-sm text-slate-400">Need help customizing roles, modules, or team settings?</p>
          </div>
          <a
            href="mailto:support@icoded.in"
            className="shrink-0 rounded-2xl bg-brand-600 px-4 py-2.5 text-xs font-bold text-white shadow-md hover:bg-brand-500 transition-all active:scale-95"
          >
            Get Help & Contact
          </a>
        </div>
      </div>

    </div>
  )
}
