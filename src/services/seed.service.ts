import type { AppUser } from '@/types'
import { createEmployee } from './employees.service'
import { createExpense } from './expenses.service'
import { createInventoryItem } from './inventory.service'
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

  // Seed IT Expenses
  await createExpense(
    tenantId,
    {
      title: 'AWS Cloud Hosting & Database Services',
      amount: 1450.00,
      category: 'cloud_infrastructure',
      paymentMethod: 'Corporate Card',
      vendor: 'Amazon Web Services',
      date: new Date().toISOString().split('T')[0],
      status: 'paid',
      notes: 'Monthly EC2, RDS, and S3 usage',
      createdBy: user.uid,
      createdByName: user.name,
    },
    user,
  )
  await createExpense(
    tenantId,
    {
      title: 'GitHub Enterprise & Copilot Licenses',
      amount: 680.00,
      category: 'software_subscription',
      paymentMethod: 'Corporate Card',
      vendor: 'GitHub Inc.',
      date: new Date().toISOString().split('T')[0],
      status: 'paid',
      notes: 'Developer seats annual renewal',
      createdBy: user.uid,
      createdByName: user.name,
    },
    user,
  )

  // Seed IT Inventory
  await createInventoryItem(
    tenantId,
    {
      name: 'Apple MacBook Pro 16" M3 Max',
      assetTag: 'AST-9021',
      serialNumber: 'C02G9901M3M',
      category: 'laptop',
      status: 'in_use',
      condition: 'new',
      assignedTo: empIds[1],
      assignedToName: 'James Wilson',
      purchaseDate: '2024-02-10',
      purchaseCost: 3499.00,
      location: 'Engineers Bay #4',
      notes: '36GB RAM, 1TB SSD',
    },
    user,
  )
  await createInventoryItem(
    tenantId,
    {
      name: 'Dell UltraSharp 27" 4K Monitor',
      assetTag: 'AST-4011',
      serialNumber: 'CN-098412-DL',
      category: 'monitor',
      status: 'in_stock',
      condition: 'good',
      purchaseDate: '2024-01-15',
      purchaseCost: 599.00,
      location: 'IT Storage Cabinet B',
      notes: 'USB-C Hub built-in',
    },
    user,
  )
}

