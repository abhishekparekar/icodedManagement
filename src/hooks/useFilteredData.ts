import { useMemo } from 'react'
import type { AppUser, Employee, Lead, Project } from '@/types'
import { useDataStore } from '@/stores/dataStore'

export function useEmployeeScopedProjects(user: AppUser | null): Project[] {
  const projects = useDataStore((s) => s.projects)
  const employees = useDataStore((s) => s.employees)

  return useMemo(() => {
    if (!user || user.role !== 'employee') return projects
    const emp = employees.find((e) => e.email === user.email || e.userId === user.uid)
    if (!emp) return []
    return projects.filter((p) => p.assignedEmployees.includes(emp.id))
  }, [user, projects, employees])
}

export function filterEmployees(
  employees: Employee[],
  search: string,
  department: string,
  role: string,
): Employee[] {
  return employees.filter((e) => {
    const matchSearch =
      !search ||
      e.name.toLowerCase().includes(search.toLowerCase()) ||
      e.email.toLowerCase().includes(search.toLowerCase())
    const matchDept = !department || e.department === department
    const matchRole = !role || e.role === role
    return matchSearch && matchDept && matchRole
  })
}

export function filterLeads(
  leads: Lead[],
  search: string,
  status: string,
  assignedTo: string,
): Lead[] {
  return leads.filter((l) => {
    const matchSearch =
      !search ||
      l.clientName.toLowerCase().includes(search.toLowerCase()) ||
      l.contact.toLowerCase().includes(search.toLowerCase())
    const matchStatus = !status || l.status === status
    const matchAssign = !assignedTo || l.assignedTo === assignedTo
    return matchSearch && matchStatus && matchAssign
  })
}

export function filterProjects(
  projects: Project[],
  search: string,
  status: string,
): Project[] {
  return projects.filter((p) => {
    const matchSearch =
      !search || p.name.toLowerCase().includes(search.toLowerCase())
    const matchStatus = !status || p.status === status
    return matchSearch && matchStatus
  })
}
