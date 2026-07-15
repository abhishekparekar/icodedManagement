import { cn } from '@/lib/utils'
import type { ReactNode } from 'react'

export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        'rounded-2xl border border-slate-100 bg-white p-3 sm:p-5 shadow-card dark:border-slate-800 dark:bg-slate-900 backdrop-blur-sm',
        className,
      )}
    >
      {children}
    </div>
  )
}

export function CardHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <div className="mb-3 sm:mb-4 flex flex-wrap items-start justify-between gap-2">
      <div>
        <h3 className="text-base sm:text-lg font-semibold text-slate-900 dark:text-white">{title}</h3>
        {subtitle && <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">{subtitle}</p>}
      </div>
      {action}
    </div>
  )
}
