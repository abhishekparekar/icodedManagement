import { Briefcase, CheckCircle2, Target, Users, ArrowRight, Activity } from 'lucide-react'
import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { Card, CardHeader } from '@/components/ui/Card'
import { StatCard } from '@/components/ui/StatCard'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { useEmployeeScopedProjects } from '@/hooks/useFilteredData'
import { hasPermission } from '@/lib/permissions'
import { useAuthStore } from '@/stores/authStore'
import { useDataStore } from '@/stores/dataStore'
import { formatDate } from '@/lib/utils'

const PIE_COLORS = ['#2563eb', '#f59e0b', '#10b981', '#ef4444']

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white/95 p-2.5 shadow-md backdrop-blur dark:border-slate-800 dark:bg-slate-950/95">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{label}</p>
        <p className="mt-0.5 text-sm font-bold text-brand-600 dark:text-brand-400">{payload[0].value}</p>
      </div>
    )
  }
  return null
}

const CustomPieTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white/95 p-2.5 shadow-md backdrop-blur dark:border-slate-800 dark:bg-slate-950/95">
        <p className="text-[10px] font-bold text-slate-900 dark:text-white capitalize">{payload[0].name}</p>
        <p className="text-sm font-bold text-brand-600 dark:text-brand-400">{payload[0].value}</p>
      </div>
    )
  }
  return null
}

// Compact coloured-dot legend for the pie chart — no label overflow on mobile
const PieLegend = ({ data }: { data: { name: string; value: number }[] }) => (
  <div className="mt-2 flex flex-wrap justify-center gap-x-3 gap-y-1">
    {data.map((entry, i) => (
      <span key={entry.name} className="flex items-center gap-1 text-[10px] font-semibold text-slate-600 dark:text-slate-400 capitalize">
        <span className="inline-block h-2 w-2 shrink-0 rounded-full" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
        {entry.name} ({entry.value})
      </span>
    ))}
  </div>
)

export function DashboardPage() {
  const user = useAuthStore((s) => s.user)
  const employees = useDataStore((s) => s.employees)
  const leads = useDataStore((s) => s.leads)
  const allProjects = useDataStore((s) => s.projects)
  const activityLogs = useDataStore((s) => s.activityLogs)
  const scopedProjects = useEmployeeScopedProjects(user)

  const projects = user?.role === 'employee' ? scopedProjects : allProjects

  const stats = useMemo(() => {
    const activeProjects = projects.filter((p) => p.status === 'ongoing').length
    const completedProjects = projects.filter((p) => p.status === 'completed').length
    return {
      employees: hasPermission(user, 'employees:read') ? employees.length : '—',
      activeProjects,
      totalLeads: hasPermission(user, 'leads:read') ? leads.length : '—',
      completedProjects,
    }
  }, [employees.length, leads.length, projects, user])

  const recentLogs = useMemo(() => activityLogs.slice(0, 4), [activityLogs])

  const ongoingProjects = useMemo(() =>
    projects.filter((p) => p.status === 'ongoing').slice(0, 3),
    [projects]
  )

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

  return (
    <div className="space-y-3 sm:space-y-5">

      {/* ── Stat Cards: 2 cols mobile, 4 cols desktop ── */}
      <div className="grid grid-cols-2 gap-2.5 sm:gap-3 xl:grid-cols-4">
        {hasPermission(user, 'employees:read') && (
          <StatCard title="Employees" value={stats.employees} icon={Users} color="text-blue-600" iconBg="bg-blue-50" />
        )}
        <StatCard title="Active Projects" value={stats.activeProjects} icon={Briefcase} color="text-violet-600" iconBg="bg-violet-50" />
        {hasPermission(user, 'leads:read') && (
          <StatCard title="Total Leads" value={stats.totalLeads} icon={Target} color="text-sky-600" iconBg="bg-sky-50" />
        )}
        <StatCard title="Completed" value={stats.completedProjects} icon={CheckCircle2} color="text-emerald-600" iconBg="bg-emerald-50" />
      </div>

      {/* ── Ongoing Projects + Recent Activity ── */}
      <div className="grid gap-2.5 sm:gap-5 lg:grid-cols-2">

        {/* Ongoing Projects */}
        <Card className="min-w-0 !p-3 sm:!p-5">
          <div className="flex items-center justify-between pb-2.5 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-1.5">
              <Briefcase className="h-4 w-4 text-brand-500" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Ongoing Projects</h3>
            </div>
            <Link to="/projects" className="flex items-center gap-0.5 text-[11px] font-semibold text-brand-600 hover:text-brand-700 dark:text-brand-400">
              View all <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="mt-2.5 space-y-2">
            {ongoingProjects.length === 0 ? (
              <p className="py-4 text-center text-xs text-slate-500">No projects in progress.</p>
            ) : (
              ongoingProjects.map((project) => (
                <Link
                  key={project.id}
                  to={`/projects/${project.id}`}
                  className="block rounded-xl border border-slate-100 bg-slate-50/60 p-2.5 hover:bg-slate-100/60 dark:border-slate-800 dark:bg-slate-950/20 transition"
                >
                  <div className="flex items-center justify-between gap-2 min-w-0">
                    <p className="truncate text-xs font-bold text-slate-900 dark:text-white">{project.name}</p>
                    <span className="shrink-0 text-[10px] text-slate-400">Ends {formatDate(project.endDate)}</span>
                  </div>
                  <div className="mt-1.5">
                    <div className="flex items-center justify-between text-[10px] font-semibold text-slate-400 mb-1">
                      <span>Progress</span>
                      <span className="text-brand-600 font-bold">{project.progress}%</span>
                    </div>
                    <ProgressBar value={project.progress} className="h-1.5" />
                  </div>
                </Link>
              ))
            )}
          </div>
        </Card>

        {/* Recent Activities */}
        <Card className="min-w-0 !p-3 sm:!p-5">
          <div className="flex items-center justify-between pb-2.5 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-1.5">
              <Activity className="h-4 w-4 text-indigo-500" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Recent Activity</h3>
            </div>
            {hasPermission(user, 'activity:read') && (
              <Link to="/activity" className="flex items-center gap-0.5 text-[11px] font-semibold text-brand-600 hover:text-brand-700 dark:text-brand-400">
                View all <ArrowRight className="h-3 w-3" />
              </Link>
            )}
          </div>
          <div className="relative mt-3 pl-5 space-y-3.5 before:absolute before:inset-y-0 before:left-1.5 before:w-px before:bg-slate-200 dark:before:bg-slate-800">
            {recentLogs.length === 0 ? (
              <p className="py-4 text-center text-xs text-slate-500 pl-0">No activity recorded yet.</p>
            ) : (
              recentLogs.map((log) => (
                <div key={log.id} className="relative flex gap-2.5 text-xs">
                  <div className="absolute -left-[19px] mt-0.5 h-2 w-2 rounded-full border-2 border-white bg-indigo-500 dark:border-slate-900 shadow-sm shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-slate-800 dark:text-slate-200 leading-snug line-clamp-2">{log.action}</p>
                    <p className="text-[10px] text-slate-400 font-medium mt-0.5">
                      {log.userName || 'System'} · {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>

      {/* ── Charts ── */}
      <div className="grid gap-2.5 sm:gap-5 lg:grid-cols-2">
        {hasPermission(user, 'leads:read') && leadChart.some((d) => d.value > 0) && (
          <Card className="!p-3 sm:!p-5">
            <CardHeader title="Lead Pipeline" subtitle="By status" />
            <div className="h-44 sm:h-56">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={leadChart}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={65}
                    paddingAngle={3}
                  >
                    {leadChart.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomPieTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            {/* Mobile-safe legend dots instead of overflowing labels */}
            <PieLegend data={leadChart.filter(d => d.value > 0)} />
          </Card>
        )}

        <Card className="!p-3 sm:!p-5">
          <CardHeader title="Projects by Status" />
          <div className="h-44 sm:h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={projectChart} margin={{ top: 8, right: 8, left: -22, bottom: 0 }}>
                <defs>
                  <linearGradient id="projectGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3b82f6" />
                    <stop offset="100%" stopColor="#2563eb" />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} strokeDasharray="3" className="stroke-slate-100 dark:stroke-slate-800" />
                <XAxis dataKey="status" tickLine={false} axisLine={false} tick={{ fill: '#94a3b8', fontSize: 10 }} />
                <YAxis allowDecimals={false} tickLine={false} axisLine={false} tick={{ fill: '#94a3b8', fontSize: 10 }} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(37,99,235,0.04)', radius: 4 }} />
                <Bar dataKey="count" fill="url(#projectGrad)" radius={[5, 5, 0, 0]} maxBarSize={38} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* ── Need Help Banner ── */}
      <div className="rounded-2xl bg-blue-gradient p-4 sm:p-5 text-white shadow-lg shadow-brand-600/20">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <h3 className="text-sm font-bold">Need Help?</h3>
            <p className="mt-0.5 text-xs text-blue-100 line-clamp-2">We're here to support you anytime.</p>
          </div>
          <a
            href="mailto:support@icoded.in"
            className="shrink-0 rounded-xl border border-white/30 bg-white/15 px-3.5 py-2 text-xs font-bold text-white hover:bg-white/25 transition-colors"
          >
            Contact
          </a>
        </div>
      </div>

    </div>
  )
}
