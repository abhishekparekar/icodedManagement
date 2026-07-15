import { create } from 'zustand'
import type { ActivityLog, Bill, Employee, Goal, Lead, Project, Quotation } from '@/types'

interface DataState {
  employees: Employee[]
  leads: Lead[]
  projects: Project[]
  activityLogs: ActivityLog[]
  quotations: Quotation[]
  goals: Goal[]
  bills: Bill[]
  setEmployees: (employees: Employee[]) => void
  setLeads: (leads: Lead[]) => void
  setProjects: (projects: Project[]) => void
  setActivityLogs: (logs: ActivityLog[]) => void
  setQuotations: (quotations: Quotation[]) => void
  setGoals: (goals: Goal[]) => void
  setBills: (bills: Bill[]) => void
}

export const useDataStore = create<DataState>((set) => ({
  employees: [],
  leads: [],
  projects: [],
  activityLogs: [],
  quotations: [],
  goals: [],
  bills: [],
  setEmployees: (employees) => set({ employees }),
  setLeads: (leads) => set({ leads }),
  setProjects: (projects) => set({ projects }),
  setActivityLogs: (activityLogs) => set({ activityLogs }),
  setQuotations: (quotations) => set({ quotations }),
  setGoals: (goals) => set({ goals }),
  setBills: (bills) => set({ bills }),
}))
