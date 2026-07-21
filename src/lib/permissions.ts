import type { AppUser, UserRole } from '@/types'

export type Permission =
  | 'employees:read'
  | 'employees:write'
  | 'leads:read'
  | 'leads:write'
  | 'projects:read'
  | 'projects:write'
  | 'tasks:read'
  | 'tasks:write'
  | 'activity:read'
  | 'dashboard:read'
  | 'dashboard:full'
  | 'quotations:read'
  | 'quotations:write'
  | 'goals:read'
  | 'goals:write'
  | 'bills:read'
  | 'bills:write'
  | 'expenses:read'
  | 'expenses:write'
  | 'inventory:read'
  | 'inventory:write'

const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  admin: [
    'employees:read', 'employees:write',
    'leads:read', 'leads:write',
    'projects:read', 'projects:write',
    'tasks:read', 'tasks:write',
    'activity:read',
    'dashboard:full', 'dashboard:read',
    'quotations:read', 'quotations:write',
    'goals:read', 'goals:write',
    'bills:read', 'bills:write',
    'expenses:read', 'expenses:write',
    'inventory:read', 'inventory:write',
  ],
  manager: [
    'employees:read',
    'leads:read', 'leads:write',
    'projects:read', 'projects:write',
    'tasks:read', 'tasks:write',
    'activity:read',
    'dashboard:full', 'dashboard:read',
    'quotations:read', 'quotations:write',
    'goals:read', 'goals:write',
    'bills:read', 'bills:write',
    'expenses:read', 'expenses:write',
    'inventory:read', 'inventory:write',
  ],
  employee: [
    'projects:read', 'tasks:read', 'tasks:write',
    'leads:read', 'dashboard:read',
    'quotations:read',
    'goals:read',
    'bills:read',
    'expenses:read',
    'inventory:read',
  ],
}

export function hasPermission(user: AppUser | null, permission: Permission): boolean {
  if (!user) return false
  return ROLE_PERMISSIONS[user.role]?.includes(permission) ?? false
}

export function canManageEmployees(user: AppUser | null): boolean {
  return hasPermission(user, 'employees:write')
}

export function canManageLeads(user: AppUser | null): boolean {
  return hasPermission(user, 'leads:write')
}

export function canManageProjects(user: AppUser | null): boolean {
  return hasPermission(user, 'projects:write')
}

export function canManageQuotations(user: AppUser | null): boolean {
  return hasPermission(user, 'quotations:write')
}

export function canManageGoals(user: AppUser | null): boolean {
  return hasPermission(user, 'goals:write')
}

export function canManageBills(user: AppUser | null): boolean {
  return hasPermission(user, 'bills:write')
}

export function canManageExpenses(user: AppUser | null): boolean {
  return hasPermission(user, 'expenses:write')
}

export function canManageInventory(user: AppUser | null): boolean {
  return hasPermission(user, 'inventory:write')
}

