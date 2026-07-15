import { cn } from '@/lib/utils'
import type { ReactNode } from 'react'

interface Tab {
  value: string
  label: string
  icon?: ReactNode
}

interface TabsProps {
  tabs: Tab[]
  active: string
  onChange: (value: string) => void
  className?: string
}

export function Tabs({ tabs, active, onChange, className }: TabsProps) {
  return (
    <div className={cn('flex gap-1 rounded-lg bg-slate-100 p-1 dark:bg-slate-800', className)}>
      {tabs.map((tab) => (
        <button
          key={tab.value}
          onClick={() => onChange(tab.value)}
          className={cn(
            'flex flex-1 items-center justify-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition',
            active === tab.value
              ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-white'
              : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200',
          )}
        >
          {tab.icon}
          {tab.label}
        </button>
      ))}
    </div>
  )
}
