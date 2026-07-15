import { Eye, FileText, Pencil, Plus, Printer, Receipt, Save, Trash2, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import toast from 'react-hot-toast'
import { BillPreview } from '@/components/bill/BillPreview'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card, CardHeader } from '@/components/ui/Card'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { EmptyState } from '@/components/ui/EmptyState'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { Pagination } from '@/components/ui/Pagination'
import { Select } from '@/components/ui/Select'
import { Textarea } from '@/components/ui/Textarea'
import { BILL_STATUSES, CURRENCIES, PAGE_SIZE, PAYMENT_MODES } from '@/lib/constants'
import { canManageBills } from '@/lib/permissions'
import { calcQuotationTotals, formatCurrency, formatDate, generateId, paginate, totalPages } from '@/lib/utils'
import {
  createBill,
  deleteBill,
  deletePayment,
  generateBillNumber,
  recordPayment,
  updateBill,
} from '@/services/bills.service'
import { getCompanyProfile } from '@/services/quotations.service'
import { useAuthStore } from '@/stores/authStore'
import { useDataStore } from '@/stores/dataStore'
import type {
  Bill, BillLineItem, BillPayment,
  CompanyProfile, Quotation,
  QuotationBankDetails, QuotationClientInfo, QuotationCompanyInfo,
} from '@/types'

// ─── Constants ───────────────────────────────────────────────────────────────

const BLANK_BANK: QuotationBankDetails = { bankName: '', accountName: '', accountNumber: '', ifscCode: '', branchName: '', upiId: '' }

const BLANK_COMPANY: QuotationCompanyInfo = {
  name: 'iCoded Automation Pvt Ltd',
  address: 'Neesha Pride, 2nd Floor, Mondha Naka',
  city: 'Chhatrapati Sambhajinagar - 431006, Maharashtra',
  phone: '',
  email: 'info@icodedautomation.com',
  website: 'www.icodedautomation.com',
  taxId: '',
  logoUrl: '/company_logo1.jpeg',
  about: '',
}

const BLANK_CLIENT: QuotationClientInfo = { salutation: 'Mr.', name: '', company: '', address: '', city: '', phone: '', email: '' }

// ─── Helpers ─────────────────────────────────────────────────────────────────

function profileToCompanyForBills(p: CompanyProfile): QuotationCompanyInfo {
  return { name: p.name, address: p.address, city: p.city, phone: p.phone, email: p.email, website: p.website, instagram: p.instagram ?? '', logoUrl: p.logoUrl, taxId: p.taxId, about: p.about }
}

function statusColor(s: string) {
  return BILL_STATUSES.find((x) => x.value === s)?.color ?? ''
}

function makeBillFromQuotation(
  q: Quotation,
  billNumber: string,
  uid: string,
  uname: string,
): Omit<Bill, 'id' | 'tenantId' | 'createdAt' | 'updatedAt'> {
  return {
    billNumber,
    quotationId: q.id,
    quotationNumber: q.quotationNumber,
    status: 'draft',
    accentColor: q.accentColor,
    theme: q.theme,
    company: q.company,
    client: q.client,
    bankDetails: q.bankDetails ?? BLANK_BANK,
    showBankDetails: q.showBankDetails,
    issueDate: new Date().toISOString().slice(0, 10),
    dueDate: new Date(Date.now() + 15 * 86400000).toISOString().slice(0, 10),
    items: q.items.map((i) => ({ id: i.id, description: i.description, quantity: i.quantity, unitPrice: i.unitPrice })),
    discountPercent: q.discountPercent,
    taxPercent: q.taxPercent,
    subtotal: q.subtotal,
    discountAmount: q.discountAmount,
    taxAmount: q.taxAmount,
    grandTotal: q.grandTotal,
    amountPaid: 0,
    balanceDue: q.grandTotal,
    payments: [],
    currency: q.currency,
    notes: q.notes,
    terms: 'Payment is due within 15 days of the invoice date. Late payments may attract additional charges.',
    createdBy: uid,
    createdByName: uname,
  }
}

function makeBlankBill(
  billNumber: string,
  uid: string,
  uname: string,
  company: QuotationCompanyInfo,
  bank: QuotationBankDetails,
  currency: string,
): Omit<Bill, 'id' | 'tenantId' | 'createdAt' | 'updatedAt'> {
  return {
    billNumber,
    status: 'draft',
    accentColor: '#4f46e5',
    theme: 'modern',
    company,
    client: BLANK_CLIENT,
    bankDetails: bank,
    showBankDetails: Object.values(bank).some((v) => v !== ''),
    issueDate: new Date().toISOString().slice(0, 10),
    dueDate: new Date(Date.now() + 15 * 86400000).toISOString().slice(0, 10),
    items: [{ id: generateId(), description: '', quantity: 1, unitPrice: 0 }],
    discountPercent: 0,
    taxPercent: 18,
    subtotal: 0,
    discountAmount: 0,
    taxAmount: 0,
    grandTotal: 0,
    amountPaid: 0,
    balanceDue: 0,
    payments: [],
    currency,
    notes: 'Thank you for your business.',
    terms: 'Payment is due within 15 days of the invoice date.',
    createdBy: uid,
    createdByName: uname,
  }
}

// ─── BillForm ────────────────────────────────────────────────────────────────

interface BillFormProps {
  draft: Bill
  onChange: (b: Bill) => void
}

function BillForm({ draft: b, onChange }: BillFormProps) {
  const set = (patch: Partial<Bill>) => {
    const next = { ...b, ...patch }
    const items = patch.items ?? b.items
    const dp = patch.discountPercent ?? b.discountPercent
    const tp = patch.taxPercent ?? b.taxPercent
    const { subtotal, discountAmount, taxAmount, grandTotal } = calcQuotationTotals(items, dp, tp)
    const balanceDue = Math.max(0, grandTotal - (b.amountPaid || 0))
    onChange({ ...next, subtotal, discountAmount, taxAmount, grandTotal, balanceDue })
  }

  const addItem = () => set({ items: [...b.items, { id: generateId(), description: '', quantity: 1, unitPrice: 0 }] })
  const updateItem = (id: string, patch: Partial<BillLineItem>) =>
    set({ items: b.items.map((it) => (it.id === id ? { ...it, ...patch } : it)) })
  const removeItem = (id: string) => set({ items: b.items.filter((it) => it.id !== id) })

  const { subtotal, discountAmount, taxAmount, grandTotal } = calcQuotationTotals(b.items, b.discountPercent, b.taxPercent)

  return (
    <div className="space-y-7">

      {/* Quotation link notice */}
      {b.quotationNumber && (
        <div className="flex items-center gap-2 rounded-xl border border-brand-200 bg-brand-50 px-4 py-2.5 text-sm text-brand-700 dark:border-brand-800 dark:bg-brand-900/20 dark:text-brand-300">
          <Receipt className="h-4 w-4 shrink-0" />
          <span>Generated from Quotation <strong>{b.quotationNumber}</strong> — edit fields as needed.</span>
        </div>
      )}

      {/* ── Bill Details ── */}
      <Section title="Bill Details">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Input label="Bill Number *" value={b.billNumber} onChange={(e) => set({ billNumber: e.target.value })} />
          <Select label="Status" value={b.status}
            onChange={(e) => set({ status: e.target.value as Bill['status'] })}
            options={BILL_STATUSES.map((s) => ({ value: s.value, label: s.label }))} />
          <Select label="Currency" value={b.currency}
            onChange={(e) => set({ currency: e.target.value })}
            options={CURRENCIES.map((c) => ({ value: c.value, label: c.label }))} />
          <Input label="Issue Date" type="date" value={b.issueDate} onChange={(e) => set({ issueDate: e.target.value })} />
          <Input label="Due Date" type="date" value={b.dueDate} onChange={(e) => set({ dueDate: e.target.value })} />
          <div className="space-y-1">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Accent Color</label>
            <div className="flex items-center gap-2">
              <input type="color" value={b.accentColor}
                onChange={(e) => set({ accentColor: e.target.value })}
                className="h-9 w-9 cursor-pointer rounded-lg border border-slate-200 p-0.5 dark:border-slate-700" />
              <span className="text-xs text-slate-400">{b.accentColor}</span>
            </div>
          </div>
        </div>
      </Section>

      {/* ── Your Company ── */}
      <Section title="Your Company">
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="Company Name *" value={b.company.name} onChange={(e) => set({ company: { ...b.company, name: e.target.value } })} />
          <Input label="Email" type="email" value={b.company.email} onChange={(e) => set({ company: { ...b.company, email: e.target.value } })} />
          <Input label="Phone" value={b.company.phone} onChange={(e) => set({ company: { ...b.company, phone: e.target.value } })} />
          <Input label="Website" value={b.company.website} onChange={(e) => set({ company: { ...b.company, website: e.target.value } })} />
          <Input label="Address" value={b.company.address} onChange={(e) => set({ company: { ...b.company, address: e.target.value } })} />
          <Input label="City / State / PIN" value={b.company.city} onChange={(e) => set({ company: { ...b.company, city: e.target.value } })} />
          <Input label="GSTIN / Tax ID" value={b.company.taxId ?? ''} onChange={(e) => set({ company: { ...b.company, taxId: e.target.value } })} />
        </div>
      </Section>

      {/* ── Bill To ── */}
      <Section title="Bill To (Client)">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Salutation</label>
            <select value={b.client.salutation ?? 'Mr.'} onChange={(e) => set({ client: { ...b.client, salutation: e.target.value } })}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900">
              {['Mr.', 'Mrs.', 'Ms.', 'Dr.', 'M/s.', 'Prof.'].map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <Input label="Contact Name *" value={b.client.name} onChange={(e) => set({ client: { ...b.client, name: e.target.value } })} placeholder="John Smith" />
          <Input label="Company" value={b.client.company} onChange={(e) => set({ client: { ...b.client, company: e.target.value } })} />
          <Input label="Email" type="email" value={b.client.email} onChange={(e) => set({ client: { ...b.client, email: e.target.value } })} />
          <Input label="Phone" value={b.client.phone} onChange={(e) => set({ client: { ...b.client, phone: e.target.value } })} />
          <Input label="Address" value={b.client.address} onChange={(e) => set({ client: { ...b.client, address: e.target.value } })} />
          <Input label="City / State / PIN" value={b.client.city} onChange={(e) => set({ client: { ...b.client, city: e.target.value } })} />
        </div>
      </Section>

      {/* ── Line Items ── */}
      <Section title="Line Items">
        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
          <table className="w-full min-w-[500px] text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800">
              <tr className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                <th className="px-3 py-3 text-left">Description</th>
                <th className="w-20 px-3 py-3 text-center">Qty</th>
                <th className="w-32 px-3 py-3 text-right">Rate</th>
                <th className="w-32 px-3 py-3 text-right">Total</th>
                <th className="w-8 px-3 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {b.items.map((item, idx) => (
                <tr key={item.id} className="group bg-white dark:bg-slate-900">
                  <td className="px-3 py-2">
                    <input className="w-full rounded border border-transparent bg-transparent px-2 py-1 text-sm focus:border-brand-400 focus:bg-slate-50 focus:outline-none dark:focus:bg-slate-800"
                      placeholder={'Item ' + (idx + 1) + '...'}
                      value={item.description}
                      onChange={(e) => updateItem(item.id, { description: e.target.value })} />
                  </td>
                  <td className="px-3 py-2">
                    <input type="number" min={0} step="any"
                      className="w-full rounded border border-transparent bg-transparent px-2 py-1 text-center text-sm focus:border-brand-400 focus:bg-slate-50 focus:outline-none dark:focus:bg-slate-800"
                      value={item.quantity}
                      onChange={(e) => updateItem(item.id, { quantity: parseFloat(e.target.value) || 0 })} />
                  </td>
                  <td className="px-3 py-2">
                    <input type="number" min={0} step="0.01"
                      className="w-full rounded border border-transparent bg-transparent px-2 py-1 text-right text-sm focus:border-brand-400 focus:bg-slate-50 focus:outline-none dark:focus:bg-slate-800"
                      value={item.unitPrice}
                      onChange={(e) => updateItem(item.id, { unitPrice: parseFloat(e.target.value) || 0 })} />
                  </td>
                  <td className="px-3 py-2 text-right font-semibold text-slate-800 dark:text-slate-200">
                    {formatCurrency(item.quantity * item.unitPrice, b.currency)}
                  </td>
                  <td className="px-3 py-2">
                    <button type="button" onClick={() => removeItem(item.id)} disabled={b.items.length === 1}
                      className="rounded p-1 text-slate-300 opacity-0 transition hover:text-red-500 group-hover:opacity-100 disabled:opacity-20">
                      <X className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Card-based List View */}
        <div className="grid gap-3 md:hidden">
          {b.items.map((item, idx) => (
            <div key={item.id} className="rounded-xl border border-slate-200 bg-slate-50/50 p-3.5 dark:border-slate-800 dark:bg-slate-900/30 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500">Item #{idx + 1}</span>
                <button
                  type="button"
                  onClick={() => removeItem(item.id)}
                  disabled={b.items.length === 1}
                  className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-500 disabled:opacity-20 dark:hover:bg-red-900/20"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>

              <div className="space-y-1">
                <label className="block text-[9px] uppercase tracking-wider text-slate-400 font-bold">Description</label>
                <input
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                  placeholder={'Item ' + (idx + 1) + '...'}
                  value={item.description}
                  onChange={(e) => updateItem(item.id, { description: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-[9px] uppercase tracking-wider text-slate-400 font-bold">Qty</label>
                  <input
                    type="number" min={0} step="any"
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                    value={item.quantity}
                    onChange={(e) => updateItem(item.id, { quantity: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-[9px] uppercase tracking-wider text-slate-400 font-bold">Rate ({b.currency})</label>
                  <input
                    type="number" min={0} step="0.01"
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                    value={item.unitPrice}
                    onChange={(e) => updateItem(item.id, { unitPrice: parseFloat(e.target.value) || 0 })}
                  />
                </div>
              </div>

              <div className="flex justify-between items-center border-t border-slate-150 pt-2.5 dark:border-slate-800">
                <span className="text-[10px] uppercase font-bold text-slate-450 dark:text-slate-500">Total</span>
                <span className="text-sm font-semibold text-slate-900 dark:text-white">
                  {formatCurrency(item.quantity * item.unitPrice, b.currency)}
                </span>
              </div>
            </div>
          ))}
        </div>
        <Button type="button" variant="secondary" onClick={addItem} className="mt-2">
          <Plus className="h-4 w-4" /> Add item
        </Button>
        {/* Discount / Tax / Totals */}
        <div className="mt-5 flex flex-col items-end gap-3">
          <div className="flex flex-wrap gap-4">
            <div className="w-40">
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-500">Discount (%)</label>
              <div className="flex items-center rounded-lg border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
                <input type="number" min={0} max={100} step="0.1"
                  className="w-full bg-transparent px-3 py-2 text-right text-sm focus:outline-none"
                  value={b.discountPercent}
                  onChange={(e) => set({ discountPercent: parseFloat(e.target.value) || 0 })} />
                <span className="pr-3 text-sm text-slate-400">%</span>
              </div>
            </div>
            <div className="w-40">
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-500">Tax / GST (%)</label>
              <div className="flex items-center rounded-lg border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
                <input type="number" min={0} max={100} step="0.1"
                  className="w-full bg-transparent px-3 py-2 text-right text-sm focus:outline-none"
                  value={b.taxPercent}
                  onChange={(e) => set({ taxPercent: parseFloat(e.target.value) || 0 })} />
                <span className="pr-3 text-sm text-slate-400">%</span>
              </div>
            </div>
          </div>
          <div className="w-64 space-y-1.5 rounded-xl border border-slate-200 p-4 text-sm dark:border-slate-700">
            <div className="flex justify-between text-slate-500"><span>Subtotal</span><span>{formatCurrency(subtotal, b.currency)}</span></div>
            {discountAmount > 0 && <div className="flex justify-between text-emerald-600"><span>Discount ({b.discountPercent}%)</span><span>-{formatCurrency(discountAmount, b.currency)}</span></div>}
            {taxAmount > 0 && <div className="flex justify-between text-slate-500"><span>Tax ({b.taxPercent}%)</span><span>{formatCurrency(taxAmount, b.currency)}</span></div>}
            <div className="flex justify-between border-t border-slate-200 pt-2 text-base font-bold text-slate-900 dark:border-slate-700 dark:text-white">
              <span>Grand Total</span><span>{formatCurrency(grandTotal, b.currency)}</span>
            </div>
          </div>
        </div>
      </Section>

      {/* ── Bank Details ── */}
      <Section title="Bank Details">
        <label className="mb-3 flex cursor-pointer items-center gap-2">
          <input type="checkbox" checked={b.showBankDetails} onChange={(e) => set({ showBankDetails: e.target.checked })} className="accent-brand-600" />
          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Show bank details on bill</span>
        </label>
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="Bank Name" value={b.bankDetails?.bankName ?? ''} onChange={(e) => set({ bankDetails: { ...b.bankDetails, bankName: e.target.value } })} placeholder="State Bank of India" />
          <Input label="Account Holder" value={b.bankDetails?.accountName ?? ''} onChange={(e) => set({ bankDetails: { ...b.bankDetails, accountName: e.target.value } })} />
          <Input label="Account Number" value={b.bankDetails?.accountNumber ?? ''} onChange={(e) => set({ bankDetails: { ...b.bankDetails, accountNumber: e.target.value } })} />
          <Input label="IFSC Code" value={b.bankDetails?.ifscCode ?? ''} onChange={(e) => set({ bankDetails: { ...b.bankDetails, ifscCode: e.target.value } })} />
          <Input label="Branch" value={b.bankDetails?.branchName ?? ''} onChange={(e) => set({ bankDetails: { ...b.bankDetails, branchName: e.target.value } })} />
          <Input label="UPI ID" value={b.bankDetails?.upiId ?? ''} onChange={(e) => set({ bankDetails: { ...b.bankDetails, upiId: e.target.value } })} />
        </div>
      </Section>

      {/* ── Notes & Terms ── */}
      <Section title="Notes & Terms">
        <div className="grid gap-4 sm:grid-cols-2">
          <Textarea label="Notes" rows={3} value={b.notes} onChange={(e) => set({ notes: e.target.value })} placeholder="Thank you for your business." />
          <Textarea label="Terms & Conditions" rows={3} value={b.terms} onChange={(e) => set({ terms: e.target.value })} placeholder="Payment due within 15 days." />
        </div>
      </Section>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="mb-3 flex items-center gap-3 text-xs font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
        <span className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />
        {title}
        <span className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />
      </h3>
      {children}
    </div>
  )
}

// ─── RecordPaymentForm ───────────────────────────────────────────────────────

function RecordPaymentForm({ bill, onSave, onClose }: { bill: Bill; onSave: (p: Omit<BillPayment, 'id'>) => void; onClose: () => void }) {
  const [amount, setAmount] = useState(bill.balanceDue ?? bill.grandTotal)
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  const [mode, setMode] = useState('Bank Transfer')
  const [reference, setReference] = useState('')
  const [note, setNote] = useState('')

  const handleSave = () => {
    if (!amount || amount <= 0) { toast.error('Enter a valid amount'); return }
    onSave({ amount, date, mode, reference, note })
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800">
        <div className="flex justify-between text-sm">
          <span className="text-slate-500">Bill Total</span>
          <span className="font-semibold">{formatCurrency(bill.grandTotal, bill.currency)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-slate-500">Already Paid</span>
          <span className="font-semibold text-emerald-600">{formatCurrency(bill.amountPaid || 0, bill.currency)}</span>
        </div>
        <div className="flex justify-between border-t border-slate-200 pt-2 text-sm font-bold dark:border-slate-700">
          <span>Balance Due</span>
          <span className="text-brand-600">{formatCurrency(bill.balanceDue ?? bill.grandTotal, bill.currency)}</span>
        </div>
      </div>
      <Input label="Amount Received *" type="number" min={0} step="0.01" value={amount}
        onChange={(e) => setAmount(parseFloat(e.target.value) || 0)} />
      <Input label="Payment Date *" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
      <Select label="Payment Mode *" value={mode} onChange={(e) => setMode(e.target.value)}
        options={PAYMENT_MODES.map((m) => ({ value: m, label: m }))} />
      <Input label="Reference / Transaction ID" value={reference} onChange={(e) => setReference(e.target.value)} placeholder="UTR / Cheque No / Transaction ID" />
      <Input label="Note" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Optional note" />
      <div className="flex justify-end gap-2">
        <Button variant="secondary" onClick={onClose}>Cancel</Button>
        <Button onClick={handleSave}>Record Payment</Button>
      </div>
    </div>
  )
}

// ─── BillsPage ───────────────────────────────────────────────────────────────

export function BillsPage() {
  const user = useAuthStore((s) => s.user)
  const bills = useDataStore((s) => s.bills)
  const quotations = useDataStore((s) => s.quotations)
  const canWrite = canManageBills(user)

  const [page, setPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState('')
  const [builderOpen, setBuilderOpen] = useState(false)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [editing, setEditing] = useState<Bill | null>(null)
  const [draft, setDraft] = useState<Bill | null>(null)
  const [cancelConfirm, setCancelConfirm] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<Bill | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [saving, setSaving] = useState(false)
  const [paymentBill, setPaymentBill] = useState<Bill | null>(null)
  const [fromQuotationOpen, setFromQuotationOpen] = useState(false)
  const [companyProfile, setCompanyProfile] = useState<CompanyProfile | null>(null)
  const [profileLoaded, setProfileLoaded] = useState(false)
  const printRef = useRef<HTMLDivElement>(null)

  // Load company profile once
  useEffect(() => {
    if (!user?.tenantId || profileLoaded) return
    getCompanyProfile(user.tenantId)
      .then((p) => { setCompanyProfile(p); setProfileLoaded(true) })
      .catch(() => setProfileLoaded(true))
  }, [user?.tenantId, profileLoaded])

  const filtered = statusFilter ? bills.filter((b) => b.status === statusFilter) : bills
  const paged = paginate(filtered, page, PAGE_SIZE)
  const pages = totalPages(filtered.length, PAGE_SIZE)

  // Stats
  const totalBilled = bills.reduce((s, b) => s + b.grandTotal, 0)
  const totalPaid = bills.reduce((s, b) => s + (b.amountPaid || 0), 0)
  const totalDue = bills.reduce((s, b) => s + (b.balanceDue ?? b.grandTotal), 0)
  const overdueCnt = bills.filter((b) => b.status === 'overdue').length

  const getCompany = (): QuotationCompanyInfo =>
    companyProfile ? profileToCompanyForBills(companyProfile) : BLANK_COMPANY

  const getBank = (): QuotationBankDetails =>
    companyProfile?.bankDetails ?? BLANK_BANK

  // Open blank bill
  const openCreate = () => {
    if (!user) return
    const num = generateBillNumber(bills)
    const blank = makeBlankBill(num, user.uid, user.name, getCompany(), getBank(), companyProfile?.defaultCurrency ?? 'INR')
    setEditing(null)
    setDraft({ id: '', tenantId: '', createdAt: '', updatedAt: '', ...blank })
    setBuilderOpen(true)
  }

  // Convert quotation to bill
  const openFromQuotation = (q: Quotation) => {
    if (!user) return
    const num = generateBillNumber(bills)
    const data = makeBillFromQuotation(q, num, user.uid, user.name)
    setEditing(null)
    setDraft({ id: '', tenantId: '', createdAt: '', updatedAt: '', ...data })
    setFromQuotationOpen(false)
    setBuilderOpen(true)
  }

  const openEdit = (b: Bill) => {
    setEditing(b)
    setDraft({
      ...b,
      bankDetails: b.bankDetails ?? BLANK_BANK,
      payments: b.payments ?? [],
      client: { ...b.client, salutation: b.client.salutation ?? 'Mr.' },
    })
    setBuilderOpen(true)
  }

  const openPreview = (b: Bill) => {
    setDraft({ ...b, bankDetails: b.bankDetails ?? BLANK_BANK, payments: b.payments ?? [] })
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
    if (!draft.billNumber.trim()) { toast.error('Bill number is required'); return }
    if (!draft.company.name.trim()) { toast.error('Company name is required'); return }
    if (!draft.client.name.trim()) { toast.error('Client name is required'); return }
    if (!draft.items.length) { toast.error('Add at least one item'); return }

    setSaving(true)
    try {
      const { subtotal, discountAmount, taxAmount, grandTotal } = calcQuotationTotals(draft.items, draft.discountPercent, draft.taxPercent)
      const amountPaid = (draft.payments ?? []).reduce((s, p) => s + p.amount, 0)
      const balanceDue = Math.max(0, grandTotal - amountPaid)
      let status = draft.status
      if (balanceDue <= 0 && grandTotal > 0) status = 'paid'
      else if (amountPaid > 0) status = 'partial'

      const payload: Bill = { ...draft, subtotal, discountAmount, taxAmount, grandTotal, amountPaid, balanceDue, status }

      if (editing) {
        await updateBill(editing.id, user.tenantId, payload, user)
        toast.success('Bill updated')
      } else {
        await createBill(user.tenantId, payload, user)
        toast.success('Bill created')
      }
      doClose()
    } catch (e) {
      console.error('[handleSave]', e)
      toast.error(e instanceof Error ? e.message : 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget?.id?.trim() || !user?.tenantId) return
    setDeleting(true)
    try {
      await deleteBill(deleteTarget.id, user.tenantId, deleteTarget.billNumber, user)
      toast.success('Bill deleted')
      setDeleteTarget(null)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Delete failed')
    } finally {
      setDeleting(false)
    }
  }

  const handleRecordPayment = async (payment: Omit<BillPayment, 'id'>) => {
    if (!paymentBill?.id?.trim() || !user?.tenantId) return
    try {
      await recordPayment(paymentBill, user.tenantId, payment, user)
      toast.success('Payment recorded')
      setPaymentBill(null)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed')
    }
  }

  const handleDeletePayment = async (bill: Bill, paymentId: string) => {
    if (!user?.tenantId) return
    try {
      await deletePayment(bill, user.tenantId, paymentId, user)
      toast.success('Payment removed')
    } catch {
      toast.error('Failed')
    }
  }

  const handlePrint = () => {
    if (!printRef.current) return
    const pw = window.open('', '_blank', 'width=960,height=800')
    if (!pw) { toast.error('Pop-up blocked'); return }
    const css = Array.from(document.styleSheets).map((ss) => {
      try { return Array.from(ss.cssRules).map((r) => r.cssText).join('\n') } catch { return '' }
    }).join('\n')
    pw.document.write('<!DOCTYPE html><html><head><meta charset="utf-8"/><title>Bill ' + (draft?.billNumber ?? '') + '</title><style>' + css + '* { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; } @page { margin: 0; size: A4; } body { margin: 0; }</style></head><body>' + printRef.current.innerHTML + '</body></html>')
    pw.document.close()
    pw.focus()
    setTimeout(() => pw.print(), 600)
  }

  const currency = bills[0]?.currency ?? 'INR'

  return (
    <div className="space-y-6">

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: 'Total Billed',  value: formatCurrency(totalBilled, currency), color: 'bg-brand-500' },
          { label: 'Total Received', value: formatCurrency(totalPaid, currency),  color: 'bg-emerald-500' },
          { label: 'Balance Due',   value: formatCurrency(totalDue, currency),    color: 'bg-amber-500' },
          { label: 'Overdue Bills', value: String(overdueCnt),                    color: 'bg-red-500' },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border border-slate-200 bg-white p-4 shadow-card dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-500">{s.label}</p>
                <p className="mt-1 text-xl font-bold text-slate-900 dark:text-white">{s.value}</p>
              </div>
              <div className={'flex h-10 w-10 items-center justify-center rounded-xl ' + s.color}>
                <Receipt className="h-5 w-5 text-white" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Main list */}
      <Card>
        <CardHeader title="Bills / Invoices" subtitle={filtered.length + ' bill' + (filtered.length !== 1 ? 's' : '')}
          action={canWrite && (
            <div className="flex gap-2">
              <Button variant="secondary" onClick={() => setFromQuotationOpen(true)} disabled={!profileLoaded}>
                <FileText className="h-4 w-4" /> From Quotation
              </Button>
              <Button onClick={openCreate} disabled={!profileLoaded}>
                <Plus className="h-4 w-4" /> New bill
              </Button>
            </div>
          )} />

        {/* Filters */}
        <div className="mb-4 flex flex-wrap gap-2">
          {[{ value: '', label: 'All' }, ...BILL_STATUSES].map((s) => (
            <button key={s.value} onClick={() => { setStatusFilter(s.value); setPage(1) }}
              className={'rounded-full px-3 py-1 text-xs font-medium transition ' +
                (statusFilter === s.value ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300')}>
              {s.label}
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <EmptyState icon={Receipt} title="No bills yet"
            description={canWrite ? 'Create a bill manually or generate one from a quotation' : 'No bills available'} />
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-slate-200 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:border-slate-800">
                  <tr>
                    <th className="pb-3 pr-4">Bill No.</th>
                    <th className="pb-3 pr-4">Client</th>
                    <th className="pb-3 pr-4">Issue Date</th>
                    <th className="pb-3 pr-4">Due Date</th>
                    <th className="pb-3 pr-4">Total</th>
                    <th className="pb-3 pr-4">Paid</th>
                    <th className="pb-3 pr-4">Balance</th>
                    <th className="pb-3 pr-4">Status</th>
                    <th className="pb-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {paged.map((b) => (
                    <tr key={b.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                      <td className="py-3 pr-4">
                        <span className="font-mono font-semibold text-brand-600 dark:text-brand-400">{b.billNumber}</span>
                        {b.quotationNumber && <p className="text-xs text-slate-400">Ref: {b.quotationNumber}</p>}
                      </td>
                      <td className="py-3 pr-4">
                        <p className="font-medium text-slate-900 dark:text-white">
                          {b.client.salutation ? b.client.salutation + ' ' : ''}{b.client.name}
                        </p>
                        {b.client.company && <p className="text-xs text-slate-500">{b.client.company}</p>}
                      </td>
                      <td className="py-3 pr-4 text-slate-500">{formatDate(b.issueDate)}</td>
                      <td className={'py-3 pr-4 ' + (b.status === 'overdue' ? 'font-semibold text-red-600' : 'text-slate-500')}>{formatDate(b.dueDate)}</td>
                      <td className="py-3 pr-4 font-semibold text-slate-900 dark:text-white">{formatCurrency(b.grandTotal, b.currency)}</td>
                      <td className="py-3 pr-4 text-emerald-600">{formatCurrency(b.amountPaid || 0, b.currency)}</td>
                      <td className={'py-3 pr-4 font-semibold ' + ((b.balanceDue ?? 0) > 0 ? 'text-amber-600' : 'text-emerald-600')}>
                        {formatCurrency(b.balanceDue ?? 0, b.currency)}
                      </td>
                      <td className="py-3 pr-4"><Badge className={statusColor(b.status)}>{b.status}</Badge></td>
                      <td className="py-3">
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" onClick={() => openPreview(b)} title="Preview"><Eye className="h-4 w-4" /></Button>
                          {canWrite && (
                            <>
                              <Button variant="ghost" onClick={() => setPaymentBill(b)} title="Record payment"
                                className="text-emerald-600 hover:text-emerald-700">
                                <Receipt className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" onClick={() => openEdit(b)} title="Edit"><Pencil className="h-4 w-4" /></Button>
                              <Button variant="ghost" onClick={() => setDeleteTarget(b)} title="Delete"><Trash2 className="h-4 w-4 text-red-500" /></Button>
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
              {paged.map((b) => (
                <div key={b.id} className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-mono text-xs font-semibold text-brand-600 dark:text-brand-400">
                        {b.billNumber}
                      </p>
                      {b.quotationNumber && (
                        <p className="text-[10px] text-slate-400">Ref: {b.quotationNumber}</p>
                      )}
                      <h4 className="mt-1 font-semibold text-slate-900 dark:text-white">
                        {b.client.salutation ? b.client.salutation + ' ' : ''}{b.client.name}
                      </h4>
                      {b.client.company && (
                        <p className="text-xs text-slate-500">{b.client.company}</p>
                      )}
                    </div>
                    <Badge className={statusColor(b.status)}>{b.status}</Badge>
                  </div>
                  
                  <div className="mt-3 grid grid-cols-2 gap-2 border-t border-slate-100 pt-2 text-xs text-slate-500 dark:border-slate-800">
                    <div>
                      <span className="block text-[10px] uppercase text-slate-400">Issue Date</span>
                      <span className="font-medium text-slate-700 dark:text-slate-300">{formatDate(b.issueDate)}</span>
                    </div>
                    <div>
                      <span className="block text-[10px] uppercase text-slate-400">Due Date</span>
                      <span className={`font-semibold ${b.status === 'overdue' ? 'text-red-600' : 'text-slate-700 dark:text-slate-300'}`}>{formatDate(b.dueDate)}</span>
                    </div>
                  </div>

                  <div className="mt-3 grid grid-cols-3 gap-2 border-t border-slate-100 pt-2 text-xs dark:border-slate-800">
                    <div>
                      <span className="text-[10px] uppercase text-slate-400 block">Total</span>
                      <span className="font-semibold text-slate-900 dark:text-white">
                        {formatCurrency(b.grandTotal, b.currency)}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase text-slate-400 block">Paid</span>
                      <span className="font-semibold text-emerald-600">
                        {formatCurrency(b.amountPaid || 0, b.currency)}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase text-slate-400 block">Balance</span>
                      <span className={`font-semibold ${(b.balanceDue ?? 0) > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
                        {formatCurrency(b.balanceDue ?? 0, b.currency)}
                      </span>
                    </div>
                  </div>

                  <div className="mt-3 flex items-center justify-end border-t border-slate-100 pt-2 dark:border-slate-800 gap-1">
                    <Button variant="ghost" className="h-8 w-8 p-0" onClick={() => openPreview(b)} title="Preview">
                      <Eye className="h-4 w-4" />
                    </Button>
                    {canWrite && (
                      <>
                        <Button variant="ghost" className="h-8 w-8 p-0 text-emerald-600 hover:text-emerald-700" onClick={() => setPaymentBill(b)} title="Record payment">
                          <Receipt className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" className="h-8 w-8 p-0" onClick={() => openEdit(b)} title="Edit">
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" className="h-8 w-8 p-0" onClick={() => setDeleteTarget(b)} title="Delete">
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <Pagination page={page} totalPages={pages} onPageChange={setPage} />
          </>
        )}
      </Card>

      {/* ── From Quotation Modal ── */}
      <Modal open={fromQuotationOpen} onClose={() => setFromQuotationOpen(false)} title="Generate Bill from Quotation" size="lg">
        <div className="space-y-3">
          <p className="text-sm text-slate-500">Select a quotation to pre-fill the bill with client and item details.</p>
          {quotations.length === 0 ? (
            <EmptyState icon={FileText} title="No quotations found" description="Create a quotation first" />
          ) : (
            <div className="max-h-96 space-y-2 overflow-y-auto">
              {quotations.map((q) => (
                <button key={q.id} type="button" onClick={() => openFromQuotation(q)}
                  className="flex w-full items-center justify-between rounded-xl border border-slate-200 px-4 py-3 text-left transition hover:border-brand-400 hover:bg-brand-50 dark:border-slate-700 dark:hover:bg-brand-900/20">
                  <div>
                    <p className="font-mono font-semibold text-brand-600">{q.quotationNumber}</p>
                    <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
                      {q.client.salutation ? q.client.salutation + ' ' : ''}{q.client.name}
                      {q.client.company ? ' — ' + q.client.company : ''}
                    </p>
                    <p className="text-xs text-slate-400">{formatDate(q.issueDate)} · {q.status}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-slate-900 dark:text-white">{formatCurrency(q.grandTotal, q.currency)}</p>
                    <Badge className={q.status === 'accepted' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}>{q.status}</Badge>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </Modal>

      {/* ── Builder Modal ── */}
      <Modal open={builderOpen} onClose={handleCancel}
        title={editing ? 'Edit — ' + editing.billNumber : 'New Bill'} size="xl" disableBackdropClose>
        {draft && (
          <div className="space-y-6">
            <BillForm draft={draft} onChange={setDraft} />
            <div className="sticky bottom-0 flex justify-end gap-3 border-t border-slate-200 bg-white py-4 dark:border-slate-700 dark:bg-slate-900">
              <Button variant="secondary" onClick={handleCancel}>Cancel</Button>
              <Button variant="secondary" onClick={() => { setBuilderOpen(false); setPreviewOpen(true) }}>
                <Eye className="h-4 w-4" /> Preview
              </Button>
              <Button onClick={handleSave} loading={saving}>
                <Save className="h-4 w-4" /> {editing ? 'Update' : 'Save'} Bill
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* ── Preview Modal ── */}
      <Modal open={previewOpen} onClose={() => setPreviewOpen(false)}
        title={'Bill — ' + (draft?.billNumber ?? '')} size="xl">
        {draft && (
          <div className="space-y-4">
            {/* Payment history in preview */}
            {(draft.payments ?? []).length > 0 && (
              <Card>
                <CardHeader title="Payment History" subtitle={draft.payments.length + ' payment(s)'} />
                <div className="space-y-2">
                  {draft.payments.map((p) => (
                    <div key={p.id} className="flex items-center justify-between rounded-lg border border-slate-100 px-3 py-2 dark:border-slate-800">
                      <div>
                        <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{formatCurrency(p.amount, draft.currency)}</p>
                        <p className="text-xs text-slate-400">{formatDate(p.date)} · {p.mode}{p.reference ? ' · ' + p.reference : ''}</p>
                      </div>
                      {canWrite && (
                        <Button variant="ghost" onClick={() => handleDeletePayment(draft, p.id)}>
                          <Trash2 className="h-3.5 w-3.5 text-red-400" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </Card>
            )}
            <div className="flex flex-wrap justify-end gap-2">
              {canWrite && (
                <Button variant="secondary" onClick={() => { setPreviewOpen(false); setPaymentBill(draft) }}>
                  <Receipt className="h-4 w-4" /> Record Payment
                </Button>
              )}
              <Button variant="secondary" onClick={handlePrint}><Printer className="h-4 w-4" /> Print / PDF</Button>
              {canWrite && (
                <Button onClick={() => { setPreviewOpen(false); setBuilderOpen(true) }}>
                  <Pencil className="h-4 w-4" /> Edit
                </Button>
              )}
            </div>
            <div className="overflow-auto rounded-xl border border-slate-200 bg-white dark:border-slate-700">
              <BillPreview ref={printRef} bill={draft} />
            </div>
          </div>
        )}
      </Modal>

      {/* ── Record Payment Modal ── */}
      <Modal open={!!paymentBill} onClose={() => setPaymentBill(null)}
        title={'Record Payment — ' + (paymentBill?.billNumber ?? '')} size="sm">
        {paymentBill && (
          <RecordPaymentForm bill={paymentBill} onSave={handleRecordPayment} onClose={() => setPaymentBill(null)} />
        )}
      </Modal>

      {/* Cancel confirm */}
      <ConfirmDialog open={cancelConfirm} title="Discard changes?"
        message="You have unsaved changes. Close without saving?"
        confirmLabel="Discard" onConfirm={doClose} onCancel={() => setCancelConfirm(false)} />

      {/* Delete confirm */}
      <ConfirmDialog open={!!deleteTarget} title="Delete bill"
        message={'Delete "' + (deleteTarget?.billNumber ?? '') + '"? This cannot be undone.'}
        confirmLabel="Delete" loading={deleting}
        onConfirm={handleDelete} onCancel={() => { if (!deleting) setDeleteTarget(null) }} />

      {/* Floating Action Button for Mobile */}
      {canWrite && (
        <button
          onClick={openCreate}
          disabled={!profileLoaded}
          aria-label="New bill"
          className="fixed bottom-20 right-4 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-brand-600 text-white shadow-lg transition-transform active:scale-95 hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 dark:bg-brand-500 dark:hover:bg-brand-600 lg:hidden"
        >
          <Plus className="h-6 w-6" />
        </button>
      )}
    </div>
  )
}
