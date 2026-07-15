import { useEffect } from 'react'
import { subscribeActivityLogs } from '@/services/activity.service'
import { subscribeBills } from '@/services/bills.service'
import { subscribeEmployees } from '@/services/employees.service'
import { subscribeGoals } from '@/services/goals.service'
import { subscribeLeads } from '@/services/leads.service'
import { subscribeProjects } from '@/services/projects.service'
import { subscribeQuotations } from '@/services/quotations.service'
import { useAuthStore } from '@/stores/authStore'
import { useDataStore } from '@/stores/dataStore'
import { hasPermission } from '@/lib/permissions'

export function useRealtimeData() {
  const user = useAuthStore((s) => s.user)
  const { setEmployees, setLeads, setProjects, setActivityLogs, setQuotations, setGoals, setBills } = useDataStore()

  useEffect(() => {
    if (!user?.tenantId) return
    const unsubs: (() => void)[] = []

    if (hasPermission(user, 'employees:read'))
      unsubs.push(subscribeEmployees(user.tenantId, setEmployees))
    if (hasPermission(user, 'leads:read'))
      unsubs.push(subscribeLeads(user.tenantId, setLeads))
    if (hasPermission(user, 'projects:read'))
      unsubs.push(subscribeProjects(user.tenantId, setProjects))
    if (hasPermission(user, 'activity:read'))
      unsubs.push(subscribeActivityLogs(user.tenantId, setActivityLogs))
    if (hasPermission(user, 'quotations:read'))
      unsubs.push(subscribeQuotations(user.tenantId, setQuotations))
    if (hasPermission(user, 'goals:read'))
      unsubs.push(subscribeGoals(user.tenantId, setGoals))
    if (hasPermission(user, 'bills:read'))
      unsubs.push(subscribeBills(user.tenantId, setBills))

    return () => unsubs.forEach((u) => u())
  }, [user, setEmployees, setLeads, setProjects, setActivityLogs, setQuotations, setGoals, setBills])
}
