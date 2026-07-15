import { z } from 'zod'

export const loginSchema = z.object({
  email: z.string().email('Valid email required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

export const signupSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  companyName: z.string().min(2, 'Company name is required'),
  email: z.string().email('Valid email required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
})

export const employeeSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().min(6),
  role: z.enum(['admin', 'manager', 'employee']),
  department: z.string().min(1),
  joiningDate: z.string().min(1),
})

export const leadSchema = z.object({
  clientName: z.string().min(2),
  contact: z.string().min(3),
  source: z.string().min(1),
  status: z.enum(['new', 'in_progress', 'converted', 'lost']),
  assignedTo: z.string(),
  notes: z.string(),
})

export const projectSchema = z.object({
  name: z.string().min(2, 'Project name is required'),
  description: z.string().min(1, 'Description is required'),
  status: z.enum(['pending', 'ongoing', 'completed']),
  progress: z.coerce.number().min(0).max(100),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().min(1, 'End date is required'),
})

export const taskSchema = z.object({
  title: z.string().min(2),
  assignedTo: z.string().min(1),
  status: z.enum(['todo', 'in_progress', 'done']),
  dueDate: z.string().min(1),
})

export type LoginForm = z.infer<typeof loginSchema>
export type SignupForm = z.infer<typeof signupSchema>
export type EmployeeForm = z.infer<typeof employeeSchema>
export type LeadForm = z.infer<typeof leadSchema>
export type ProjectForm = z.infer<typeof projectSchema>
export type TaskForm = z.infer<typeof taskSchema>
