import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import type { QuotationLineItem } from '@/types'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function generateId(): string {
  return crypto.randomUUID()
}

export function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
}

export function paginate<T>(items: T[], page: number, pageSize: number): T[] {
  const start = (page - 1) * pageSize
  return items.slice(start, start + pageSize)
}

export function totalPages(count: number, pageSize: number): number {
  return Math.max(1, Math.ceil(count / pageSize))
}

/** Line total = qty × unitPrice (no per-item discount/tax) */
export function calcLineTotal(item: QuotationLineItem): number {
  return item.quantity * item.unitPrice
}

/** Compute all quotation totals from items + single discount% + single tax% */
export function calcQuotationTotals(
  items: QuotationLineItem[],
  discountPercent: number,
  taxPercent: number,
) {
  const subtotal = items.reduce((sum, it) => sum + calcLineTotal(it), 0)
  const discountAmount = subtotal * (discountPercent / 100)
  const afterDiscount = subtotal - discountAmount
  const taxAmount = afterDiscount * (taxPercent / 100)
  const grandTotal = afterDiscount + taxAmount
  return { subtotal, discountAmount, taxAmount, grandTotal }
}

export function formatCurrency(amount: number, currency = 'USD'): string {
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}
