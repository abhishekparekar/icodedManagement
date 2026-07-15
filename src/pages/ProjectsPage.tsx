import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowRight, Pencil, Plus, Trash2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card, CardHeader } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { Pagination } from '@/components/ui/Pagination'
import { Select } from '@/components/ui/Select'
import { Textarea } from '@/components/ui/Textarea'
import { PAGE_SIZE, PROJECT_STATUSES } from '@/lib/constants'
import { canManageProjects } from '@/lib/permissions'
import { paginate, totalPages } from '@/lib/utils'
import { projectSchema, type ProjectForm } from '@/schemas'
import { createProject, deleteProject, updateProject } from '@/services/projects.service'
import { useAuthStore } from '@/stores/authStore'
import { useDataStore } from '@/stores/dataStore'
import { filterProjects, useEmployeeScopedProjects } from '@/hooks/useFilteredData'
import type { Project } from '@/types'

export function ProjectsPage() {
  const user = useAuthStore((s) => s.user)
  const allProjects = useDataStore((s) => s.projects)
  const employees = useDataStore((s) => s.employees)
  const scoped = useEmployeeScopedProjects(user)
  const projects = user?.role === 'employee' ? scoped : allProjects
  const canWrite = canManageProjects(user)

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [page, setPage] = useState(1)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Project | null>(null)
  const [saving, setSaving] = useState(false)
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([])

  const filtered = useMemo(
    () => filterProjects(projects, search, statusFilter),
    [projects, search, statusFilter],
  )
  const paged = paginate(filtered, page, PAGE_SIZE)
  const pages = totalPages(filtered.length, PAGE_SIZE)

  const { register, handleSubmit, reset, formState: { errors } } = useForm<ProjectForm>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      status: 'pending',
      progress: 0,
      startDate: new Date().toISOString().slice(0, 10),
      endDate: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
    },
  })

  const openCreate = () => {
    setEditing(null)
    setSelectedEmployees([])
    reset({
      name: '',
      description: '',
      status: 'pending',
      progress: 0,
      startDate: new Date().toISOString().slice(0, 10),
      endDate: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
    })
    setModalOpen(true)
  }

  const openEdit = (project: Project) => {
    setEditing(project)
    setSelectedEmployees(project.assignedEmployees)
    reset({
      name: project.name,
      description: project.description,
      status: project.status,
      progress: project.progress,
      startDate: project.startDate.slice(0, 10),
      endDate: project.endDate.slice(0, 10),
    })
    setModalOpen(true)
  }

  const toggleEmployee = (id: string) => {
    setSelectedEmployees((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    )
  }

  const onSubmit = async (data: ProjectForm) => {
    if (!user?.tenantId) {
      toast.error('Not authenticated')
      return
    }
    setSaving(true)
    const payload = { ...data, assignedEmployees: selectedEmployees }
    try {
      if (editing) {
        await updateProject(editing.id, user.tenantId, payload, user)
        toast.success('Project updated')
      } else {
        await createProject(user.tenantId, payload, user)
        toast.success('Project created')
      }
      setModalOpen(false)
    } catch (e) {
      console.error('Project save error:', e)
      const msg = e instanceof Error ? e.message : String(e)
      toast.error(`Save failed: ${msg}`)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (project: Project) => {
    if (!user?.tenantId || !confirm(`Delete ${project.name}?`)) return
    try {
      await deleteProject(project.id, user.tenantId, project.name, user)
      toast.success('Project deleted')
    } catch {
      toast.error('Delete failed')
    }
  }

  const statusColor = (status: string) =>
    PROJECT_STATUSES.find((s) => s.value === status)?.color ?? ''

  return (
    <div className="space-y-3 sm:space-y-5">
      <Card>
        <CardHeader
          title="Projects"
          subtitle={`${filtered.length} projects`}
          action={
            canWrite && (
              <Button onClick={openCreate}>
                <Plus className="h-4 w-4" /> New project
              </Button>
            )
          }
        />
        <div className="mb-4 flex flex-wrap gap-3">
          <Input
            placeholder="Search projects..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-xs"
          />
          <select
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">All statuses</option>
            {PROJECT_STATUSES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {paged.map((project) => (
            <div
              key={project.id}
              className="rounded-xl border border-slate-200 p-4 transition hover:shadow-card-hover dark:border-slate-800"
            >
              <div className="mb-2 flex items-start justify-between">
                <h3 className="font-semibold text-slate-900 dark:text-white">{project.name}</h3>
                <Badge className={statusColor(project.status)}>{project.status}</Badge>
              </div>
              <p className="mb-3 line-clamp-2 text-sm text-slate-500">{project.description}</p>
              <div className="mb-2">
                <div className="mb-1 flex justify-between text-xs text-slate-500">
                  <span>Progress</span>
                  <span>{project.progress}%</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                  <div
                    className="h-full rounded-full bg-brand-500 transition-all"
                    style={{ width: `${project.progress}%` }}
                  />
                </div>
              </div>
              <p className="text-xs text-slate-400">
                {project.startDate.slice(0, 10)} → {project.endDate.slice(0, 10)}
              </p>
              <div className="mt-4 flex items-center justify-between">
                <Link
                  to={`/projects/${project.id}`}
                  className="inline-flex items-center gap-1 text-sm font-medium text-brand-600 hover:underline"
                >
                  View details <ArrowRight className="h-4 w-4" />
                </Link>
                {canWrite && (
                  <div className="flex gap-1">
                    <Button variant="ghost" onClick={() => openEdit(project)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" onClick={() => handleDelete(project)}>
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
        <Pagination page={page} totalPages={pages} onPageChange={setPage} />
      </Card>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit project' : 'New project'} size="lg">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input label="Project name" {...register('name')} error={errors.name?.message} />
          <Textarea label="Description" {...register('description')} error={errors.description?.message} />
          <div className="grid gap-4 sm:grid-cols-2">
            <Select label="Status" options={PROJECT_STATUSES.map((s) => ({ value: s.value, label: s.label }))} {...register('status')} />
            <Input label="Progress %" type="number" min={0} max={100} {...register('progress')} />
            <Input label="Start date" type="date" {...register('startDate')} />
            <Input label="End date" type="date" {...register('endDate')} />
          </div>
          <div>
            <p className="mb-2 text-sm font-medium text-slate-700 dark:text-slate-300">Assign employees</p>
            <div className="flex flex-wrap gap-2">
              {employees.map((emp) => (
                <button
                  key={emp.id}
                  type="button"
                  onClick={() => toggleEmployee(emp.id)}
                  className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                    selectedEmployees.includes(emp.id)
                      ? 'bg-brand-600 text-white'
                      : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                  }`}
                >
                  {emp.name}
                </button>
              ))}
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={saving}>
              Save
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
