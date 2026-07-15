import { cn } from '@/lib/utils'
import type { ButtonHTMLAttributes } from 'react'

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  loading?: boolean
}

const variants: Record<Variant, string> = {
  primary:
    'bg-brand-600 text-white hover:bg-brand-700 dark:bg-brand-500 dark:hover:bg-brand-600 shadow-sm shadow-indigo-500/10',
  secondary:
    'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700 dark:hover:bg-slate-700/80',
  danger: 'bg-red-600 text-white hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600/90 shadow-sm shadow-red-500/10',
  ghost: 'text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800/80',
}

export function Button({
  className,
  variant = 'primary',
  loading,
  disabled,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center gap-2.5 rounded-xl px-5 py-2.5 text-sm font-semibold transition-all duration-200 active:scale-98 focus:outline-none focus:ring-4 focus:ring-brand-500/10 disabled:cursor-not-allowed disabled:opacity-60 disabled:pointer-events-none disabled:transform-none',
        variants[variant],
        className,
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
      )}
      {children}
    </button>
  )
}
