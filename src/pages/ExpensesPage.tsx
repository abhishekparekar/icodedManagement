import { useState } from 'react'
import {
  Plus,
  Search,
  Wallet,
  Cloud,
  Cpu,
  Receipt,
  Clock,
  Trash2,
  Edit2,
  TrendingDown,
  Layers,
  X,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { Avatar } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts'
import { StatCard } from '@/components/ui/StatCard'
import { canManageExpenses } from '@/lib/permissions'
import { formatCurrency } from '@/lib/utils'
import { createExpense, deleteExpense, updateExpense } from '@/services/expenses.service'
import { useAuthStore } from '@/stores/authStore'
import { useDataStore } from '@/stores/dataStore'
import type { Expense, ExpenseCategory, ExpenseStatus } from '@/types'

const CATEGORY_LABELS: Record<ExpenseCategory, string> = {
  software_subscription: 'SaaS / Software',
  hardware: 'IT Hardware',
  cloud_infrastructure: 'Cloud & Servers',
  office_utility: 'Office Utilities',
  team_allowance: 'Team & Perks',
  marketing: 'Marketing & Ads',
  miscellaneous: 'Miscellaneous',
}

const CATEGORY_COLORS: Record<ExpenseCategory, string> = {
  software_subscription: '#3b82f6',
  hardware: '#8b5cf6',
  cloud_infrastructure: '#06b6d4',
  office_utility: '#10b981',
  team_allowance: '#f59e0b',
  marketing: '#ec4899',
  miscellaneous: '#64748b',
}

const STATUS_CONFIG: Record<ExpenseStatus, { label: string; bg: string; text: string }> = {
  paid: { label: 'Paid', bg: 'bg-emerald-50 dark:bg-emerald-950/40', text: 'text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800' },
  pending: { label: 'Pending', bg: 'bg-amber-50 dark:bg-amber-950/40', text: 'text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800' },
  approved: { label: 'Approved', bg: 'bg-blue-50 dark:bg-blue-950/40', text: 'text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800' },
}

export function ExpensesPage() {
  const user = useAuthStore((s) => s.user)
  const expenses = useDataStore((s) => s.expenses)

  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [selectedStatus, setSelectedStatus] = useState<string>('all')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Form fields
  const [title, setTitle] = useState('')
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState<ExpenseCategory>('software_subscription')
  const [paymentMethod, setPaymentMethod] = useState('Corporate Credit Card')
  const [vendor, setVendor] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [status, setStatus] = useState<ExpenseStatus>('paid')
  const [notes, setNotes] = useState('')

  const canManage = canManageExpenses(user)

  const openCreateModal = () => {
    setEditingExpense(null)
    setTitle('')
    setAmount('')
    setCategory('software_subscription')
    setPaymentMethod('Corporate Credit Card')
    setVendor('')
    setDate(new Date().toISOString().split('T')[0])
    setStatus('paid')
    setNotes('')
    setIsModalOpen(true)
  }

  const openEditModal = (exp: Expense) => {
    setEditingExpense(exp)
    setTitle(exp.title)
    setAmount(String(exp.amount))
    setCategory(exp.category)
    setPaymentMethod(exp.paymentMethod)
    setVendor(exp.vendor)
    setDate(exp.date)
    setStatus(exp.status)
    setNotes(exp.notes || '')
    setIsModalOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user?.tenantId || !title.trim() || !amount) {
      toast.error('Please fill required fields')
      return
    }

    const numericAmount = parseFloat(amount)
    if (isNaN(numericAmount) || numericAmount <= 0) {
      toast.error('Please enter a valid amount')
      return
    }

    setIsSubmitting(true)
    try {
      if (editingExpense) {
        await updateExpense(
          editingExpense.id,
          user.tenantId,
          {
            title: title.trim(),
            amount: numericAmount,
            category,
            paymentMethod,
            vendor: vendor.trim(),
            date,
            status,
            notes: notes.trim(),
          },
          user,
        )
        toast.success('Expense updated successfully')
      } else {
        await createExpense(
          user.tenantId,
          {
            title: title.trim(),
            amount: numericAmount,
            category,
            paymentMethod,
            vendor: vendor.trim(),
            date,
            status,
            notes: notes.trim(),
            createdBy: user.uid,
            createdByName: user.name,
          },
          user,
        )
        toast.success('Expense recorded successfully')
      }
      setIsModalOpen(false)
    } catch {
      toast.error('Failed to save expense')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (exp: Expense) => {
    if (!user?.tenantId) return
    if (!confirm(`Delete expense "${exp.title}"?`)) return
    try {
      await deleteExpense(exp.id, user.tenantId, exp.title, user)
      toast.success('Expense deleted')
    } catch {
      toast.error('Failed to delete expense')
    }
  }

  // Filtered expenses
  const filteredExpenses = expenses.filter((exp) => {
    const matchesSearch =
      exp.title.toLowerCase().includes(search.toLowerCase()) ||
      exp.vendor.toLowerCase().includes(search.toLowerCase()) ||
      (exp.notes && exp.notes.toLowerCase().includes(search.toLowerCase()))
    const matchesCategory = selectedCategory === 'all' || exp.category === selectedCategory
    const matchesStatus = selectedStatus === 'all' || exp.status === selectedStatus
    return matchesSearch && matchesCategory && matchesStatus
  })

  // Calculation stats
  const totalAmount = expenses.reduce((sum, e) => sum + e.amount, 0)
  const saasAmount = expenses
    .filter((e) => e.category === 'software_subscription')
    .reduce((sum, e) => sum + e.amount, 0)
  const cloudAmount = expenses
    .filter((e) => e.category === 'cloud_infrastructure')
    .reduce((sum, e) => sum + e.amount, 0)
  const pendingCount = expenses.filter((e) => e.status === 'pending').length

  // Chart data
  const categoryChartData = (Object.keys(CATEGORY_LABELS) as ExpenseCategory[]).map((cat) => {
    const value = expenses
      .filter((e) => e.category === cat)
      .reduce((sum, e) => sum + e.amount, 0)
    return { name: CATEGORY_LABELS[cat], value, color: CATEGORY_COLORS[cat] }
  }).filter((d) => d.value > 0)

  // Monthly breakdown
  const monthlyDataMap: Record<string, number> = {}
  expenses.forEach((e) => {
    const month = e.date ? e.date.substring(0, 7) : 'Unknown'
    monthlyDataMap[month] = (monthlyDataMap[month] || 0) + e.amount
  })
  const monthlyChartData = Object.keys(monthlyDataMap)
    .sort()
    .slice(-6)
    .map((m) => ({ month: m, amount: monthlyDataMap[m] }))

  return (
    <div className="space-y-4 animate-fade-in pb-16">
      {/* Overview Stat Cards (Compact 2x2 Grid) */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatCard title="Total Spending" value={formatCurrency(totalAmount, 'INR')} icon={Wallet}  gradient="from-brand-500 to-violet-600" delay="delay-75" />
        <StatCard title="SaaS & Apps"    value={formatCurrency(saasAmount, 'INR')}  icon={Cpu}     gradient="from-blue-500 to-cyan-500" delay="delay-150" />
        <StatCard title="Cloud Infra"    value={formatCurrency(cloudAmount, 'INR')} icon={Cloud}   gradient="from-cyan-500 to-teal-600" delay="delay-225" />
        <StatCard title="Pending"        value={pendingCount}                        icon={Clock}   gradient="from-amber-500 to-orange-500" delay="delay-300" />
      </div>

      {/* Analytics Charts Section (Compact heights) */}
      {expenses.length > 0 && (
        <div className="grid gap-3 lg:grid-cols-3">
          {/* Monthly Trend Bar Chart */}
          <div className="rounded-2xl border border-slate-200/70 bg-white p-3 sm:p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900 lg:col-span-2">
            <h3 className="text-xs font-black text-slate-800 dark:text-slate-200 mb-2 flex items-center gap-1.5">
              <TrendingDown className="h-3.5 w-3.5 text-brand-600" />
              Monthly Expense Trend
            </h3>
            <div className="w-full" style={{ height: 160 }}>
              <ResponsiveContainer width="100%" height={160} minHeight={100}>
                <BarChart data={monthlyChartData} margin={{ top: 5, right: 5, left: -22, bottom: 0 }}>
                  <XAxis dataKey="month" stroke="#94a3b8" fontSize={10} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderRadius: '10px',
                      border: 'none',
                      color: '#fff',
                      fontSize: '11px',
                    }}
                    formatter={(val: any) => [formatCurrency(Number(val || 0), 'INR'), 'Amount']}
                  />
                  <Bar dataKey="amount" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={32} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Category Distribution Pie Chart */}
          <div className="rounded-2xl border border-slate-200/70 bg-white p-3 sm:p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900">
            <h3 className="text-xs font-black text-slate-800 dark:text-slate-200 mb-1 flex items-center gap-1.5">
              <Layers className="h-3.5 w-3.5 text-purple-600" />
              Category Breakdown
            </h3>
            <div className="w-full" style={{ height: 160 }}>
              <ResponsiveContainer width="100%" height={160} minHeight={100}>
                <PieChart>
                  <Pie
                    data={categoryChartData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={32}
                    outerRadius={52}
                    paddingAngle={3}
                  >
                    {categoryChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(val: any) => [formatCurrency(Number(val || 0), 'INR'), 'Value']} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* ── Integrated Filter & Action Control Bar ── */}
      <div className="bg-white dark:bg-slate-900 p-3 sm:p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
        
        {/* Top Control Bar: Search + Dropdowns + Action Buttons */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          
          {/* Search Input & Select Dropdowns */}
          <div className="flex flex-1 flex-col sm:flex-row items-stretch sm:items-center gap-2.5 max-w-2xl">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Search vendor or expense title..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-9 w-full rounded-xl border border-slate-200/90 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 pl-9 pr-8 text-xs font-semibold text-slate-700 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all"
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

            {/* Category Select Dropdown */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="h-9 rounded-xl border border-slate-200/90 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-3 text-xs font-semibold text-slate-700 dark:text-slate-200 focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all"
            >
              <option value="all">Category: All</option>
              {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>

            {/* Status Dropdown */}
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="h-9 rounded-xl border border-slate-200/90 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-3 text-xs font-semibold text-slate-700 dark:text-slate-200 focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all"
            >
              <option value="all">Status: All</option>
              <option value="paid">Paid</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
            </select>
          </div>

          {/* Action Buttons (Always Prominently Visible on PC/Laptop) */}
          <div className="flex items-center gap-2 shrink-0 justify-between sm:justify-end">
            {(search || selectedCategory !== 'all' || selectedStatus !== 'all') && (
              <button
                onClick={() => { setSearch(''); setSelectedCategory('all'); setSelectedStatus('all') }}
                className="text-xs font-bold text-brand-600 dark:text-brand-400 hover:underline px-2 shrink-0"
              >
                Reset
              </button>
            )}

            {canManage && (
              <Button
                onClick={openCreateModal}
                className="h-9 text-xs font-bold bg-gradient-to-r from-brand-600 to-violet-600 hover:from-brand-700 hover:to-violet-700 text-white shadow-md shadow-brand-500/20 shrink-0 px-4"
              >
                <Plus className="h-4 w-4" /> Add Expense
              </Button>
            )}
          </div>
        </div>

        {/* Bottom Filter Pills Bar for Quick 1-Click Access */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-2 border-t border-slate-100 dark:border-slate-800/80">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider pr-1 shrink-0">Quick Filter:</span>
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-3 py-1 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              selectedCategory === 'all'
                ? 'bg-gradient-to-r from-brand-600 to-violet-600 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            All Categories
          </button>
          {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setSelectedCategory(key)}
              className={`px-3 py-1 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                selectedCategory === key
                  ? 'bg-gradient-to-r from-brand-600 to-violet-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Expense List View */}
      {filteredExpenses.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 p-8 text-center dark:border-slate-800 bg-white dark:bg-slate-900">
          <Receipt className="h-10 w-10 text-slate-300 dark:text-slate-600 mb-2" />
          <h4 className="text-sm font-black text-slate-800 dark:text-slate-200">No Expenses Found</h4>
          <p className="text-[11px] text-slate-400 max-w-xs mt-0.5">
            {search || selectedCategory !== 'all'
              ? 'Try adjusting your search filters.'
              : 'Record your first IT company expense item.'}
          </p>
        </div>
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="hidden lg:block overflow-hidden rounded-2xl border border-slate-200/70 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
              <thead className="border-b border-slate-100 bg-slate-50 text-[10px] font-black uppercase tracking-wider text-slate-400 dark:border-slate-800 dark:bg-slate-950/60">
                <tr>
                  <th className="px-4 py-3">Expense Title & Vendor</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Payment</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Added By</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Amount</th>
                  {canManage && <th className="px-4 py-3 text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredExpenses.map((exp) => {
                  const statusInfo = STATUS_CONFIG[exp.status]
                  const creatorName = exp.createdByName || exp.createdBy || 'Admin'
                  return (
                    <tr key={exp.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="px-4 py-3">
                        <div className="font-bold text-slate-900 dark:text-white text-xs">{exp.title}</div>
                        <div className="text-[10px] text-slate-400">{exp.vendor}</div>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className="inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-extrabold"
                          style={{
                            backgroundColor: `${CATEGORY_COLORS[exp.category]}15`,
                            color: CATEGORY_COLORS[exp.category],
                          }}
                        >
                          {CATEGORY_LABELS[exp.category]}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                        {exp.paymentMethod}
                      </td>
                      <td className="px-4 py-3 text-[11px] text-slate-400">{exp.date}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <Avatar name={creatorName} size="sm" className="h-5 w-5 text-[9px]" />
                          <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 truncate">
                            {creatorName}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-black ${statusInfo.bg} ${statusInfo.text}`}>
                          {statusInfo.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-black text-slate-900 dark:text-white">
                        {formatCurrency(exp.amount, 'INR')}
                      </td>
                      {canManage && (
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => openEditModal(exp)}
                              className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800"
                              title="Edit"
                            >
                              <Edit2 className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => handleDelete(exp)}
                              className="rounded-lg p-1 text-slate-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40"
                              title="Delete"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Sleek Native Card List View */}
          <div className="grid gap-2.5 lg:hidden">
            {filteredExpenses.map((exp) => {
              const statusInfo = STATUS_CONFIG[exp.status]
              return (
                <div
                  key={exp.id}
                  className="rounded-2xl border border-slate-200/70 bg-white p-3 shadow-sm dark:border-slate-800 dark:bg-slate-900 active:scale-[0.99] transition-all"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span
                        className="inline-block rounded-md px-2 py-0.5 text-[9px] font-black tracking-tight mb-1"
                        style={{
                          backgroundColor: `${CATEGORY_COLORS[exp.category]}18`,
                          color: CATEGORY_COLORS[exp.category],
                        }}
                      >
                        {CATEGORY_LABELS[exp.category]}
                      </span>
                      <h4 className="font-extrabold text-slate-900 dark:text-white text-sm leading-snug">
                        {exp.title}
                      </h4>
                      <p className="text-[11px] font-semibold text-slate-400">{exp.vendor}</p>
                    </div>

                    <div className="text-right shrink-0 ml-2">
                      <p className="text-base font-black text-brand-600 dark:text-brand-400 leading-none">
                        {formatCurrency(exp.amount, 'INR')}
                      </p>
                      <span className={`inline-block mt-1 rounded-full border px-2 py-0.5 text-[9px] font-black ${statusInfo.bg} ${statusInfo.text}`}>
                        {statusInfo.label}
                      </span>
                    </div>
                  </div>

                  {exp.notes && (
                    <p className="mt-2 text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 bg-slate-50 dark:bg-slate-800/50 p-2 rounded-xl">
                      {exp.notes}
                    </p>
                  )}

                  <div className="mt-2.5 flex items-center justify-between border-t border-slate-100 dark:border-slate-800/80 pt-2 text-[10px] text-slate-400 font-semibold">
                    <div className="flex items-center gap-1.5 truncate">
                      <Avatar name={exp.createdByName || exp.createdBy || 'Admin'} size="sm" className="h-4.5 w-4.5 text-[8px]" />
                      <span className="truncate text-slate-600 dark:text-slate-300 font-bold">
                        {exp.createdByName || exp.createdBy || 'Admin'}
                      </span>
                      <span>• {exp.date}</span>
                    </div>

                    {canManage && (
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => openEditModal(exp)}
                          className="font-bold text-brand-600 dark:text-brand-400"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(exp)}
                          className="font-bold text-red-600 dark:text-red-400"
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </>
      )}

      {/* Floating Action Button (FAB) on Mobile */}
      {canManage && (
        <button
          onClick={openCreateModal}
          className="fixed bottom-20 right-4 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-r from-brand-600 to-indigo-600 text-white shadow-xl shadow-brand-600/40 lg:hidden active:scale-95 transition-all"
          aria-label="Add Expense"
        >
          <Plus className="h-6 w-6" />
        </button>
      )}

      {/* Modal Dialog */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-lg rounded-3xl border border-slate-200/80 bg-white p-5 shadow-2xl dark:border-slate-800 dark:bg-slate-900 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-black text-slate-900 dark:text-white">
              {editingExpense ? 'Edit Expense Record' : 'Record New Expense'}
            </h3>
            <p className="mt-0.5 text-xs text-slate-500">
              Enter expense amount, category, and vendor details.
            </p>

            <form onSubmit={handleSubmit} className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Expense Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. AWS Hosting / GitHub Copilot"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800 transition-all focus:border-brand-500 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    Amount (₹) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800 transition-all focus:border-brand-500 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    Category *
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as ExpenseCategory)}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800 transition-all focus:border-brand-500 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  >
                    {Object.entries(CATEGORY_LABELS).map(([k, v]) => (
                      <option key={k} value={k}>
                        {v}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    Vendor
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. AWS / GitHub"
                    value={vendor}
                    onChange={(e) => setVendor(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800 transition-all focus:border-brand-500 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    Payment Method
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Corporate Card"
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800 transition-all focus:border-brand-500 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    Expense Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800 transition-all focus:border-brand-500 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    Status
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as ExpenseStatus)}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800 transition-all focus:border-brand-500 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  >
                    <option value="paid">Paid</option>
                    <option value="pending">Pending</option>
                    <option value="approved">Approved</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Notes
                </label>
                <textarea
                  rows={2}
                  placeholder="Notes..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800 transition-all focus:border-brand-500 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-xl px-3.5 py-2 text-xs font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="rounded-xl bg-brand-600 px-4 py-2 text-xs font-black text-white shadow-lg shadow-brand-600/25 hover:bg-brand-700 disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving...' : editingExpense ? 'Save Changes' : 'Record Expense'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
