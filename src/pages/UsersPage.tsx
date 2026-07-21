import {
  Search,
  Shield,
  UserCheck,
  UserCog,
  Users,
  X,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { Select } from '@/components/ui/Select'
import { StatCard } from '@/components/ui/StatCard'
import { ROLES } from '@/lib/constants'
import { subscribeUsers, updateUserRole } from '@/services/users.service'
import { useAuthStore } from '@/stores/authStore'
import type { AppUser, UserRole } from '@/types'

const roleBadgeColor: Record<UserRole, string> = {
  admin: 'bg-purple-100 text-purple-800 dark:bg-purple-950/80 dark:text-purple-300 border-purple-200 dark:border-purple-900/40',
  manager: 'bg-blue-100 text-blue-800 dark:bg-blue-950/80 dark:text-blue-300 border-blue-200 dark:border-blue-900/40',
  employee: 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700',
}

const rolePermissionsDesc: Record<UserRole, string> = {
  admin: 'Full Workspace Admin & System Access',
  manager: 'Manages Team, Assigned Projects & Leads',
  employee: 'Accesses Assigned Work, Projects & Shared Finance',
}

export function UsersPage() {
  const user = useAuthStore((s) => s.user)
  const [users, setUsers] = useState<AppUser[]>([])
  const [updating, setUpdating] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('')

  useEffect(() => {
    if (!user?.tenantId) return
    return subscribeUsers(user.tenantId, setUsers)
  }, [user?.tenantId])

  const stats = useMemo(() => {
    const total = users.length
    const admins = users.filter((u) => u.role === 'admin').length
    const managers = users.filter((u) => u.role === 'manager').length
    const employees = users.filter((u) => u.role === 'employee').length

    return { total, admins, managers, employees }
  }, [users])

  const filtered = useMemo(() => {
    return users.filter((u) => {
      const matchesRole = !roleFilter || u.role === roleFilter
      const query = search.toLowerCase().trim()
      const matchesSearch =
        !query ||
        u.name.toLowerCase().includes(query) ||
        u.email.toLowerCase().includes(query)

      return matchesRole && matchesSearch
    })
  }, [users, search, roleFilter])

  const handleRoleChange = async (target: AppUser, role: UserRole) => {
    if (!user?.tenantId || target.uid === user.uid) return
    setUpdating(target.uid)
    try {
      await updateUserRole(target.uid, user.tenantId, role, user)
      toast.success(`${target.name}'s role updated to ${role}`)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Update failed')
    } finally {
      setUpdating(null)
    }
  }

  return (
    <div className="space-y-4 sm:space-y-5">

      {/* ── KPI Metrics Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-5">
        <StatCard title="Total Team"  value={stats.total}     icon={Users}    to="/users" gradient="from-brand-500 to-violet-600" delay="delay-75" />
        <StatCard title="Admins"      value={stats.admins}    icon={Shield}   to="/users" gradient="from-purple-500 to-indigo-600" delay="delay-150" />
        <StatCard title="Managers"    value={stats.managers}  icon={UserCog}  to="/users" gradient="from-blue-500 to-cyan-500"    delay="delay-225" />
        <StatCard title="Employees"   value={stats.employees} icon={UserCheck} to="/users" gradient="from-emerald-500 to-teal-600" delay="delay-300" />
      </div>

      {/* ── Integrated Search & Role Filter Bar ── */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3 sm:p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
        
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-400 pointer-events-none" />
          <input
            className="h-9 w-full rounded-xl border border-slate-200/90 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 pl-9 pr-8 text-xs font-semibold text-slate-700 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all"
            placeholder="Search user name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
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

        {/* Role Filter Dropdown */}
        <div className="flex items-center gap-2 shrink-0 justify-between sm:justify-end">
          <select
            className="h-9 rounded-xl border border-slate-200/90 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-3 text-xs font-semibold text-slate-700 dark:text-slate-200 focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all"
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
          >
            <option value="">All Roles</option>
            {ROLES.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>

          {(search || roleFilter) && (
            <button
              onClick={() => { setSearch(''); setRoleFilter('') }}
              className="text-xs font-bold text-brand-600 dark:text-brand-400 hover:underline px-2"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* ── Users Stream List Card ── */}
      <Card className="!p-0 overflow-hidden">
        
        {/* Stream Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-2">
            <UserCog className="h-4.5 w-4.5 text-brand-600 dark:text-brand-400" />
            <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">Workspace Role Permissions</h3>
          </div>
          <span className="text-xs font-semibold text-slate-400">
            {filtered.length} users registered
          </span>
        </div>

        {filtered.length === 0 ? (
          <div className="p-6">
            <EmptyState icon={Users} title="No team users found" description="Users will appear here after registering into the workspace." />
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-slate-200/80 bg-slate-50/50 text-xs uppercase tracking-wider text-slate-400 dark:border-slate-800 dark:bg-slate-950/60 font-bold">
                  <tr>
                    <th className="py-3 px-6">User Account</th>
                    <th className="py-3 px-4">Current Role</th>
                    <th className="py-3 px-4">Module Access Scope</th>
                    <th className="py-3 px-4">Joined Date</th>
                    <th className="py-3 px-6 text-right">Assign Role</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {filtered.map((u) => (
                    <tr key={u.uid} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-3.5 px-6">
                        <div className="flex items-center gap-3">
                          <Avatar name={u.name} size="md" className="h-9 w-9 text-xs ring-2 ring-brand-500/20" />
                          <div>
                            <p className="font-bold text-slate-900 dark:text-white">
                              {u.name}
                              {u.uid === user?.uid && (
                                <span className="ml-2 text-xs font-semibold text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-950/80 px-2 py-0.5 rounded-md">
                                  (You)
                                </span>
                              )}
                            </p>
                            <p className="text-xs text-slate-400">{u.email}</p>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <Badge className={`border uppercase tracking-wider text-[10px] font-black ${roleBadgeColor[u.role]}`}>
                          {u.role}
                        </Badge>
                      </td>

                      <td className="py-3.5 px-4 text-xs font-semibold text-slate-500 dark:text-slate-400">
                        {rolePermissionsDesc[u.role]}
                      </td>

                      <td className="py-3.5 px-4 text-xs font-semibold text-slate-400">
                        {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '—'}
                      </td>

                      <td className="py-3.5 px-6 text-right">
                        {u.uid === user?.uid ? (
                          <span className="text-xs text-slate-400 font-semibold italic">Current Admin</span>
                        ) : (
                          <Select
                            options={ROLES}
                            value={u.role}
                            disabled={updating === u.uid}
                            onChange={(e) => handleRoleChange(u, e.target.value as UserRole)}
                            className="w-36 h-8 text-xs font-bold inline-block"
                          />
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card List View */}
            <div className="divide-y divide-slate-100 dark:divide-slate-800/60 md:hidden">
              {filtered.map((u) => (
                <div key={u.uid} className="p-4 space-y-3">
                  <div className="flex items-center gap-3">
                    <Avatar name={u.name} size="md" className="h-10 w-10 text-xs shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-slate-900 dark:text-white truncate">
                        {u.name}
                        {u.uid === user?.uid && (
                          <span className="ml-2 text-xs text-brand-600 dark:text-brand-400 font-bold">(You)</span>
                        )}
                      </p>
                      <p className="text-xs text-slate-400 truncate">{u.email}</p>
                    </div>
                    <Badge className={`border uppercase tracking-wider text-[10px] font-black shrink-0 ${roleBadgeColor[u.role]}`}>
                      {u.role}
                    </Badge>
                  </div>

                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800/60 flex items-center justify-between gap-2 text-xs">
                    <span className="text-slate-400 font-semibold text-[11px] truncate">
                      {rolePermissionsDesc[u.role]}
                    </span>

                    <div className="shrink-0">
                      {u.uid === user?.uid ? (
                        <span className="text-xs text-slate-400 italic">Self</span>
                      ) : (
                        <Select
                          options={ROLES}
                          value={u.role}
                          disabled={updating === u.uid}
                          onChange={(e) => handleRoleChange(u, e.target.value as UserRole)}
                          className="h-8 text-xs font-bold w-32"
                        />
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </Card>

    </div>
  )
}
