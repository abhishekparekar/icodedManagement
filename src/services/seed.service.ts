import type { AppUser } from '@/types'
import { createEmployee } from './employees.service'
import { createLead } from './leads.service'
import { createProject } from './projects.service'

export async function seedDemoData(user: AppUser): Promise<void> {
  const { tenantId } = user

  const empIds: string[] = []
  const employees = [
    { name: 'Sarah Chen', email: 'sarah@demo.com', phone: '+1 555-0101', role: 'manager' as const, department: 'Sales', joiningDate: '2024-01-15' },
    { name: 'James Wilson', email: 'james@demo.com', phone: '+1 555-0102', role: 'employee' as const, department: 'Engineering', joiningDate: '2024-03-20' },
    { name: 'Emily Davis', email: 'emily@demo.com', phone: '+1 555-0103', role: 'employee' as const, department: 'Marketing', joiningDate: '2024-06-01' },
  ]

  for (const emp of employees) {
    const id = await createEmployee(tenantId, { ...emp, profileImage: '' }, user)
    empIds.push(id)
  }

  await createLead(
    tenantId,
    {
      clientName: 'Acme Corp',
      contact: 'john@acme.com',
      source: 'Website',
      status: 'new',
      assignedTo: empIds[0] ?? '',
      notes: 'Interested in enterprise plan',
    },
    user,
  )
  await createLead(
    tenantId,
    {
      clientName: 'Globex Industries',
      contact: '+1 555-9999',
      source: 'Referral',
      status: 'in_progress',
      assignedTo: empIds[0] ?? '',
      notes: 'Follow up next week',
    },
    user,
  )
  await createLead(
    tenantId,
    {
      clientName: 'Initech',
      contact: 'sales@initech.com',
      source: 'LinkedIn',
      status: 'converted',
      assignedTo: empIds[1] ?? '',
      notes: 'Signed annual contract',
    },
    user,
  )

  await createProject(
    tenantId,
    {
      name: 'Website Redesign',
      description: 'Modernize corporate website and improve conversion funnel.',
      status: 'ongoing',
      progress: 65,
      startDate: '2025-01-01',
      endDate: '2025-06-30',
      assignedEmployees: empIds.slice(0, 2),
    },
    user,
  )
  await createProject(
    tenantId,
    {
      name: 'CRM Integration',
      description: 'Integrate Salesforce with internal tools.',
      status: 'pending',
      progress: 10,
      startDate: '2025-03-01',
      endDate: '2025-09-01',
      assignedEmployees: [empIds[1] ?? ''],
    },
    user,
  )
  await createProject(
    tenantId,
    {
      name: 'Q4 Marketing Campaign',
      description: 'Launch multi-channel campaign for product line.',
      status: 'completed',
      progress: 100,
      startDate: '2024-09-01',
      endDate: '2024-12-15',
      assignedEmployees: empIds,
    },
    user,
  )
}
