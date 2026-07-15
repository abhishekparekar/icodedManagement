import type { LeadStatus, ProjectStatus, TaskStatus, UserRole } from '@/types'

export const ROLES: { value: UserRole; label: string }[] = [
  { value: 'admin', label: 'Admin' },
  { value: 'manager', label: 'Manager' },
  { value: 'employee', label: 'Employee' },
]

export const LEAD_STATUSES: { value: LeadStatus; label: string; color: string }[] = [
  { value: 'new', label: 'New', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300' },
  { value: 'in_progress', label: 'In Progress', color: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300' },
  { value: 'converted', label: 'Converted', color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300' },
  { value: 'lost', label: 'Lost', color: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300' },
]

export const PROJECT_STATUSES: { value: ProjectStatus; label: string; color: string }[] = [
  { value: 'pending', label: 'Pending', color: 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300' },
  { value: 'ongoing', label: 'Ongoing', color: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-300' },
  { value: 'completed', label: 'Completed', color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300' },
]

export const TASK_STATUSES: { value: TaskStatus; label: string }[] = [
  { value: 'todo', label: 'To Do' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'done', label: 'Done' },
]

export const DEPARTMENTS = [
  'Engineering', 'Sales', 'Marketing', 'HR', 'Finance', 'Operations', 'Support',
]

export const LEAD_SOURCES = [
  'Website', 'Referral', 'LinkedIn', 'Cold Call', 'Trade Show', 'Email Campaign', 'Other',
]

export const PAGE_SIZE = 10

export const QUOTATION_STATUSES: { value: string; label: string; color: string }[] = [
  { value: 'draft',    label: 'Draft',    color: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300' },
  { value: 'sent',     label: 'Sent',     color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' },
  { value: 'accepted', label: 'Accepted', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300' },
  { value: 'rejected', label: 'Rejected', color: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300' },
  { value: 'expired',  label: 'Expired',  color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300' },
]

export const QUOTATION_THEMES: { value: string; label: string; description: string }[] = [
  { value: 'modern',  label: 'Modern',  description: 'Clean gradient header with bold typography' },
  { value: 'classic', label: 'Classic', description: 'Traditional bordered layout, timeless look' },
  { value: 'minimal', label: 'Minimal', description: 'Ultra-clean, whitespace-focused design' },
  { value: 'bold',    label: 'Bold',    description: 'High-contrast, impactful corporate style' },
]

export const CURRENCIES: { value: string; label: string; symbol: string }[] = [
  { value: 'USD', label: 'USD — US Dollar',        symbol: '$'    },
  { value: 'EUR', label: 'EUR — Euro',             symbol: '\u20ac' },
  { value: 'GBP', label: 'GBP — British Pound',   symbol: '\u00a3' },
  { value: 'INR', label: 'INR — Indian Rupee',     symbol: '\u20b9' },
  { value: 'AED', label: 'AED — UAE Dirham',       symbol: 'AED'  },
  { value: 'SAR', label: 'SAR — Saudi Riyal',      symbol: 'SAR'  },
  { value: 'CAD', label: 'CAD — Canadian Dollar',  symbol: 'CA$'  },
  { value: 'AUD', label: 'AUD — Australian Dollar',symbol: 'A$'   },
]

export const ACCENT_COLORS = [
  '#4f46e5',
  '#0ea5e9',
  '#10b981',
  '#f59e0b',
  '#ef4444',
  '#8b5cf6',
  '#ec4899',
  '#0f172a',
]

export const GOAL_STATUSES: { value: string; label: string; color: string }[] = [
  { value: 'not_started', label: 'Not Started', color: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300' },
  { value: 'in_progress', label: 'In Progress', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' },
  { value: 'completed',   label: 'Completed',   color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300' },
  { value: 'at_risk',     label: 'At Risk',     color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300' },
  { value: 'cancelled',   label: 'Cancelled',   color: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300' },
]

export const GOAL_PRIORITIES: { value: string; label: string; color: string }[] = [
  { value: 'low',      label: 'Low',      color: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400' },
  { value: 'medium',   label: 'Medium',   color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' },
  { value: 'high',     label: 'High',     color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300' },
  { value: 'critical', label: 'Critical', color: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300' },
]

export const GOAL_CATEGORIES: { value: string; label: string; icon: string }[] = [
  { value: 'revenue',    label: 'Revenue',    icon: 'revenue' },
  { value: 'growth',     label: 'Growth',     icon: 'growth' },
  { value: 'product',    label: 'Product',    icon: 'product' },
  { value: 'team',       label: 'Team',       icon: 'team' },
  { value: 'customer',   label: 'Customer',   icon: 'customer' },
  { value: 'operations', label: 'Operations', icon: 'operations' },
  { value: 'other',      label: 'Other',      icon: 'other' },
]

export const BILL_STATUSES: { value: string; label: string; color: string }[] = [
  { value: 'draft',     label: 'Draft',     color: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300' },
  { value: 'sent',      label: 'Sent',      color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' },
  { value: 'paid',      label: 'Paid',      color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300' },
  { value: 'partial',   label: 'Partial',   color: 'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300' },
  { value: 'overdue',   label: 'Overdue',   color: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300' },
  { value: 'cancelled', label: 'Cancelled', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300' },
]

export const PAYMENT_MODES = [
  'Cash', 'UPI', 'Bank Transfer', 'NEFT/RTGS', 'Cheque', 'Credit Card', 'Debit Card', 'Online', 'Other',
]
