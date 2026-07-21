import {
  CheckCircle2,
  Circle,
  Clock,
  Coins,
  Flag,
  Handshake,
  Pencil,
  Plus,
  Rocket,
  Search,
  Settings,
  Target,
  Trash2,
  TrendingUp,
  Users,
  X,
} from 'lucide-react'
import { useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { EmptyState } from '@/components/ui/EmptyState'
import { Modal } from '@/components/ui/Modal'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { StatCard } from '@/components/ui/StatCard'
import { GOAL_CATEGORIES, GOAL_PRIORITIES, GOAL_STATUSES } from '@/lib/constants'
import { canManageGoals } from '@/lib/permissions'
import { formatDate, generateId } from '@/lib/utils'
import {
  createGoal,
  deleteGoal,
  makeBlankGoal,
  toggleMilestone,
  updateGoal,
  updateGoalProgress,
} from '@/services/goals.service'
import { useAuthStore } from '@/stores/authStore'
import { useDataStore } from '@/stores/dataStore'
import type { Goal, GoalCategory, GoalPriority, GoalStatus, Milestone } from '@/types'

// ─── Helpers ────────────────────────────────────────────────────────────────

function getStatusColor(s: string) {
  return GOAL_STATUSES.find((x) => x.value === s)?.color ?? ''
}

function getPriorityColor(p: string) {
  return GOAL_PRIORITIES.find((x) => x.value === p)?.color ?? ''
}

function getCategoryIcon(c: string) {
  const map: Record<string, React.ElementType> = {
    revenue: Coins,
    growth: TrendingUp,
    product: Rocket,
    team: Users,
    customer: Handshake,
    operations: Settings,
    other: Target,
  }
  const IconComponent = map[c] ?? Target
  return <IconComponent className="h-5 w-5 text-brand-600 dark:text-brand-400 shrink-0" />
}

function getCategoryLabel(c: string) {
  return GOAL_CATEGORIES.find((x) => x.value === c)?.label ?? c
}

function daysLeft(dueDate: string): number {
  return Math.ceil((new Date(dueDate).getTime() - Date.now()) / 86400000)
}

function getProgressColor(pct: number, status: string): string {
  if (status === 'completed') return 'bg-emerald-500'
  if (status === 'cancelled') return 'bg-slate-400'
  if (status === 'at_risk') return 'bg-amber-500'
  if (pct >= 75) return 'bg-emerald-500'
  if (pct >= 40) return 'bg-blue-500'
  return 'bg-brand-500'
}

// ─── Form State ──────────────────────────────────────────────────────────────

interface GoalFormState {
  title: string
  description: string
  category: GoalCategory
  priority: GoalPriority
  status: GoalStatus
  progress: number
  autoProgress: boolean
  targetValue: string
  currentValue: string
  unit: string
  startDate: string
  dueDate: string
  assignedTo: string[]
  notes: string
  milestones: Milestone[]
}

function toFormState(g: Partial<Goal>): GoalFormState {
  return {
    title: g.title ?? '',
    description: g.description ?? '',
    category: g.category ?? 'other',
    priority: g.priority ?? 'medium',
    status: g.status ?? 'not_started',
    progress: g.progress ?? 0,
    autoProgress: g.autoProgress ?? true,
    targetValue: g.targetValue != null ? String(g.targetValue) : '',
    currentValue: g.currentValue != null ? String(g.currentValue) : '',
    unit: g.unit ?? '',
    startDate: g.startDate ?? new Date().toISOString().slice(0, 10),
    dueDate: g.dueDate ?? new Date(Date.now() + 90 * 86400000).toISOString().slice(0, 10),
    assignedTo: g.assignedTo ?? [],
    notes: g.notes ?? '',
    milestones: g.milestones ?? [],
  }
}

// ─── GoalForm ────────────────────────────────────────────────────────────────

interface GoalFormProps {
  form: GoalFormState
  onChange: (f: GoalFormState) => void
  employees: { id: string; name: string; profileImage?: string }[]
}

function GoalForm({ form, onChange, employees }: GoalFormProps) {
  const set = (patch: Partial<GoalFormState>) => onChange({ ...form, ...patch })
  const [newMsTitle, setNewMsTitle] = useState('')
  const [newMsDue, setNewMsDue] = useState(new Date().toISOString().slice(0, 10))

  const addMs = () => {
    if (!newMsTitle.trim()) return
    const ms: Milestone = { id: generateId(), title: newMsTitle.trim(), dueDate: newMsDue, completed: false }
    set({ milestones: [...form.milestones, ms] })
    setNewMsTitle('')
    setNewMsDue(new Date().toISOString().slice(0, 10))
  }

  const removeMs = (id: string) => set({ milestones: form.milestones.filter((m) => m.id !== id) })

  const toggleAssign = (id: string) =>
    set({
      assignedTo: form.assignedTo.includes(id)
        ? form.assignedTo.filter((x) => x !== id)
        : [...form.assignedTo, id],
    })

  const autoCalcProgress = form.autoProgress && form.milestones.length > 0
    ? Math.round((form.milestones.filter((m) => m.completed).length / form.milestones.length) * 100)
    : null

  return (
    <div className="space-y-4 text-xs">
      {/* Title & Description */}
      <div className="space-y-3">
        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
            Goal Title *
          </label>
          <input
            type="text"
            required
            placeholder="e.g. Reach 100 active software clients by Q4"
            value={form.title}
            onChange={(e) => set({ title: e.target.value })}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-800 transition-all focus:border-brand-500 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
            Description
          </label>
          <textarea
            rows={2}
            placeholder="What does success look like for this milestone?"
            value={form.description}
            onChange={(e) => set({ description: e.target.value })}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800 transition-all focus:border-brand-500 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
          />
        </div>
      </div>

      {/* Select Controls */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
            Category
          </label>
          <select
            value={form.category}
            onChange={(e) => set({ category: e.target.value as GoalCategory })}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
          >
            {GOAL_CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
            Priority
          </label>
          <select
            value={form.priority}
            onChange={(e) => set({ priority: e.target.value as GoalPriority })}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
          >
            {GOAL_PRIORITIES.map((p) => (
              <option key={p.value} value={p.value}>{p.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
            Status
          </label>
          <select
            value={form.status}
            onChange={(e) => set({ status: e.target.value as GoalStatus })}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
          >
            {GOAL_STATUSES.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Dates */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
            Start Date
          </label>
          <input
            type="date"
            value={form.startDate}
            onChange={(e) => set({ startDate: e.target.value })}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
            Due Date *
          </label>
          <input
            type="date"
            value={form.dueDate}
            onChange={(e) => set({ dueDate: e.target.value })}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 font-bold"
          />
        </div>
      </div>

      {/* Numeric Target */}
      <div className="rounded-2xl border border-slate-200/80 bg-slate-50/50 p-3.5 dark:border-slate-800 dark:bg-slate-900/50 space-y-2.5">
        <p className="text-xs font-black uppercase tracking-wider text-slate-500">
          Numeric Target Metrics (Optional)
        </p>
        <div className="grid grid-cols-3 gap-2.5">
          <div>
            <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-0.5">Target Value</label>
            <input
              type="number"
              min={0}
              placeholder="e.g. 100"
              value={form.targetValue}
              onChange={(e) => set({ targetValue: e.target.value })}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-800 font-bold dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-0.5">Current Value</label>
            <input
              type="number"
              min={0}
              placeholder="e.g. 42"
              value={form.currentValue}
              onChange={(e) => set({ currentValue: e.target.value })}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-800 font-bold dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-0.5">Unit</label>
            <input
              type="text"
              placeholder="e.g. clients, ₹, %"
              value={form.unit}
              onChange={(e) => set({ unit: e.target.value })}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-800 font-bold dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            />
          </div>
        </div>
      </div>

      {/* Progress Settings */}
      <div className="rounded-2xl border border-slate-200/80 bg-slate-50/50 p-3.5 dark:border-slate-800 dark:bg-slate-900/50 space-y-2">
        <div className="flex items-center justify-between">
          <label className="flex cursor-pointer items-center gap-2">
            <input
              type="checkbox"
              checked={form.autoProgress}
              onChange={(e) => set({ autoProgress: e.target.checked })}
              className="h-4 w-4 rounded accent-brand-600"
            />
            <span className="text-xs font-extrabold text-slate-800 dark:text-slate-200">
              Auto-calculate progress from milestones
            </span>
          </label>
          <span className="text-xs font-black text-brand-600 dark:text-brand-400">
            {form.progress}% Complete
          </span>
        </div>

        {!form.autoProgress && (
          <div className="flex items-center gap-3 pt-1">
            <input
              type="range"
              min={0}
              max={100}
              value={form.progress}
              onChange={(e) => set({ progress: parseInt(e.target.value) })}
              className="flex-1 accent-brand-600"
            />
          </div>
        )}

        {autoCalcProgress !== null && (
          <p className="text-[11px] font-medium text-slate-400">
            Calculated: <strong className="text-brand-600 dark:text-brand-400">{autoCalcProgress}%</strong> based on{' '}
            {form.milestones.filter((m) => m.completed).length}/{form.milestones.length} milestones
          </p>
        )}
      </div>

      {/* Milestones Checklist Builder */}
      <div>
        <label className="block text-xs font-extrabold text-slate-800 dark:text-slate-200 mb-1.5">
          Milestones Checklist
        </label>
        
        <div className="space-y-1.5 mb-2">
          {form.milestones.map((ms) => (
            <div
              key={ms.id}
              className="flex items-center justify-between gap-2 rounded-xl border border-slate-200/80 bg-white px-3 py-2 dark:border-slate-800 dark:bg-slate-900 shadow-xs"
            >
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <span className={`h-2 w-2 rounded-full shrink-0 ${ms.completed ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                <span className={`text-xs font-semibold truncate ${ms.completed ? 'line-through text-slate-400' : 'text-slate-800 dark:text-slate-200'}`}>
                  {ms.title}
                </span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-[10px] font-medium text-slate-400">{ms.dueDate}</span>
                <button
                  type="button"
                  onClick={() => removeMs(ms.id)}
                  className="rounded-lg p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          <input
            className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium dark:border-slate-700 dark:bg-slate-800"
            placeholder="New milestone title..."
            value={newMsTitle}
            onChange={(e) => setNewMsTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                addMs()
              }
            }}
          />
          <input
            type="date"
            className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium dark:border-slate-700 dark:bg-slate-800"
            value={newMsDue}
            onChange={(e) => setNewMsDue(e.target.value)}
          />
          <Button type="button" variant="secondary" onClick={addMs} className="h-9 px-3 text-xs font-bold">
            <Plus className="h-4 w-4" /> Add
          </Button>
        </div>
      </div>

      {/* Assign Team Members */}
      <div>
        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
          Assign Team Members
        </label>
        <div className="flex flex-wrap gap-1.5">
          {employees.map((emp) => {
            const isAssigned = form.assignedTo.includes(emp.id)
            return (
              <button
                key={emp.id}
                type="button"
                onClick={() => toggleAssign(emp.id)}
                className={`inline-flex items-center gap-1.5 rounded-xl px-2.5 py-1 text-xs font-bold transition-all ${
                  isAssigned
                    ? 'bg-brand-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                <Avatar name={emp.name} src={emp.profileImage} size="sm" className="h-4 w-4" />
                {emp.name}
              </button>
            )
          })}
          {employees.length === 0 && (
            <p className="text-xs text-slate-400 italic">No employees found in directory</p>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── GoalCard ────────────────────────────────────────────────────────────────

interface GoalCardProps {
  goal: Goal
  employees: { id: string; name: string; profileImage?: string }[]
  canWrite: boolean
  onEdit: (g: Goal) => void
  onDelete: (g: Goal) => void
  onToggleMilestone: (goal: Goal, msId: string) => void
  onUpdateProgress: (goal: Goal) => void
}

function GoalCard({
  goal,
  employees,
  canWrite,
  onEdit,
  onDelete,
  onToggleMilestone,
  onUpdateProgress,
}: GoalCardProps) {
  const [expanded, setExpanded] = useState(false)
  const days = daysLeft(goal.dueDate)
  const assignees = goal.assignedTo
    .map((id) => employees.find((e) => e.id === id))
    .filter(Boolean) as typeof employees
  const doneMilestones = goal.milestones.filter((m) => m.completed).length
  const pColor = getProgressColor(goal.progress, goal.status)

  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-5 shadow-xs hover:shadow-card-hover transition-all dark:border-slate-800 dark:bg-slate-900 flex flex-col justify-between space-y-3.5">
      
      {/* Top Header */}
      <div>
        <div className="flex items-start justify-between gap-3 mb-2">
          <div className="flex items-start gap-2.5 min-w-0">
            <div className="p-2 rounded-xl bg-brand-50 dark:bg-slate-800 shrink-0">
              {getCategoryIcon(goal.category)}
            </div>
            <div className="min-w-0">
              <h3 className="font-bold text-slate-900 dark:text-white text-sm sm:text-base leading-snug line-clamp-2">
                {goal.title}
              </h3>
              <p className="text-[11px] font-semibold text-slate-400">
                {getCategoryLabel(goal.category)}
              </p>
            </div>
          </div>

          <div className="flex flex-col items-end gap-1 shrink-0">
            <Badge className={`uppercase tracking-wider text-[9px] font-black border ${getPriorityColor(goal.priority)}`}>
              {goal.priority}
            </Badge>
            <Badge className={`uppercase tracking-wider text-[9px] font-black border ${getStatusColor(goal.status)}`}>
              {goal.status.replace('_', ' ')}
            </Badge>
          </div>
        </div>

        {goal.description && (
          <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mt-1">
            {goal.description}
          </p>
        )}
      </div>

      {/* Progress Bar & Numerical Target */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="font-bold text-slate-500 text-[11px] uppercase tracking-wider">Overall Progress</span>
          <span className="font-black text-slate-900 dark:text-white">{goal.progress}%</span>
        </div>
        <ProgressBar value={goal.progress} color={pColor} className="h-2 rounded-full" />

        {/* Numeric target metric */}
        {goal.targetValue != null && goal.targetValue > 0 && (
          <div className="flex items-center justify-between gap-2 rounded-xl bg-slate-50/80 px-3 py-2 text-xs font-semibold dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
              <TrendingUp className="h-3.5 w-3.5 text-brand-600 dark:text-brand-400" />
              <span>
                {goal.currentValue ?? 0} / {goal.targetValue} {goal.unit ? goal.unit : ''}
              </span>
            </div>
            <span className="font-extrabold text-brand-600 dark:text-brand-400 text-[11px]">
              {goal.targetValue > 0 ? Math.round(((goal.currentValue ?? 0) / goal.targetValue) * 100) : 0}%
            </span>
          </div>
        )}
      </div>

      {/* Meta Row: Due Date & Assignees */}
      <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-slate-800/80 text-xs">
        <div className="flex items-center gap-2">
          <Clock className="h-3.5 w-3.5 text-slate-400" />
          <span className="text-[11px] font-semibold text-slate-500">
            Due {formatDate(goal.dueDate)}
          </span>
          {days > 0 && goal.status !== 'completed' && goal.status !== 'cancelled' && (
            <span className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded-md ${days <= 7 ? 'bg-red-50 text-red-600 dark:bg-red-950/40' : 'bg-slate-100 text-slate-600 dark:bg-slate-800'}`}>
              {days}d left
            </span>
          )}
          {days <= 0 && goal.status !== 'completed' && goal.status !== 'cancelled' && (
            <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded-md bg-red-50 text-red-600 dark:bg-red-950/40">
              Overdue
            </span>
          )}
        </div>

        {assignees.length > 0 && (
          <div className="flex -space-x-1.5 shrink-0">
            {assignees.slice(0, 3).map((emp) => (
              <Avatar
                key={emp.id}
                name={emp.name}
                src={emp.profileImage}
                size="sm"
                className="h-6 w-6 ring-2 ring-white dark:ring-slate-900"
              />
            ))}
            {assignees.length > 3 && (
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-200 text-[10px] font-bold text-slate-700 dark:bg-slate-700 dark:text-slate-200 ring-2 ring-white dark:ring-slate-900">
                +{assignees.length - 3}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Milestones Expandable Stream */}
      {goal.milestones.length > 0 && (
        <div className="space-y-1.5 pt-1">
          <button
            type="button"
            onClick={() => setExpanded((p) => !p)}
            className="w-full flex items-center justify-between text-xs font-bold text-brand-600 dark:text-brand-400 hover:underline py-1"
          >
            <span>Milestones Checklist</span>
            <span className="text-[11px] text-slate-400">
              {doneMilestones} / {goal.milestones.length} done {expanded ? '▲' : '▼'}
            </span>
          </button>

          {expanded && (
            <div className="space-y-1.5 rounded-xl bg-slate-50 p-2.5 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
              {goal.milestones.map((ms) => (
                <div key={ms.id} className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => canWrite && onToggleMilestone(goal, ms.id)}
                    className={canWrite ? 'cursor-pointer shrink-0' : 'cursor-default shrink-0'}
                    title={canWrite ? (ms.completed ? 'Mark incomplete' : 'Mark complete') : ''}
                  >
                    {ms.completed ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    ) : (
                      <Circle className="h-4 w-4 text-slate-300 dark:text-slate-600" />
                    )}
                  </button>
                  <span className={`flex-1 text-xs font-medium truncate ${ms.completed ? 'line-through text-slate-400' : 'text-slate-800 dark:text-slate-200'}`}>
                    {ms.title}
                  </span>
                  <span className="text-[10px] text-slate-400 shrink-0">{ms.dueDate}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Action Footer */}
      {canWrite && (
        <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800/80 pt-2.5">
          <Button variant="ghost" onClick={() => onUpdateProgress(goal)} className="h-8 text-xs font-bold text-brand-600 dark:text-brand-400 px-2">
            <TrendingUp className="h-3.5 w-3.5" /> Update Progress
          </Button>

          <div className="flex items-center gap-1">
            <Button variant="ghost" className="h-8 w-8 p-0" onClick={() => onEdit(goal)} title="Edit Goal">
              <Pencil className="h-4 w-4 text-slate-500 hover:text-brand-600" />
            </Button>
            <Button variant="ghost" className="h-8 w-8 p-0" onClick={() => onDelete(goal)} title="Delete Goal">
              <Trash2 className="h-4 w-4 text-red-500 hover:text-red-600" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── UpdateProgressModal ─────────────────────────────────────────────────────

function UpdateProgressModal({
  goal,
  onClose,
  onSave,
}: {
  goal: Goal
  onClose: () => void
  onSave: (progress: number, currentValue?: number) => void
}) {
  const [progress, setProgress] = useState(goal.progress)
  const [currentValue, setCurrentValue] = useState(goal.currentValue ?? 0)
  const pColor = getProgressColor(progress, goal.status)

  return (
    <div className="space-y-4 text-xs">
      <div>
        <div className="mb-2 flex items-center justify-between">
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
            Overall Progress Percentage
          </label>
          <span className="text-base font-black text-brand-600 dark:text-brand-400">{progress}%</span>
        </div>
        <input
          type="range"
          min={0}
          max={100}
          value={progress}
          onChange={(e) => setProgress(parseInt(e.target.value))}
          className="w-full accent-brand-600"
        />
        <ProgressBar value={progress} className="mt-2" color={pColor} />
      </div>

      {goal.targetValue != null && goal.targetValue > 0 && (
        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
            Current Numeric Value (Target: {goal.targetValue} {goal.unit ? goal.unit : ''})
          </label>
          <input
            type="number"
            min={0}
            value={currentValue}
            onChange={(e) => setCurrentValue(parseFloat(e.target.value) || 0)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
          />
        </div>
      )}

      <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
        <Button variant="secondary" onClick={onClose} className="h-9 text-xs font-bold">
          Cancel
        </Button>
        <Button
          onClick={() => onSave(progress, goal.targetValue != null ? currentValue : undefined)}
          className="h-9 text-xs font-bold bg-gradient-to-r from-brand-600 to-violet-600 text-white"
        >
          Save Progress
        </Button>
      </div>
    </div>
  )
}

// ─── GoalsPage ───────────────────────────────────────────────────────────────

export function GoalsPage() {
  const user = useAuthStore((s) => s.user)
  const goals = useDataStore((s) => s.goals)
  const employees = useDataStore((s) => s.employees)
  const canWrite = canManageGoals(user)

  const [categoryFilter, setCategoryFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [priorityFilter, setPriorityFilter] = useState('')
  const [search, setSearch] = useState('')

  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Goal | null>(null)
  const [form, setForm] = useState<GoalFormState>(toFormState({}))
  const [saving, setSaving] = useState(false)

  const [deleteTarget, setDeleteTarget] = useState<Goal | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [progressTarget, setProgressTarget] = useState<Goal | null>(null)

  // Stats
  const stats = useMemo(
    () => ({
      total: goals.length,
      completed: goals.filter((g) => g.status === 'completed').length,
      inProgress: goals.filter((g) => g.status === 'in_progress').length,
      atRisk: goals.filter((g) => g.status === 'at_risk').length,
      avgProgress:
        goals.length
          ? Math.round(goals.reduce((s, g) => s + g.progress, 0) / goals.length)
          : 0,
    }),
    [goals],
  )

  // Filtered list
  const filtered = useMemo(
    () =>
      goals.filter((g) => {
        if (categoryFilter && g.category !== categoryFilter) return false
        if (statusFilter && g.status !== statusFilter) return false
        if (priorityFilter && g.priority !== priorityFilter) return false
        if (
          search &&
          !g.title.toLowerCase().includes(search.toLowerCase()) &&
          !g.description.toLowerCase().includes(search.toLowerCase())
        )
          return false
        return true
      }),
    [goals, categoryFilter, statusFilter, priorityFilter, search],
  )

  const openCreate = () => {
    if (!user) return
    setEditing(null)
    setForm(toFormState(makeBlankGoal(user.uid, user.name)))
    setModalOpen(true)
  }

  const openEdit = (g: Goal) => {
    setEditing(g)
    setForm(toFormState(g))
    setModalOpen(true)
  }

  const handleSave = async () => {
    if (!user?.tenantId) return
    if (!form.title.trim()) { toast.error('Goal title is required'); return }
    if (!form.dueDate) { toast.error('Due date is required'); return }

    setSaving(true)
    try {
      let progress = form.progress
      if (form.autoProgress && form.milestones.length > 0) {
        progress = Math.round(
          (form.milestones.filter((m) => m.completed).length / form.milestones.length) * 100,
        )
      }

      const payload = {
        title: form.title.trim(),
        description: form.description,
        category: form.category,
        priority: form.priority,
        status: form.status,
        progress,
        autoProgress: form.autoProgress,
        targetValue: form.targetValue !== '' ? parseFloat(form.targetValue) : undefined,
        currentValue: form.currentValue !== '' ? parseFloat(form.currentValue) : undefined,
        unit: form.unit,
        startDate: form.startDate,
        dueDate: form.dueDate,
        assignedTo: form.assignedTo,
        milestones: form.milestones,
        notes: form.notes,
        createdBy: user.uid,
        createdByName: user.name,
      }

      if (editing) {
        await updateGoal(editing.id, user.tenantId, payload, user)
        toast.success('Goal updated')
      } else {
        await createGoal(user.tenantId, payload, user)
        toast.success('Goal created')
      }
      setModalOpen(false)
    } catch (e) {
      console.error('[handleSave]', e)
      toast.error(e instanceof Error ? e.message : 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget?.id?.trim() || !user?.tenantId) return
    const id = deleteTarget.id
    const title = deleteTarget.title
    setDeleting(true)
    try {
      await deleteGoal(id, user.tenantId, title, user)
      toast.success('Goal deleted')
      setDeleteTarget(null)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Delete failed')
    } finally {
      setDeleting(false)
    }
  }

  const handleToggleMilestone = async (goal: Goal, msId: string) => {
    if (!user?.tenantId) return
    try {
      await toggleMilestone(goal.id, user.tenantId, goal, msId, user)
    } catch {
      toast.error('Update failed')
    }
  }

  const handleUpdateProgress = async (progress: number, currentValue?: number) => {
    if (!progressTarget?.id?.trim() || !user?.tenantId) return
    try {
      await updateGoalProgress(progressTarget.id, progress, currentValue, user, user.tenantId)
      toast.success('Progress updated')
      setProgressTarget(null)
    } catch {
      toast.error('Update failed')
    }
  }

  return (
    <div className="space-y-4 sm:space-y-5">
      {/* ── KPI Summary Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
        <StatCard title="Total Goals"  value={stats.total}             icon={Flag}       to="/goals" gradient="from-brand-500 to-violet-600" delay="delay-75" />
        <StatCard title="Completed"    value={stats.completed}         icon={CheckCircle2} to="/goals" gradient="from-emerald-500 to-teal-600" delay="delay-150" />
        <StatCard title="In Progress"  value={stats.inProgress}        icon={TrendingUp} to="/goals" gradient="from-blue-500 to-cyan-500"    delay="delay-225" />
        <StatCard title="At Risk"      value={stats.atRisk}            icon={Clock}      to="/goals" gradient="from-amber-500 to-orange-500"  delay="delay-300" />
        <StatCard title="Avg Progress" value={stats.avgProgress + '%'} icon={Target}     to="/goals" gradient="from-purple-500 to-pink-600"   delay="delay-300" />
      </div>

      {/* ── Integrated Filter & Control Toolbar ── */}
      <div className="bg-white dark:bg-slate-900 p-3 sm:p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
        
        {/* Top Primary Toolbar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          
          {/* Search Input & Select Dropdowns */}
          <div className="flex flex-1 flex-col sm:flex-row items-stretch sm:items-center gap-2.5 max-w-3xl">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Search goal title or description..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-9 w-full rounded-xl border border-slate-200/90 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 pl-9 pr-8 text-xs font-semibold text-slate-700 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all"
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="absolute right-2.5 top-2 rounded-md p-0.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Category Dropdown */}
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="h-9 rounded-xl border border-slate-200/90 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-3 text-xs font-semibold text-slate-700 dark:text-slate-200 focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all"
            >
              <option value="">Category: All</option>
              {GOAL_CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>

            {/* Status Dropdown */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-9 rounded-xl border border-slate-200/90 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-3 text-xs font-semibold text-slate-700 dark:text-slate-200 focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all"
            >
              <option value="">Status: All</option>
              {GOAL_STATUSES.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>

            {/* Priority Dropdown */}
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="h-9 rounded-xl border border-slate-200/90 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-3 text-xs font-semibold text-slate-700 dark:text-slate-200 focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all"
            >
              <option value="">Priority: All</option>
              {GOAL_PRIORITIES.map((p) => (
                <option key={p.value} value={p.value}>{p.label}</option>
              ))}
            </select>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 shrink-0 justify-between sm:justify-end">
            {(search || categoryFilter || statusFilter || priorityFilter) && (
              <button
                onClick={() => { setSearch(''); setCategoryFilter(''); setStatusFilter(''); setPriorityFilter('') }}
                className="text-xs font-bold text-brand-600 dark:text-brand-400 hover:underline px-2 shrink-0"
              >
                Reset
              </button>
            )}

            {canWrite && (
              <Button
                onClick={openCreate}
                className="h-9 text-xs font-bold bg-gradient-to-r from-brand-600 to-violet-600 hover:from-brand-700 hover:to-violet-700 text-white shadow-md shadow-brand-500/20 shrink-0 px-4"
              >
                <Plus className="h-4 w-4" /> New Goal
              </Button>
            )}
          </div>
        </div>

        {/* Bottom Filter Pills Bar for Quick 1-Click Category Filter */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-2 border-t border-slate-100 dark:border-slate-800/80">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider pr-1 shrink-0">Quick Filter:</span>
          <button
            onClick={() => setCategoryFilter('')}
            className={`px-3 py-1 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              categoryFilter === ''
                ? 'bg-gradient-to-r from-brand-600 to-violet-600 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            All Categories
          </button>
          {GOAL_CATEGORIES.map((c) => (
            <button
              key={c.value}
              onClick={() => setCategoryFilter(c.value)}
              className={`px-3 py-1 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                categoryFilter === c.value
                  ? 'bg-gradient-to-r from-brand-600 to-violet-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Goals Grid Stream ── */}
      {filtered.length === 0 ? (
        <Card>
          <EmptyState
            icon={Target}
            title="No goals found"
            description={
              search || categoryFilter || statusFilter || priorityFilter
                ? 'Try clearing your search filters'
                : 'Click "New Goal" to establish company milestones and targets'
            }
          />
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((goal) => (
            <GoalCard
              key={goal.id}
              goal={goal}
              employees={employees}
              canWrite={canWrite}
              onEdit={openEdit}
              onDelete={setDeleteTarget}
              onToggleMilestone={handleToggleMilestone}
              onUpdateProgress={setProgressTarget}
            />
          ))}
        </div>
      )}

      {/* ── Create / Edit Modal ── */}
      {modalOpen && (
        <Modal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          title={editing ? 'Edit Goal — ' + editing.title : 'New Goal'}
          size="xl"
        >
          <div className="space-y-4">
            <GoalForm form={form} onChange={setForm} employees={employees} />
            <div className="sticky bottom-0 flex justify-end gap-2.5 border-t border-slate-100 bg-white py-3 dark:border-slate-800 dark:bg-slate-900">
              <Button variant="secondary" onClick={() => setModalOpen(false)} className="h-9 px-4 text-xs font-bold">
                Cancel
              </Button>
              <Button onClick={handleSave} loading={saving} className="h-9 px-5 text-xs font-bold bg-gradient-to-r from-brand-600 to-violet-600 text-white shadow-md shadow-brand-500/20">
                {editing ? 'Update Goal' : 'Create Goal'}
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* ── Update Progress Modal ── */}
      {progressTarget && (
        <Modal
          open={!!progressTarget}
          onClose={() => setProgressTarget(null)}
          title={'Update Progress — ' + progressTarget.title}
          size="sm"
        >
          <UpdateProgressModal
            goal={progressTarget}
            onClose={() => setProgressTarget(null)}
            onSave={handleUpdateProgress}
          />
        </Modal>
      )}

      {/* ── Delete Confirmation ── */}
      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete goal"
        message={'Are you sure you want to delete goal "' + (deleteTarget?.title ?? '') + '"? All associated milestones will be removed.'}
        confirmLabel="Delete"
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => { if (!deleting) setDeleteTarget(null) }}
      />
    </div>
  )
}
