import {
  Activity,
  Briefcase,
  CheckSquare,
  Target,
  Users,
} from 'lucide-react'
import { useMemo, useState } from 'react'
import { Badge } from '@/components/ui/Badge'
import { Card, CardHeader } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { Pagination } from '@/components/ui/Pagination'
import { PAGE_SIZE } from '@/lib/constants'
import { formatDate, paginate, totalPages } from '@/lib/utils'
import { useDataStore } from '@/stores/dataStore'
import type { ActivityLog } from '@/types'

const ENTITY_ICONS: Record<string, React.ElementType> = {
  employee: Users,
  lead: Target,
  project: Briefcase,
  task: CheckSquare,
}

const ENTITY_COLORS: Record<string, string> = {
  employee: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400',
  lead: 'bg-sky-50 text-sky-600 dark:bg-sky-900/30 dark:text-sky-400',
  project: 'bg-violet-50 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400',
  task: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400',
}

const ENTITY_BADGE: Record<string, string> = {
  employee: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300',
  lead: 'bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300',
  project: 'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300',
  task: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
}

const ENTITY_TYPES = ['employee', 'lead', 'project', 'task']

export function ActivityPage() {
  const logs = useDataStore((s) => s.activityLogs)
  const [entityFilter, setEntityFilter] = useState('')
  const [page, setPage] = useState(1)

  const filtered = useMemo(() => {
    if (!entityFilter) return logs
    return logs.filter((l) => l.entityType === entityFilter)
  }, [logs, entityFilter])

  const paged = paginate(filtered, page, PAGE_SIZE)
  const pages = totalPages(filtered.length, PAGE_SIZE)

  const getIcon = (log: ActivityLog) => {
    const type = log.entityType ?? ''
    const Icon = ENTITY_ICONS[type] ?? Activity
    const color = ENTITY_COLORS[type] ?? 'bg-brand-50 text-brand-600 dark:bg-brand-900/30 dark:text-brand-400'
    return { Icon, color }
  }

  return (
    <Card>
      <CardHeader
        title="Activity logs"
        subtitle={`${filtered.length} recent actions in your workspace`}
        action={
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => { setEntityFilter(''); setPage(1) }}
              className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                !entityFilter
                  ? 'bg-brand-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'
              }`}
            >
              All
            </button>
            {ENTITY_TYPES.map((type) => (
              <button
                key={type}
                onClick={() => { setEntityFilter(type); setPage(1) }}
                className={`rounded-full px-3 py-1 text-xs font-medium capitalize transition ${
                  entityFilter === type
                    ? 'bg-brand-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        }
      />

      {filtered.length === 0 ? (
        <EmptyState
          icon={Activity}
          title="No activity yet"
          description="Actions will appear here as your team works"
        />
      ) : (
        <>
          <ul className="divide-y divide-slate-100 dark:divide-slate-800">
            {paged.map((log) => {
              const { Icon, color } = getIcon(log)
              return (
                <li key={log.id} className="flex gap-4 py-4">
                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${color}`}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-slate-900 dark:text-white">{log.action}</p>
                    <div className="mt-1 flex flex-wrap items-center gap-2">
                      <span className="text-xs text-slate-500">
                        {log.userName || log.userId} · {formatDate(log.timestamp)}
                      </span>
                      {log.entityType && (
                        <Badge
                          className={
                            ENTITY_BADGE[log.entityType] ??
                            'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
                          }
                        >
                          {log.entityType}
                        </Badge>
                      )}
                    </div>
                  </div>
                </li>
              )
            })}
          </ul>
          <Pagination page={page} totalPages={pages} onPageChange={setPage} />
        </>
      )}
    </Card>
  )
}
