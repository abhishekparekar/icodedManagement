import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface StatCardProps {
  title: string
  value: string | number
  icon: LucideIcon
  trend?: string
  color?: string
  iconBg?: string
}

export function StatCard({ title, value, icon: Icon, trend, color = 'text-brand-600', iconBg = 'bg-brand-50' }: StatCardProps) {
  return (
    <div className={cn(
      'group relative flex items-center gap-2.5 sm:gap-4 rounded-2xl border border-slate-100 bg-white p-3 sm:p-5 shadow-card transition-all duration-300 hover:-translate-y-0.5 hover:shadow-card-hover hover:border-slate-200 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700 min-w-0 w-full overflow-hidden',
    )}>
      {/* Icon badge — compact on mobile, full on sm+ */}
      <div className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-xl sm:h-12 sm:w-12 sm:rounded-2xl', iconBg)}>
        <Icon className={cn('h-4 w-4 sm:h-6 sm:w-6', color)} />
      </div>
      {/* Text */}
      <div className="min-w-0 flex-1">
        <p className="truncate text-[9px] sm:text-[11px] font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-500">{title}</p>
        <p className="mt-0.5 text-xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-3xl leading-none">{value}</p>
        {trend && <p className="mt-0.5 text-[10px] text-slate-400 dark:text-slate-500">{trend}</p>}
      </div>
    </div>
  )
}
