import { CheckCircle2, Circle, Flag, Pencil, Plus, Target, Trash2, TrendingUp, X, Coins, Handshake, Rocket, Users, Settings } from 'lucide-react'
import { useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card, CardHeader } from '@/components/ui/Card'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { EmptyState } from '@/components/ui/EmptyState'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { Select } from '@/components/ui/Select'
import { Textarea } from '@/components/ui/Textarea'
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

// ─── helpers ────────────────────────────────────────────────────────────────

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
  return <IconComponent className="h-5 w-5 text-brand-500 shrink-0" />
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

// ─── Form state ──────────────────────────────────────────────────────────────

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
    <div className="space-y-6">
      {/* Basic info */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <Input
            label="Goal Title *"
            value={form.title}
            onChange={(e) => set({ title: e.target.value })}
            placeholder="e.g. Reach 100 active clients by Q4"
          />
        </div>
        <div className="sm:col-span-2">
          <Textarea
            label="Description"
            rows={2}
            value={form.description}
            onChange={(e) => set({ description: e.target.value })}
            placeholder="What does success look like?"
          />
        </div>
        <Select
          label="Category"
          value={form.category}
          onChange={(e) => set({ category: e.target.value as GoalCategory })}
          options={GOAL_CATEGORIES.map((c) => ({ value: c.value, label: c.label }))}
        />
        <Select
          label="Priority"
          value={form.priority}
          onChange={(e) => set({ priority: e.target.value as GoalPriority })}
          options={GOAL_PRIORITIES.map((p) => ({ value: p.value, label: p.label }))}
        />
        <Select
          label="Status"
          value={form.status}
          onChange={(e) => set({ status: e.target.value as GoalStatus })}
          options={GOAL_STATUSES.map((s) => ({ value: s.value, label: s.label }))}
        />
        <Input label="Start Date" type="date" value={form.startDate} onChange={(e) => set({ startDate: e.target.value })} />
        <Input label="Due Date" type="date" value={form.dueDate} onChange={(e) => set({ dueDate: e.target.value })} />
      </div>

      {/* Numeric target */}
      <div>
        <p className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-500">
          Numeric Target (optional)
        </p>
        <div className="grid gap-4 sm:grid-cols-3">
          <Input
            label="Target Value"
            type="number"
            min={0}
            value={form.targetValue}
            onChange={(e) => set({ targetValue: e.target.value })}
            placeholder="e.g. 100"
          />
          <Input
            label="Current Value"
            type="number"
            min={0}
            value={form.currentValue}
            onChange={(e) => set({ currentValue: e.target.value })}
            placeholder="e.g. 42"
          />
          <Input
            label="Unit"
            value={form.unit}
            onChange={(e) => set({ unit: e.target.value })}
            placeholder="e.g. clients, USD, %"
          />
        </div>
      </div>

      {/* Progress */}
      <div>
        <p className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-500">Progress</p>
        <label className="mb-3 flex cursor-pointer items-center gap-2">
          <input
            type="checkbox"
            checked={form.autoProgress}
            onChange={(e) => set({ autoProgress: e.target.checked })}
            className="accent-brand-600"
          />
          <span className="text-sm text-slate-700 dark:text-slate-300">
            Auto-calculate from milestones
          </span>
        </label>
        {!form.autoProgress && (
          <div className="flex items-center gap-3">
            <input
              type="range"
              min={0}
              max={100}
              value={form.progress}
              onChange={(e) => set({ progress: parseInt(e.target.value) })}
              className="flex-1 accent-brand-600"
            />
            <span className="w-12 text-right text-sm font-semibold text-slate-700 dark:text-slate-300">
              {form.progress}%
            </span>
          </div>
        )}
        {autoCalcProgress !== null && (
          <p className="mt-1 text-xs text-slate-400">
            Will be {autoCalcProgress}% based on{' '}
            {form.milestones.filter((m) => m.completed).length}/{form.milestones.length} milestones
          </p>
        )}
      </div>

      {/* Milestones */}
      <div>
        <p className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-500">Milestones</p>
        <div className="space-y-2">
          {form.milestones.map((ms) => (
            <div
              key={ms.id}
              className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 dark:border-slate-700"
            >
              <div
                className={
                  'h-2 w-2 shrink-0 rounded-full ' +
                  (ms.completed ? 'bg-emerald-500' : 'bg-slate-300')
                }
              />
              <span
                className={
                  'flex-1 text-sm ' +
                  (ms.completed
                    ? 'line-through text-slate-400'
                    : 'text-slate-800 dark:text-slate-200')
                }
              >
                {ms.title}
              </span>
              <span className="text-xs text-slate-400">{ms.dueDate}</span>
              <button
                type="button"
                onClick={() => removeMs(ms.id)}
                className="rounded p-0.5 text-slate-300 hover:text-red-500"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
        <div className="mt-2 flex gap-2">
          <input
            className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
            placeholder="Milestone title..."
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
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
            value={newMsDue}
            onChange={(e) => setNewMsDue(e.target.value)}
          />
          <Button type="button" variant="secondary" onClick={addMs}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Assign */}
      <div>
        <p className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-500">Assign To</p>
        <div className="flex flex-wrap gap-2">
          {employees.map((emp) => (
            <button
              key={emp.id}
              type="button"
              onClick={() => toggleAssign(emp.id)}
              className={
                'flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition ' +
                (form.assignedTo.includes(emp.id)
                  ? 'bg-brand-600 text-white'
                  : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300')
              }
            >
              <Avatar name={emp.name} src={emp.profileImage} size="sm" className="h-4 w-4" />
              {emp.name}
            </button>
          ))}
          {employees.length === 0 && (
            <p className="text-xs text-slate-400">No employees added yet</p>
          )}
        </div>
      </div>

      {/* Notes */}
      <Textarea
        label="Notes"
        rows={2}
        value={form.notes}
        onChange={(e) => set({ notes: e.target.value })}
        placeholder="Additional context..."
      />
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
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-card transition hover:shadow-card-hover dark:border-slate-800 dark:bg-slate-900">
      {/* Header */}
      <div className="mb-3 flex items-start justify-between gap-2">
        <div className="flex items-start gap-2">
          <span className="mt-0.5 text-xl">{getCategoryIcon(goal.category)}</span>
          <div>
            <h3 className="font-semibold text-slate-900 dark:text-white">{goal.title}</h3>
            <p className="text-xs text-slate-500">{getCategoryLabel(goal.category)}</p>
          </div>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-1">
          <Badge className={getPriorityColor(goal.priority)}>{goal.priority}</Badge>
          <Badge className={getStatusColor(goal.status)}>
            {goal.status.replace('_', ' ')}
          </Badge>
        </div>
      </div>

      {/* Progress bar */}
      <div className="mb-3">
        <div className="mb-1 flex items-center justify-between text-xs text-slate-500">
          <span>Progress</span>
          <span className="font-semibold text-slate-700 dark:text-slate-300">{goal.progress}%</span>
        </div>
        <ProgressBar value={goal.progress} color={pColor} />
      </div>

      {/* Numeric target */}
      {goal.targetValue != null && goal.targetValue > 0 && (
        <div className="mb-3 flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2 text-sm dark:bg-slate-800">
          <TrendingUp className="h-4 w-4 text-brand-500" />
          <span className="text-slate-600 dark:text-slate-400">
            {goal.currentValue ?? 0} / {goal.targetValue}
            {goal.unit ? ' ' + goal.unit : ''}
          </span>
          <span className="ml-auto text-xs text-slate-400">
            {goal.targetValue > 0
              ? Math.round(((goal.currentValue ?? 0) / goal.targetValue) * 100)
              : 0}
            %
          </span>
        </div>
      )}

      {/* Description */}
      {goal.description && (
        <p className="mb-3 line-clamp-2 text-xs text-slate-500">{goal.description}</p>
      )}

      {/* Meta row */}
      <div className="mb-3 flex flex-wrap items-center gap-3 text-xs text-slate-500">
        <span>Due {formatDate(goal.dueDate)}</span>
        {days > 0 && goal.status !== 'completed' && goal.status !== 'cancelled' && (
          <span
            className={
              'font-medium ' +
              (days <= 7 ? 'text-red-500' : days <= 30 ? 'text-amber-500' : 'text-slate-500')
            }
          >
            {days}d left
          </span>
        )}
        {days <= 0 && goal.status !== 'completed' && goal.status !== 'cancelled' && (
          <span className="font-medium text-red-500">Overdue</span>
        )}
        {goal.milestones.length > 0 && (
          <span>
            {doneMilestones}/{goal.milestones.length} milestones
          </span>
        )}
        {assignees.length > 0 && (
          <div className="flex -space-x-1">
            {assignees.slice(0, 4).map((emp) => (
              <Avatar
                key={emp.id}
                name={emp.name}
                src={emp.profileImage}
                size="sm"
                className="h-5 w-5 ring-1 ring-white dark:ring-slate-900"
              />
            ))}
            {assignees.length > 4 && (
              <div className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-200 text-xs dark:bg-slate-700">
                +{assignees.length - 4}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Milestones expandable */}
      {goal.milestones.length > 0 && (
        <div className="mb-3">
          <button
            type="button"
            onClick={() => setExpanded((p) => !p)}
            className="mb-1 flex items-center gap-1 text-xs font-medium text-brand-600 hover:underline dark:text-brand-400"
          >
            {expanded ? 'Hide' : 'Show'} milestones ({doneMilestones}/{goal.milestones.length})
          </button>
          {expanded && (
            <div className="space-y-1.5 rounded-lg bg-slate-50 p-2 dark:bg-slate-800">
              {goal.milestones.map((ms) => (
                <div key={ms.id} className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => canWrite && onToggleMilestone(goal, ms.id)}
                    className={canWrite ? 'cursor-pointer' : 'cursor-default'}
                    title={canWrite ? (ms.completed ? 'Mark incomplete' : 'Mark complete') : ''}
                  >
                    {ms.completed ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    ) : (
                      <Circle className="h-4 w-4 text-slate-300" />
                    )}
                  </button>
                  <span
                    className={
                      'flex-1 text-xs ' +
                      (ms.completed
                        ? 'line-through text-slate-400'
                        : 'text-slate-700 dark:text-slate-300')
                    }
                  >
                    {ms.title}
                  </span>
                  <span className="text-xs text-slate-400">{ms.dueDate}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      {canWrite && (
        <div className="flex items-center gap-1 border-t border-slate-100 pt-3 dark:border-slate-800">
          <Button variant="ghost" onClick={() => onUpdateProgress(goal)} className="text-xs">
            <TrendingUp className="h-3.5 w-3.5" /> Update
          </Button>
          <div className="ml-auto flex gap-1">
            <Button variant="ghost" onClick={() => onEdit(goal)}>
              <Pencil className="h-4 w-4" />
            </Button>
            <Button variant="ghost" onClick={() => onDelete(goal)}>
              <Trash2 className="h-4 w-4 text-red-500" />
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
    <div className="space-y-5">
      <div>
        <div className="mb-2 flex items-center justify-between">
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
            Progress
          </label>
          <span className="text-lg font-bold text-brand-600">{progress}%</span>
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
        <Input
          label={'Current value (target: ' + goal.targetValue + (goal.unit ? ' ' + goal.unit : '') + ')'}
          type="number"
          min={0}
          value={currentValue}
          onChange={(e) => setCurrentValue(parseFloat(e.target.value) || 0)}
        />
      )}

      <div className="flex justify-end gap-2">
        <Button variant="secondary" onClick={onClose}>
          Cancel
        </Button>
        <Button
          onClick={() =>
            onSave(progress, goal.targetValue != null ? currentValue : undefined)
          }
        >
          Save progress
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
    <div className="space-y-6">
      {/* Stats row */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {[
          { label: 'Total Goals',   value: stats.total,                  color: 'bg-brand-500' },
          { label: 'Completed',     value: stats.completed,              color: 'bg-emerald-500' },
          { label: 'In Progress',   value: stats.inProgress,             color: 'bg-blue-500' },
          { label: 'At Risk',       value: stats.atRisk,                 color: 'bg-amber-500' },
          { label: 'Avg Progress',  value: stats.avgProgress + '%',      color: 'bg-violet-500' },
        ].map((s) => (
          <div
            key={s.label}
            className="rounded-xl border border-slate-200 bg-white p-4 shadow-card dark:border-slate-800 dark:bg-slate-900"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-500">{s.label}</p>
                <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">{s.value}</p>
              </div>
              <div className={'flex h-10 w-10 items-center justify-center rounded-xl ' + s.color}>
                <Flag className="h-5 w-5 text-white" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Main card */}
      <Card>
        <CardHeader
          title="Goals & Milestones"
          subtitle={filtered.length + ' goal' + (filtered.length !== 1 ? 's' : '')}
          action={
            canWrite && (
              <Button onClick={openCreate}>
                <Plus className="h-4 w-4" /> New goal
              </Button>
            )
          }
        />

        {/* Filters */}
        <div className="mb-5 flex flex-wrap gap-2">
          <input
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
            placeholder="Search goals..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            <option value="">All categories</option>
            {GOAL_CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
          <select
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">All statuses</option>
            {GOAL_STATUSES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
          <select
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
          >
            <option value="">All priorities</option>
            {GOAL_PRIORITIES.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </select>
        </div>

        {/* Goals grid */}
        {filtered.length === 0 ? (
          <EmptyState
            icon={Target}
            title="No goals yet"
            description={
              canWrite
                ? 'Set your first goal to start tracking progress'
                : 'No goals available'
            }
          />
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
      </Card>

      {/* Create / Edit Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Edit — ' + editing.title : 'New Goal'}
        size="xl"
      >
        <div className="space-y-6">
          <GoalForm form={form} onChange={setForm} employees={employees} />
          <div className="sticky bottom-0 flex justify-end gap-3 border-t border-slate-200 bg-white py-4 dark:border-slate-700 dark:bg-slate-900">
            <Button variant="secondary" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} loading={saving}>
              {editing ? 'Update' : 'Create'} Goal
            </Button>
          </div>
        </div>
      </Modal>

      {/* Update Progress Modal */}
      <Modal
        open={!!progressTarget}
        onClose={() => setProgressTarget(null)}
        title={'Update Progress — ' + (progressTarget?.title ?? '')}
        size="sm"
      >
        {progressTarget && (
          <UpdateProgressModal
            goal={progressTarget}
            onClose={() => setProgressTarget(null)}
            onSave={handleUpdateProgress}
          />
        )}
      </Modal>

      {/* Delete Confirm */}
      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete goal"
        message={'Delete "' + (deleteTarget?.title ?? '') + '"? All milestones will be lost.'}
        confirmLabel="Delete"
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => { if (!deleting) setDeleteTarget(null) }}
      />
    </div>
  )
}
