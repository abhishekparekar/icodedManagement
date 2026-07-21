import { useMemo, useState } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import {
  Boxes,
  Briefcase,
  Download,
  FileSpreadsheet,
  Filter,
  PieChart as PieIcon,
  Receipt,
  Search,
  Target,
  TrendingUp,
  Users,
  Wallet,
  X,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { StatCard } from '@/components/ui/StatCard'
import { GOAL_STATUSES, LEAD_STATUSES, PROJECT_STATUSES } from '@/lib/constants'
import { formatCurrency, formatDate } from '@/lib/utils'
import { useDataStore } from '@/stores/dataStore'

const CHART_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#06b6d4', '#ef4444', '#64748b']

type ReportType = 'financials' | 'inventory' | 'leads' | 'projects' | 'employees' | 'goals'

function downloadCSV(filename: string, rows: Record<string, any>[]) {
  if (!rows.length) {
    toast.error('No data available to export')
    return
  }
  const headers = Object.keys(rows[0])
  const csvContent =
    'data:text/csv;charset=utf-8,' +
    [
      headers.join(','),
      ...rows.map((row) =>
        headers.map((h) => `"${String(row[h] ?? '').replace(/"/g, '""')}"`).join(',')
      ),
    ].join('\n')

  const encodedUri = encodeURI(csvContent)
  const link = document.createElement('a')
  link.setAttribute('href', encodedUri)
  link.setAttribute('download', `${filename}_${new Date().toISOString().slice(0, 10)}.csv`)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  toast.success(`Exported ${rows.length} rows to ${filename}.csv`)
}

const CustomChartTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-xl border border-slate-200/90 bg-slate-950/95 p-3 shadow-xl backdrop-blur text-white text-xs space-y-1">
        <p className="font-extrabold text-slate-400 uppercase tracking-wider">{label}</p>
        {payload.map((p: any, idx: number) => (
          <p key={idx} className="font-semibold flex items-center justify-between gap-4">
            <span style={{ color: p.color || p.fill }}>{p.name}:</span>
            <span className="font-mono font-bold">
              {typeof p.value === 'number' && p.value > 1000
                ? formatCurrency(p.value, 'INR')
                : p.value}
            </span>
          </p>
        ))}
      </div>
    )
  }
  return null
}

export function ReportsPage() {
  const employees = useDataStore((s) => s.employees)
  const leads = useDataStore((s) => s.leads)
  const projects = useDataStore((s) => s.projects)
  const bills = useDataStore((s) => s.bills)
  const expenses = useDataStore((s) => s.expenses)
  const inventory = useDataStore((s) => s.inventory)
  const goals = useDataStore((s) => s.goals)

  const [activeReportType, setActiveReportType] = useState<ReportType>('leads')
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all')
  const [search, setSearch] = useState<string>('')
  
  // Interactive Chart Slicing Filters
  const [activePieFilter, setActivePieFilter] = useState<string | null>(null)
  const [activeBarFilter, setActiveBarFilter] = useState<string | null>(null)

  // Clear chart filters when switching active report type
  const switchReportType = (type: ReportType) => {
    setActiveReportType(type)
    setActivePieFilter(null)
    setActiveBarFilter(null)
  }

  // Reset all filters
  const resetAllFilters = () => {
    setSelectedDepartment('all')
    setSearch('')
    setActivePieFilter(null)
    setActiveBarFilter(null)
  }

  // Unique departments
  const departments = useMemo(() => {
    const set = new Set<string>()
    employees.forEach((e) => { if (e.department) set.add(e.department) })
    return Array.from(set)
  }, [employees])

  // Department-filtered employees
  const filteredEmployees = useMemo(() => {
    if (selectedDepartment === 'all') return employees
    return employees.filter((e) => e.department === selectedDepartment)
  }, [employees, selectedDepartment])

  // Financial Stats
  const financialStats = useMemo(() => {
    const totalBilled = bills.reduce((s, b) => s + b.grandTotal, 0)
    const totalCollected = bills.reduce((s, b) => s + (b.amountPaid || 0), 0)
    const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0)
    const netProfit = totalCollected - totalExpenses

    return { totalBilled, totalCollected, totalExpenses, netProfit }
  }, [bills, expenses])

  // Lead Ratios
  const leadStats = useMemo(() => {
    const total = leads.length
    const converted = leads.filter((l) => l.status === 'converted').length
    const conversionRatio = total ? Math.round((converted / total) * 100) : 0

    return { total, converted, conversionRatio }
  }, [leads])

  // Inventory Stats
  const inventoryStats = useMemo(() => {
    const totalValue = inventory.reduce((s, i) => s + (i.purchaseCost || 0), 0)
    const inUse = inventory.filter((i) => i.status === 'in_use').length
    const inUseRatio = inventory.length ? Math.round((inUse / inventory.length) * 100) : 0

    return { totalCount: inventory.length, totalValue, inUse, inUseRatio }
  }, [inventory])

  // Dynamic Bar Chart Data based on Active Module
  const primaryBarChartData = useMemo(() => {
    switch (activeReportType) {
      case 'financials': {
        const monthsMap: Record<string, { revenue: number; expense: number }> = {}
        bills.forEach((b) => {
          const month = b.issueDate ? b.issueDate.slice(0, 7) : '2026-07'
          if (!monthsMap[month]) monthsMap[month] = { revenue: 0, expense: 0 }
          monthsMap[month].revenue += b.grandTotal
        })
        expenses.forEach((e) => {
          const month = e.date ? e.date.slice(0, 7) : '2026-07'
          if (!monthsMap[month]) monthsMap[month] = { revenue: 0, expense: 0 }
          monthsMap[month].expense += e.amount
        })
        return Object.keys(monthsMap).sort().map((m) => ({
          label: m,
          val1: monthsMap[m].revenue,
          val2: monthsMap[m].expense,
        }))
      }

      case 'inventory': {
        const catMap: Record<string, number> = {}
        inventory.forEach((i) => {
          catMap[i.category] = (catMap[i.category] || 0) + (i.purchaseCost || 0)
        })
        return Object.entries(catMap).map(([cat, val]) => ({
          label: cat.replace('_', ' '),
          val1: val,
        }))
      }

      case 'leads': {
        const srcMap: Record<string, number> = {}
        leads.forEach((l) => {
          const src = l.source || 'other'
          srcMap[src] = (srcMap[src] || 0) + 1
        })
        return Object.entries(srcMap).map(([src, val]) => ({
          label: src.toUpperCase(),
          val1: val,
        }))
      }

      case 'projects': {
        const buckets = [
          { label: '0–25%', count: 0 },
          { label: '26–50%', count: 0 },
          { label: '51–75%', count: 0 },
          { label: '76–100%', count: 0 },
        ]
        projects.forEach((p) => {
          if (p.progress <= 25) buckets[0].count++
          else if (p.progress <= 50) buckets[1].count++
          else if (p.progress <= 75) buckets[2].count++
          else buckets[3].count++
        })
        return buckets.map((b) => ({ label: b.label, val1: b.count }))
      }

      case 'employees': {
        const deptMap: Record<string, number> = {}
        filteredEmployees.forEach((e) => {
          const d = e.department || 'General'
          deptMap[d] = (deptMap[d] || 0) + 1
        })
        return Object.entries(deptMap).map(([dept, val]) => ({ label: dept, val1: val }))
      }

      case 'goals': {
        const catMap: Record<string, number> = {}
        goals.forEach((g) => {
          catMap[g.category] = (catMap[g.category] || 0) + g.progress
        })
        return Object.entries(catMap).map(([cat, val]) => ({ label: cat.toUpperCase(), val1: val }))
      }

      default:
        return []
    }
  }, [activeReportType, bills, expenses, inventory, leads, projects, filteredEmployees, goals])

  // Dynamic Secondary Donut / Pie Breakdown Data
  const secondaryPieChartData = useMemo(() => {
    switch (activeReportType) {
      case 'financials': {
        const map: Record<string, number> = {}
        expenses.forEach((e) => {
          map[e.category] = (map[e.category] || 0) + e.amount
        })
        return Object.entries(map).map(([name, value]) => ({ name: name.replace('_', ' '), value }))
      }

      case 'inventory': {
        const map: Record<string, number> = {}
        inventory.forEach((i) => {
          map[i.status] = (map[i.status] || 0) + 1
        })
        return Object.entries(map).map(([name, value]) => ({ name: name.replace('_', ' '), value }))
      }

      case 'leads': {
        return LEAD_STATUSES.map((s) => ({
          name: s.label,
          value: leads.filter((l) => l.status === s.value).length,
        }))
      }

      case 'projects': {
        return PROJECT_STATUSES.map((s) => ({
          name: s.label,
          value: projects.filter((p) => p.status === s.value).length,
        }))
      }

      case 'employees': {
        const counts = { Admin: 0, Manager: 0, Employee: 0 }
        filteredEmployees.forEach((e) => {
          if (e.role === 'admin') counts.Admin++
          else if (e.role === 'manager') counts.Manager++
          else counts.Employee++
        })
        return Object.entries(counts).map(([name, value]) => ({ name, value }))
      }

      case 'goals': {
        return GOAL_STATUSES.map((s) => ({
          name: s.label,
          value: goals.filter((g) => g.status === s.value).length,
        }))
      }

      default:
        return []
    }
  }, [activeReportType, expenses, inventory, leads, projects, filteredEmployees, goals])

  // Active Live Table Stream Data matching selected filters & chart slice clicks
  const reportTableData = useMemo(() => {
    const query = search.toLowerCase().trim()

    switch (activeReportType) {
      case 'financials':
        return bills
          .filter((b) => {
            if (query && !b.billNumber.toLowerCase().includes(query) && !b.client.name.toLowerCase().includes(query)) return false
            if (activePieFilter && b.status.toLowerCase() !== activePieFilter.toLowerCase()) return false
            return true
          })
          .map((b) => ({
            'Bill No': b.billNumber,
            'Client Name': b.client.name,
            'Company': b.client.company || 'N/A',
            'Issue Date': formatDate(b.issueDate),
            'Due Date': formatDate(b.dueDate),
            'Grand Total': formatCurrency(b.grandTotal, 'INR'),
            'Amount Paid': formatCurrency(b.amountPaid || 0, 'INR'),
            'Balance Due': formatCurrency(b.balanceDue ?? 0, 'INR'),
            'Status': b.status.toUpperCase(),
          }))

      case 'inventory':
        return inventory
          .filter((i) => {
            if (query && !i.name.toLowerCase().includes(query) && !i.assetTag.toLowerCase().includes(query)) return false
            if (activePieFilter) {
              const statusClean = i.status.replace('_', ' ').toLowerCase()
              if (statusClean !== activePieFilter.toLowerCase()) return false
            }
            if (activeBarFilter) {
              const catClean = i.category.replace('_', ' ').toLowerCase()
              if (catClean !== activeBarFilter.toLowerCase()) return false
            }
            return true
          })
          .map((i) => ({
            'Asset Tag': i.assetTag,
            'Asset Name': i.name,
            'Category': i.category,
            'Status': i.status,
            'Condition': i.condition,
            'Assigned To': i.assignedToName || 'Unassigned',
            'Added By': i.createdByName || 'Admin',
            'Purchase Cost': formatCurrency(i.purchaseCost || 0, 'INR'),
          }))

      case 'leads':
        return leads
          .filter((l) => {
            if (query && !l.clientName.toLowerCase().includes(query) && !l.contact.toLowerCase().includes(query)) return false
            if (activePieFilter) {
              const matchedStatus = LEAD_STATUSES.find((s) => s.label.toLowerCase() === activePieFilter.toLowerCase())
              if (matchedStatus && l.status !== matchedStatus.value) return false
            }
            if (activeBarFilter) {
              if (l.source.toLowerCase() !== activeBarFilter.toLowerCase()) return false
            }
            return true
          })
          .map((l) => ({
            'Client Name': l.clientName,
            'Contact': l.contact,
            'Source': l.source,
            'Status': l.status.toUpperCase(),
            'Assigned To': l.assignedTo || 'Unassigned',
            'Created Date': formatDate(l.createdAt),
          }))

      case 'projects':
        return projects
          .filter((p) => {
            if (query && !p.name.toLowerCase().includes(query) && !p.description.toLowerCase().includes(query)) return false
            // Pie filter (Pending, Ongoing, Completed)
            if (activePieFilter) {
              const matchedStatus = PROJECT_STATUSES.find((s) => s.label.toLowerCase() === activePieFilter.toLowerCase())
              if (matchedStatus && p.status !== matchedStatus.value) return false
            }
            // Bar filter (0–25%, 26–50%, 51–75%, 76–100%)
            if (activeBarFilter) {
              if (activeBarFilter.includes('0–25') && !(p.progress >= 0 && p.progress <= 25)) return false
              if (activeBarFilter.includes('26–50') && !(p.progress >= 26 && p.progress <= 50)) return false
              if (activeBarFilter.includes('51–75') && !(p.progress >= 51 && p.progress <= 75)) return false
              if (activeBarFilter.includes('76–100') && !(p.progress >= 76 && p.progress <= 100)) return false
            }
            return true
          })
          .map((p) => ({
            'Project Name': p.name,
            'Description': p.description || 'N/A',
            'Status': p.status.toUpperCase(),
            'Progress': `${p.progress}%`,
            'Start Date': formatDate(p.startDate),
            'End Date': formatDate(p.endDate),
          }))

      case 'employees':
        return filteredEmployees
          .filter((e) => {
            if (query && !e.name.toLowerCase().includes(query) && !e.email.toLowerCase().includes(query)) return false
            if (activePieFilter && e.role.toLowerCase() !== activePieFilter.toLowerCase()) return false
            if (activeBarFilter && e.department.toLowerCase() !== activeBarFilter.toLowerCase()) return false
            return true
          })
          .map((e) => ({
            'Emp ID': e.id,
            'Full Name': e.name,
            'Email': e.email,
            'Phone': e.phone,
            'Department': e.department,
            'Role': e.role.toUpperCase(),
            'Joining Date': formatDate(e.joiningDate),
          }))

      case 'goals':
        return goals
          .filter((g) => {
            if (query && !g.title.toLowerCase().includes(query)) return false
            if (activePieFilter) {
              const matchedStatus = GOAL_STATUSES.find((s) => s.label.toLowerCase() === activePieFilter.toLowerCase())
              if (matchedStatus && g.status !== matchedStatus.value) return false
            }
            if (activeBarFilter && g.category.toLowerCase() !== activeBarFilter.toLowerCase()) return false
            return true
          })
          .map((g) => ({
            'Goal Title': g.title,
            'Category': g.category,
            'Priority': g.priority.toUpperCase(),
            'Status': g.status.toUpperCase(),
            'Progress': `${g.progress}%`,
            'Due Date': formatDate(g.dueDate),
            'Created By': g.createdByName || 'Admin',
          }))

      default:
        return []
    }
  }, [activeReportType, bills, inventory, leads, projects, filteredEmployees, goals, search, activePieFilter, activeBarFilter])

  // CSV Export Trigger
  const handleExportCSV = () => {
    downloadCSV(`${activeReportType}_department_report`, reportTableData)
  }

  return (
    <div className="space-y-4 sm:space-y-5 animate-fade-in">
      {/* ── Top Executive KPI Metrics ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-5">
        <StatCard
          title="Collected Revenue"
          value={formatCurrency(financialStats.totalCollected, 'INR')}
          icon={Wallet}
          to="/bills"
          gradient="from-emerald-500 to-teal-600"
          trend={`Billed: ${formatCurrency(financialStats.totalBilled, 'INR')}`}
          delay="delay-75"
        />
        <StatCard
          title="Total IT Expenses"
          value={formatCurrency(financialStats.totalExpenses, 'INR')}
          icon={Receipt}
          to="/expenses"
          gradient="from-brand-500 to-violet-600"
          trend={`Profit: ${formatCurrency(financialStats.netProfit, 'INR')}`}
          delay="delay-150"
        />
        <StatCard
          title="Lead Conversion Ratio"
          value={`${leadStats.conversionRatio}%`}
          icon={Target}
          to="/leads"
          gradient="from-amber-500 to-orange-500"
          trend={`${leadStats.converted} / ${leadStats.total} Converted`}
          delay="delay-225"
        />
        <StatCard
          title="Active IT Hardware"
          value={inventoryStats.totalCount}
          icon={Boxes}
          to="/inventory"
          gradient="from-blue-500 to-cyan-500"
          trend={`${inventoryStats.inUseRatio}% In-Use (${formatCurrency(inventoryStats.totalValue, 'INR')})`}
          delay="delay-300"
        />
      </div>

      {/* ── Department & Report Control Bar (2-Tier Layout for 100% Zero Clipping) ── */}
      <div className="bg-white dark:bg-slate-900 p-3.5 sm:p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
        
        {/* Tier 1: Controls & Actions Row */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          
          <div className="flex items-center gap-2">
            <span className="text-xs font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Report Category:
            </span>
            <select
              value={activeReportType}
              onChange={(e) => switchReportType(e.target.value as ReportType)}
              className="h-9 rounded-xl border border-slate-200/90 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-3 text-xs font-bold text-brand-600 dark:text-brand-400 focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all capitalize"
            >
              <option value="financials">Financials & Invoices</option>
              <option value="inventory">IT Hardware Assets</option>
              <option value="leads">Leads Pipeline</option>
              <option value="projects">Projects & Delivery</option>
              <option value="employees">Team Directory</option>
              <option value="goals">Goals & Milestones</option>
            </select>
          </div>

          <div className="flex items-center gap-2 shrink-0 justify-between sm:justify-end">
            <select
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
              className="h-9 rounded-xl border border-slate-200/90 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-3 text-xs font-semibold text-slate-700 dark:text-slate-200 focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all"
            >
              <option value="all">Department: All</option>
              {departments.map((d) => (
                <option key={d} value={d}>
                  Dept: {d}
                </option>
              ))}
            </select>

            <Button
              onClick={handleExportCSV}
              className="h-9 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20 px-4 shrink-0"
            >
              <Download className="h-4 w-4" /> Export CSV
            </Button>
          </div>
        </div>

        {/* Tier 2: Dedicated Scrollable Navigation Tabs Row (Zero Clipping) */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80">
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar scroll-smooth w-full pb-0.5">
            {[
              { id: 'financials', label: 'Financials & Invoices', icon: Receipt },
              { id: 'inventory',  label: 'IT Hardware Assets',   icon: Boxes },
              { id: 'leads',      label: 'Leads Pipeline',        icon: Target },
              { id: 'projects',   label: 'Projects & Delivery',   icon: Briefcase },
              { id: 'employees',  label: 'Team Directory',       icon: Users },
              { id: 'goals',      label: 'Goals & Milestones',    icon: TrendingUp },
            ].map((tab) => {
              const Icon = tab.icon
              const isActive = activeReportType === tab.id
              return (
                <button
                  key={tab.id}
                  onClick={() => switchReportType(tab.id as ReportType)}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all shrink-0 ${
                    isActive
                      ? 'bg-gradient-to-r from-brand-600 to-violet-600 text-white shadow-md shadow-brand-500/20'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span>{tab.label}</span>
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* ── Active Module Interactive Charts ── */}
      <div className="grid gap-4 lg:grid-cols-3">
        
        {/* Main Bar Chart */}
        <Card className="lg:col-span-2 !p-4 sm:!p-5">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2 capitalize">
                <TrendingUp className="h-4 w-4 text-brand-600 dark:text-brand-400" />
                {activeReportType} Bar Analytics Chart
              </h3>
              <p className="text-xs text-slate-400">Click any bar to filter table stream below</p>
            </div>
            {activeReportType === 'financials' && (
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 rounded-lg">
                Net Profit: {formatCurrency(financialStats.netProfit, 'INR')}
              </span>
            )}
          </div>

          <div className="w-full" style={{ height: 240 }}>
            <ResponsiveContainer width="100%" height={240} minHeight={150}>
              <BarChart
                data={primaryBarChartData}
                margin={{ top: 10, right: 10, left: 15, bottom: 0 }}
                onClick={(state) => {
                  if (state && state.activeLabel) {
                    const label = String(state.activeLabel)
                    setActiveBarFilter(label === activeBarFilter ? null : label)
                  }
                }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-slate-100 dark:stroke-slate-800" />
                <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10 }} />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#94a3b8', fontSize: 10 }}
                  tickFormatter={(v) => typeof v === 'number' && v >= 1000 ? `₹${(v / 1000).toFixed(0)}k` : v}
                />
                <Tooltip content={<CustomChartTooltip />} />
                <Bar
                  dataKey="val1"
                  name={activeReportType === 'financials' ? 'Billed Revenue' : 'Count / Metric'}
                  fill="#3b82f6"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={32}
                  className="cursor-pointer"
                />
                {activeReportType === 'financials' && (
                  <Bar dataKey="val2" name="IT Expenses" fill="#ef4444" radius={[4, 4, 0, 0]} maxBarSize={32} className="cursor-pointer" />
                )}
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Secondary Donut Breakdown Chart */}
        <Card className="!p-4 sm:!p-5">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2 capitalize">
                <PieIcon className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                {activeReportType} Ratio Breakdown
              </h3>
              <p className="text-xs text-slate-400">Click slice to filter table stream</p>
            </div>
          </div>

          <div className="w-full" style={{ height: 180 }}>
            <ResponsiveContainer width="100%" height={180} minHeight={120}>
              <PieChart>
                <Pie
                  data={secondaryPieChartData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={70}
                  paddingAngle={4}
                  onClick={(entry) => {
                    const name = entry?.name ? String(entry.name) : null
                    setActivePieFilter(name === activePieFilter ? null : name)
                  }}
                >
                  {secondaryPieChartData.map((_, idx) => (
                    <Cell
                      key={`cell-${idx}`}
                      fill={CHART_COLORS[idx % CHART_COLORS.length]}
                      className="cursor-pointer hover:opacity-80 transition-opacity"
                    />
                  ))}
                </Pie>
                <Tooltip content={<CustomChartTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-2 flex flex-wrap justify-center gap-x-2.5 gap-y-1.5 max-h-24 overflow-y-auto">
            {secondaryPieChartData.map((entry, idx) => (
              <button
                key={entry.name}
                onClick={() => setActivePieFilter(entry.name === activePieFilter ? null : entry.name)}
                className={`flex items-center gap-1.5 px-2 py-0.5 rounded-lg text-[11px] font-bold capitalize transition-all ${
                  activePieFilter === entry.name
                    ? 'bg-brand-600 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                }`}
              >
                <span className="inline-block h-2 w-2 rounded-full shrink-0" style={{ background: CHART_COLORS[idx % CHART_COLORS.length] }} />
                <span>{entry.name} ({entry.value})</span>
              </button>
            ))}
          </div>
        </Card>
      </div>

      {/* ── Active Department Live Data Stream Table ── */}
      <Card className="!p-0 overflow-hidden">
        
        {/* Table Toolbar Header */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 px-4 sm:px-6 py-3.5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex flex-wrap items-center gap-2">
            <FileSpreadsheet className="h-4.5 w-4.5 text-emerald-600 dark:text-emerald-400" />
            <h3 className="text-sm font-extrabold text-slate-900 dark:text-white capitalize">
              {activeReportType} Department Stream ({reportTableData.length} records)
            </h3>

            {/* Active Slice / Bar Filter Badges */}
            {(activePieFilter || activeBarFilter || selectedDepartment !== 'all' || search) && (
              <div className="flex items-center gap-1.5 ml-2">
                {activePieFilter && (
                  <Badge className="bg-brand-50 text-brand-600 border border-brand-200 dark:bg-brand-950/40 dark:text-brand-400 dark:border-brand-800 flex items-center gap-1 text-[10px]">
                    <Filter className="h-3 w-3" /> Ratio: {activePieFilter}
                    <button onClick={() => setActivePieFilter(null)} className="ml-1 hover:text-red-500">
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                )}
                {activeBarFilter && (
                  <Badge className="bg-purple-50 text-purple-600 border border-purple-200 dark:bg-purple-950/40 dark:text-purple-400 dark:border-purple-800 flex items-center gap-1 text-[10px]">
                    <Filter className="h-3 w-3" /> Bar: {activeBarFilter}
                    <button onClick={() => setActiveBarFilter(null)} className="ml-1 hover:text-red-500">
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                )}
                <button
                  onClick={resetAllFilters}
                  className="text-[11px] font-bold text-brand-600 dark:text-brand-400 hover:underline px-1"
                >
                  Reset All
                </button>
              </div>
            )}
          </div>

          {/* Table Search Input */}
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search active report stream..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-8 w-full rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-950 pl-8 pr-7 text-xs font-semibold text-slate-700 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:border-brand-500 transition-all"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-2 top-2 text-slate-400 hover:text-slate-600">
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Live Table Stream */}
        {reportTableData.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs font-medium space-y-2">
            <p>No report records match the selected slice, department, or search query.</p>
            <Button variant="secondary" onClick={resetAllFilters} className="h-8 text-xs font-bold">
              Reset Filters
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-200/80 bg-slate-50/80 text-[10px] uppercase tracking-wider text-slate-400 dark:border-slate-800 dark:bg-slate-950/80 font-bold">
                <tr>
                  {Object.keys(reportTableData[0]).map((col) => (
                    <th key={col} className="py-3 px-4 sm:px-6">{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {reportTableData.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                    {Object.entries(row).map(([col, val], colIdx) => (
                      <td key={colIdx} className="py-3 px-4 sm:px-6 font-semibold text-slate-700 dark:text-slate-200">
                        {String(val).startsWith('₹') ? (
                          <span className="font-black text-slate-900 dark:text-white">{String(val)}</span>
                        ) : col === 'Status' || col === 'Priority' ? (
                          <Badge className="uppercase text-[9px] font-black tracking-wider border bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                            {String(val)}
                          </Badge>
                        ) : (
                          String(val)
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  )
}
