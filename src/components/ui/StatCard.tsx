import type { LucideIcon } from 'lucide-react'
import { Link } from 'react-router-dom'
import { ArrowUpRight } from 'lucide-react'
import { cn } from '@/lib/utils'

interface StatCardProps {
  title: string
  value: string | number
  icon: LucideIcon
  to?: string
  onClick?: () => void
  /** Gradient theme for top accent line & icon badge (e.g. "from-blue-500 to-cyan-500") */
  gradient?: string
  trend?: string
  delay?: string
}

export function StatCard({
  title,
  value,
  icon: Icon,
  to,
  onClick,
  gradient = 'from-brand-500 to-violet-600',
  trend,
  delay = '',
}: StatCardProps) {
  // Extract gradient classes or construct default
  const gradClass = gradient.includes('bg-') ? gradient : `bg-gradient-to-br ${gradient}`

  const isClickable = Boolean(to || onClick)

  const cardContent = (
    <>
      {/* Top gradient accent line */}
      <div className={cn('absolute top-0 inset-x-0 h-1 transition-all duration-300 group-hover:h-1.5', gradClass)} />

      {/* Ambient background glow orb */}
      <div className={cn('pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full opacity-10 blur-2xl transition-opacity group-hover:opacity-25', gradClass)} />

      {/* Card Header: Icon + Label + Optional Arrow */}
      <div className="flex items-center justify-between gap-2 mb-2 sm:mb-3">
        <div className="flex items-center gap-1.5 min-w-0">
          <p className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 truncate">
            {title}
          </p>
          {isClickable && (
            <ArrowUpRight className="h-3.5 w-3.5 text-slate-400 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all shrink-0" />
          )}
        </div>
        <div className={cn('flex h-8 w-8 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-xl text-white shadow-sm transition-transform duration-300 group-hover:scale-110', gradClass)}>
          <Icon className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
        </div>
      </div>

      {/* Metric Value */}
      <div className="flex items-baseline justify-between gap-2">
        <p className="text-2xl sm:text-3xl lg:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-none">
          {value}
        </p>
      </div>

      {/* Optional Trend / Subtext */}
      {trend && (
        <p className="mt-2 text-[11px] sm:text-xs font-semibold text-slate-400 dark:text-slate-500 truncate">
          {trend}
        </p>
      )}
    </>
  )

  const baseClasses = cn(
    'group relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white/90 p-3.5 sm:p-5 shadow-sm transition-all duration-300 dark:border-slate-800/80 dark:bg-slate-900/90 backdrop-blur-xl animate-fade-up block w-full text-left',
    isClickable && 'cursor-pointer hover:shadow-xl hover:-translate-y-1 hover:border-brand-300 dark:hover:border-brand-700 active:scale-[0.98]',
    delay,
  )

  if (to) {
    return (
      <Link to={to} className={baseClasses}>
        {cardContent}
      </Link>
    )
  }

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={baseClasses}>
        {cardContent}
      </button>
    )
  }

  return <div className={baseClasses}>{cardContent}</div>
}
