import { zodResolver } from '@hookform/resolvers/zod'
import {
  FolderTree,
  Pencil,
  Plus,
  Search,
  Shield,
  Trash2,
  User,
  Users,
  X,
} from 'lucide-react'
import { useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { Pagination } from '@/components/ui/Pagination'
import { Select } from '@/components/ui/Select'
import { StatCard } from '@/components/ui/StatCard'
import { filterEmployees } from '@/hooks/useFilteredData'
import { DEPARTMENTS, PAGE_SIZE, ROLES } from '@/lib/constants'
import { canManageEmployees } from '@/lib/permissions'
import { formatDate, paginate, totalPages } from '@/lib/utils'
import { employeeSchema, type EmployeeForm } from '@/schemas'
import {
  createEmployee,
  deleteEmployee,
  updateEmployee,
} from '@/services/employees.service'
import { uploadProfileImage } from '@/services/storage.service'
import { useAuthStore } from '@/stores/authStore'
import { useDataStore } from '@/stores/dataStore'
import type { Employee } from '@/types'

export function EmployeesPage() {
  const user = useAuthStore((s) => s.user)
  const employees = useDataStore((s) => s.employees)
  const canWrite = canManageEmployees(user)

  const stats = useMemo(() => {
    const activeDepts = new Set(employees.map((e) => e.department)).size
    const managers = employees.filter((e) => e.role === 'manager').length
    const admins = employees.filter((e) => e.role === 'admin').length
    return {
      total: employees.length,
      departments: activeDepts,
      managers,
      admins,
    }
  }, [employees])

  const [search, setSearch] = useState('')
  const [department, setDepartment] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [page, setPage] = useState(1)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Employee | null>(null)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [saving, setSaving] = useState(false)

  const filtered = useMemo(
    () => filterEmployees(employees, search, department, roleFilter),
    [employees, search, department, roleFilter],
  )
  const paged = paginate(filtered, page, PAGE_SIZE)
  const pages = totalPages(filtered.length, PAGE_SIZE)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<EmployeeForm>({
    resolver: zodResolver(employeeSchema),
    defaultValues: {
      role: 'employee',
      department: DEPARTMENTS[0],
      joiningDate: new Date().toISOString().slice(0, 10),
    },
  })

  const openCreate = () => {
    setEditing(null)
    setImageFile(null)
    reset({
      name: '',
      email: '',
      phone: '',
      role: 'employee',
      department: DEPARTMENTS[0],
      joiningDate: new Date().toISOString().slice(0, 10),
    })
    setModalOpen(true)
  }

  const openEdit = (emp: Employee) => {
    setEditing(emp)
    setImageFile(null)
    reset({
      name: emp.name,
      email: emp.email,
      phone: emp.phone,
      role: emp.role,
      department: emp.department,
      joiningDate: emp.joiningDate.slice(0, 10),
    })
    setModalOpen(true)
  }

  const onSubmit = async (data: EmployeeForm) => {
    if (!user?.tenantId) return
    setSaving(true)
    try {
      if (editing) {
        let profileImage = editing.profileImage
        if (imageFile) {
          profileImage = await uploadProfileImage(user.tenantId, editing.id, imageFile)
        }
        await updateEmployee(editing.id, user.tenantId, { ...data, profileImage }, user)
        toast.success('Employee updated')
      } else {
        const id = await createEmployee(user.tenantId, { ...data, profileImage: '' }, user)
        if (imageFile) {
          const url = await uploadProfileImage(user.tenantId, id, imageFile)
          await updateEmployee(id, user.tenantId, { profileImage: url }, user)
        }
        toast.success('Employee added')
      }
      setModalOpen(false)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (emp: Employee) => {
    if (!user?.tenantId || !confirm(`Delete ${emp.name}?`)) return
    try {
      await deleteEmployee(emp.id, user.tenantId, emp.name, user)
      toast.success('Employee deleted')
    } catch {
      toast.error('Delete failed')
    }
  }

  const roleBadge = (role: string) => {
    const colors: Record<string, string> = {
      admin: 'bg-purple-100 text-purple-800 dark:bg-purple-950/80 dark:text-purple-300 border-purple-200 dark:border-purple-900/40',
      manager: 'bg-blue-100 text-blue-800 dark:bg-blue-950/80 dark:text-blue-300 border-blue-200 dark:border-blue-900/40',
      employee: 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700',
    }
    return <Badge className={`border uppercase tracking-wider text-[10px] font-black ${colors[role] ?? colors.employee}`}>{role}</Badge>
  }

  return (
    <div className="space-y-4 sm:space-y-5">

      {/* ── KPI Metric Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-5">
        <StatCard title="Total Team"   value={stats.total}       icon={Users}      to="/employees" gradient="from-blue-500 to-cyan-500" delay="delay-75" />
        <StatCard title="Departments"  value={stats.departments}  icon={FolderTree} to="/employees" gradient="from-violet-500 to-purple-700" delay="delay-150" />
        <StatCard title="Managers"     value={stats.managers}     icon={User}       to="/employees" gradient="from-sky-500 to-blue-600" delay="delay-225" />
        <StatCard title="Admins"       value={stats.admins}       icon={Shield}     to="/users"     gradient="from-emerald-500 to-teal-600" delay="delay-300" />
      </div>

      {/* ── Control Bar: Search + Department + Role Filters + Action Button ── */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3 sm:p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
        
        {/* Search & Select Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 flex-1 max-w-3xl">
          {/* Search Input */}
          <div className="relative sm:col-span-1">
            <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-400 pointer-events-none" />
            <input
              className="h-9 w-full rounded-xl border border-slate-200/90 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 pl-9 pr-8 text-xs font-semibold text-slate-700 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all"
              placeholder="Search name, email..."
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

          {/* Department Filter */}
          <select
            className="h-9 w-full rounded-xl border border-slate-200/90 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-3 text-xs font-semibold text-slate-700 dark:text-slate-200 focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all"
            value={department}
            onChange={(e) => {
              setDepartment(e.target.value)
              setPage(1)
            }}
          >
            <option value="">All Departments</option>
            {DEPARTMENTS.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>

          {/* Role Filter */}
          <select
            className="h-9 w-full rounded-xl border border-slate-200/90 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-3 text-xs font-semibold text-slate-700 dark:text-slate-200 focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all"
            value={roleFilter}
            onChange={(e) => {
              setRoleFilter(e.target.value)
              setPage(1)
            }}
          >
            <option value="">All Roles</option>
            {ROLES.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>
        </div>

        {/* Clear Filters & Add Employee Button */}
        <div className="flex items-center gap-2 shrink-0 justify-between sm:justify-end">
          {(search || department || roleFilter) && (
            <button
              onClick={() => { setSearch(''); setDepartment(''); setRoleFilter(''); setPage(1) }}
              className="text-xs font-bold text-brand-600 dark:text-brand-400 hover:underline px-2"
            >
              Reset
            </button>
          )}

          {canWrite && (
            <Button onClick={openCreate} className="h-9 text-xs font-bold bg-gradient-to-r from-brand-600 to-violet-600 hover:from-brand-700 hover:to-violet-700 text-white shadow-md shadow-brand-500/20">
              <Plus className="h-4 w-4" /> Add Employee
            </Button>
          )}
        </div>
      </div>

      {/* ── Employee Table / Card Stream Container ── */}
      <Card className="!p-0 overflow-hidden">
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-2">
            <Users className="h-4.5 w-4.5 text-brand-600 dark:text-brand-400" />
            <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">Team Directory</h3>
          </div>
          <span className="text-xs font-semibold text-slate-400">
            {filtered.length} members
          </span>
        </div>

        {paged.length === 0 ? (
          <div className="p-6">
            <EmptyState icon={User} title="No employees found" description={search || department || roleFilter ? 'Try clearing your search filters.' : 'Click "Add Employee" to register your first team member.'} />
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-slate-200/80 bg-slate-50/50 text-xs uppercase tracking-wider text-slate-400 dark:border-slate-800 dark:bg-slate-900/50 font-bold">
                  <tr>
                    <th className="py-3 px-6">Employee</th>
                    <th className="py-3 px-4">Department</th>
                    <th className="py-3 px-4">Role</th>
                    <th className="py-3 px-4">Joining Date</th>
                    {canWrite && <th className="py-3 px-6 text-right">Actions</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {paged.map((emp) => (
                    <tr key={emp.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-3.5 px-6">
                        <div className="flex items-center gap-3">
                          <Avatar name={emp.name} src={emp.profileImage} size="md" className="h-9 w-9 text-xs ring-2 ring-brand-500/20" />
                          <div className="min-w-0">
                            <p className="font-bold text-slate-900 dark:text-white truncate">{emp.name}</p>
                            <p className="text-xs text-slate-400 truncate">{emp.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-slate-700 dark:text-slate-300">{emp.department}</td>
                      <td className="py-3.5 px-4">{roleBadge(emp.role)}</td>
                      <td className="py-3.5 px-4 text-xs font-semibold text-slate-400">{formatDate(emp.joiningDate)}</td>
                      {canWrite && (
                        <td className="py-3.5 px-6 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button variant="ghost" className="h-8 w-8 p-0" onClick={() => openEdit(emp)} title="Edit Employee">
                              <Pencil className="h-4 w-4 text-slate-500 hover:text-brand-600" />
                            </Button>
                            <Button variant="ghost" className="h-8 w-8 p-0" onClick={() => handleDelete(emp)} title="Delete Employee">
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

            {/* Mobile Card-based List View */}
            <div className="divide-y divide-slate-100 dark:divide-slate-800/60 md:hidden">
              {paged.map((emp) => (
                <div key={emp.id} className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <Avatar name={emp.name} src={emp.profileImage} size="md" className="h-10 w-10 text-xs ring-2 ring-brand-500/20 shrink-0" />
                      <div className="min-w-0">
                        <p className="font-bold text-slate-900 dark:text-white truncate">{emp.name}</p>
                        <p className="text-xs text-slate-400 truncate">{emp.email}</p>
                      </div>
                    </div>
                    {canWrite && (
                      <div className="flex items-center gap-1 shrink-0">
                        <Button variant="ghost" className="h-8 w-8 p-0" onClick={() => openEdit(emp)}>
                          <Pencil className="h-4 w-4 text-slate-500" />
                        </Button>
                        <Button variant="ghost" className="h-8 w-8 p-0" onClick={() => handleDelete(emp)}>
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-slate-800/60 text-xs">
                    <span className="font-semibold text-slate-500 dark:text-slate-400">{emp.department}</span>
                    {roleBadge(emp.role)}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {pages > 1 && (
          <div className="px-4 sm:px-6 py-3 border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/30 dark:bg-slate-900/30">
            <Pagination page={page} totalPages={pages} onPageChange={setPage} />
          </div>
        )}
      </Card>

      {/* ── Employee Modal ── */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Employee Profile' : 'Add New Employee'} size="lg">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Full Name" {...register('name')} error={errors.name?.message} placeholder="e.g. Rahul Sharma" />
            <Input label="Email Address" type="email" {...register('email')} error={errors.email?.message} placeholder="name@company.com" />
            <Input label="Phone Number" {...register('phone')} error={errors.phone?.message} placeholder="+91 98765 43210" />
            <Input label="Joining Date" type="date" {...register('joiningDate')} error={errors.joiningDate?.message} />
            <Select
              label="Department"
              options={DEPARTMENTS.map((d) => ({ value: d, label: d }))}
              {...register('department')}
            />
            <Select label="Workspace Role" options={ROLES} {...register('role')} />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Profile Avatar Image
            </label>
            <input
              type="file"
              accept="image/*"
              className="w-full text-xs text-slate-500 file:mr-3 file:rounded-xl file:border-0 file:bg-brand-50 file:px-3 file:py-2 file:text-xs file:font-bold file:text-brand-700 hover:file:bg-brand-100 dark:file:bg-brand-950/60 dark:file:text-brand-400 cursor-pointer"
              onChange={(e) => setImageFile(e.target.files?.[0] ?? null)}
            />
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100 dark:border-slate-800">
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)} className="px-4 text-xs font-bold">
              Cancel
            </Button>
            <Button type="submit" loading={saving} className="bg-gradient-to-r from-brand-600 to-violet-600 text-white font-bold px-5 text-xs shadow-md shadow-brand-500/20">
              {editing ? 'Save Changes' : 'Create Employee'}
            </Button>
          </div>
        </form>
      </Modal>

    </div>
  )
}
