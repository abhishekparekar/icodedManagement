import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowLeft, KanbanSquare, List, Pencil, Plus, Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { Select } from '@/components/ui/Select'
import { Tabs } from '@/components/ui/Tabs'
import { PROJECT_STATUSES, TASK_STATUSES } from '@/lib/constants'
import { canManageProjects, hasPermission } from '@/lib/permissions'
import { formatDate } from '@/lib/utils'
import { taskSchema, type TaskForm } from '@/schemas'
import { createTask, deleteTask, subscribeTasks, updateTask } from '@/services/tasks.service'
import { useAuthStore } from '@/stores/authStore'
import { useDataStore } from '@/stores/dataStore'
import type { Task } from '@/types'

const TASK_STATUS_COLORS: Record<string, string> = {
  todo: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
  in_progress: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300',
  done: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300',
}

const VIEW_TABS = [
  { value: 'kanban', label: 'Kanban', icon: <KanbanSquare className="h-4 w-4" /> },
  { value: 'list', label: 'List', icon: <List className="h-4 w-4" /> },
]

export function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>()
  const user = useAuthStore((s) => s.user)
  const projects = useDataStore((s) => s.projects)
  const employees = useDataStore((s) => s.employees)
  const project = projects.find((p) => p.id === id)

  const [tasks, setTasks] = useState<Task[]>([])
  const [modalOpen, setModalOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Task | null>(null)
  const [saving, setSaving] = useState(false)
  const [view, setView] = useState<'kanban' | 'list'>('kanban')
  const canWrite = canManageProjects(user)

  const employeeOptions = [
    { value: '', label: 'Unassigned' },
    ...employees.map((e) => ({ value: e.id, label: e.name })),
  ]

  const { register, handleSubmit, reset, formState: { errors } } = useForm<TaskForm>({
    resolver: zodResolver(taskSchema),
    defaultValues: { status: 'todo', dueDate: new Date().toISOString().slice(0, 10) },
  })

  useEffect(() => {
    if (!id) return
    return subscribeTasks(id, setTasks)
  }, [id])

  if (!project) {
    return (
      <Card>
        <p className="text-slate-500">Project not found.</p>
        <Link to="/projects" className="mt-4 inline-flex text-brand-600">
          <ArrowLeft className="mr-1 h-4 w-4" /> Back to projects
        </Link>
      </Card>
    )
  }

  const openCreate = () => {
    setEditingTask(null)
    reset({ title: '', assignedTo: '', status: 'todo', dueDate: new Date().toISOString().slice(0, 10) })
    setModalOpen(true)
  }

  const openEdit = (task: Task) => {
    setEditingTask(task)
    reset({
      title: task.title,
      assignedTo: task.assignedTo,
      status: task.status,
      dueDate: task.dueDate.slice(0, 10),
    })
    setModalOpen(true)
  }

  const onSubmit = async (data: TaskForm) => {
    if (!user?.tenantId || !id) return
    setSaving(true)
    try {
      if (editingTask) {
        await updateTask(id, editingTask.id, user.tenantId, data, user)
        toast.success('Task updated')
      } else {
        await createTask(id, user.tenantId, data, user, project.name)
        toast.success('Task created')
      }
      setModalOpen(false)
      reset()
    } catch {
      toast.error('Failed to save task')
    } finally {
      setSaving(false)
    }
  }

  const updateStatus = async (task: Task, status: Task['status']) => {
    if (!user?.tenantId || !id) return
    try {
      await updateTask(id, task.id, user.tenantId, { status }, user)
    } catch {
      toast.error('Update failed')
    }
  }

  const confirmDelete = async () => {
    if (!deleteTarget || !user?.tenantId || !id) return
    try {
      await deleteTask(id, deleteTarget.id, user.tenantId, deleteTarget.title, user)
      toast.success('Task deleted')
    } catch {
      toast.error('Delete failed')
    } finally {
      setDeleteTarget(null)
    }
  }

  const statusColor = PROJECT_STATUSES.find((s) => s.value === project.status)?.color ?? ''

  const getEmployee = (id: string) => employees.find((e) => e.id === id)

  return (
    <div className="space-y-6">
      <Link to="/projects" className="inline-flex items-center gap-1 text-sm text-brand-600 hover:underline">
        <ArrowLeft className="h-4 w-4" /> Back to projects
      </Link>

      {/* Project header */}
      <Card>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{project.name}</h2>
            <p className="mt-2 max-w-2xl text-slate-500">{project.description}</p>
          </div>
          <Badge className={statusColor}>{project.status}</Badge>
        </div>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="text-xs text-slate-500">Timeline</p>
            <p className="font-medium">{formatDate(project.startDate)} – {formatDate(project.endDate)}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Progress</p>
            <div className="mt-1 flex items-center gap-2">
              <ProgressBar value={project.progress} showLabel className="flex-1" />
            </div>
          </div>
          <div>
            <p className="text-xs text-slate-500">Tasks</p>
            <p className="font-medium">
              {tasks.filter((t) => t.status === 'done').length} / {tasks.length} done
            </p>
          </div>
          <div>
            <p className="mb-1 text-xs text-slate-500">Team</p>
            <div className="flex -space-x-2">
              {project.assignedEmployees.slice(0, 5).map((eid) => {
                const emp = getEmployee(eid)
                return emp ? (
                  <Avatar key={eid} name={emp.name} src={emp.profileImage} size="sm" className="ring-2 ring-white dark:ring-slate-900" />
                ) : null
              })}
              {project.assignedEmployees.length > 5 && (
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-200 text-xs font-medium ring-2 ring-white dark:bg-slate-700 dark:ring-slate-900">
                  +{project.assignedEmployees.length - 5}
                </div>
              )}
            </div>
            {!project.assignedEmployees.length && (
              <p className="text-sm text-slate-400">No assignees</p>
            )}
          </div>
        </div>
      </Card>

      {/* Tasks section */}
      <Card>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Tasks</h3>
            <p className="text-sm text-slate-500">{tasks.length} tasks total</p>
          </div>
          <div className="flex items-center gap-2">
            <Tabs
              tabs={VIEW_TABS}
              active={view}
              onChange={(v) => setView(v as 'kanban' | 'list')}
              className="w-auto"
            />
            {canWrite && (
              <Button onClick={openCreate}>
                <Plus className="h-4 w-4" /> Add task
              </Button>
            )}
          </div>
        </div>

        {/* Kanban view */}
        {view === 'kanban' && (
          <div className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory md:grid md:grid-cols-3 md:overflow-x-visible md:pb-0">
            {TASK_STATUSES.map((col) => {
              const colTasks = tasks.filter((t) => t.status === col.value)
              return (
                <div key={col.value} className="w-[85vw] sm:w-[320px] shrink-0 snap-align-start rounded-xl bg-slate-50 p-3 dark:bg-slate-800/50 md:w-auto md:shrink">
                  <div className="mb-3 flex items-center justify-between">
                    <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                      {col.label}
                    </span>
                    <Badge className={TASK_STATUS_COLORS[col.value]}>{colTasks.length}</Badge>
                  </div>
                  <div className="space-y-2">
                    {colTasks.length === 0 && (
                      <p className="py-4 text-center text-xs text-slate-400">No tasks</p>
                    )}
                    {colTasks.map((task) => {
                      const assignee = getEmployee(task.assignedTo)
                      return (
                        <div
                          key={task.id}
                          className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-700 dark:bg-slate-900"
                        >
                          <p className="font-medium text-slate-900 dark:text-white">{task.title}</p>
                          <div className="mt-2 flex items-center justify-between">
                            <div className="flex items-center gap-1.5">
                              {assignee && (
                                <Avatar name={assignee.name} src={assignee.profileImage} size="sm" />
                              )}
                              <span className="text-xs text-slate-500">
                                {assignee?.name ?? 'Unassigned'}
                              </span>
                            </div>
                            <span className="text-xs text-slate-400">
                              {task.dueDate.slice(0, 10)}
                            </span>
                          </div>
                          {hasPermission(user, 'tasks:write') && (
                            <div className="mt-2 flex gap-1">
                              {TASK_STATUSES.filter((s) => s.value !== task.status).map((s) => (
                                <button
                                  key={s.value}
                                  onClick={() => updateStatus(task, s.value)}
                                  className="rounded px-1.5 py-0.5 text-xs text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                                >
                                  → {s.label}
                                </button>
                              ))}
                              {canWrite && (
                                <>
                                  <button
                                    onClick={() => openEdit(task)}
                                    className="ml-auto rounded p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                                  >
                                    <Pencil className="h-3 w-3" />
                                  </button>
                                  <button
                                    onClick={() => setDeleteTarget(task)}
                                    className="rounded p-1 text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </button>
                                </>
                              )}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* List view */}
        {view === 'list' && (
          <div className="space-y-2">
            {tasks.length === 0 ? (
              <p className="py-8 text-center text-sm text-slate-500">No tasks yet. Add one to get started.</p>
            ) : (
              tasks.map((task) => {
                const assignee = getEmployee(task.assignedTo)
                return (
                  <div
                    key={task.id}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-200 p-3 dark:border-slate-800"
                  >
                    <div className="flex items-center gap-3">
                      {assignee && (
                        <Avatar name={assignee.name} src={assignee.profileImage} size="sm" />
                      )}
                      <div>
                        <p className="font-medium text-slate-900 dark:text-white">{task.title}</p>
                        <p className="text-xs text-slate-500">
                          {assignee?.name ?? 'Unassigned'} · Due {task.dueDate.slice(0, 10)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={TASK_STATUS_COLORS[task.status]}>
                        {TASK_STATUSES.find((s) => s.value === task.status)?.label}
                      </Badge>
                      {hasPermission(user, 'tasks:write') && (
                        <select
                          value={task.status}
                          onChange={(e) => updateStatus(task, e.target.value as Task['status'])}
                          className="rounded-lg border border-slate-200 px-2 py-1 text-xs dark:border-slate-700 dark:bg-slate-900"
                        >
                          {TASK_STATUSES.map((s) => (
                            <option key={s.value} value={s.value}>
                              {s.label}
                            </option>
                          ))}
                        </select>
                      )}
                      {canWrite && (
                        <>
                          <Button variant="ghost" onClick={() => openEdit(task)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" onClick={() => setDeleteTarget(task)}>
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                )
              })
            )}
          </div>
        )}
      </Card>

      {/* Task modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingTask ? 'Edit task' : 'Add task'}
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input label="Title" {...register('title')} error={errors.title?.message} />
          <Select label="Assign to" options={employeeOptions} {...register('assignedTo')} />
          <Select
            label="Status"
            options={TASK_STATUSES.map((s) => ({ value: s.value, label: s.label }))}
            {...register('status')}
          />
          <Input label="Due date" type="date" {...register('dueDate')} />
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={saving}>
              {editingTask ? 'Update' : 'Create'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete confirm */}
      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete task"
        message={`Are you sure you want to delete "${deleteTarget?.title}"? This cannot be undone.`}
        confirmLabel="Delete"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  )
}
