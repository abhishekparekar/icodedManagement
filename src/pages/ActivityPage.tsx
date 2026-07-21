import {
  Activity,
  Boxes,
  Briefcase,
  CheckSquare,
  Clock,
  FileText,
  Filter,
  ReceiptText,
  Search,
  Shield,
  Target,
  User,
  Users,
  Wallet,
  X,
  Zap,
} from 'lucide-react'
import { useMemo, useState } from 'react'
import { Avatar } from '@/components/ui/Avatar'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { Pagination } from '@/components/ui/Pagination'
import { StatCard } from '@/components/ui/StatCard'
import { PAGE_SIZE } from '@/lib/constants'
import { formatDate, paginate, totalPages } from '@/lib/utils'
import { useDataStore } from '@/stores/dataStore'
import type { ActivityLog } from '@/types'

const ENTITY_ICONS: Record<string, React.ElementType> = {
  employee: Users,
  lead: Target,
  project: Briefcase,
  task: CheckSquare,
  expense: Wallet,
  inventory: Boxes,
  quotation: FileText,
  bill: ReceiptText,
  user: User,
}

const ENTITY_COLORS: Record<string, string> = {
  employee: 'from-blue-500 to-cyan-500 text-white',
  lead: 'from-amber-500 to-orange-500 text-white',
  project: 'from-indigo-500 to-violet-600 text-white',
  task: 'from-emerald-500 to-teal-600 text-white',
  expense: 'from-rose-500 to-pink-500 text-white',
  inventory: 'from-sky-500 to-blue-600 text-white',
  quotation: 'from-purple-500 to-fuchsia-600 text-white',
  bill: 'from-violet-600 to-indigo-700 text-white',
  user: 'from-slate-600 to-slate-800 text-white',
}

const ENTITY_BADGES: Record<string, string> = {
  employee: 'bg-blue-100 text-blue-700 dark:bg-blue-950/80 dark:text-blue-300 border-blue-200 dark:border-blue-900/40',
  lead: 'bg-amber-100 text-amber-700 dark:bg-amber-950/80 dark:text-amber-300 border-amber-200 dark:border-amber-900/40',
  project: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950/80 dark:text-indigo-300 border-indigo-200 dark:border-indigo-900/40',
  task: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900/40',
  expense: 'bg-rose-100 text-rose-700 dark:bg-rose-950/80 dark:text-rose-300 border-rose-200 dark:border-rose-900/40',
  inventory: 'bg-sky-100 text-sky-700 dark:bg-sky-950/80 dark:text-sky-300 border-sky-200 dark:border-sky-900/40',
  quotation: 'bg-purple-100 text-purple-700 dark:bg-purple-950/80 dark:text-purple-300 border-purple-200 dark:border-purple-900/40',
  bill: 'bg-fuchsia-100 text-fuchsia-700 dark:bg-fuchsia-950/80 dark:text-fuchsia-300 border-fuchsia-200 dark:border-fuchsia-900/40',
  user: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700',
}

const FILTER_TYPES = [
  { id: '', label: 'All Logs' },
  { id: 'project', label: 'Projects' },
  { id: 'lead', label: 'Leads' },
  { id: 'employee', label: 'Employees' },
  { id: 'expense', label: 'Expenses' },
  { id: 'inventory', label: 'Assets' },
  { id: 'quotation', label: 'Quotations' },
  { id: 'task', label: 'Tasks' },
]

export function ActivityPage() {
  const logs = useDataStore((s) => s.activityLogs)
  const [search, setSearch] = useState('')
  const [entityFilter, setEntityFilter] = useState('')
  const [page, setPage] = useState(1)

  // Filter & Search Logic
  const filtered = useMemo(() => {
    return logs.filter((log) => {
      const matchesType = !entityFilter || log.entityType === entityFilter
      const query = search.toLowerCase().trim()
      const matchesSearch =
        !query ||
        log.action.toLowerCase().includes(query) ||
        (log.userName && log.userName.toLowerCase().includes(query)) ||
        (log.entityType && log.entityType.toLowerCase().includes(query))

      return matchesType && matchesSearch
    })
  }, [logs, entityFilter, search])

  const paged = paginate(filtered, page, PAGE_SIZE)
  const pages = totalPages(filtered.length, PAGE_SIZE)

  // KPI Metrics
  const stats = useMemo(() => {
    const todayStr = new Date().toDateString()
    const todayCount = logs.filter((l) => new Date(l.timestamp).toDateString() === todayStr).length
    const userActions = logs.filter((l) => l.userName && l.userName !== 'System').length
    const systemActions = logs.length - userActions

    return {
      total: logs.length,
      today: todayCount,
      userActions,
      systemActions,
    }
  }, [logs])

  const getLogMeta = (log: ActivityLog) => {
    const type = log.entityType ?? 'user'
    const Icon = ENTITY_ICONS[type] ?? Activity
    const gradient = ENTITY_COLORS[type] ?? 'from-brand-500 to-violet-600 text-white'
    const badge = ENTITY_BADGES[type] ?? 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
    return { Icon, gradient, badge }
  }

  return (
    <div className="space-y-4 sm:space-y-5">

      {/* ── KPI Metrics Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-5">
        <StatCard
          title="Total Activity"
          value={stats.total}
          icon={Activity}
          gradient="from-brand-500 to-violet-600"
          onClick={() => { setEntityFilter(''); setSearch(''); setPage(1) }}
          delay="delay-75"
        />
        <StatCard
          title="Actions Today"
          value={stats.today}
          icon={Zap}
          gradient="from-blue-500 to-cyan-500"
          delay="delay-150"
        />
        <StatCard
          title="Team Actions"
          value={stats.userActions}
          icon={Users}
          gradient="from-emerald-500 to-teal-600"
          delay="delay-225"
        />
        <StatCard
          title="System Logs"
          value={stats.systemActions}
          icon={Shield}
          gradient="from-amber-500 to-orange-500"
          delay="delay-300"
        />
      </div>

      {/* ── Integrated Search & Module Filter Bar ── */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3 sm:p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
        
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            placeholder="Search actions, team members, module..."
            className="h-9 w-full rounded-xl border border-slate-200/90 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 pl-9 pr-8 text-xs font-semibold text-slate-700 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-2.5 top-2.5 rounded-md p-0.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Filter Pills Bar */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 no-scrollbar">
          <span className="text-xs font-extrabold text-slate-400 shrink-0 mr-1 flex items-center gap-1">
            <Filter className="h-3.5 w-3.5" /> Filter:
          </span>
          {FILTER_TYPES.map((tab) => {
            const isActive = entityFilter === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => { setEntityFilter(tab.id); setPage(1) }}
                className={`shrink-0 rounded-xl px-3 py-1.5 text-xs font-bold transition-all active:scale-95 ${
                  isActive
                    ? 'bg-gradient-to-r from-brand-600 to-violet-600 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {tab.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* ── Activity Stream List Card ── */}
      <Card className="!p-0 overflow-hidden">
        
        {/* Stream Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-2">
            <Activity className="h-4.5 w-4.5 text-brand-600 dark:text-brand-400" />
            <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">Workspace Audit Logs</h3>
          </div>
          <span className="text-xs font-semibold text-slate-400">
            {filtered.length} total events
          </span>
        </div>

        {/* Activity Stream Items */}
        {filtered.length === 0 ? (
          <div className="p-6">
            <EmptyState
              icon={Activity}
              title="No activities found"
              description={search || entityFilter ? 'Try clearing your search query or filter selection.' : 'Events will record here automatically as your team works.'}
            />
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
            {paged.map((log) => {
              const { Icon, gradient, badge } = getLogMeta(log)
              const logTime = new Date(log.timestamp)
              const formattedTime = logTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

              return (
                <div
                  key={log.id}
                  className="flex items-center justify-between gap-3 sm:gap-4 px-4 sm:px-6 py-3 sm:py-3.5 hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                >
                  {/* Icon Node + Main Details */}
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${gradient} shadow-xs`}
                    >
                      <Icon className="h-4.5 w-4.5 text-white" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs sm:text-sm font-bold text-slate-900 dark:text-white leading-snug">
                        {log.action}
                      </p>

                      <div className="mt-1 flex items-center gap-2 text-[11px] sm:text-xs text-slate-400 font-semibold truncate">
                        <Avatar name={log.userName || 'System'} size="sm" className="h-4.5 w-4.5 text-[9px] shrink-0" />
                        <span className="truncate text-slate-600 dark:text-slate-300">
                          {log.userName || 'System Auto Log'}
                        </span>
                        <span>·</span>
                        <span className="flex items-center gap-1 shrink-0">
                          <Clock className="h-3 w-3" />
                          {formatDate(log.timestamp)} at {formattedTime}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right Entity Badge */}
                  {log.entityType && (
                    <span className={`shrink-0 rounded-lg border px-2.5 py-1 text-[10px] font-black uppercase tracking-wider ${badge}`}>
                      {log.entityType}
                    </span>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* Pagination Footer */}
        {pages > 1 && (
          <div className="px-4 sm:px-6 py-3 border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/30 dark:bg-slate-900/30">
            <Pagination page={page} totalPages={pages} onPageChange={setPage} />
          </div>
        )}
      </Card>

    </div>
  )
}
