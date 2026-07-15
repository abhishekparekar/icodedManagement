import { cn } from '@/lib/utils'
import { forwardRef, type TextareaHTMLAttributes } from 'react'

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, id, ...props }, ref) => {
    const textareaId = id ?? props.name
    return (
      <div className="space-y-1">
        {label && (
          <label htmlFor={textareaId} className="block text-sm font-medium text-slate-700 dark:text-slate-300">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={textareaId}
          rows={4}
          className={cn(
            'w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-sm transition-all duration-200 placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-500/10 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100',
            error && 'border-red-500 focus:border-red-500 focus:ring-red-500/10',
            className,
          )}
          {...props}
        />
        {error && <p className="text-xs text-red-600">{error}</p>}
      </div>
    )
  },
)
Textarea.displayName = 'Textarea'
