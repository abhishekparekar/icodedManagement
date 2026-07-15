import { X } from 'lucide-react'
import { useEffect, type ReactNode } from 'react'
import { Button } from './Button'

interface ModalProps {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl'
  disableBackdropClose?: boolean
}

const sizes = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
}

export function Modal({
  open,
  onClose,
  title,
  children,
  size = 'md',
  disableBackdropClose = false,
}: ModalProps) {
  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop — only closes if disableBackdropClose is false */}
      <div
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
        onClick={disableBackdropClose ? undefined : onClose}
        aria-hidden
      />
      <div
        role="dialog"
        aria-modal
        className={`relative z-10 w-full ${sizes[size]} max-h-[90vh] overflow-y-auto rounded-xl bg-white shadow-xl dark:bg-slate-900`}
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 dark:border-slate-800">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">{title}</h2>
          <Button variant="ghost" onClick={onClose} aria-label="Close">
            <X className="h-5 w-5" />
          </Button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  )
}
