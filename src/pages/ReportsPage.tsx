import { useMemo } from 'react'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  RadialBar,
  RadialBarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { Card, CardHeader } from '@/components/ui/Card'
import { StatCard } from '@/components/ui/StatCard'
import { LEAD_STATUSES } from '@/lib/constants'
import { useDataStore } from '@/stores/dataStore'
import { Briefcase, Target, TrendingUp, Users } from 'lucide-react'

const COLORS = ['#2563eb', '#10b981', '#f59e0b', '#ef4444', '#06b6d4', '#8b5cf6', '#ec4899']

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white/95 p-3 shadow-md backdrop-blur dark:border-slate-800 dark:bg-slate-950/95">
        <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">{label}</p>
        <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-white">
          {payload[0].name}: <span className="font-extrabold text-brand-600 dark:text-brand-400">{payload[0].value}</span>
        </p>
      </div>
    )
  }
  return null
}

const CustomPieTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white/95 p-3 shadow-md backdrop-blur dark:border-slate-800 dark:bg-slate-950/95">
        <p className="text-xs font-bold text-slate-900 dark:text-white capitalize">{payload[0].name}</p>
        <p className="mt-1 text-sm font-semibold text-brand-600 dark:text-brand-400">
          Value: <span className="font-extrabold">{payload[0].value}</span>
        </p>
      </div>
    )
  }
  return null
}

export function ReportsPage() {
  const employees = useDataStore((s) => s.employees)
  const leads = useDataStore((s) => s.leads)
  const projects = useDataStore((s) => s.projects)
  const activityLogs = useDataStore((s) => s.activityLogs)

  // Department distribution
  const deptData = useMemo(() => {
    const counts: Record<string, number> = {}
    employees.forEach((e) => {
      counts[e.department] = (counts[e.department] ?? 0) + 1
    })
    return Object.entries(counts).map(([name, value]) => ({ name, value }))
  }, [employees])

  // Lead status breakdown
  const leadStatusData = useMemo(() => {
    return LEAD_STATUSES.map((s) => ({
      name: s.label,
      value: leads.filter((l) => l.status === s.value).length,
    }))
  }, [leads])

  // Project progress distribution
  const projectProgressData = useMemo(() => {
    const buckets = [
      { name: '0–25%', min: 0, max: 25, count: 0 },
      { name: '26–50%', min: 26, max: 50, count: 0 },
      { name: '51–75%', min: 51, max: 75, count: 0 },
      { name: '76–100%', min: 76, max: 100, count: 0 },
    ]
    projects.forEach((p) => {
      const bucket = buckets.find((b) => p.progress >= b.min && p.progress <= b.max)
      if (bucket) bucket.count++
    })
    return buckets.map(({ name, count }) => ({ name, count }))
  }, [projects])

  // Activity over time (last 7 days)
  const activityTrend = useMemo(() => {
    const days: Record<string, number> = {}
    const now = Date.now()
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now - i * 86400000)
      days[d.toLocaleDateString('en-US', { weekday: 'short' })] = 0
    }
    activityLogs.forEach((log) => {
      const d = new Date(log.timestamp)
      const key = d.toLocaleDateString('en-US', { weekday: 'short' })
      if (key in days) days[key]++
    })
    return Object.entries(days).map(([day, count]) => ({ day, count }))
  }, [activityLogs])

  // Role distribution (radial)
  const roleData = useMemo(() => {
    const counts: Record<string, number> = { admin: 0, manager: 0, employee: 0 }
    employees.forEach((e) => {
      counts[e.role] = (counts[e.role] ?? 0) + 1
    })
    return [
      { name: 'Admin', value: counts.admin, fill: '#6366f1' },
      { name: 'Manager', value: counts.manager, fill: '#22c55e' },
      { name: 'Employee', value: counts.employee, fill: '#f59e0b' },
    ]
  }, [employees])

  const conversionRate = useMemo(() => {
    if (!leads.length) return 0
    return Math.round((leads.filter((l) => l.status === 'converted').length / leads.length) * 100)
  }, [leads])

  const completionRate = useMemo(() => {
    if (!projects.length) return 0
    return Math.round(
      (projects.filter((p) => p.status === 'completed').length / projects.length) * 100,
    )
  }, [projects])

  return (
    <div className="space-y-3 sm:space-y-5">
      {/* KPI row */}
      <div className="grid gap-2.5 sm:gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Total Employees"
          value={employees.length}
          icon={Users}
          color="text-blue-600"
          iconBg="bg-blue-50"
          trend={`Across ${deptData.length} departments`}
        />
        <StatCard
          title="Total Projects"
          value={projects.length}
          icon={Briefcase}
          color="text-violet-600"
          iconBg="bg-violet-50"
          trend={`${completionRate}% completion`}
        />
        <StatCard
          title="Total Leads"
          value={leads.length}
          icon={Target}
          color="text-sky-600"
          iconBg="bg-sky-50"
          trend={`${conversionRate}% conversion`}
        />
        <StatCard
          title="Activity (7d)"
          value={activityLogs.length}
          icon={TrendingUp}
          color="text-emerald-600"
          iconBg="bg-emerald-50"
          trend="Recent actions"
        />
      </div>

      {/* Charts row 1 */}
      <div className="grid gap-3 sm:gap-5 lg:grid-cols-2">
        <Card className="!p-3 sm:!p-5">
          <CardHeader title="Employees by department" subtitle="Headcount distribution" />
          <div className="h-56 sm:h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={deptData} layout="vertical" margin={{ top: 5, right: 15, left: -22, bottom: 5 }}>
                <CartesianGrid
                  strokeDasharray="3"
                  horizontal={false}
                  className="stroke-slate-100 dark:stroke-slate-800"
                />
                <XAxis type="number" allowDecimals={false} axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10 }} />
                <YAxis type="category" dataKey="name" width={80} axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10 }} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(37, 99, 235, 0.02)', radius: 4 }} />
                <Bar dataKey="value" name="Employees" radius={[0, 4, 4, 0]} maxBarSize={24}>
                  {deptData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="!p-3 sm:!p-5">
          <CardHeader title="Lead pipeline" subtitle="Status breakdown" />
          <div className="h-44 sm:h-56">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={leadStatusData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={65}
                  innerRadius={45}
                  paddingAngle={3}
                >
                  {leadStatusData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomPieTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          {/* Custom mobile legend */}
          <div className="mt-2 flex flex-wrap justify-center gap-x-3 gap-y-1">
            {leadStatusData.filter(d => d.value > 0).map((entry, i) => (
              <span key={entry.name} className="flex items-center gap-1 text-[10px] font-semibold text-slate-600 dark:text-slate-400 capitalize">
                <span className="inline-block h-2 w-2 shrink-0 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                {entry.name} ({entry.value})
              </span>
            ))}
          </div>
        </Card>
      </div>

      {/* Charts row 2 */}
      <div className="grid gap-3 sm:gap-5 lg:grid-cols-2">
        <Card className="!p-3 sm:!p-5">
          <CardHeader title="Activity trend" subtitle="Actions in the last 7 days" />
          <div className="h-56 sm:h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={activityTrend} margin={{ top: 10, right: 10, left: -22, bottom: 0 }}>
                <defs>
                  <linearGradient id="actGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0.01} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  vertical={false}
                  strokeDasharray="3"
                  className="stroke-slate-100 dark:stroke-slate-800"
                />
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10 }} />
                <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10 }} />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="count"
                  name="Actions"
                  stroke="#2563eb"
                  fill="url(#actGrad)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="!p-3 sm:!p-5">
          <CardHeader title="Project progress buckets" subtitle="How far along are projects" />
          <div className="h-56 sm:h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={projectProgressData} margin={{ top: 10, right: 10, left: -22, bottom: 0 }}>
                <defs>
                  <linearGradient id="progressBucketGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3b82f6" />
                    <stop offset="100%" stopColor="#2563eb" />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  vertical={false}
                  strokeDasharray="3"
                  className="stroke-slate-100 dark:stroke-slate-800"
                />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10 }} />
                <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10 }} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(37, 99, 235, 0.03)', radius: 4 }} />
                <Bar dataKey="count" name="Projects" fill="url(#progressBucketGrad)" radius={[5, 5, 0, 0]} maxBarSize={38}>
                  {projectProgressData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Role distribution */}
      {employees.length > 0 && (
        <Card>
          <CardHeader title="Team role distribution" subtitle="Breakdown by role" />
          <div className="flex flex-wrap items-center gap-8">
            <div className="h-48 w-48">
              <ResponsiveContainer width="100%" height="100%">
                <RadialBarChart
                  cx="50%"
                  cy="50%"
                  innerRadius="30%"
                  outerRadius="90%"
                  data={roleData}
                  startAngle={90}
                  endAngle={-270}
                >
                  <RadialBar dataKey="value" background={{ fill: 'rgba(100,116,139,0.05)' }} />
                  <Tooltip content={<CustomPieTooltip />} />
                </RadialBarChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-3">
              {roleData.map((r) => (
                <div key={r.name} className="flex items-center gap-3">
                  <div className="h-3 w-3 rounded-full" style={{ background: r.fill }} />
                  <span className="text-sm text-slate-600 dark:text-slate-400 capitalize">{r.name}</span>
                  <span className="font-semibold text-slate-900 dark:text-white">{r.value}</span>
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}
