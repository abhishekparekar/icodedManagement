import { zodResolver } from '@hookform/resolvers/zod'
import { Pencil, Plus, Search, Trash2, User, Shield, Users, FolderTree } from 'lucide-react'
import { StatCard } from '@/components/ui/StatCard'
import { useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card, CardHeader } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { Pagination } from '@/components/ui/Pagination'
import { Select } from '@/components/ui/Select'
import { DEPARTMENTS, PAGE_SIZE, ROLES } from '@/lib/constants'
import { canManageEmployees } from '@/lib/permissions'
import { paginate, totalPages } from '@/lib/utils'
import { employeeSchema, type EmployeeForm } from '@/schemas'
import {
  createEmployee,
  deleteEmployee,
  updateEmployee,
} from '@/services/employees.service'
import { uploadProfileImage } from '@/services/storage.service'
import { useAuthStore } from '@/stores/authStore'
import { useDataStore } from '@/stores/dataStore'
import { filterEmployees } from '@/hooks/useFilteredData'
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
      admin: 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300',
      manager: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300',
      employee: 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300',
    }
    return <Badge className={colors[role]}>{role}</Badge>
  }

  return (
    <div className="space-y-3 sm:space-y-5">
      {/* Headcount metrics */}
      <div className="grid grid-cols-2 gap-2.5 sm:gap-3 lg:grid-cols-4">
        <StatCard title="Total Team" value={stats.total} icon={Users} color="text-blue-600" iconBg="bg-blue-50" />
        <StatCard title="Departments" value={stats.departments} icon={FolderTree} color="text-violet-600" iconBg="bg-violet-50" />
        <StatCard title="Managers" value={stats.managers} icon={User} color="text-sky-600" iconBg="bg-sky-50" />
        <StatCard title="Admins" value={stats.admins} icon={Shield} color="text-emerald-600" iconBg="bg-emerald-50" />
      </div>

      <Card>
        <CardHeader
          title="Employees"
          subtitle={`${filtered.length} team members`}
          action={
            canWrite && (
              <Button onClick={openCreate}>
                <Plus className="h-4 w-4" /> Add employee
              </Button>
            )
          }
        />
        <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="relative sm:col-span-2">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-3 text-sm dark:border-slate-700 dark:bg-slate-900"
              placeholder="Search name or email..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setPage(1)
              }}
            />
          </div>
          <select
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
            value={department}
            onChange={(e) => {
              setDepartment(e.target.value)
              setPage(1)
            }}
          >
            <option value="">All departments</option>
            {DEPARTMENTS.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
          <select
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
            value={roleFilter}
            onChange={(e) => {
              setRoleFilter(e.target.value)
              setPage(1)
            }}
          >
            <option value="">All roles</option>
            {ROLES.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>
        </div>

        {paged.length === 0 ? (
          <EmptyState icon={User} title="No employees" description="Add your first team member" />
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-slate-200 text-slate-500 dark:border-slate-800">
                  <tr>
                    <th className="pb-3 font-medium">Employee</th>
                    <th className="pb-3 font-medium">Department</th>
                    <th className="pb-3 font-medium">Role</th>
                    <th className="pb-3 font-medium">Joined</th>
                    {canWrite && <th className="pb-3 font-medium">Actions</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {paged.map((emp) => (
                    <tr key={emp.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                      <td className="py-3">
                        <div className="flex items-center gap-3">
                          {emp.profileImage ? (
                            <img src={emp.profileImage} alt="" className="h-10 w-10 rounded-full object-cover" />
                          ) : (
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-100 text-brand-700 dark:bg-brand-900/40">
                              {emp.name.charAt(0)}
                            </div>
                          )}
                          <div>
                            <p className="font-medium text-slate-900 dark:text-white">{emp.name}</p>
                            <p className="text-xs text-slate-500">{emp.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3">{emp.department}</td>
                      <td className="py-3">{roleBadge(emp.role)}</td>
                      <td className="py-3 text-slate-500">{emp.joiningDate.slice(0, 10)}</td>
                      {canWrite && (
                        <td className="py-3">
                          <div className="flex gap-2">
                            <Button variant="ghost" onClick={() => openEdit(emp)}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" onClick={() => handleDelete(emp)}>
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

            {/* Mobile Card-based List View */}
            <div className="grid gap-3 md:hidden">
              {paged.map((emp) => (
                <div key={emp.id} className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3">
                      {emp.profileImage ? (
                        <img src={emp.profileImage} alt="" className="h-10 w-10 rounded-full object-cover" />
                      ) : (
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-100 text-brand-700 dark:bg-brand-900/40 font-bold">
                          {emp.name.charAt(0)}
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="font-semibold text-slate-900 dark:text-white truncate">{emp.name}</p>
                        <p className="text-xs text-slate-500 truncate">{emp.email}</p>
                      </div>
                    </div>
                    {canWrite && (
                      <div className="flex gap-1 shrink-0">
                        <Button variant="ghost" className="h-8 w-8 p-0" onClick={() => openEdit(emp)} title="Edit">
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" className="h-8 w-8 p-0" onClick={() => handleDelete(emp)} title="Delete">
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    )}
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-2 border-t border-slate-100 pt-2.5 text-xs text-slate-500 dark:border-slate-800">
                    <div>
                      <span className="block text-[9px] uppercase tracking-wider text-slate-400 font-bold">Department</span>
                      <span className="font-medium text-slate-700 dark:text-slate-300">{emp.department}</span>
                    </div>
                    <div>
                      <span className="block text-[9px] uppercase tracking-wider text-slate-400 font-bold mb-0.5">Role</span>
                      {roleBadge(emp.role)}
                    </div>
                    <div className="col-span-2">
                      <span className="block text-[9px] uppercase tracking-wider text-slate-400 font-bold">Joined</span>
                      <span className="font-medium text-slate-700 dark:text-slate-300">{emp.joiningDate.slice(0, 10)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
        <Pagination page={page} totalPages={pages} onPageChange={setPage} />
      </Card>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit employee' : 'Add employee'}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input label="Name" {...register('name')} error={errors.name?.message} />
          <Input label="Email" type="email" {...register('email')} error={errors.email?.message} />
          <Input label="Phone" {...register('phone')} error={errors.phone?.message} />
          <Select label="Role" options={ROLES} {...register('role')} />
          <Select
            label="Department"
            options={DEPARTMENTS.map((d) => ({ value: d, label: d }))}
            {...register('department')}
          />
          <Input label="Joining date" type="date" {...register('joiningDate')} error={errors.joiningDate?.message} />
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
              Profile image
            </label>
            <input type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files?.[0] ?? null)} />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={saving}>
              {editing ? 'Update' : 'Create'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
