import { Download, Eye, FileText, Pencil, Plus, Printer, Save, Trash2 } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import toast from 'react-hot-toast'
// @ts-ignore
import html2pdf from 'html2pdf.js'
import { QuotationBuilder } from '@/components/quotation/QuotationBuilder'
import { QuotationPreview } from '@/components/quotation/QuotationPreview'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card, CardHeader } from '@/components/ui/Card'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { EmptyState } from '@/components/ui/EmptyState'
import { Modal } from '@/components/ui/Modal'
import { Pagination } from '@/components/ui/Pagination'
import { QUOTATION_STATUSES, PAGE_SIZE } from '@/lib/constants'
import { DEFAULT_SELECTED_TERMS } from '@/lib/termsAndConditions'
import { canManageQuotations } from '@/lib/permissions'
import { calcQuotationTotals, formatCurrency, formatDate, generateId, paginate, totalPages } from '@/lib/utils'
import {
  createQuotation,
  deleteQuotation,
  generateQuotationNumber,
  getCompanyProfile,
  saveCompanyProfile,
  updateQuotation,
} from '@/services/quotations.service'
import { useAuthStore } from '@/stores/authStore'
import { useDataStore } from '@/stores/dataStore'
import { downloadImageAsBase64 } from '@/services/storage.service'
import type { CompanyProfile, Quotation, QuotationBankDetails, QuotationCompanyInfo } from '@/types'

// ─── iCoded Automation defaults ──────────────────────────────────────────────

const ICODED_COMPANY: QuotationCompanyInfo = {
  name: 'iCoded Automation Pvt Ltd',
  address: 'Nisha Pride, 2nd Floor, Mondha Naka',
  city: 'Chhatrapati Sambhajinagar - 431006, Maharashtra',
  phone: '+91 98765 43210',
  email: 'info@icodedautomation.com',
  website: 'www.icodedautomation.com',
  instagram: '@icodedautomation',
  taxId: '',
  logoUrl: '/company_logo1.jpeg',
  about:
    'iCoded Automation Pvt Ltd is a leading software development company with 55+ successful software products delivered and 70+ satisfied clients across India. We specialize in Android & iOS App Development, Web Development, Custom Software Development, Digital Marketing, Social Media Management, Content Creation, SEO, and Business Automation Solutions. We transform your ideas into powerful digital products.',
}

const BLANK_BANK: QuotationBankDetails = {
  bankName: '',
  accountName: '',
  accountNumber: '',
  ifscCode: '',
  branchName: '',
  upiId: '',
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function profileToCompanyInfo(p: CompanyProfile): QuotationCompanyInfo {
  return {
    name: p.name,
    address: p.address,
    city: p.city,
    phone: p.phone,
    email: p.email,
    website: p.website,
    instagram: p.instagram ?? '',
    logoUrl: p.logoUrl,
    taxId: p.taxId,
    about: p.about,
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
  number: string,
  company: QuotationCompanyInfo,
  bank: QuotationBankDetails,
  profile: CompanyProfile | null,
): Quotation {
  const today = new Date().toISOString().slice(0, 10)
  const valid = new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10)
  return {
    id: '',
    tenantId: '',
    quotationNumber: number,
    status: 'draft',
    theme: profile?.defaultTheme ?? 'modern',
    accentColor: profile?.defaultAccentColor ?? '#4f46e5',
    company,
    client: { salutation: 'Mr.', name: '', company: '', address: '', city: '', phone: '', email: '' },
    bankDetails: bank,
    showBankDetails: Object.values(bank).some((v) => v.trim() !== ''),
    issueDate: today,
    validUntil: valid,
    items: [{ id: generateId(), description: '', quantity: 1, unitPrice: 0 }],
    projectTimelineDays: 0,
    discountPercent: 0,
    taxPercent: 18,
    subtotal: 0,
    discountAmount: 0,
    taxAmount: 0,
    grandTotal: 0,
    currency: profile?.defaultCurrency ?? 'INR',
    notes: profile?.defaultNotes ?? 'Thank you for your business. We look forward to working with you.',
    selectedTerms: DEFAULT_SELECTED_TERMS,
    customTerms: '',
    createdBy: uid,
    createdByName: userName,
    createdAt: '',
    updatedAt: '',
  }
}

// ─── Component ──────────────────────────────────────────────────────────────

export function QuotationsPage() {
  const user = useAuthStore((s) => s.user)
  const quotations = useDataStore((s) => s.quotations)
  const canWrite = canManageQuotations(user)

  const [page, setPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState('')
  const [builderOpen, setBuilderOpen] = useState(false)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [editing, setEditing] = useState<Quotation | null>(null)
  const [draft, setDraft] = useState<Quotation | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Quotation | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [saving, setSaving] = useState(false)
  const [companyProfile, setCompanyProfile] = useState<CompanyProfile | null>(null)
  const [profileLoaded, setProfileLoaded] = useState(false)
  // Cancel confirmation
  const [cancelConfirmOpen, setCancelConfirmOpen] = useState(false)
  const printRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!user?.tenantId || profileLoaded) return
    getCompanyProfile(user.tenantId)
      .then(async (p) => {
        let activeProfile = p
        if (user?.tenantId) {
          if (!p) {
            const defaultProfile = companyInfoToProfile(ICODED_COMPANY, BLANK_BANK, null)
            const profilePayload = { ...defaultProfile, logoUrl: '/company_logo1.jpeg' }
            await saveCompanyProfile(user.tenantId, profilePayload)
            activeProfile = { id: user.tenantId, tenantId: user.tenantId, updatedAt: new Date().toISOString(), ...profilePayload }
          } else if (!p.logoUrl) {
            const { id, tenantId, updatedAt, ...rest } = p
            rest.logoUrl = '/company_logo1.jpeg'
            await saveCompanyProfile(user.tenantId, rest)
            activeProfile = { ...p, logoUrl: '/company_logo1.jpeg' }
          }
        }

        setCompanyProfile(activeProfile)
        setProfileLoaded(true)

        // Proactive migration: convert profile URL logo to base64 to avoid CORS blocks in exports
        if (activeProfile && activeProfile.logoUrl && activeProfile.logoUrl.startsWith('http')) {
          try {
            const base64 = await downloadImageAsBase64(activeProfile.logoUrl)
            if (base64 && base64.startsWith('data:')) {
              const updatedProfile = { ...activeProfile, logoUrl: base64 }
              const { id, tenantId, updatedAt, ...rest } = updatedProfile
              await saveCompanyProfile(user.tenantId, rest)
              setCompanyProfile(updatedProfile)
              console.log('[CompanyProfile] Successfully migrated logoUrl to base64 via SDK')
            }
          } catch (e) {
            console.warn('[CompanyProfile] Logo migration failed', e)
          }
        }
      })
      .catch((err) => { console.error('[getCompanyProfile]', err); setProfileLoaded(true) })
  }, [user?.tenantId, profileLoaded])

  const filtered = statusFilter ? quotations.filter((q) => q.status === statusFilter) : quotations
  const paged = paginate(filtered, page, PAGE_SIZE)
  const pages = totalPages(filtered.length, PAGE_SIZE)

  const buildCompanyInfo = (): QuotationCompanyInfo => {
    if (companyProfile) return profileToCompanyInfo(companyProfile)
    // First time — use iCoded defaults
    return ICODED_COMPANY
  }

  const buildBankDetails = (): QuotationBankDetails => {
    if (companyProfile?.bankDetails) return companyProfile.bankDetails
    return BLANK_BANK
  }

  const openCreate = () => {
    if (!user) return
    setEditing(null)
    setDraft(makeBlank(
      user.uid,
      user.name,
      generateQuotationNumber(quotations),
      buildCompanyInfo(),
      buildBankDetails(),
      companyProfile,
    ))
    setBuilderOpen(true)
  }

  const migrateQuotation = (q: Quotation): Quotation => {
    const logoUrl = companyProfile?.logoUrl && companyProfile.logoUrl.startsWith('data:') && (!q.company.logoUrl || q.company.logoUrl.startsWith('http'))
      ? companyProfile.logoUrl
      : q.company.logoUrl

    return {
      ...q,
      discountPercent: q.discountPercent ?? 0,
      taxPercent: q.taxPercent ?? 0,
      discountAmount: q.discountAmount ?? 0,
      taxAmount: q.taxAmount ?? 0,
      selectedTerms: q.selectedTerms ?? DEFAULT_SELECTED_TERMS,
      projectTimelineDays: q.projectTimelineDays ?? 0,
      customTerms: q.customTerms ?? '',
      bankDetails: q.bankDetails ?? BLANK_BANK,
      showBankDetails: q.showBankDetails ?? false,
      client: {
        salutation: q.client.salutation ?? 'Mr.',
        name: q.client.name,
        company: q.client.company,
        address: q.client.address,
        city: q.client.city,
        phone: q.client.phone,
        email: q.client.email,
      },
      company: {
        ...q.company,
        logoUrl: logoUrl,
        about: q.company.about ?? ICODED_COMPANY.about,
        instagram: q.company.instagram ?? '',
      },
    }
  }

  const openEdit = (q: Quotation) => {
    setEditing(q)
    setDraft(migrateQuotation(q))
    setBuilderOpen(true)
  }

  const openPreview = (q: Quotation) => {
    setDraft(migrateQuotation(q))
    setPreviewOpen(true)
  }

  const handleCancel = () => {
    // If draft has any meaningful content, ask for confirmation
    if (draft && (draft.client.name.trim() || draft.items.some((i) => i.description.trim() || i.unitPrice > 0))) {
      setCancelConfirmOpen(true)
    } else {
      doClose()
    }
  }

  const doClose = () => {
    setBuilderOpen(false)
    setDraft(null)
    setEditing(null)
    setCancelConfirmOpen(false)
  }

  const handleSave = async () => {
    if (!draft || !user?.tenantId) return
    if (!draft.quotationNumber.trim()) { toast.error('Quotation number is required'); return }
    if (!draft.company.name.trim()) { toast.error('Company name is required'); return }
    if (!draft.client.name.trim()) { toast.error('Client name is required'); return }
    if (draft.items.length === 0) { toast.error('Add at least one line item'); return }

    setSaving(true)
    try {
      const totals = calcQuotationTotals(draft.items, draft.discountPercent, draft.taxPercent)
      const payload: Quotation = { ...draft, ...totals }

      if (editing) {
        await updateQuotation(editing.id, user.tenantId, payload, user)
        toast.success('Quotation updated')
      } else {
        await createQuotation(user.tenantId, payload, user)
        toast.success('Quotation created')
      }

      // Auto-save company profile (including bank details)
      await saveCompanyProfile(
        user.tenantId,
        companyInfoToProfile(draft.company, draft.bankDetails, companyProfile),
      )
      const updated = await getCompanyProfile(user.tenantId)
      setCompanyProfile(updated)

      setBuilderOpen(false)
      setDraft(null)
      setEditing(null)
    } catch (e) {
      console.error('[handleSave]', e)
      toast.error(e instanceof Error ? e.message : 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget || !user?.tenantId) return
    const id = deleteTarget.id?.trim()
    if (!id) { toast.error('Invalid quotation ID'); setDeleteTarget(null); return }
    const number = deleteTarget.quotationNumber
    setDeleting(true)
    try {
      await deleteQuotation(id, user.tenantId, number, user)
      toast.success('Quotation ' + number + ' deleted')
      setDeleteTarget(null)
    } catch (e) {
      console.error('[handleDelete]', e)
      toast.error(e instanceof Error ? e.message : 'Delete failed')
    } finally {
      setDeleting(false)
    }
  }

  const handlePrint = () => {
    if (!printRef.current) return
    const printWindow = window.open('', '_blank', 'width=960,height=800')
    if (!printWindow) { toast.error('Pop-up blocked — allow pop-ups to print'); return }
    const styleSheets = Array.from(document.styleSheets).map((ss) => {
      try { return Array.from(ss.cssRules).map((r) => r.cssText).join('\n') } catch { return '' }
    }).join('\n')
    printWindow.document.write('<!DOCTYPE html><html><head><meta charset="utf-8"/><title>Quotation ' +
      (draft?.quotationNumber ?? '') + '</title><style>' + styleSheets +
      '* { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }' +
      '@page { margin: 0; size: A4; } body { margin: 0; padding: 0; }' +
      '</style></head><body>' + printRef.current.innerHTML + '</body></html>')
    printWindow.document.close()
    printWindow.focus()
    setTimeout(() => { printWindow.print() }, 600)
  }

  const handleDownloadPDF = async () => {
    if (!printRef.current || !draft) return
    const element = printRef.current
    const loadingToast = toast.loading('Generating PDF...')

    try {
      // Fetch the logo image and convert it to base64 before snapshot to completely bypass CORS canvas-taint errors
      let base64Logo = ''
      const activeLogo = draft.company.logoUrl || companyProfile?.logoUrl || ''
      if (activeLogo && activeLogo.startsWith('http')) {
        try {
          const base64 = await downloadImageAsBase64(activeLogo)
          if (base64 && base64.startsWith('data:')) {
            base64Logo = base64
          }
        } catch (err) {
          console.error('Failed to pre-convert logo to base64', err)
        }
      }

      const opt = {
        margin:       0,
        filename:     `Quotation-${draft.quotationNumber}.pdf`,
        image:        { type: 'jpeg' as const, quality: 0.98 },
        html2canvas:  { 
          scale: 2, 
          useCORS: true, 
          logging: false,
          backgroundColor: '#ffffff',
          delay: 1000,
          onclone: (clonedDoc: Document) => {
            // Remove dark classes to ensure light mode is used for the PDF capture
            clonedDoc.documentElement.classList.remove('dark')
            clonedDoc.body.classList.remove('dark')
            
            // Remove margins and paddings from html and body to prevent page overflow issues
            const html = clonedDoc.documentElement
            if (html) {
              html.style.margin = '0'
              html.style.padding = '0'
            }
            const clonedBody = clonedDoc.body as HTMLElement
            if (clonedBody) {
              clonedBody.style.width = '850px'
              clonedBody.style.minWidth = '850px'
              clonedBody.style.margin = '0'
              clonedBody.style.padding = '0'
            }

            const container = clonedDoc.querySelector('.quotation-print-container') as HTMLElement
            if (container) {
              // Lock width to 850px to perfectly match the preview layout size
              container.style.width = '850px'
              container.style.minWidth = '850px'
              container.style.margin = '0 auto'
              
              let el: HTMLElement | null = container
              while (el) {
                el.classList.remove('dark')
                el = el.parentElement
              }
            }
            
            // Target the logo image specifically in the clone and explicitly replace it with base64 data URL
            const logoEl = clonedDoc.querySelector('.logo-img-el') as HTMLImageElement | null
            if (logoEl) {
              if (activeLogo.startsWith('data:')) {
                logoEl.setAttribute('src', activeLogo)
              } else if (base64Logo) {
                logoEl.setAttribute('src', base64Logo)
              } else if (activeLogo.startsWith('http')) {
                logoEl.setAttribute('crossorigin', 'anonymous')
                logoEl.setAttribute('src', `https://corsproxy.io/?${encodeURIComponent(activeLogo)}`)
              }
            }
            
            // Handle any other normal images in the document
            const images = clonedDoc.querySelectorAll('img:not(.logo-img-el)')
            images.forEach((img) => {
              const src = img.getAttribute('src')
              if (src && !src.startsWith('data:') && src.startsWith('http')) {
                img.setAttribute('crossorigin', 'anonymous')
                img.setAttribute('src', `https://corsproxy.io/?${encodeURIComponent(src)}`)
              }
            })
          }
        },
        jsPDF:        { unit: 'mm' as const, format: 'a4' as const, orientation: 'portrait' as const },
        pagebreak:    { mode: ['avoid-all', 'css', 'legacy'] }
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
    <div className="space-y-6">
      <Card>
        <CardHeader
          title="Quotations"
          subtitle={filtered.length + ' quotation' + (filtered.length !== 1 ? 's' : '')}
          action={canWrite && (
            <Button onClick={openCreate} disabled={!profileLoaded}>
              <Plus className="h-4 w-4" /> New quotation
            </Button>
          )}
        />

        {/* Status filters */}
        <div className="mb-4 flex flex-wrap gap-2">
          {[{ value: '', label: 'All' }, ...QUOTATION_STATUSES].map((s) => (
            <button
              key={s.value}
              onClick={() => { setStatusFilter(s.value); setPage(1) }}
              className={'rounded-full px-3 py-1 text-xs font-medium transition ' +
                (statusFilter === s.value
                  ? 'bg-brand-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300')}
            >
              {s.label}
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <EmptyState icon={FileText} title="No quotations yet"
            description={canWrite ? 'Create your first professional quotation' : 'No quotations available'} />
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-slate-200 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:border-slate-800">
                  <tr>
                    <th className="pb-3 pr-4">Number</th>
                    <th className="pb-3 pr-4">Client</th>
                    <th className="pb-3 pr-4">Issue Date</th>
                    <th className="pb-3 pr-4">Valid Until</th>
                    <th className="pb-3 pr-4">Amount</th>
                    <th className="pb-3 pr-4">Status</th>
                    <th className="pb-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {paged.map((q) => (
                    <tr key={q.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                      <td className="py-3 pr-4">
                        <span className="font-mono font-semibold text-brand-600 dark:text-brand-400">{q.quotationNumber}</span>
                      </td>
                      <td className="py-3 pr-4">
                        <p className="font-medium text-slate-900 dark:text-white">
                          {q.client.salutation ? q.client.salutation + ' ' : ''}{q.client.name}
                        </p>
                        {q.client.company && <p className="text-xs text-slate-500">{q.client.company}</p>}
                      </td>
                      <td className="py-3 pr-4 text-slate-500">{formatDate(q.issueDate)}</td>
                      <td className="py-3 pr-4 text-slate-500">{formatDate(q.validUntil)}</td>
                      <td className="py-3 pr-4 font-semibold text-slate-900 dark:text-white">
                        {formatCurrency(q.grandTotal, q.currency)}
                      </td>
                      <td className="py-3 pr-4"><Badge className={statusColor(q.status)}>{q.status}</Badge></td>
                      <td className="py-3">
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" onClick={() => openPreview(q)} title="Preview"><Eye className="h-4 w-4" /></Button>
                          {canWrite && (
                            <>
                              <Button variant="ghost" onClick={() => openEdit(q)} title="Edit"><Pencil className="h-4 w-4" /></Button>
                              <Button variant="ghost" onClick={() => setDeleteTarget(q)} title="Delete"><Trash2 className="h-4 w-4 text-red-500" /></Button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card-based List View */}
            <div className="grid gap-3 md:hidden">
              {paged.map((q) => (
                <div key={q.id} className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-mono text-xs font-semibold text-brand-600 dark:text-brand-400">
                        {q.quotationNumber}
                      </p>
                      <h4 className="mt-1 font-semibold text-slate-900 dark:text-white">
                        {q.client.salutation ? q.client.salutation + ' ' : ''}{q.client.name}
                      </h4>
                      {q.client.company && (
                        <p className="text-xs text-slate-500">{q.client.company}</p>
                      )}
                    </div>
                    <Badge className={statusColor(q.status)}>{q.status}</Badge>
                  </div>
                  
                  <div className="mt-3 grid grid-cols-2 gap-2 border-t border-slate-100 pt-2 text-xs text-slate-500 dark:border-slate-800">
                    <div>
                      <span className="block text-[10px] uppercase text-slate-400">Issue Date</span>
                      <span className="font-medium text-slate-700 dark:text-slate-300">{formatDate(q.issueDate)}</span>
                    </div>
                    <div>
                      <span className="block text-[10px] uppercase text-slate-400">Valid Until</span>
                      <span className="font-medium text-slate-700 dark:text-slate-300">{formatDate(q.validUntil)}</span>
                    </div>
                  </div>

                  <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2 dark:border-slate-800">
                    <div>
                      <span className="text-[10px] uppercase text-slate-400 block">Total Amount</span>
                      <span className="text-sm font-bold text-slate-900 dark:text-white">
                        {formatCurrency(q.grandTotal, q.currency)}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" className="h-8 w-8 p-0" onClick={() => openPreview(q)} title="Preview">
                        <Eye className="h-4 w-4" />
                      </Button>
                      {canWrite && (
                        <>
                          <Button variant="ghost" className="h-8 w-8 p-0" onClick={() => openEdit(q)} title="Edit">
                            <Pencil className="h-4 w-4" />
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
            <Pagination page={page} totalPages={pages} onPageChange={setPage} />
          </>
        )}
      </Card>

      {/* Builder Modal — backdrop click disabled, cancel requires confirmation */}
      <Modal
        open={builderOpen}
        onClose={handleCancel}
        title={editing ? 'Edit — ' + editing.quotationNumber : 'New Quotation'}
        size="xl"
        disableBackdropClose
      >
        {draft && (
          <div className="space-y-6">
            <QuotationBuilder value={draft} onChange={setDraft} />
            <div className="sticky bottom-0 flex justify-end gap-3 border-t border-slate-200 bg-white py-4 dark:border-slate-700 dark:bg-slate-900">
              <Button variant="secondary" onClick={handleCancel}>Cancel</Button>
              <Button variant="secondary" onClick={() => { setBuilderOpen(false); setPreviewOpen(true) }}>
                <Eye className="h-4 w-4" /> Preview
              </Button>
              <Button onClick={handleSave} loading={saving}>
                <Save className="h-4 w-4" /> {editing ? 'Update' : 'Save'} Quotation
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Preview Modal */}
      <Modal
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        title={'Preview — ' + (draft?.quotationNumber ?? '')}
        size="xl"
      >
        {draft && (
          <div className="space-y-4">
            <div className="flex flex-wrap justify-end gap-2">
              <Button variant="secondary" onClick={handleDownloadPDF}>
                <Download className="h-4 w-4" /> Download PDF
              </Button>
              <Button variant="secondary" onClick={handlePrint}>
                <Printer className="h-4 w-4" /> Print
              </Button>
              {canWrite && (
                <Button onClick={() => { setPreviewOpen(false); setBuilderOpen(true) }}>
                  <Pencil className="h-4 w-4" /> Edit
                </Button>
              )}
            </div>
            <div className="overflow-auto rounded-xl border border-slate-200 bg-white dark:border-slate-700">
              <QuotationPreview ref={printRef} quotation={draft} />
            </div>
          </div>
        )}
      </Modal>

      {/* Cancel confirmation */}
      <ConfirmDialog
        open={cancelConfirmOpen}
        title="Discard changes?"
        message="You have unsaved changes. Are you sure you want to close without saving?"
        confirmLabel="Discard"
        onConfirm={doClose}
        onCancel={() => setCancelConfirmOpen(false)}
        danger
      />

      {/* Delete Confirm */}
      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete quotation"
        message={'Delete "' + (deleteTarget?.quotationNumber ?? '') + '"? This cannot be undone.'}
        confirmLabel="Delete"
        onConfirm={handleDelete}
        onCancel={() => { if (!deleting) setDeleteTarget(null) }}
        loading={deleting}
      />

      {/* Floating Action Button for Mobile */}
      {canWrite && (
        <button
          onClick={openCreate}
          disabled={!profileLoaded}
          aria-label="New quotation"
          className="fixed bottom-20 right-4 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-brand-600 text-white shadow-lg transition-transform active:scale-95 hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 dark:bg-brand-500 dark:hover:bg-brand-600 lg:hidden"
        >
          <Plus className="h-6 w-6" />
        </button>
      )}
    </div>
  )
}
