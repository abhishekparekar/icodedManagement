import {
  CheckCircle2,
  Clock,
  Download,
  Eye,
  FileText,
  Pencil,
  Plus,
  Search,
  Trash2,
  X,
  Zap,
} from 'lucide-react'
import { useMemo, useRef, useState } from 'react'
import toast from 'react-hot-toast'
// @ts-ignore
import html2pdf from 'html2pdf.js'
import { QuotationBuilder } from '@/components/quotation/QuotationBuilder'
import { QuotationPreview } from '@/components/quotation/QuotationPreview'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { EmptyState } from '@/components/ui/EmptyState'
import { Modal } from '@/components/ui/Modal'
import { Pagination } from '@/components/ui/Pagination'
import { StatCard } from '@/components/ui/StatCard'
import { PAGE_SIZE, QUOTATION_STATUSES } from '@/lib/constants'
import { canManageQuotations } from '@/lib/permissions'
import { DEFAULT_SELECTED_TERMS } from '@/lib/termsAndConditions'
import { calcQuotationTotals, formatCurrency, formatDate, generateId, paginate, totalPages } from '@/lib/utils'
import {
  createQuotation,
  deleteQuotation,
  generateQuotationNumber,
  saveCompanyProfile,
  updateQuotation,
} from '@/services/quotations.service'
import { downloadImageAsBase64 } from '@/services/storage.service'
import { useAuthStore } from '@/stores/authStore'
import { useDataStore } from '@/stores/dataStore'
import type { CompanyProfile, Quotation, QuotationBankDetails, QuotationCompanyInfo } from '@/types'

const ICODED_COMPANY: QuotationCompanyInfo = {
  name: 'ICODED AUTOMATION PRIVATE LIMITED',
  tagline: 'Building Business Through Technology',
  address: 'Nisha Pride, 2nd Floor, Mondha Naka',
  city: 'Chh. Sambhajinagar, Maharashtra - 431006',
  phone: '+91 93703 29233',
  email: 'company.icoded@gmail.com',
  website: 'www.icodedautomation.com',
  instagram: '@icodedautomation',
  taxId: '27ABCDE1234F1Z5',
  logoUrl: '/company_logo1.jpeg',
  about:
    'iCoded Automation Pvt Ltd is a leading software development company with 85+ successful software products delivered and 70+ satisfied clients across India. We specialize in Web Development, App Development, Custom Software Development, Digital Marketing, and Business Automation Solutions, transforming ideas into powerful digital products.',
}

const BLANK_BANK: QuotationBankDetails = {
  bankName: 'Kotak Mahindra Bank',
  accountName: 'Rameshwar Narayan Shinde',
  accountNumber: '5647820806',
  ifscCode: 'KKBK0001946',
  branchName: 'Chh. Sambhajinagar',
  upiId: '',
}

function profileToCompanyInfo(p: CompanyProfile): QuotationCompanyInfo {
  return {
    name: p.name || 'ICODED AUTOMATION PRIVATE LIMITED',
    tagline: (p as any).tagline || 'Building Business Through Technology',
    address: p.address || 'Nisha Pride, 2nd Floor, Mondha Naka',
    city: p.city || 'Chh. Sambhajinagar, Maharashtra',
    phone: p.phone || '+91 93703 29233',
    email: p.email || 'company.icoded@gmail.com',
    website: p.website || 'www.icodedautomation.com',
    instagram: p.instagram ?? '@icodedautomation',
    logoUrl: p.logoUrl || '/company_logo1.jpeg',
    taxId: p.taxId || '27ABCDE1234F1Z5',
    about: p.about || ICODED_COMPANY.about,
  }
}

function companyInfoToProfile(
  info: QuotationCompanyInfo,
  bank: QuotationBankDetails,
  existing: CompanyProfile | null,
): Omit<CompanyProfile, 'id' | 'tenantId' | 'updatedAt'> {
  return {
    name: info.name,
    address: info.address,
    city: info.city,
    phone: info.phone,
    email: info.email,
    website: info.website,
    instagram: info.instagram ?? '',
    logoUrl: info.logoUrl ?? '',
    taxId: info.taxId ?? '',
    about: info.about ?? '',
    bankDetails: bank,
    defaultCurrency: existing?.defaultCurrency ?? 'INR',
    defaultAccentColor: existing?.defaultAccentColor ?? '#4f46e5',
    defaultTheme: existing?.defaultTheme ?? 'modern',
    defaultNotes: existing?.defaultNotes ?? '',
  }
}

function makeBlank(
  uid: string,
  userName: string,
  company: QuotationCompanyInfo,
  bank: QuotationBankDetails,
  quotationNumber: string,
): Omit<Quotation, 'id' | 'tenantId' | 'createdAt' | 'updatedAt'> {
  const defaultItems = [
    {
      id: generateId(),
      moduleName: 'E-Commerce Website Development (Storefront + Admin Panel)',
      description: 'Custom responsive online store with modern catalog & admin panel',
      quantity: 1,
      unitPrice: 95000,
    },
    {
      id: generateId(),
      moduleName: 'Product Catalog, Cart & Checkout Module',
      description: 'Category filters, cart management, address selection & order summary',
      quantity: 1,
      unitPrice: 0,
    },
    {
      id: generateId(),
      moduleName: 'Payment Gateway Integration (Razorpay / UPI / COD)',
      description: 'Secure online payment processing and COD handling',
      quantity: 1,
      unitPrice: 0,
    },
    {
      id: generateId(),
      moduleName: 'Admin Dashboard (Products, Orders, Inventory)',
      description: 'Complete back-office control panel for products and sales analytics',
      quantity: 1,
      unitPrice: 0,
    },
    {
      id: generateId(),
      moduleName: 'Domain Charges',
      description: '1-Year .com/.in Domain Registration',
      quantity: 1,
      unitPrice: 950,
    },
    {
      id: generateId(),
      moduleName: 'VPS Hosting KVM 2',
      description: 'High-speed cloud server with SSD storage and automated backups',
      quantity: 1,
      unitPrice: 13154,
    },
  ]

  const { subtotal, discountAmount, taxAmount, grandTotal } = calcQuotationTotals(defaultItems, 0, 0)

  return {
    quotationNumber,
    version: '1.0',
    salesPerson: userName || 'Abhishek Parekar (Sales Executive)',
    status: 'draft',
    theme: 'modern',
    accentColor: '#1D4ED8',
    company,
    client: { salutation: 'Mr.', name: '', company: '', address: '', city: '', phone: '', email: '' },
    bankDetails: bank,
    showBankDetails: true,
    issueDate: new Date().toISOString().slice(0, 10),
    validUntil: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
    projectTimelineDays: 30,
    items: defaultItems,
    discountPercent: 0,
    taxPercent: 0,
    subtotal,
    discountAmount,
    taxAmount,
    grandTotal,
    currency: 'INR',
    notes: 'Thank you for giving us the opportunity to quote. We look forward to working with you.',
    selectedTerms: DEFAULT_SELECTED_TERMS,
    customTerms: '',
    createdBy: uid,
    createdByName: userName,
  }
}

export function QuotationsPage() {
  const user = useAuthStore((s) => s.user)
  const quotations = useDataStore((s) => s.quotations)
  const canWrite = canManageQuotations(user)

  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [builderOpen, setBuilderOpen] = useState(false)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [editing, setEditing] = useState<Quotation | null>(null)
  const [draft, setDraft] = useState<Quotation | null>(null)
  const [cancelConfirm, setCancelConfirm] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<Quotation | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [saving, setSaving] = useState(false)

  const companyProfile = useMemo(() => {
    return quotations[0]?.company ? profileToCompanyInfo(quotations[0].company as any) : ICODED_COMPANY
  }, [quotations])

  const stats = useMemo(() => {
    const total = quotations.length
    const acceptedVal = quotations.filter((q) => q.status === 'accepted').reduce((s, q) => s + q.grandTotal, 0)
    const pendingSent = quotations.filter((q) => q.status === 'sent').length
    const drafts = quotations.filter((q) => q.status === 'draft').length

    return { total, acceptedVal, pendingSent, drafts }
  }, [quotations])

  const printRef = useRef<HTMLDivElement>(null)

  const filtered = useMemo(() => {
    return quotations.filter((q) => {
      const matchesStatus = !statusFilter || q.status === statusFilter
      const query = search.toLowerCase().trim()
      const matchesSearch =
        !query ||
        q.quotationNumber.toLowerCase().includes(query) ||
        q.client.name.toLowerCase().includes(query) ||
        (q.client.company && q.client.company.toLowerCase().includes(query))

      return matchesStatus && matchesSearch
    })
  }, [quotations, search, statusFilter])

  const paged = paginate(filtered, page, PAGE_SIZE)
  const pages = totalPages(filtered.length, PAGE_SIZE)

  const openCreate = () => {
    if (!user) return
    const qNum = generateQuotationNumber(quotations)
    const blank = makeBlank(user.uid, user.name, companyProfile, BLANK_BANK, qNum)
    setEditing(null)
    setDraft({ id: '', tenantId: '', createdAt: '', updatedAt: '', ...blank })
    setBuilderOpen(true)
  }

  const openEdit = (q: Quotation) => {
    setEditing(q)
    setDraft({ ...q, bankDetails: q.bankDetails ?? BLANK_BANK })
    setBuilderOpen(true)
  }

  const openPreview = (q: Quotation) => {
    setDraft({ ...q, bankDetails: q.bankDetails ?? BLANK_BANK })
    setPreviewOpen(true)
  }

  const handleCancel = () => {
    if (draft && (draft.client.name.trim() || draft.items.some((i) => i.unitPrice > 0))) {
      setCancelConfirm(true)
    } else {
      doClose()
    }
  }

  const doClose = () => {
    setBuilderOpen(false)
    setDraft(null)
    setEditing(null)
    setCancelConfirm(false)
  }

  const handleSave = async () => {
    if (!draft || !user?.tenantId) return
    if (!draft.quotationNumber.trim()) { toast.error('Quotation number is required'); return }
    if (!draft.company.name.trim()) { toast.error('Company name is required'); return }
    if (!draft.client.name.trim()) { toast.error('Client name is required'); return }
    if (!draft.items.length) { toast.error('Add at least one line item'); return }

    setSaving(true)
    try {
      const { subtotal, discountAmount, taxAmount, grandTotal } = calcQuotationTotals(
        draft.items,
        draft.discountPercent,
        draft.taxPercent,
      )
      const payload: Quotation = { ...draft, subtotal, discountAmount, taxAmount, grandTotal }

      if (editing) {
        await updateQuotation(editing.id, user.tenantId, payload, user)
        toast.success('Quotation updated')
      } else {
        await createQuotation(user.tenantId, payload, user)
        toast.success('Quotation created')
      }

      await saveCompanyProfile(
        user.tenantId,
        companyInfoToProfile(payload.company, payload.bankDetails, null),
      )

      setBuilderOpen(false)
      setDraft(null)
      setEditing(null)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget || !user?.tenantId) return
    const id = deleteTarget.id?.trim()
    if (!id) return
    setDeleting(true)
    try {
      await deleteQuotation(id, user.tenantId, deleteTarget.quotationNumber, user)
      toast.success('Quotation deleted')
      setDeleteTarget(null)
    } catch {
      toast.error('Delete failed')
    } finally {
      setDeleting(false)
    }
  }

  const handleDownloadPDF = async () => {
    if (!printRef.current || !draft) return
    const element = printRef.current
    const loadingToast = toast.loading('Generating PDF...')

    try {
      const activeLogo = draft.company.logoUrl || ''
      if (activeLogo && activeLogo.startsWith('http')) {
        try {
          await downloadImageAsBase64(activeLogo)
        } catch (err) {
          console.error('Failed to pre-convert logo to base64', err)
        }
      }

      const opt = {
        margin: 0,
        filename: `Quotation-${draft.quotationNumber}.pdf`,
        image: { type: 'jpeg' as const, quality: 0.98 },
        html2canvas: {
          scale: 2,
          useCORS: true,
          logging: false,
          backgroundColor: '#ffffff',
          delay: 1000,
        },
        jsPDF: { unit: 'mm' as const, format: 'a4' as const, orientation: 'portrait' as const },
        pagebreak: { mode: ['avoid-all', 'css', 'legacy'] },
      }

      await html2pdf().from(element).set(opt).save()
      toast.dismiss(loadingToast)
      toast.success('PDF downloaded successfully')
    } catch (err: any) {
      console.error('PDF generation error:', err)
      toast.dismiss(loadingToast)
      toast.error('Failed to generate PDF')
    }
  }

  const statusColor = (s: string) => QUOTATION_STATUSES.find((x) => x.value === s)?.color ?? ''

  return (
    <div className="space-y-4 sm:space-y-5">

      {/* ── KPI Summary Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-5">
        <StatCard title="Total Quotations" value={stats.total}       icon={FileText}     to="/quotations" gradient="from-purple-500 to-fuchsia-600" delay="delay-75" />
        <StatCard title="Accepted Value"   value={formatCurrency(stats.acceptedVal, 'INR')} icon={CheckCircle2} to="/quotations" gradient="from-emerald-500 to-teal-600" delay="delay-150" />
        <StatCard title="Pending Sent"    value={stats.pendingSent}  icon={Zap}          to="/quotations" gradient="from-blue-500 to-cyan-500"    delay="delay-225" />
        <StatCard title="Drafts"           value={stats.drafts}       icon={Clock}        to="/quotations" gradient="from-amber-500 to-orange-500"  delay="delay-300" />
      </div>

      {/* ── Integrated Search & Control Bar ── */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3 sm:p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
        
        {/* Search & Status Filter */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 flex-1 max-w-xl">
          <div className="relative">
            <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-400 pointer-events-none" />
            <input
              className="h-9 w-full rounded-xl border border-slate-200/90 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 pl-9 pr-8 text-xs font-semibold text-slate-700 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all"
              placeholder="Search quotation # or client..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setPage(1)
              }}
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

          <select
            className="h-9 w-full rounded-xl border border-slate-200/90 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-3 text-xs font-semibold text-slate-700 dark:text-slate-200 focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all"
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value)
              setPage(1)
            }}
          >
            <option value="">All Statuses</option>
            {QUOTATION_STATUSES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 shrink-0 justify-between sm:justify-end">
          {(search || statusFilter) && (
            <button
              onClick={() => { setSearch(''); setStatusFilter(''); setPage(1) }}
              className="text-xs font-bold text-brand-600 dark:text-brand-400 hover:underline px-2"
            >
              Reset
            </button>
          )}

          {canWrite && (
            <Button onClick={openCreate} className="h-9 text-xs font-bold bg-gradient-to-r from-brand-600 to-violet-600 hover:from-brand-700 hover:to-violet-700 text-white shadow-md shadow-brand-500/20">
              <Plus className="h-4 w-4" /> New Quotation
            </Button>
          )}
        </div>
      </div>

      {/* ── Quotation Stream List ── */}
      <Card className="!p-0 overflow-hidden">
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-2">
            <FileText className="h-4.5 w-4.5 text-purple-600 dark:text-purple-400" />
            <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">Workspace Quotations</h3>
          </div>
          <span className="text-xs font-semibold text-slate-400">
            {filtered.length} total quotations
          </span>
        </div>

        {filtered.length === 0 ? (
          <div className="p-6">
            <EmptyState icon={FileText} title="No quotations found" description={search || statusFilter ? 'Try clearing your search query.' : 'Click "New Quotation" to create your first client proposal.'} />
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-slate-200/80 bg-slate-50/50 text-xs uppercase tracking-wider text-slate-400 dark:border-slate-800 dark:bg-slate-950/60 font-bold">
                  <tr>
                    <th className="py-3 px-6">Quotation No.</th>
                    <th className="py-3 px-4">Client Name</th>
                    <th className="py-3 px-4">Issue Date</th>
                    <th className="py-3 px-4">Valid Until</th>
                    <th className="py-3 px-4">Grand Total</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {paged.map((q) => (
                    <tr key={q.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-3.5 px-6">
                        <span className="font-mono font-bold text-brand-600 dark:text-brand-400 text-xs">{q.quotationNumber}</span>
                      </td>

                      <td className="py-3.5 px-4">
                        <p className="font-bold text-slate-900 dark:text-white text-xs">{q.client.salutation ? q.client.salutation + ' ' : ''}{q.client.name}</p>
                        {q.client.company && <p className="text-[11px] font-semibold text-slate-400">{q.client.company}</p>}
                      </td>

                      <td className="py-3.5 px-4 text-xs font-semibold text-slate-400">{formatDate(q.issueDate)}</td>
                      <td className="py-3.5 px-4 text-xs font-semibold text-slate-400">{formatDate(q.validUntil)}</td>

                      <td className="py-3.5 px-4 font-black text-slate-900 dark:text-white text-xs">
                        {formatCurrency(q.grandTotal, q.currency)}
                      </td>

                      <td className="py-3.5 px-4">
                        <Badge className={`border uppercase tracking-wider text-[10px] font-black ${statusColor(q.status)}`}>
                          {q.status}
                        </Badge>
                      </td>

                      <td className="py-3.5 px-6 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" className="h-8 w-8 p-0" onClick={() => openPreview(q)} title="Preview / PDF">
                            <Eye className="h-4 w-4 text-slate-500 hover:text-brand-600" />
                          </Button>
                          {canWrite && (
                            <>
                              <Button variant="ghost" className="h-8 w-8 p-0" onClick={() => openEdit(q)} title="Edit">
                                <Pencil className="h-4 w-4 text-slate-500 hover:text-brand-600" />
                              </Button>
                              <Button variant="ghost" className="h-8 w-8 p-0" onClick={() => setDeleteTarget(q)} title="Delete">
                                <Trash2 className="h-4 w-4 text-red-500 hover:text-red-600" />
                              </Button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card Stream View */}
            <div className="divide-y divide-slate-100 dark:divide-slate-800/60 md:hidden">
              {paged.map((q) => (
                <div key={q.id} className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span className="font-mono text-xs font-bold text-brand-600 dark:text-brand-400">{q.quotationNumber}</span>
                      <h4 className="font-bold text-slate-900 dark:text-white text-sm mt-0.5">
                        {q.client.salutation ? q.client.salutation + ' ' : ''}{q.client.name}
                      </h4>
                      {q.client.company && <p className="text-xs text-slate-400">{q.client.company}</p>}
                    </div>

                    <div className="text-right shrink-0">
                      <p className="font-black text-slate-900 dark:text-white text-sm">
                        {formatCurrency(q.grandTotal, q.currency)}
                      </p>
                      <Badge className={`border uppercase tracking-wider text-[9px] font-black mt-1 ${statusColor(q.status)}`}>
                        {q.status}
                      </Badge>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-slate-800/60 text-xs">
                    <span className="text-slate-400 font-semibold text-[11px]">
                      Valid till: {formatDate(q.validUntil)}
                    </span>

                    <div className="flex items-center gap-1">
                      <Button variant="ghost" className="h-8 w-8 p-0" onClick={() => openPreview(q)} title="Preview">
                        <Eye className="h-4 w-4 text-slate-500" />
                      </Button>
                      {canWrite && (
                        <>
                          <Button variant="ghost" className="h-8 w-8 p-0" onClick={() => openEdit(q)} title="Edit">
                            <Pencil className="h-4 w-4 text-slate-500" />
                          </Button>
                          <Button variant="ghost" className="h-8 w-8 p-0" onClick={() => setDeleteTarget(q)} title="Delete">
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {pages > 1 && (
          <div className="px-4 sm:px-6 py-3 border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/30 dark:bg-slate-900/30">
            <Pagination page={page} totalPages={pages} onPageChange={setPage} />
          </div>
        )}
      </Card>

      {/* Builder & Live Paper Preview Modal */}
      {builderOpen && draft && (
        <Modal open={builderOpen} onClose={handleCancel} title={editing ? 'Edit Quotation ' + draft.quotationNumber : 'New Quotation ' + draft.quotationNumber} size="xl">
          <div className="space-y-4">
            {/* Top Action Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 dark:bg-slate-900 p-3 rounded-2xl border border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-500">Live Paper Generator</span>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-brand-500 text-white">
                  Realtime Sync
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Button type="button" variant="secondary" className="h-8 text-xs font-bold gap-1.5" onClick={handleDownloadPDF}>
                  <Download className="h-3.5 w-3.5 text-brand-600 dark:text-brand-400" /> Save PDF
                </Button>

                <Button type="button" variant="secondary" className="h-8 text-xs font-bold gap-1.5" onClick={() => window.print()}>
                  🖨️ Print
                </Button>

                {draft.client.phone && (
                  <Button 
                    type="button"
                    className="h-8 text-xs font-bold gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white" 
                    onClick={() => {
                      const cleanPhone = draft.client.phone.replace(/[^0-9]/g, '')
                      const msg = `Hello ${draft.client.name}, Please review Quotation ${draft.quotationNumber} for ${draft.company.name}. Total: ${formatCurrency(draft.grandTotal, draft.currency)}`
                      window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`, '_blank')
                    }}
                  >
                    💬 WhatsApp
                  </Button>
                )}

                <Button type="button" onClick={handleSave} loading={saving} className="h-8 bg-gradient-to-r from-brand-600 to-violet-600 text-white font-bold px-4 text-xs shadow-md shadow-brand-500/20">
                  {editing ? 'Save Changes' : 'Save Quotation'}
                </Button>
              </div>
            </div>

            {/* Split Screen Layout: Form on Left, Live Paper Preview on Right */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Column: Form Fillup */}
              <div className="lg:col-span-6 max-h-[75vh] overflow-y-auto pr-2 space-y-4">
                <QuotationBuilder value={draft} onChange={setDraft} />
              </div>

              {/* Right Column: Live Paper Preview */}
              <div className="lg:col-span-6 max-h-[75vh] overflow-y-auto bg-slate-100 dark:bg-slate-900/50 p-3 rounded-2xl border border-slate-200 dark:border-slate-800">
                <div className="text-xs font-bold text-slate-500 mb-2 flex items-center justify-between px-1">
                  <span>📄 Live Paper Document Preview</span>
                  <span className="text-[10px] text-slate-400 font-mono">Updates live as you type</span>
                </div>
                <div ref={printRef} className="scale-95 origin-top">
                  <QuotationPreview quotation={draft} />
                </div>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100 dark:border-slate-800">
              <Button type="button" variant="secondary" onClick={handleCancel} className="px-4 text-xs font-bold">
                Cancel
              </Button>
              <Button type="button" onClick={handleSave} loading={saving} className="bg-gradient-to-r from-brand-600 to-violet-600 text-white font-bold px-5 text-xs shadow-md shadow-brand-500/20">
                {editing ? 'Save Changes' : 'Save Quotation'}
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Preview Modal */}
      {previewOpen && draft && (
        <Modal open={previewOpen} onClose={() => setPreviewOpen(false)} title={'Quotation ' + draft.quotationNumber} size="xl">
          <div className="space-y-4">
            {/* Top Toolbar Action Buttons */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 dark:bg-slate-900 p-3 rounded-2xl border border-slate-200 dark:border-slate-800">
              
              {/* Status Badge */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-500">Status:</span>
                <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${
                  draft.status === 'accepted' ? 'bg-emerald-500 text-white' :
                  draft.status === 'rejected' ? 'bg-red-500 text-white' :
                  draft.status === 'expired' ? 'bg-slate-500 text-white' :
                  'bg-amber-500 text-white'
                }`}>
                  {draft.status === 'sent' || draft.status === 'draft' ? 'Pending' : draft.status}
                </span>
              </div>

              {/* Action Buttons: PDF, Print, Email, WhatsApp */}
              <div className="flex flex-wrap items-center gap-2">
                <Button variant="secondary" className="h-9 text-xs font-bold gap-1.5" onClick={handleDownloadPDF}>
                  <Download className="h-4 w-4 text-brand-600 dark:text-brand-400" /> Download PDF
                </Button>

                <Button variant="secondary" className="h-9 text-xs font-bold gap-1.5" onClick={() => window.print()}>
                  🖨️ Print
                </Button>

                {draft.client.email && (
                  <Button 
                    variant="secondary" 
                    className="h-9 text-xs font-bold gap-1.5" 
                    onClick={() => window.open(`mailto:${draft.client.email}?subject=Quotation ${draft.quotationNumber} from ${encodeURIComponent(draft.company.name)}`)}
                  >
                    📧 Send Email
                  </Button>
                )}

                {draft.client.phone && (
                  <Button 
                    className="h-9 text-xs font-bold gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white" 
                    onClick={() => {
                      const cleanPhone = draft.client.phone.replace(/[^0-9]/g, '')
                      const msg = `Hello ${draft.client.name}, Please review Quotation ${draft.quotationNumber} for ${draft.company.name}. Total: ${formatCurrency(draft.grandTotal, draft.currency)}`
                      window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`, '_blank')
                    }}
                  >
                    💬 Send WhatsApp
                  </Button>
                )}

                {canWrite && (
                  <Button className="h-9 text-xs font-bold bg-brand-600 hover:bg-brand-700 text-white" onClick={() => { setPreviewOpen(false); openEdit(draft) }}>
                    <Pencil className="h-4 w-4" /> Edit
                  </Button>
                )}
              </div>
            </div>

            <div ref={printRef} className="rounded-xl border border-slate-200 p-2 dark:border-slate-800 bg-white">
              <QuotationPreview quotation={draft} />
            </div>
          </div>
        </Modal>
      )}

      <ConfirmDialog open={cancelConfirm} onCancel={() => setCancelConfirm(false)} onConfirm={doClose} title="Discard changes?" message="Any unsaved changes will be lost." confirmLabel="Discard" danger />
      <ConfirmDialog open={Boolean(deleteTarget)} onCancel={() => setDeleteTarget(null)} onConfirm={handleDelete} title="Delete quotation?" message={'Are you sure you want to delete quotation ' + (deleteTarget?.quotationNumber ?? '') + '?'} confirmLabel="Delete" danger loading={deleting} />

    </div>
  )
}
