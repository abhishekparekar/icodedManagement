import { zodResolver } from '@hookform/resolvers/zod'
import {
  CheckCircle2,
  LayoutGrid,
  List,
  Pencil,
  Plus,
  Search,
  Target,
  Trash2,
  UserCheck,
  X,
  Zap,
} from 'lucide-react'
import { useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { Pagination } from '@/components/ui/Pagination'
import { Select } from '@/components/ui/Select'
import { StatCard } from '@/components/ui/StatCard'
import { Textarea } from '@/components/ui/Textarea'
import { LEAD_SOURCES, LEAD_STATUSES, PAGE_SIZE } from '@/lib/constants'
import { canManageLeads } from '@/lib/permissions'
import { paginate, totalPages } from '@/lib/utils'
import { leadSchema, type LeadForm } from '@/schemas'
import { createLead, deleteLead, updateLead } from '@/services/leads.service'
import { useAuthStore } from '@/stores/authStore'
import { useDataStore } from '@/stores/dataStore'
import type { Lead } from '@/types'

export function LeadsPage() {
  const user = useAuthStore((s) => s.user)
  const leads = useDataStore((s) => s.leads)
  const employees = useDataStore((s) => s.employees)
  const canWrite = canManageLeads(user)

  const [view, setView] = useState<'kanban' | 'table'>('kanban')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [sourceFilter, setSourceFilter] = useState('')
  const [assignedFilter, setAssignedFilter] = useState('')
  const [page, setPage] = useState(1)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Lead | null>(null)
  const [saving, setSaving] = useState(false)

  const stats = useMemo(() => {
    const total = leads.length
    const newLeads = leads.filter((l) => l.status === 'new').length
    const inProgress = leads.filter((l) => l.status === 'in_progress').length
    const converted = leads.filter((l) => l.status === 'converted').length

    return { total, newLeads, inProgress, converted }
  }, [leads])

  const employeeOptions = [
    { value: '', label: 'Unassigned' },
    ...employees.map((e) => ({ value: e.id, label: e.name })),
  ]

  // Comprehensive multi-field filter
  const filtered = useMemo(() => {
    return leads.filter((lead) => {
      const matchesStatus = !statusFilter || lead.status === statusFilter
      const matchesSource = !sourceFilter || lead.source === sourceFilter
      const matchesAssigned = !assignedFilter || lead.assignedTo === assignedFilter
      const query = search.toLowerCase().trim()
      const matchesSearch =
        !query ||
        lead.clientName.toLowerCase().includes(query) ||
        lead.contact.toLowerCase().includes(query) ||
        (lead.notes && lead.notes.toLowerCase().includes(query))

      return matchesStatus && matchesSource && matchesAssigned && matchesSearch
    })
  }, [leads, search, statusFilter, sourceFilter, assignedFilter])

  const paged = paginate(filtered, page, PAGE_SIZE)
  const pages = totalPages(filtered.length, PAGE_SIZE)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<LeadForm>({
    resolver: zodResolver(leadSchema),
    defaultValues: { status: 'new', source: LEAD_SOURCES[0], notes: '' },
  })

  const openCreate = () => {
    setEditing(null)
    reset({ clientName: '', contact: '', source: LEAD_SOURCES[0], status: 'new', assignedTo: '', notes: '' })
    setModalOpen(true)
  }

  const openEdit = (lead: Lead) => {
    setEditing(lead)
    reset({
      clientName: lead.clientName,
      contact: lead.contact,
      source: lead.source,
      status: lead.status,
      assignedTo: lead.assignedTo,
      notes: lead.notes,
    })
    setModalOpen(true)
  }

  const onSubmit = async (data: LeadForm) => {
    if (!user?.tenantId) return
    setSaving(true)
    try {
      if (editing) {
        await updateLead(editing.id, user.tenantId, data, user)
        toast.success('Lead updated')
      } else {
        await createLead(user.tenantId, data, user)
        toast.success('Lead created')
      }
      setModalOpen(false)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (lead: Lead) => {
    if (!user?.tenantId || !confirm(`Delete lead ${lead.clientName}?`)) return
    try {
      await deleteLead(lead.id, user.tenantId, lead.clientName, user)
      toast.success('Lead deleted')
    } catch {
      toast.error('Delete failed')
    }
  }

  const statusColor = (status: string) =>
    LEAD_STATUSES.find((s) => s.value === status)?.color ?? 'bg-slate-100 text-slate-700'

  const getAssignee = (id: string) => employees.find((e) => e.id === id)?.name ?? 'Unassigned'

  return (
    <div className="space-y-4 sm:space-y-5">

      {/* ── KPI Metric Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-5">
        <StatCard title="Total Leads"   value={stats.total}      icon={Target}       to="/leads" gradient="from-brand-500 to-violet-600" delay="delay-75" />
        <StatCard title="New Pipeline"  value={stats.newLeads}   icon={Zap}          to="/leads" gradient="from-blue-500 to-cyan-500"    delay="delay-150" />
        <StatCard title="In Progress"   value={stats.inProgress} icon={UserCheck}    to="/leads" gradient="from-amber-500 to-orange-500"  delay="delay-225" />
        <StatCard title="Converted"     value={stats.converted}  icon={CheckCircle2} to="/leads" gradient="from-emerald-500 to-teal-600" delay="delay-300" />
      </div>

      {/* ── Comprehensive Filter & Control Bar ── */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3 sm:p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
        
        {/* Search & Multi-Select Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 flex-1 max-w-3xl">
          {/* Search Input */}
          <div className="relative sm:col-span-1">
            <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-400 pointer-events-none" />
            <input
              className="h-9 w-full rounded-xl border border-slate-200/90 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 pl-9 pr-8 text-xs font-semibold text-slate-700 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all"
              placeholder="Search client name or contact..."
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

          {/* Status Filter Dropdown */}
          <select
            className="h-9 w-full rounded-xl border border-slate-200/90 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-3 text-xs font-semibold text-slate-700 dark:text-slate-200 focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all"
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value)
              setPage(1)
            }}
          >
            <option value="">All Statuses</option>
            {LEAD_STATUSES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>

          {/* Source Filter Dropdown */}
          <select
            className="h-9 w-full rounded-xl border border-slate-200/90 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-3 text-xs font-semibold text-slate-700 dark:text-slate-200 focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all"
            value={sourceFilter}
            onChange={(e) => {
              setSourceFilter(e.target.value)
              setPage(1)
            }}
          >
            <option value="">All Sources</option>
            {LEAD_SOURCES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        {/* View Toggle & Action Buttons */}
        <div className="flex items-center gap-2 shrink-0 justify-between sm:justify-end">
          {(search || statusFilter || sourceFilter || assignedFilter) && (
            <button
              onClick={() => { setSearch(''); setStatusFilter(''); setSourceFilter(''); setAssignedFilter(''); setPage(1) }}
              className="text-xs font-bold text-brand-600 dark:text-brand-400 hover:underline px-2"
            >
              Reset
            </button>
          )}

          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
            <button
              onClick={() => setView('kanban')}
              className={`flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                view === 'kanban'
                  ? 'bg-white dark:bg-slate-900 text-brand-600 dark:text-brand-400 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <LayoutGrid className="h-3.5 w-3.5" /> Kanban
            </button>
            <button
              onClick={() => setView('table')}
              className={`flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                view === 'table'
                  ? 'bg-white dark:bg-slate-900 text-brand-600 dark:text-brand-400 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <List className="h-3.5 w-3.5" /> Table
            </button>
          </div>

          {canWrite && (
            <Button onClick={openCreate} className="h-9 text-xs font-bold bg-gradient-to-r from-brand-600 to-violet-600 hover:from-brand-700 hover:to-violet-700 text-white shadow-md shadow-brand-500/20">
              <Plus className="h-4 w-4" /> Add Lead
            </Button>
          )}
        </div>
      </div>

      {/* ── Kanban / Table View Container ── */}
      {view === 'kanban' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-start">
          {LEAD_STATUSES.map((col) => {
            const columnLeads = filtered.filter((l) => l.status === col.value)
            return (
              <div
                key={col.value}
                className="flex flex-col rounded-2xl border border-slate-200/80 bg-slate-50/80 dark:border-slate-800/80 dark:bg-slate-900/40 p-3.5 space-y-3"
              >
                {/* Column Header */}
                <div className="flex items-center justify-between px-1">
                  <span className="text-xs font-extrabold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                    {col.label}
                  </span>
                  <span className={`rounded-lg px-2 py-0.5 text-xs font-black ${col.color}`}>
                    {columnLeads.length}
                  </span>
                </div>

                {/* Column Lead Cards */}
                <div className="space-y-2.5 flex-1">
                  {columnLeads.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-slate-200 dark:border-slate-800 p-6 text-center text-xs text-slate-400">
                      No leads in {col.label.toLowerCase()}
                    </div>
                  ) : (
                    columnLeads.map((lead) => (
                      <div
                        key={lead.id}
                        className="group relative flex flex-col justify-between rounded-xl border border-slate-200/80 bg-white p-3.5 shadow-xs transition-all duration-200 hover:shadow-md hover:border-brand-300 dark:border-slate-800/80 dark:bg-slate-900 dark:hover:border-brand-800 space-y-2"
                      >
                        <div>
                          <div className="flex items-start justify-between gap-2">
                            <p className="font-bold text-slate-900 dark:text-white text-sm leading-snug">
                              {lead.clientName}
                            </p>
                            {canWrite && (
                              <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100">
                                <button
                                  onClick={() => openEdit(lead)}
                                  className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-brand-600 dark:hover:bg-slate-800"
                                  title="Edit"
                                >
                                  <Pencil className="h-3.5 w-3.5" />
                                </button>
                                <button
                                  onClick={() => handleDelete(lead)}
                                  className="rounded-lg p-1 text-slate-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40"
                                  title="Delete"
                                >
                                  <Trash2 className="h-3.5 w-3.5 text-red-500" />
                                </button>
                              </div>
                            )}
                          </div>
                          <p className="text-xs text-slate-400 mt-0.5 truncate">{lead.contact}</p>
                        </div>

                        <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-slate-800/60 text-xs">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <Avatar name={getAssignee(lead.assignedTo)} size="sm" className="h-5 w-5 text-[9px]" />
                            <span className="truncate text-slate-500 dark:text-slate-400 font-semibold text-[11px]">
                              {getAssignee(lead.assignedTo)}
                            </span>
                          </div>
                          <span className="shrink-0 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                            {lead.source}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        /* Table View */
        <Card className="!p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200/80 bg-slate-50/50 text-xs uppercase tracking-wider text-slate-400 dark:border-slate-800 dark:bg-slate-900/50 font-bold">
                <tr>
                  <th className="py-3 px-6">Client Name</th>
                  <th className="py-3 px-4">Contact Info</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Assigned To</th>
                  <th className="py-3 px-4">Source</th>
                  {canWrite && <th className="py-3 px-6 text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {paged.map((lead) => (
                  <tr key={lead.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-6 font-bold text-slate-900 dark:text-white">{lead.clientName}</td>
                    <td className="py-3.5 px-4 text-xs font-semibold text-slate-400">{lead.contact}</td>
                    <td className="py-3.5 px-4">
                      <Badge className={`border uppercase tracking-wider text-[10px] font-black ${statusColor(lead.status)}`}>
                        {lead.status.replace('_', ' ')}
                      </Badge>
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-700 dark:text-slate-300 text-xs">
                      {getAssignee(lead.assignedTo)}
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-400 font-semibold">{lead.source}</td>
                    {canWrite && (
                      <td className="py-3.5 px-6 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" className="h-8 w-8 p-0" onClick={() => openEdit(lead)}>
                            <Pencil className="h-4 w-4 text-slate-500 hover:text-brand-600" />
                          </Button>
                          <Button variant="ghost" className="h-8 w-8 p-0" onClick={() => handleDelete(lead)}>
                            <Trash2 className="h-4 w-4 text-red-500 hover:text-red-600" />
                          </Button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {pages > 1 && (
            <div className="px-4 sm:px-6 py-3 border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/30 dark:bg-slate-900/30">
              <Pagination page={page} totalPages={pages} onPageChange={setPage} />
            </div>
          )}
        </Card>
      )}

      {/* ── Responsive Lead Modal ── */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Lead Details' : 'Add New Lead'} size="lg">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Client / Company Name" {...register('clientName')} error={errors.clientName?.message} placeholder="Acme Tech Corp" />
            <Input label="Contact Email / Phone" {...register('contact')} error={errors.contact?.message} placeholder="john@acme.com / +1 555-0192" />
            <Select
              label="Lead Source"
              options={LEAD_SOURCES.map((s) => ({ value: s, label: s }))}
              {...register('source')}
            />
            <Select label="Pipeline Status" options={LEAD_STATUSES.map((s) => ({ value: s.value, label: s.label }))} {...register('status')} />
          </div>

          <Select label="Assigned Team Member" options={employeeOptions} {...register('assignedTo')} />
          <Textarea label="Lead Notes & Requirement Details" {...register('notes')} placeholder="Project scope, budget details, meeting timeline..." rows={3} />

          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100 dark:border-slate-800">
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)} className="px-4 text-xs font-bold">
              Cancel
            </Button>
            <Button type="submit" loading={saving} className="bg-gradient-to-r from-brand-600 to-violet-600 text-white font-bold px-5 text-xs shadow-md shadow-brand-500/20">
              {editing ? 'Save Changes' : 'Create Lead'}
            </Button>
          </div>
        </form>
      </Modal>

    </div>
  )
}
