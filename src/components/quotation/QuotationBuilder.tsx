import { GripVertical, Plus, Trash2, Upload, Loader2 } from 'lucide-react'
import { useCallback, useState } from 'react'
import toast from 'react-hot-toast'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Textarea } from '@/components/ui/Textarea'
import { ACCENT_COLORS, CURRENCIES, QUOTATION_THEMES } from '@/lib/constants'
import { TERMS_CATEGORIES, TERMS_CLAUSES } from '@/lib/termsAndConditions'
import { calcQuotationTotals, formatCurrency, generateId } from '@/lib/utils'
import { useAuthStore } from '@/stores/authStore'
import { getCompanyProfile, saveCompanyProfile } from '@/services/quotations.service'
import type { Quotation, QuotationLineItem } from '@/types'

interface Props {
  value: Quotation
  onChange: (q: Quotation) => void
}

export function QuotationBuilder({ value: q, onChange }: Props) {
  const { user } = useAuthStore()
  const [uploadingLogo, setUploadingLogo] = useState(false)

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      setUploadingLogo(true)
      
      // Compress the logo to a small, high-quality base64 string (approx 10-15KB)
      const base64Data = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = (event) => {
          const img = new Image()
          img.onload = () => {
            const canvas = document.createElement('canvas')
            let width = img.width
            let height = img.height
            const maxDim = 200
            
            if (width > maxDim || height > maxDim) {
              if (width > height) {
                height = Math.round((height * maxDim) / width)
                width = maxDim
              } else {
                width = Math.round((width * maxDim) / height)
                height = maxDim
              }
            }
            
            canvas.width = width
            canvas.height = height
            const ctx = canvas.getContext('2d')
            if (ctx) {
              ctx.drawImage(img, 0, 0, width, height)
              resolve(canvas.toDataURL('image/jpeg', 0.85))
            } else {
              reject(new Error('Canvas 2D context not available'))
            }
          }
          img.onerror = () => reject(new Error('Failed to load image element'))
          img.src = event.target?.result as string
        }
        reader.onerror = () => reject(new Error('Failed to read logo file'))
        reader.readAsDataURL(file)
      })

      set({ company: { ...q.company, logoUrl: base64Data } })

      // Instant profile save in background
      if (user?.tenantId) {
        try {
          const currentProfile = await getCompanyProfile(user.tenantId)
          if (currentProfile) {
            const { id, tenantId, updatedAt, ...rest } = currentProfile
            rest.logoUrl = base64Data
            await saveCompanyProfile(user.tenantId, rest)
          }
        } catch (profileErr) {
          console.error('Failed to auto-save profile logo', profileErr)
        }
      }

      toast.success('Logo uploaded and saved automatically')
    } catch (err) {
      console.error('[logoUpload]', err)
      toast.error('Failed to process logo file')
    } finally {
      setUploadingLogo(false)
    }
  }

  const set = useCallback(
    (patch: Partial<Quotation>) => {
      const next = { ...q, ...patch }
      const items = patch.items ?? q.items
      const discountPercent = patch.discountPercent ?? q.discountPercent
      const taxPercent = patch.taxPercent ?? q.taxPercent
      const { subtotal, discountAmount, taxAmount, grandTotal } = calcQuotationTotals(
        items,
        discountPercent,
        taxPercent,
      )
      onChange({ ...next, subtotal, discountAmount, taxAmount, grandTotal })
    },
    [q, onChange],
  )

  const addItem = () => {
    const newItem: QuotationLineItem = { id: generateId(), description: '', quantity: 1, unitPrice: 0 }
    set({ items: [...q.items, newItem] })
  }

  const updateItem = (id: string, patch: Partial<QuotationLineItem>) =>
    set({ items: q.items.map((it) => (it.id === id ? { ...it, ...patch } : it)) })

  const removeItem = (id: string) =>
    set({ items: q.items.filter((it) => it.id !== id) })

  const toggleTerm = (id: string) => {
    const selected = q.selectedTerms.includes(id)
      ? q.selectedTerms.filter((t) => t !== id)
      : [...q.selectedTerms, id]
    set({ selectedTerms: selected })
  }

  const { subtotal, discountAmount, taxAmount, grandTotal } = calcQuotationTotals(
    q.items,
    q.discountPercent,
    q.taxPercent,
  )

  return (
    <div className="space-y-8">

      {/* ── Design & Style ── */}
      <Section title="Design & Style">
        <div className="space-y-5">
          <div>
            <p className="mb-2 text-sm font-medium text-slate-700 dark:text-slate-300">Theme</p>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {QUOTATION_THEMES.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => set({ theme: t.value as Quotation['theme'] })}
                  className={`rounded-xl border-2 p-3 text-left transition ${
                    q.theme === t.value
                      ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/20'
                      : 'border-slate-200 hover:border-slate-300 dark:border-slate-700'
                  }`}
                >
                  <p className="font-semibold text-slate-900 dark:text-white">{t.label}</p>
                  <p className="mt-0.5 text-xs text-slate-500">{t.description}</p>
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="mb-2 text-sm font-medium text-slate-700 dark:text-slate-300">Accent Color</p>
            <div className="flex flex-wrap items-center gap-2">
              {ACCENT_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => set({ accentColor: c })}
                  title={c}
                  className={`h-8 w-8 rounded-full transition-transform hover:scale-110 ${
                    q.accentColor === c ? 'scale-110 ring-2 ring-slate-400 ring-offset-2' : ''
                  }`}
                  style={{ background: c }}
                />
              ))}
              <label className="flex cursor-pointer items-center gap-1.5">
                <input
                  type="color"
                  value={q.accentColor}
                  onChange={(e) => set({ accentColor: e.target.value })}
                  className="h-8 w-8 cursor-pointer rounded-full border-0 bg-transparent p-0"
                />
                <span className="text-xs text-slate-400">Custom</span>
              </label>
            </div>
          </div>
        </div>
      </Section>

      {/* ── Quotation Details ── */}
      <Section title="Quotation Details">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Input
            label="Quotation Number"
            value={q.quotationNumber}
            onChange={(e) => set({ quotationNumber: e.target.value })}
          />
          <Select
            label="Status"
            value={q.status}
            onChange={(e) => set({ status: e.target.value as Quotation['status'] })}
            options={[
              { value: 'draft', label: 'Draft' },
              { value: 'sent', label: 'Sent' },
              { value: 'accepted', label: 'Accepted' },
              { value: 'rejected', label: 'Rejected' },
              { value: 'expired', label: 'Expired' },
            ]}
          />
          <Input label="Issue Date" type="date" value={q.issueDate} onChange={(e) => set({ issueDate: e.target.value })} />
          <Input label="Valid Until" type="date" value={q.validUntil} onChange={(e) => set({ validUntil: e.target.value })} />
          <Select
            label="Currency"
            value={q.currency}
            onChange={(e) => set({ currency: e.target.value })}
            options={CURRENCIES.map((c) => ({ value: c.value, label: c.label }))}
          />
          <div className="space-y-1">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
              Project Timeline (Working Days)
            </label>
            <div className="flex items-center rounded-lg border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
              <input
                type="number"
                min={1}
                step={1}
                className="w-full rounded-lg bg-transparent px-3 py-2 text-sm focus:outline-none"
                value={q.projectTimelineDays || ''}
                placeholder="e.g. 30"
                onChange={(e) => set({ projectTimelineDays: parseInt(e.target.value) || 0 })}
              />
              <span className="whitespace-nowrap pr-3 text-sm text-slate-400">days</span>
            </div>
            {q.projectTimelineDays > 0 && (
              <p className="text-xs text-slate-400">
                ≈ {Math.ceil(q.projectTimelineDays / 5)} week{Math.ceil(q.projectTimelineDays / 5) !== 1 ? 's' : ''}
              </p>
            )}
          </div>
        </div>
      </Section>

      {/* ── Your Company ── */}
      <Section title="Your Company">
        <p className="mb-3 text-xs text-slate-400">
          Saved automatically on every quotation save and pre-filled for future quotations.
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="Company Name *" value={q.company.name} onChange={(e) => set({ company: { ...q.company, name: e.target.value } })} placeholder="Acme Corp" />
          <Input label="Email *" type="email" value={q.company.email} onChange={(e) => set({ company: { ...q.company, email: e.target.value } })} placeholder="hello@company.com" />
          <Input label="Phone" value={q.company.phone} onChange={(e) => set({ company: { ...q.company, phone: e.target.value } })} placeholder="+1 555 000 0000" />
          <Input label="Website" value={q.company.website} onChange={(e) => set({ company: { ...q.company, website: e.target.value } })} placeholder="https://company.com" />
          <Input label="Instagram ID" value={q.company.instagram ?? ''} onChange={(e) => set({ company: { ...q.company, instagram: e.target.value } })} placeholder="@mybusiness" />
          <Input label="Address" value={q.company.address} onChange={(e) => set({ company: { ...q.company, address: e.target.value } })} placeholder="123 Main Street" />
          <Input label="City / State / ZIP" value={q.company.city} onChange={(e) => set({ company: { ...q.company, city: e.target.value } })} placeholder="New York, NY 10001" />
          <Input label="Tax ID / GST / VAT" value={q.company.taxId ?? ''} onChange={(e) => set({ company: { ...q.company, taxId: e.target.value } })} placeholder="GST: 12ABCDE1234F1Z5" />
          <div className="space-y-1">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Logo</label>
            <div className="flex items-center gap-2">
              <input
                type="url"
                placeholder="Logo image URL"
                value={q.company.logoUrl ?? ''}
                onChange={(e) => set({ company: { ...q.company, logoUrl: e.target.value } })}
                className="flex-grow rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
              />
              <label className="flex shrink-0 items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 cursor-pointer dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800">
                {uploadingLogo ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin text-brand-500" />
                    <span className="hidden sm:inline">Uploading...</span>
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 text-slate-500" />
                    <span className="hidden sm:inline">Upload Logo</span>
                  </>
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  className="hidden"
                  disabled={uploadingLogo}
                />
              </label>
            </div>
            {q.company.logoUrl && (
              <img src={q.company.logoUrl} alt="logo preview" className="mt-2 h-10 object-contain"
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
            )}
          </div>
        </div>
        <div className="mt-4">
          <Textarea
            label="About Company (shown on quotation)"
            rows={3}
            value={q.company.about ?? ''}
            onChange={(e) => set({ company: { ...q.company, about: e.target.value } })}
            placeholder="Brief company description, achievements, services offered..."
          />
        </div>
      </Section>

      {/* ── Client / Bill To ── */}
      <Section title="Client / Bill To">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Salutation</label>
            <select
              value={q.client.salutation ?? 'Mr.'}
              onChange={(e) => set({ client: { ...q.client, salutation: e.target.value } })}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-brand-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
            >
              {['Mr.', 'Mrs.', 'Ms.', 'Dr.', 'M/s.', 'Prof.'].map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
          <Input label="Contact Name *" value={q.client.name} onChange={(e) => set({ client: { ...q.client, name: e.target.value } })} placeholder="John Smith" />
          <Input label="Company Name" value={q.client.company} onChange={(e) => set({ client: { ...q.client, company: e.target.value } })} placeholder="Client Corp" />
          <Input label="Email" type="email" value={q.client.email} onChange={(e) => set({ client: { ...q.client, email: e.target.value } })} placeholder="client@example.com" />
          <Input label="Phone" value={q.client.phone} onChange={(e) => set({ client: { ...q.client, phone: e.target.value } })} placeholder="+91 98765 43210" />
          <Input label="Address" value={q.client.address} onChange={(e) => set({ client: { ...q.client, address: e.target.value } })} placeholder="456 Client Ave" />
          <Input label="City / State / PIN" value={q.client.city} onChange={(e) => set({ client: { ...q.client, city: e.target.value } })} placeholder="Mumbai - 400001, Maharashtra" />
        </div>
      </Section>

      {/* ── Line Items ── */}
      <Section title="Line Items">
        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
          <table className="w-full min-w-[600px] text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800">
              <tr className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                <th className="w-6 px-3 py-3" />
                <th className="w-16 px-3 py-3 text-center">Sr. No.</th>
                <th className="w-64 px-3 py-3 text-left">Module</th>
                <th className="px-3 py-3 text-left">Description</th>
                <th className="w-8 px-3 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {q.items.map((item, idx) => (
                <tr key={item.id} className="group bg-white dark:bg-slate-900">
                  <td className="px-3 py-2 text-slate-300"><GripVertical className="h-4 w-4" /></td>
                  <td className="px-3 py-2 text-center text-slate-500 font-mono">{idx + 1}</td>
                  <td className="px-3 py-2">
                    <input
                      className="w-full rounded border border-transparent bg-transparent px-2 py-1 text-sm font-semibold focus:border-brand-400 focus:bg-slate-50 focus:outline-none dark:focus:bg-slate-800"
                      placeholder={`Module ${idx + 1}...`}
                      value={item.moduleName ?? ''}
                      onChange={(e) => updateItem(item.id, { moduleName: e.target.value })}
                    />
                  </td>
                  <td className="px-3 py-2">
                    <textarea
                      rows={1}
                      className="w-full rounded border border-transparent bg-transparent px-2 py-1 text-sm focus:border-brand-400 focus:bg-slate-50 focus:outline-none dark:focus:bg-slate-800 resize-y"
                      placeholder="Module description and features..."
                      value={item.description}
                      onChange={(e) => updateItem(item.id, { description: e.target.value })}
                    />
                  </td>
                  <td className="px-3 py-2">
                    <button
                      type="button"
                      onClick={() => removeItem(item.id)}
                      disabled={q.items.length === 1}
                      className="rounded p-1 text-slate-300 opacity-0 transition hover:bg-red-50 hover:text-red-500 group-hover:opacity-100 disabled:cursor-not-allowed disabled:opacity-20 dark:hover:bg-red-900/20"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Card-based List View */}
        <div className="grid gap-3 md:hidden">
          {q.items.map((item, idx) => (
            <div key={item.id} className="rounded-xl border border-slate-200 bg-slate-50/50 p-3.5 dark:border-slate-800 dark:bg-slate-900/30 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500">Module #{idx + 1}</span>
                <button
                  type="button"
                  onClick={() => removeItem(item.id)}
                  disabled={q.items.length === 1}
                  className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-500 disabled:opacity-20 dark:hover:bg-red-900/20"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>

              <div className="space-y-1">
                <label className="block text-[9px] uppercase tracking-wider text-slate-400 font-bold">Module Name</label>
                <input
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                  placeholder="Module Name..."
                  value={item.moduleName ?? ''}
                  onChange={(e) => updateItem(item.id, { moduleName: e.target.value })}
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[9px] uppercase tracking-wider text-slate-400 font-bold">Description</label>
                <textarea
                  rows={2}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                  placeholder="Module description and features..."
                  value={item.description}
                  onChange={(e) => updateItem(item.id, { description: e.target.value })}
                />
              </div>
            </div>
          ))}
        </div>

        <Button type="button" variant="secondary" onClick={addItem} className="mt-3">
          <Plus className="h-4 w-4" /> Add line item
        </Button>

        {/* Discount & Tax + Totals */}
        <div className="mt-6 flex flex-col items-end gap-4">
          {/* Discount & Tax inputs */}
          <div className="flex flex-wrap items-end gap-4">
            <div className="w-44">
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-500">
                Quotation Amount ({q.currency})
              </label>
              <div className="flex items-center rounded-lg border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
                <input
                  type="number" min={0} step="0.01"
                  className="w-full rounded-lg bg-transparent px-3 py-2 text-right text-sm focus:outline-none"
                  value={q.items[0]?.unitPrice || 0}
                  onChange={(e) => {
                    const amt = parseFloat(e.target.value) || 0
                    const updatedItems = q.items.map((it, idx) => ({
                      ...it,
                      unitPrice: idx === 0 ? amt : 0,
                      quantity: 1
                    }))
                    set({ items: updatedItems })
                  }}
                />
              </div>
            </div>
            <div className="w-44">
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-500">
                Discount on Subtotal (%)
              </label>
              <div className="flex items-center rounded-lg border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
                <input
                  type="number" min={0} max={100} step="0.1"
                  className="w-full rounded-lg bg-transparent px-3 py-2 text-right text-sm focus:outline-none"
                  value={q.discountPercent}
                  onChange={(e) => set({ discountPercent: parseFloat(e.target.value) || 0 })}
                />
                <span className="pr-3 text-sm text-slate-400">%</span>
              </div>
            </div>
            <div className="w-44">
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-500">
                Tax / GST (%)
              </label>
              <div className="flex items-center rounded-lg border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
                <input
                  type="number" min={0} max={100} step="0.1"
                  className="w-full rounded-lg bg-transparent px-3 py-2 text-right text-sm focus:outline-none"
                  value={q.taxPercent}
                  onChange={(e) => set({ taxPercent: parseFloat(e.target.value) || 0 })}
                />
                <span className="pr-3 text-sm text-slate-400">%</span>
              </div>
            </div>
          </div>

          {/* Totals box */}
          <div className="w-72 space-y-2 rounded-xl border border-slate-200 p-4 text-sm dark:border-slate-700">
            <div className="flex justify-between text-slate-600 dark:text-slate-400">
              <span>Subtotal</span><span>{formatCurrency(subtotal, q.currency)}</span>
            </div>
            {discountAmount > 0 && (
              <div className="flex justify-between text-emerald-600">
                <span>Discount ({q.discountPercent}%)</span>
                <span>-{formatCurrency(discountAmount, q.currency)}</span>
              </div>
            )}
            {taxAmount > 0 && (
              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>Tax ({q.taxPercent}%)</span>
                <span>{formatCurrency(taxAmount, q.currency)}</span>
              </div>
            )}
            <div className="flex justify-between border-t border-slate-200 pt-2 text-base font-bold text-slate-900 dark:border-slate-700 dark:text-white">
              <span>Grand Total</span><span>{formatCurrency(grandTotal, q.currency)}</span>
            </div>
          </div>
        </div>
      </Section>

      {/* ── Bank Details ── */}
      <Section title="Bank Details">
        <div className="mb-3 flex items-center gap-3">
          <label className="flex cursor-pointer items-center gap-2">
            <input
              type="checkbox"
              checked={q.showBankDetails}
              onChange={(e) => set({ showBankDetails: e.target.checked })}
              className="accent-brand-600"
            />
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Show bank details on quotation
            </span>
          </label>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Bank Name"
            value={q.bankDetails?.bankName ?? ''}
            onChange={(e) => set({ bankDetails: { ...q.bankDetails, bankName: e.target.value } })}
            placeholder="State Bank of India"
          />
          <Input
            label="Account Holder Name"
            value={q.bankDetails?.accountName ?? ''}
            onChange={(e) => set({ bankDetails: { ...q.bankDetails, accountName: e.target.value } })}
            placeholder="iCoded Automation Pvt Ltd"
          />
          <Input
            label="Account Number"
            value={q.bankDetails?.accountNumber ?? ''}
            onChange={(e) => set({ bankDetails: { ...q.bankDetails, accountNumber: e.target.value } })}
            placeholder="1234567890123456"
          />
          <Input
            label="IFSC Code"
            value={q.bankDetails?.ifscCode ?? ''}
            onChange={(e) => set({ bankDetails: { ...q.bankDetails, ifscCode: e.target.value } })}
            placeholder="SBIN0001234"
          />
          <Input
            label="Branch Name"
            value={q.bankDetails?.branchName ?? ''}
            onChange={(e) => set({ bankDetails: { ...q.bankDetails, branchName: e.target.value } })}
            placeholder="Aurangabad Main Branch"
          />
          <Input
            label="UPI ID (optional)"
            value={q.bankDetails?.upiId ?? ''}
            onChange={(e) => set({ bankDetails: { ...q.bankDetails, upiId: e.target.value } })}
            placeholder="company@upi"
          />
        </div>
        <p className="mt-2 text-xs text-slate-400">
          Bank details are saved with your company profile and reused for future quotations.
        </p>
      </Section>

      {/* ── Overview ── */}
      <Section title="Overview">
        <Textarea
          label="Overview (shown on quotation)"
          rows={3}
          value={q.notes}
          onChange={(e) => set({ notes: e.target.value })}
          placeholder="Provide an overview, introduction, or message for the client."
        />
      </Section>

      {/* ── Terms & Conditions ── */}
      <Section title="Terms & Conditions">
        <p className="mb-4 text-xs text-slate-500 dark:text-slate-400">
          Select the clauses to include in this quotation. Only checked items will appear on the printed document.
        </p>
        <div className="space-y-6">
          {TERMS_CATEGORIES.map((category) => {
            const clauses = TERMS_CLAUSES.filter((c) => c.category === category)
            return (
              <div key={category}>
                <p className="mb-2 text-xs font-bold uppercase tracking-widest text-brand-600 dark:text-brand-400">
                  {category}
                </p>
                <div className="space-y-2">
                  {clauses.map((clause) => {
                    const checked = q.selectedTerms.includes(clause.id)
                    return (
                      <label
                        key={clause.id}
                        className={`flex cursor-pointer gap-3 rounded-xl border p-3 transition ${
                          checked
                            ? 'border-brand-300 bg-brand-50 dark:border-brand-700 dark:bg-brand-900/20'
                            : 'border-slate-200 hover:border-slate-300 dark:border-slate-700 dark:hover:border-slate-600'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleTerm(clause.id)}
                          className="mt-0.5 h-4 w-4 shrink-0 accent-brand-600"
                        />
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                            {clause.title}
                          </p>
                          <p className="mt-0.5 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                            {clause.text}
                          </p>
                        </div>
                      </label>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
        <p className="mt-3 text-xs text-slate-400">
          {q.selectedTerms.length} clause{q.selectedTerms.length !== 1 ? 's' : ''} selected
        </p>

        {/* ── Additional / Custom Terms ── */}
        <div className="mt-6">
          <div className="mb-2 flex items-center gap-2">
            <div className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Additional Terms</p>
            <div className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />
          </div>
          <p className="mb-3 text-xs text-slate-500 dark:text-slate-400">
            Add any custom or project-specific terms here. These will appear after the selected clauses above.
          </p>
          <Textarea
            label=""
            rows={5}
            value={q.customTerms}
            onChange={(e) => set({ customTerms: e.target.value })}
            placeholder={`e.g.\n• The client will provide all required content (text, images, branding) within 7 days of project kickoff.\n• Server credentials and third-party API keys must be shared before development begins.\n• Any delay in client approvals beyond 5 business days will extend the timeline proportionally.`}
          />
        </div>
      </Section>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="mb-4 flex items-center gap-3 text-xs font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
        <span className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />
        {title}
        <span className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />
      </h3>
      {children}
    </div>
  )
}
