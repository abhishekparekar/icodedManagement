import { zodResolver } from '@hookform/resolvers/zod'
import { LayoutGrid, List, Pencil, Plus, Trash2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card, CardHeader } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { Pagination } from '@/components/ui/Pagination'
import { Select } from '@/components/ui/Select'
import { Textarea } from '@/components/ui/Textarea'
import { LEAD_SOURCES, LEAD_STATUSES, PAGE_SIZE } from '@/lib/constants'
import { canManageLeads } from '@/lib/permissions'
import { paginate, totalPages } from '@/lib/utils'
import { leadSchema, type LeadForm } from '@/schemas'
import { createLead, deleteLead, updateLead } from '@/services/leads.service'
import { useAuthStore } from '@/stores/authStore'
import { useDataStore } from '@/stores/dataStore'
import { filterLeads } from '@/hooks/useFilteredData'
import type { Lead } from '@/types'

export function LeadsPage() {
  const user = useAuthStore((s) => s.user)
  const leads = useDataStore((s) => s.leads)
  const employees = useDataStore((s) => s.employees)
  const canWrite = canManageLeads(user)

  const [view, setView] = useState<'table' | 'kanban'>('kanban')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [page, setPage] = useState(1)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Lead | null>(null)
  const [saving, setSaving] = useState(false)

  const employeeOptions = [
    { value: '', label: 'Unassigned' },
    ...employees.map((e) => ({ value: e.id, label: e.name })),
  ]

  const filtered = useMemo(
    () => filterLeads(leads, search, statusFilter, ''),
    [leads, search, statusFilter],
  )
  const paged = paginate(filtered, page, PAGE_SIZE)
  const pages = totalPages(filtered.length, PAGE_SIZE)

  const { register, handleSubmit, reset, formState: { errors } } = useForm<LeadForm>({
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
    LEAD_STATUSES.find((s) => s.value === status)?.color ?? ''

  const getAssignee = (id: string) => employees.find((e) => e.id === id)?.name ?? 'Unassigned'

  return (
    <div className="space-y-3 sm:space-y-5">
      <Card>
        <CardHeader
          title="Leads"
          subtitle={`${filtered.length} in pipeline`}
          action={
            <div className="flex flex-wrap gap-2">
              <Button variant={view === 'kanban' ? 'primary' : 'secondary'} onClick={() => setView('kanban')}>
                <LayoutGrid className="h-4 w-4" /> Kanban
              </Button>
              <Button variant={view === 'table' ? 'primary' : 'secondary'} onClick={() => setView('table')}>
                <List className="h-4 w-4" /> Table
              </Button>
              {canWrite && (
                <Button onClick={openCreate}>
                  <Plus className="h-4 w-4" /> Add lead
                </Button>
              )}
            </div>
          }
        />

        <div className="mb-4 flex flex-wrap gap-3">
          <Input
            placeholder="Search leads..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(1)
            }}
            className="max-w-xs"
          />
          <select
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">All statuses</option>
            {LEAD_STATUSES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>

        {view === 'kanban' ? (
          <div className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory md:grid md:grid-cols-2 xl:grid-cols-4 md:overflow-x-visible md:pb-0">
            {LEAD_STATUSES.map((col) => {
              const columnLeads = filtered.filter((l) => l.status === col.value)
              return (
                <div key={col.value} className="w-[85vw] sm:w-[320px] shrink-0 snap-align-start rounded-xl bg-slate-50 p-3 dark:bg-slate-800/50 md:w-auto md:shrink">
                  <div className="mb-3 flex items-center justify-between">
                    <span className="text-sm font-semibold">{col.label}</span>
                    <Badge className={col.color}>{columnLeads.length}</Badge>
                  </div>
                  <div className="space-y-2">
                    {columnLeads.map((lead) => (
                      <div
                        key={lead.id}
                        className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-700 dark:bg-slate-900"
                      >
                        <p className="font-medium text-slate-900 dark:text-white">{lead.clientName}</p>
                        <p className="text-xs text-slate-500">{lead.contact}</p>
                        <p className="mt-1 text-xs text-slate-400">{getAssignee(lead.assignedTo)}</p>
                        {canWrite && (
                          <div className="mt-2 flex gap-1">
                            <Button variant="ghost" onClick={() => openEdit(lead)}>
                              <Pencil className="h-3 w-3" />
                            </Button>
                            <Button variant="ghost" onClick={() => handleDelete(lead)}>
                              <Trash2 className="h-3 w-3 text-red-500" />
                            </Button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-slate-200 text-slate-500 dark:border-slate-800">
                  <tr>
                    <th className="pb-3">Client</th>
                    <th className="pb-3">Contact</th>
                    <th className="pb-3">Status</th>
                    <th className="pb-3">Assigned</th>
                    {canWrite && <th className="pb-3">Actions</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {paged.map((lead) => (
                    <tr key={lead.id}>
                      <td className="py-3 font-medium">{lead.clientName}</td>
                      <td className="py-3 text-slate-500">{lead.contact}</td>
                      <td className="py-3">
                        <Badge className={statusColor(lead.status)}>{lead.status}</Badge>
                      </td>
                      <td className="py-3">{getAssignee(lead.assignedTo)}</td>
                      {canWrite && (
                        <td className="py-3">
                          <div className="flex gap-2">
                            <Button variant="ghost" onClick={() => openEdit(lead)}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" onClick={() => handleDelete(lead)}>
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination page={page} totalPages={pages} onPageChange={setPage} />
          </>
        )}
      </Card>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit lead' : 'Add lead'}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input label="Client name" {...register('clientName')} error={errors.clientName?.message} />
          <Input label="Contact info" {...register('contact')} error={errors.contact?.message} />
          <Select
            label="Source"
            options={LEAD_SOURCES.map((s) => ({ value: s, label: s }))}
            {...register('source')}
          />
          <Select label="Status" options={LEAD_STATUSES.map((s) => ({ value: s.value, label: s.label }))} {...register('status')} />
          <Select label="Assigned to" options={employeeOptions} {...register('assignedTo')} />
          <Textarea label="Notes" {...register('notes')} />
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
