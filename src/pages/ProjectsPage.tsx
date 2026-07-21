import { zodResolver } from '@hookform/resolvers/zod'
import {
  ArrowRight,
  Briefcase,
  CheckCircle2,
  Clock,
  Pencil,
  Plus,
  Search,
  Trash2,
  X,
} from 'lucide-react'
import { useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { Pagination } from '@/components/ui/Pagination'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { Select } from '@/components/ui/Select'
import { StatCard } from '@/components/ui/StatCard'
import { Textarea } from '@/components/ui/Textarea'
import { filterProjects, useEmployeeScopedProjects } from '@/hooks/useFilteredData'
import { PAGE_SIZE, PROJECT_STATUSES } from '@/lib/constants'
import { canManageProjects } from '@/lib/permissions'
import { formatDate, paginate, totalPages } from '@/lib/utils'
import { projectSchema, type ProjectForm } from '@/schemas'
import { createProject, deleteProject, updateProject } from '@/services/projects.service'
import { useAuthStore } from '@/stores/authStore'
import { useDataStore } from '@/stores/dataStore'
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

  const stats = useMemo(() => {
    const total = projects.length
    const ongoing = projects.filter((p) => p.status === 'ongoing').length
    const completed = projects.filter((p) => p.status === 'completed').length
    const pending = projects.filter((p) => p.status === 'pending').length

    return { total, ongoing, completed, pending }
  }, [projects])

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
    PROJECT_STATUSES.find((s) => s.value === status)?.color ?? 'bg-slate-100 text-slate-700'

  const getAssignedNames = (ids: string[]) => {
    return employees.filter((e) => ids.includes(e.id))
  }

  return (
    <div className="space-y-4 sm:space-y-5">

      {/* ── KPI Metric Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-5">
        <StatCard title="Total Projects" value={stats.total}     icon={Briefcase}    to="/projects" gradient="from-indigo-500 to-violet-600" delay="delay-75" />
        <StatCard title="Ongoing"        value={stats.ongoing}   icon={Clock}        to="/projects" gradient="from-blue-500 to-cyan-500"    delay="delay-150" />
        <StatCard title="Completed"      value={stats.completed} icon={CheckCircle2} to="/projects" gradient="from-emerald-500 to-teal-600" delay="delay-225" />
        <StatCard title="Pending Scope"  value={stats.pending}   icon={Clock}        to="/projects" gradient="from-amber-500 to-orange-500"  delay="delay-300" />
      </div>

      {/* ── Integrated Control Bar: Search + Status Filter + Add Project ── */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3 sm:p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
        
        {/* Search & Status Filter */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 flex-1 max-w-xl">
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-400 pointer-events-none" />
            <input
              className="h-9 w-full rounded-xl border border-slate-200/90 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 pl-9 pr-8 text-xs font-semibold text-slate-700 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all"
              placeholder="Search projects..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setPage(1)
              }}
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

          {/* Status Filter */}
          <select
            className="h-9 w-full rounded-xl border border-slate-200/90 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-3 text-xs font-semibold text-slate-700 dark:text-slate-200 focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all"
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value)
              setPage(1)
            }}
          >
            <option value="">All Statuses</option>
            {PROJECT_STATUSES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>

        {/* Reset & Add Project Button */}
        <div className="flex items-center gap-2 shrink-0 justify-between sm:justify-end">
          {(search || statusFilter) && (
            <button
              onClick={() => { setSearch(''); setStatusFilter(''); setPage(1) }}
              className="text-xs font-bold text-brand-600 dark:text-brand-400 hover:underline px-2"
            >
              Reset
            </button>
          )}

          {canWrite && (
            <Button onClick={openCreate} className="h-9 text-xs font-bold bg-gradient-to-r from-brand-600 to-violet-600 hover:from-brand-700 hover:to-violet-700 text-white shadow-md shadow-brand-500/20">
              <Plus className="h-4 w-4" /> New Project
            </Button>
          )}
        </div>
      </div>

      {/* ── Projects Grid Stream ── */}
      <Card className="!p-4 sm:!p-6 space-y-4">
        {paged.length === 0 ? (
          <EmptyState
            icon={Briefcase}
            title="No projects found"
            description={search || statusFilter ? 'Try clearing your search filters.' : 'Click "New Project" to create your first workspace project.'}
          />
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {paged.map((project) => {
              const assigned = getAssignedNames(project.assignedEmployees)
              return (
                <div
                  key={project.id}
                  className="group relative flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white dark:border-slate-800/80 dark:bg-slate-900 p-4 sm:p-5 shadow-xs transition-all duration-300 hover:shadow-lg hover:-translate-y-1 hover:border-brand-300 dark:hover:border-brand-800"
                >
                  <div>
                    {/* Header: Name + Status Badge */}
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h3 className="font-extrabold text-slate-900 dark:text-white text-base leading-snug line-clamp-1">
                        {project.name}
                      </h3>
                      <Badge className={`shrink-0 uppercase tracking-wider text-[10px] font-black ${statusColor(project.status)}`}>
                        {project.status}
                      </Badge>
                    </div>

                    {/* Description */}
                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mb-3">
                      {project.description || 'No description provided.'}
                    </p>

                    {/* Progress Bar */}
                    <div className="space-y-1 mb-4">
                      <div className="flex justify-between text-xs font-bold text-slate-500 dark:text-slate-400">
                        <span>Progress</span>
                        <span className="text-brand-600 dark:text-brand-400">{project.progress}%</span>
                      </div>
                      <ProgressBar value={project.progress} className="h-2" />
                    </div>
                  </div>

                  <div>
                    {/* Assigned Employees & Dates */}
                    <div className="flex items-center justify-between gap-2 pt-3 border-t border-slate-100 dark:border-slate-800/60 text-xs text-slate-400">
                      {/* Avatar Stack */}
                      <div className="flex items-center -space-x-2">
                        {assigned.length === 0 ? (
                          <span className="text-[11px] font-semibold text-slate-400">Unassigned</span>
                        ) : (
                          assigned.slice(0, 4).map((emp) => (
                            <Avatar key={emp.id} name={emp.name} src={emp.profileImage} size="sm" className="h-6 w-6 text-[9px] ring-2 ring-white dark:ring-slate-900" />
                          ))
                        )}
                        {assigned.length > 4 && (
                          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-[10px] font-bold text-slate-600 dark:text-slate-300 ring-2 ring-white dark:ring-slate-900">
                            +{assigned.length - 4}
                          </span>
                        )}
                      </div>

                      {/* Date Range */}
                      <span className="font-semibold text-[11px]">
                        {formatDate(project.endDate)}
                      </span>
                    </div>

                    {/* Footer Actions */}
                    <div className="mt-4 flex items-center justify-between gap-2">
                      <Link
                        to={`/projects/${project.id}`}
                        className="inline-flex items-center gap-1.5 text-xs font-extrabold text-brand-600 dark:text-brand-400 hover:underline"
                      >
                        View Project <ArrowRight className="h-3.5 w-3.5" />
                      </Link>

                      {canWrite && (
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" className="h-8 w-8 p-0" onClick={() => openEdit(project)} title="Edit">
                            <Pencil className="h-4 w-4 text-slate-400 hover:text-brand-600" />
                          </Button>
                          <Button variant="ghost" className="h-8 w-8 p-0" onClick={() => handleDelete(project)} title="Delete">
                            <Trash2 className="h-4 w-4 text-red-500 hover:text-red-600" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {pages > 1 && (
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80">
            <Pagination page={page} totalPages={pages} onPageChange={setPage} />
          </div>
        )}
      </Card>

      {/* ── Responsive Project Modal ── */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Project Details' : 'Create New Project'} size="lg">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input label="Project Name" {...register('name')} error={errors.name?.message} placeholder="Mobile App Redesign" />
          <Textarea label="Project Description" {...register('description')} error={errors.description?.message} placeholder="Scope, deliverables, requirements..." rows={3} />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select label="Project Status" options={PROJECT_STATUSES.map((s) => ({ value: s.value, label: s.label }))} {...register('status')} />
            <Input label="Progress % (0 - 100)" type="number" min={0} max={100} {...register('progress')} />
            <Input label="Start Date" type="date" {...register('startDate')} />
            <Input label="Target End Date" type="date" {...register('endDate')} />
          </div>

          <div>
            <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Assign Team Members
            </label>
            <div className="flex flex-wrap gap-2">
              {employees.map((emp) => {
                const selected = selectedEmployees.includes(emp.id)
                return (
                  <button
                    key={emp.id}
                    type="button"
                    onClick={() => toggleEmployee(emp.id)}
                    className={`rounded-xl px-3 py-1.5 text-xs font-bold transition-all active:scale-95 flex items-center gap-1.5 ${
                      selected
                        ? 'bg-gradient-to-r from-brand-600 to-violet-600 text-white shadow-xs'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    <Avatar name={emp.name} src={emp.profileImage} size="sm" className="h-4 w-4 text-[8px]" />
                    <span>{emp.name}</span>
                  </button>
                )
              })}
            </div>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100 dark:border-slate-800">
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)} className="px-4 text-xs font-bold">
              Cancel
            </Button>
            <Button type="submit" loading={saving} className="bg-gradient-to-r from-brand-600 to-violet-600 text-white font-bold px-5 text-xs shadow-md shadow-brand-500/20">
              {editing ? 'Save Changes' : 'Create Project'}
            </Button>
          </div>
        </form>
      </Modal>

    </div>
  )
}
