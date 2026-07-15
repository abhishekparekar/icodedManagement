import { cn } from '@/lib/utils'

interface ProgressBarProps {
  value: number
  max?: number
  className?: string
  showLabel?: boolean
  color?: string
}

export function ProgressBar({
  value,
  max = 100,
  className,
  showLabel = false,
  color = 'bg-brand-500',
}: ProgressBarProps) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100))

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
        <div
          className={cn('h-full rounded-full transition-all duration-500', color)}
          style={{ width: `${pct}%` }}
        />
      </div>
      {showLabel && (
        <span className="w-9 text-right text-xs font-medium text-slate-500">{Math.round(pct)}%</span>
      )}
    </div>
  )
}
