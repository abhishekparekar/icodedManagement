export type UserRole = 'admin' | 'manager' | 'employee'
export type LeadStatus = 'new' | 'in_progress' | 'converted' | 'lost'
export type ProjectStatus = 'pending' | 'ongoing' | 'completed'
export type TaskStatus = 'todo' | 'in_progress' | 'done'
export type QuotationStatus = 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired'
export type QuotationTheme = 'modern' | 'classic' | 'minimal' | 'bold'
export type BillStatus = 'draft' | 'sent' | 'paid' | 'partial' | 'overdue' | 'cancelled'

export type GoalStatus = 'not_started' | 'in_progress' | 'completed' | 'at_risk' | 'cancelled'
export type GoalPriority = 'low' | 'medium' | 'high' | 'critical'
export type GoalCategory = 'revenue' | 'growth' | 'product' | 'team' | 'customer' | 'operations' | 'other'

export interface Milestone {
  id: string
  title: string
  dueDate: string
  completed: boolean
  completedAt?: string
}

export interface Goal {
  id: string
  tenantId: string
  title: string
  description: string
  category: GoalCategory
  priority: GoalPriority
  status: GoalStatus
  progress: number          // 0–100, manually set or auto from milestones
  autoProgress: boolean     // if true, progress = completed milestones / total milestones * 100
  targetValue?: number      // optional numeric target (e.g. 100 leads)
  currentValue?: number     // optional current value
  unit?: string             // e.g. "leads", "USD", "%"
  startDate: string
  dueDate: string
  assignedTo: string[]      // employee IDs
  milestones: Milestone[]
  notes: string
  createdBy: string
  createdByName: string
  createdAt: string
  updatedAt: string
}

export interface QuotationLineItem {
  id: string
  description: string
  quantity: number
  unitPrice: number
  moduleName?: string
}

export interface QuotationBankDetails {
  bankName: string
  accountName: string
  accountNumber: string
  ifscCode: string
  branchName: string
  upiId: string
}

export interface QuotationCompanyInfo {
  name: string
  address: string
  city: string
  phone: string
  email: string
  website: string
  instagram?: string
  logoUrl?: string
  taxId?: string
  about?: string          // company tagline / about shown on quotation
}

export interface QuotationClientInfo {
  salutation: string      // Mr. / Mrs. / Ms. / Dr. / M/s.
  name: string
  company: string
  address: string
  city: string
  phone: string
  email: string
}

export interface Quotation {
  id: string
  tenantId: string
  quotationNumber: string
  status: QuotationStatus
  theme: QuotationTheme
  accentColor: string
  company: QuotationCompanyInfo
  client: QuotationClientInfo
  bankDetails: QuotationBankDetails
  showBankDetails: boolean
  issueDate: string
  validUntil: string
  projectTimelineDays: number
  items: QuotationLineItem[]
  discountPercent: number
  taxPercent: number
  subtotal: number
  discountAmount: number
  taxAmount: number
  grandTotal: number
  currency: string
  notes: string
  selectedTerms: string[]
  customTerms: string
  createdBy: string
  createdByName: string
  createdAt: string
  updatedAt: string
}

export interface CompanyProfile {
  id: string
  tenantId: string
  name: string
  address: string
  city: string
  phone: string
  email: string
  website: string
  logoUrl: string
  taxId: string
  about: string
  instagram?: string
  bankDetails: QuotationBankDetails
  defaultCurrency: string
  defaultAccentColor: string
  defaultTheme: QuotationTheme
  defaultNotes: string
  updatedAt: string
}

export interface BillLineItem {
  id: string
  description: string
  quantity: number
  unitPrice: number
}

export interface BillPayment {
  id: string
  amount: number
  date: string
  mode: string   // Cash, UPI, Bank Transfer, Cheque, etc.
  reference: string
  note: string
}

export interface Bill {
  id: string
  tenantId: string
  billNumber: string
  quotationId?: string        // linked quotation (optional)
  quotationNumber?: string    // for reference display
  status: BillStatus
  accentColor: string
  theme: QuotationTheme
  company: QuotationCompanyInfo
  client: QuotationClientInfo
  bankDetails: QuotationBankDetails
  showBankDetails: boolean
  issueDate: string
  dueDate: string
  items: BillLineItem[]
  discountPercent: number
  taxPercent: number
  subtotal: number
  discountAmount: number
  taxAmount: number
  grandTotal: number
  amountPaid: number
  balanceDue: number
  payments: BillPayment[]
  currency: string
  notes: string
  terms: string
  createdBy: string
  createdByName: string
  createdAt: string
  updatedAt: string
}

export interface AppUser {
  uid: string
  name: string
  email: string
  role: UserRole
  tenantId: string
  companyName?: string
  createdAt: string
}

export interface Employee {
  id: string
  tenantId: string
  name: string
  email: string
  phone: string
  role: UserRole
  department: string
  joiningDate: string
  profileImage?: string
  userId?: string
  createdAt: string
}

export interface Lead {
  id: string
  tenantId: string
  clientName: string
  contact: string
  source: string
  status: LeadStatus
  assignedTo: string
  notes: string
  createdAt: string
}

export interface Project {
  id: string
  tenantId: string
  name: string
  description: string
  status: ProjectStatus
  progress: number
  startDate: string
  endDate: string
  assignedEmployees: string[]
  createdAt: string
}

export interface Task {
  id: string
  title: string
  assignedTo: string
  status: TaskStatus
  dueDate: string
  createdAt: string
}

export interface ActivityLog {
  id: string
  tenantId: string
  action: string
  userId: string
  userName?: string
  entityType?: string
  entityId?: string
  timestamp: string
}

export interface Tenant {
  id: string
  name: string
  createdAt: string
}

export type ExpenseCategory =
  | 'software_subscription'
  | 'hardware'
  | 'cloud_infrastructure'
  | 'office_utility'
  | 'team_allowance'
  | 'marketing'
  | 'miscellaneous'

export type ExpenseStatus = 'paid' | 'pending' | 'approved'

export interface Expense {
  id: string
  tenantId: string
  title: string
  amount: number
  category: ExpenseCategory
  paymentMethod: string
  vendor: string
  date: string
  status: ExpenseStatus
  notes?: string
  receiptUrl?: string
  createdBy: string
  createdByName: string
  createdAt: string
  updatedAt: string
}

export type InventoryCategory =
  | 'laptop'
  | 'workstation'
  | 'monitor'
  | 'server_network'
  | 'mobile_tablet'
  | 'software_license'
  | 'peripheral'

export type InventoryStatus = 'in_use' | 'in_stock' | 'maintenance' | 'retired'
export type InventoryCondition = 'new' | 'good' | 'fair' | 'damaged'

export interface InventoryItem {
  id: string
  tenantId: string
  name: string
  assetTag: string
  serialNumber?: string
  category: InventoryCategory
  status: InventoryStatus
  condition: InventoryCondition
  assignedTo?: string
  assignedToName?: string
  purchaseDate: string
  purchaseCost: number
  location?: string
  notes?: string
  createdBy?: string
  createdByName?: string
  createdAt: string
  updatedAt: string
}

