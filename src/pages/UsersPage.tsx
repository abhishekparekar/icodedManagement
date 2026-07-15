import { Shield, Users } from 'lucide-react'
import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import { Card, CardHeader } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { Select } from '@/components/ui/Select'
import { ROLES } from '@/lib/constants'
import { subscribeUsers, updateUserRole } from '@/services/users.service'
import { useAuthStore } from '@/stores/authStore'
import type { AppUser, UserRole } from '@/types'

const roleBadgeColor: Record<UserRole, string> = {
  admin: 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300',
  manager: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300',
  employee: 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300',
}

export function UsersPage() {
  const user = useAuthStore((s) => s.user)
  const [users, setUsers] = useState<AppUser[]>([])
  const [updating, setUpdating] = useState<string | null>(null)

  useEffect(() => {
    if (!user?.tenantId) return
    return subscribeUsers(user.tenantId, setUsers)
  }, [user?.tenantId])

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
    <Card>
      <CardHeader
        title="Team members"
        subtitle={`${users.length} users in your workspace`}
        action={
          <div className="flex items-center gap-2 rounded-lg bg-amber-50 px-3 py-1.5 text-xs text-amber-700 dark:bg-amber-900/20 dark:text-amber-400">
            <Shield className="h-3.5 w-3.5" />
            Admin only
          </div>
        }
      />

      {users.length === 0 ? (
        <EmptyState icon={Users} title="No users yet" description="Users will appear here after they sign up" />
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 text-slate-500 dark:border-slate-800">
                <tr>
                  <th className="pb-3 font-medium">User</th>
                  <th className="pb-3 font-medium">Role</th>
                  <th className="pb-3 font-medium">Joined</th>
                  <th className="pb-3 font-medium">Change role</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {users.map((u) => (
                  <tr key={u.uid} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="py-3">
                      <div className="flex items-center gap-3">
                        <Avatar name={u.name} size="sm" />
                        <div>
                          <p className="font-medium text-slate-900 dark:text-white">
                            {u.name}
                            {u.uid === user?.uid && (
                              <span className="ml-2 text-xs text-slate-400">(you)</span>
                            )}
                          </p>
                          <p className="text-xs text-slate-500">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3">
                      <Badge className={roleBadgeColor[u.role]}>{u.role}</Badge>
                    </td>
                    <td className="py-3 text-slate-500">
                      {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '—'}
                    </td>
                    <td className="py-3">
                      {u.uid === user?.uid ? (
                        <span className="text-xs text-slate-400">Cannot change own role</span>
                      ) : (
                        <Select
                          options={ROLES}
                          value={u.role}
                          disabled={updating === u.uid}
                          onChange={(e) => handleRoleChange(u, e.target.value as UserRole)}
                          className="w-36"
                        />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card-based List View */}
          <div className="grid gap-3 md:hidden">
            {users.map((u) => (
              <div key={u.uid} className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <div className="flex items-center gap-3">
                  <Avatar name={u.name} size="sm" />
                  <div className="min-w-0 flex-grow">
                    <p className="font-semibold text-slate-900 dark:text-white truncate">
                      {u.name}
                      {u.uid === user?.uid && (
                        <span className="ml-2 text-xs text-slate-400 font-normal">(you)</span>
                      )}
                    </p>
                    <p className="text-xs text-slate-500 truncate">{u.email}</p>
                  </div>
                </div>

                <div className="mt-3 grid grid-cols-2 gap-2 border-t border-slate-100 pt-2.5 text-xs text-slate-500 dark:border-slate-800">
                  <div>
                    <span className="block text-[9px] uppercase tracking-wider text-slate-400 font-bold mb-0.5">Current Role</span>
                    <Badge className={roleBadgeColor[u.role]}>{u.role}</Badge>
                  </div>
                  <div>
                    <span className="block text-[9px] uppercase tracking-wider text-slate-400 font-bold">Joined</span>
                    <span className="font-medium text-slate-700 dark:text-slate-300">
                      {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '—'}
                    </span>
                  </div>
                  <div className="col-span-2 mt-1">
                    <span className="block text-[9px] uppercase tracking-wider text-slate-400 font-bold mb-1">Change Role</span>
                    {u.uid === user?.uid ? (
                      <span className="text-xs text-slate-400">Cannot change own role</span>
                    ) : (
                      <Select
                        options={ROLES}
                        value={u.role}
                        disabled={updating === u.uid}
                        onChange={(e) => handleRoleChange(u, e.target.value as UserRole)}
                        className="w-full"
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
  )
}
