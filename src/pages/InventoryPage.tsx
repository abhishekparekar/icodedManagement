import { useState } from 'react'
import {
  Plus,
  Search,
  Boxes,
  Laptop,
  CheckCircle2,
  Wrench,
  Trash2,
  Edit2,
  Tag,
  UserCheck,
  X,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { Avatar } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'
import { StatCard } from '@/components/ui/StatCard'
import { canManageInventory } from '@/lib/permissions'
import { formatCurrency } from '@/lib/utils'
import { createInventoryItem, deleteInventoryItem, updateInventoryItem } from '@/services/inventory.service'
import { useAuthStore } from '@/stores/authStore'
import { useDataStore } from '@/stores/dataStore'
import type { InventoryCategory, InventoryCondition, InventoryItem, InventoryStatus } from '@/types'

const CATEGORY_LABELS: Record<InventoryCategory, string> = {
  laptop: 'Laptops & MacBooks',
  workstation: 'Workstations & PCs',
  monitor: 'Monitors & Displays',
  server_network: 'Servers & Network',
  mobile_tablet: 'Mobile & Tablets',
  software_license: 'Software Licenses',
  peripheral: 'Peripherals & Gear',
}

const STATUS_CONFIG: Record<InventoryStatus, { label: string; bg: string; text: string }> = {
  in_use: { label: 'In Use', bg: 'bg-blue-50 dark:bg-blue-950/40', text: 'text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800' },
  in_stock: { label: 'In Stock', bg: 'bg-emerald-50 dark:bg-emerald-950/40', text: 'text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800' },
  maintenance: { label: 'Repair', bg: 'bg-amber-50 dark:bg-amber-950/40', text: 'text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800' },
  retired: { label: 'Retired', bg: 'bg-slate-100 dark:bg-slate-800', text: 'text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700' },
}

const CONDITION_BADGES: Record<InventoryCondition, { label: string; color: string }> = {
  new: { label: 'New', color: 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30' },
  good: { label: 'Good', color: 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/30' },
  fair: { label: 'Fair', color: 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30' },
  damaged: { label: 'Damaged', color: 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30' },
}

export function InventoryPage() {
  const user = useAuthStore((s) => s.user)
  const inventory = useDataStore((s) => s.inventory)
  const employees = useDataStore((s) => s.employees)

  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [selectedStatus, setSelectedStatus] = useState<string>('all')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Form fields
  const [name, setName] = useState('')
  const [assetTag, setAssetTag] = useState('')
  const [serialNumber, setSerialNumber] = useState('')
  const [category, setCategory] = useState<InventoryCategory>('laptop')
  const [status, setStatus] = useState<InventoryStatus>('in_use')
  const [condition, setCondition] = useState<InventoryCondition>('good')
  const [assignedTo, setAssignedTo] = useState('')
  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().split('T')[0])
  const [purchaseCost, setPurchaseCost] = useState('')
  const [location, setLocation] = useState('')
  const [notes, setNotes] = useState('')

  const canManage = canManageInventory(user)

  const openCreateModal = () => {
    setEditingItem(null)
    setName('')
    setAssetTag(`AST-${Math.floor(1000 + Math.random() * 9000)}`)
    setSerialNumber('')
    setCategory('laptop')
    setStatus('in_use')
    setCondition('good')
    setAssignedTo('')
    setPurchaseDate(new Date().toISOString().split('T')[0])
    setPurchaseCost('')
    setLocation('Main IT Desk')
    setNotes('')
    setIsModalOpen(true)
  }

  const openEditModal = (item: InventoryItem) => {
    setEditingItem(item)
    setName(item.name)
    setAssetTag(item.assetTag)
    setSerialNumber(item.serialNumber || '')
    setCategory(item.category)
    setStatus(item.status)
    setCondition(item.condition)
    setAssignedTo(item.assignedTo || '')
    setPurchaseDate(item.purchaseDate)
    setPurchaseCost(String(item.purchaseCost || ''))
    setLocation(item.location || '')
    setNotes(item.notes || '')
    setIsModalOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user?.tenantId || !name.trim() || !assetTag.trim()) {
      toast.error('Please fill required fields')
      return
    }

    const assignedEmp = employees.find((emp) => emp.id === assignedTo)
    const cost = parseFloat(purchaseCost) || 0

    setIsSubmitting(true)
    try {
      if (editingItem) {
        await updateInventoryItem(
          editingItem.id,
          user.tenantId,
          {
            name: name.trim(),
            assetTag: assetTag.trim(),
            serialNumber: serialNumber.trim(),
            category,
            status,
            condition,
            assignedTo: assignedTo || undefined,
            assignedToName: assignedEmp ? assignedEmp.name : undefined,
            purchaseDate,
            purchaseCost: cost,
            location: location.trim(),
            notes: notes.trim(),
          },
          user,
        )
        toast.success('Asset updated successfully')
      } else {
        await createInventoryItem(
          user.tenantId,
          {
            name: name.trim(),
            assetTag: assetTag.trim(),
            serialNumber: serialNumber.trim(),
            category,
            status,
            condition,
            assignedTo: assignedTo || undefined,
            assignedToName: assignedEmp ? assignedEmp.name : undefined,
            purchaseDate,
            purchaseCost: cost,
            location: location.trim(),
            notes: notes.trim(),
          },
          user,
        )
        toast.success('IT asset created successfully')
      }
      setIsModalOpen(false)
    } catch {
      toast.error('Failed to save asset record')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (item: InventoryItem) => {
    if (!user?.tenantId) return
    if (!confirm(`Delete IT asset "${item.name}" (${item.assetTag})?`)) return
    try {
      await deleteInventoryItem(item.id, user.tenantId, item.name, user)
      toast.success('Asset record deleted')
    } catch {
      toast.error('Failed to delete asset')
    }
  }

  // Filtered inventory
  const filteredInventory = inventory.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      item.assetTag.toLowerCase().includes(search.toLowerCase()) ||
      (item.serialNumber && item.serialNumber.toLowerCase().includes(search.toLowerCase())) ||
      (item.assignedToName && item.assignedToName.toLowerCase().includes(search.toLowerCase()))
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory
    const matchesStatus = selectedStatus === 'all' || item.status === selectedStatus
    return matchesSearch && matchesCategory && matchesStatus
  })

  // Stat calculations
  const totalAssets = inventory.length
  const inUseAssets = inventory.filter((i) => i.status === 'in_use').length
  const inStockAssets = inventory.filter((i) => i.status === 'in_stock').length
  const maintenanceAssets = inventory.filter((i) => i.status === 'maintenance').length

  return (
    <div className="space-y-4 animate-fade-in pb-16">
      {/* Overview Stat Cards (Compact 2x2 Grid) */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatCard title="Total IT Assets" value={totalAssets}       icon={Boxes}        gradient="from-brand-500 to-violet-600" delay="delay-75" />
        <StatCard title="In-Use"          value={inUseAssets}       icon={UserCheck}    gradient="from-blue-500 to-cyan-500"    delay="delay-150" />
        <StatCard title="In Stock"        value={inStockAssets}     icon={CheckCircle2} gradient="from-emerald-500 to-teal-600" delay="delay-225" />
        <StatCard title="Under Repair"    value={maintenanceAssets} icon={Wrench}       gradient="from-amber-500 to-orange-500"  delay="delay-300" />
      </div>

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
                placeholder="Search asset tag, name, developer..."
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
              <option value="in_use">In Use</option>
              <option value="in_stock">In Stock</option>
              <option value="maintenance">Repair</option>
              <option value="retired">Retired</option>
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
                <Plus className="h-4 w-4" /> Add Asset
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

      {/* Inventory List View */}
      {filteredInventory.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 p-8 text-center dark:border-slate-800 bg-white dark:bg-slate-900">
          <Laptop className="h-10 w-10 text-slate-300 dark:text-slate-600 mb-2" />
          <h4 className="text-sm font-black text-slate-800 dark:text-slate-200">No IT Assets Found</h4>
          <p className="text-[11px] text-slate-400 max-w-xs mt-0.5">
            {search || selectedCategory !== 'all'
              ? 'Try adjusting your search terms.'
              : 'Add your laptops, MacBooks, and hardware assets.'}
          </p>
        </div>
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="hidden lg:block overflow-hidden rounded-2xl border border-slate-200/70 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
              <thead className="border-b border-slate-100 bg-slate-50 text-[10px] font-black uppercase tracking-wider text-slate-400 dark:border-slate-800 dark:bg-slate-950/60">
                <tr>
                  <th className="px-4 py-3">Asset Tag & Name</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Condition</th>
                  <th className="px-4 py-3">Assigned To</th>
                  <th className="px-4 py-3">Added By</th>
                  <th className="px-4 py-3 text-right">Value (₹)</th>
                  {canManage && <th className="px-4 py-3 text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredInventory.map((item) => {
                  const statusInfo = STATUS_CONFIG[item.status]
                  const condInfo = CONDITION_BADGES[item.condition]
                  const adderName = item.createdByName || 'Admin'
                  return (
                    <tr key={item.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-slate-800 dark:text-brand-400 font-bold text-xs">
                            <Tag className="h-3.5 w-3.5" />
                          </div>
                          <div>
                            <span className="font-extrabold text-slate-900 dark:text-white block text-xs">
                              {item.name}
                            </span>
                            <span className="text-[10px] font-bold text-brand-600 dark:text-brand-400">
                              {item.assetTag} {item.serialNumber ? `• S/N: ${item.serialNumber}` : ''}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                        {CATEGORY_LABELS[item.category]}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-black ${statusInfo.bg} ${statusInfo.text}`}>
                          {statusInfo.label}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center rounded-lg px-2 py-0.5 text-[10px] font-black ${condInfo.color}`}>
                          {condInfo.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-[11px] font-medium text-slate-800 dark:text-slate-200">
                        {item.assignedToName ? (
                          <span className="inline-flex items-center gap-1 font-bold text-slate-900 dark:text-white">
                            <UserCheck className="h-3 w-3 text-blue-500" />
                            {item.assignedToName}
                          </span>
                        ) : (
                          <span className="text-slate-400 italic">Unassigned</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <Avatar name={adderName} size="sm" className="h-5 w-5 text-[9px]" />
                          <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 truncate">
                            {adderName}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right font-black text-slate-900 dark:text-white">
                        {formatCurrency(item.purchaseCost || 0, 'INR')}
                      </td>
                      {canManage && (
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => openEditModal(item)}
                              className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800"
                              title="Edit"
                            >
                              <Edit2 className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => handleDelete(item)}
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

          {/* Mobile Card Grid View */}
          <div className="grid gap-2.5 lg:hidden">
            {filteredInventory.map((item) => {
              const statusInfo = STATUS_CONFIG[item.status]
              const condInfo = CONDITION_BADGES[item.condition]
              return (
                <div
                  key={item.id}
                  className="rounded-2xl border border-slate-200/70 bg-white p-3 shadow-sm dark:border-slate-800 dark:bg-slate-900 active:scale-[0.99] transition-all"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="inline-block rounded-md bg-brand-50 px-2 py-0.5 text-[9px] font-black text-brand-600 dark:bg-slate-800 dark:text-brand-400 mb-1">
                        {item.assetTag}
                      </span>
                      <h4 className="font-extrabold text-slate-900 dark:text-white text-sm leading-snug">
                        {item.name}
                      </h4>
                      <p className="text-[10px] text-slate-400">{CATEGORY_LABELS[item.category]}</p>
                    </div>

                    <span className={`inline-block rounded-full border px-2 py-0.5 text-[9px] font-black ${statusInfo.bg} ${statusInfo.text}`}>
                      {statusInfo.label}
                    </span>
                  </div>
                  <div className="mt-2.5 flex items-center justify-between border-t border-slate-100 dark:border-slate-800/80 pt-2 text-[10px] text-slate-400 font-semibold">
                    <div className="flex items-center gap-1.5 truncate">
                      <Avatar name={item.createdByName || 'Admin'} size="sm" className="h-4.5 w-4.5 text-[8px]" />
                      <span className="truncate text-slate-600 dark:text-slate-300 font-bold">
                        {item.createdByName || 'Admin'}
                      </span>
                      {item.assignedToName && (
                        <span>• Assigned: {item.assignedToName}</span>
                      )}
                    </div>
                    <span className="font-black text-slate-900 dark:text-white text-xs shrink-0">
                      {formatCurrency(item.purchaseCost || 0, 'INR')}
                    </span>
                  </div>

                  <div className="mt-2 flex items-center justify-between text-[10px] text-slate-400 font-semibold">
                    <span className={`rounded-md px-1.5 py-0.5 font-bold ${condInfo.color}`}>
                      Condition: {condInfo.label}
                    </span>

                    {canManage && (
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => openEditModal(item)}
                          className="font-bold text-brand-600 dark:text-brand-400"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(item)}
                          className="font-bold text-red-500"
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
          aria-label="Add IT Asset"
        >
          <Plus className="h-6 w-6" />
        </button>
      )}

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-lg rounded-3xl border border-slate-200/80 bg-white p-5 shadow-2xl dark:border-slate-800 dark:bg-slate-900 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-black text-slate-900 dark:text-white">
              {editingItem ? 'Edit Asset Record' : 'Add New IT Asset'}
            </h3>
            <p className="mt-0.5 text-xs text-slate-500">
              Enter hardware details, asset tag, and employee assignment.
            </p>

            <form onSubmit={handleSubmit} className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Asset Name / Model *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. MacBook Pro 16 M3 Max / Dell UltraSharp 27"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800 transition-all focus:border-brand-500 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    Asset Tag *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="AST-1001"
                    value={assetTag}
                    onChange={(e) => setAssetTag(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800 transition-all focus:border-brand-500 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    Serial Number
                  </label>
                  <input
                    type="text"
                    placeholder="C02G3812MD6M"
                    value={serialNumber}
                    onChange={(e) => setSerialNumber(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800 transition-all focus:border-brand-500 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    Category *
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as InventoryCategory)}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800 transition-all focus:border-brand-500 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  >
                    {Object.entries(CATEGORY_LABELS).map(([k, v]) => (
                      <option key={k} value={k}>
                        {v}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    Status
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as InventoryStatus)}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800 transition-all focus:border-brand-500 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  >
                    <option value="in_use">In Use</option>
                    <option value="in_stock">In Stock</option>
                    <option value="maintenance">Maintenance</option>
                    <option value="retired">Retired</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    Condition
                  </label>
                  <select
                    value={condition}
                    onChange={(e) => setCondition(e.target.value as InventoryCondition)}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800 transition-all focus:border-brand-500 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  >
                    <option value="new">New</option>
                    <option value="good">Good</option>
                    <option value="fair">Fair</option>
                    <option value="damaged">Damaged</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    Assigned Employee
                  </label>
                  <select
                    value={assignedTo}
                    onChange={(e) => setAssignedTo(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800 transition-all focus:border-brand-500 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  >
                    <option value="">-- Unassigned --</option>
                    {employees.map((emp) => (
                      <option key={emp.id} value={emp.id}>
                        {emp.name} ({emp.department || emp.role})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    Purchase Date
                  </label>
                  <input
                    type="date"
                    value={purchaseDate}
                    onChange={(e) => setPurchaseDate(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800 transition-all focus:border-brand-500 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    Purchase Cost (₹)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={purchaseCost}
                    onChange={(e) => setPurchaseCost(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800 transition-all focus:border-brand-500 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Notes / Location
                </label>
                <input
                  type="text"
                  placeholder="Warranty info or location..."
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
                  {isSubmitting ? 'Saving...' : editingItem ? 'Save Changes' : 'Add IT Asset'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
