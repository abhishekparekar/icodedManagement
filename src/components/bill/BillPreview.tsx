import { forwardRef } from 'react'
import type { Bill } from '@/types'
import { calcQuotationTotals, formatCurrency, formatDate } from '@/lib/utils'

interface Props { bill: Bill }

export const BillPreview = forwardRef<HTMLDivElement, Props>(({ bill }, ref) => {
  const accent = bill.accentColor || '#4f46e5'
  const { subtotal, discountAmount, taxAmount, grandTotal } = calcQuotationTotals(
    bill.items,
    bill.discountPercent,
    bill.taxPercent,
  )
  const clientName = (bill.client.salutation ? bill.client.salutation + ' ' : '') + bill.client.name

  return (
    <div ref={ref} className="w-full bg-white text-slate-800" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>

      {/* ── Header ── */}
      <div className="relative overflow-hidden px-12 pb-8 pt-10"
        style={{ background: `linear-gradient(135deg, ${accent}18 0%, ${accent}06 100%)` }}>
        <div className="absolute -right-10 -top-10 h-48 w-48 rounded-full opacity-10" style={{ background: accent }} />
        <div className="relative flex items-start justify-between gap-6">

          {/* Company */}
          <div className="flex-1">
            {bill.company.logoUrl && (
              <img src={bill.company.logoUrl} alt="logo" className="mb-3 h-12 object-contain"
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
            )}
            <h1 className="text-xl font-bold" style={{ color: accent }}>{bill.company.name}</h1>
            <div className="mt-1 space-y-0.5 text-xs text-slate-500">
              {bill.company.address && <p>{bill.company.address}</p>}
              {bill.company.city && <p>{bill.company.city}</p>}
              {bill.company.phone && <p>{bill.company.phone}</p>}
              {bill.company.email && <p>{bill.company.email}</p>}
              {bill.company.website && <p>{bill.company.website}</p>}
              {bill.company.taxId && <p>GSTIN / Tax ID: {bill.company.taxId}</p>}
            </div>
          </div>

          {/* Invoice badge */}
          <div className="shrink-0 text-right">
            <div className="inline-block rounded-2xl px-5 py-2.5 text-white" style={{ background: accent }}>
              <p className="text-xs font-bold uppercase tracking-widest opacity-80">Tax Invoice</p>
              <p className="text-xl font-black">{bill.billNumber}</p>
            </div>
            <div className="mt-3 space-y-1 text-xs text-slate-500">
              <p><span className="font-semibold text-slate-700">Issue Date:</span> {formatDate(bill.issueDate)}</p>
              <p><span className="font-semibold text-slate-700">Due Date:</span>
                <span className={bill.status === 'overdue' ? ' font-bold text-red-600' : ''}> {formatDate(bill.dueDate)}</span>
              </p>
              {bill.quotationNumber && (
                <p><span className="font-semibold text-slate-700">Ref Quotation:</span> {bill.quotationNumber}</p>
              )}
              <div className="mt-1">
                <span className="inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide"
                  style={{ background: accent + '20', color: accent }}>
                  {bill.status.toUpperCase()}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Bill To ── */}
      <div className="px-12 py-5">
        <div className="flex gap-8">
          <div className="flex-1 rounded-xl p-4" style={{ background: accent + '08', borderLeft: `4px solid ${accent}` }}>
            <p className="mb-1.5 text-xs font-bold uppercase tracking-widest" style={{ color: accent }}>Bill To</p>
            <p className="font-bold text-slate-900">{clientName}</p>
            {bill.client.company && <p className="text-sm font-medium text-slate-700">{bill.client.company}</p>}
            {bill.client.address && <p className="text-xs text-slate-500">{bill.client.address}</p>}
            {bill.client.city && <p className="text-xs text-slate-500">{bill.client.city}</p>}
            {bill.client.phone && <p className="text-xs text-slate-500">{bill.client.phone}</p>}
            {bill.client.email && <p className="text-xs text-slate-500">{bill.client.email}</p>}
          </div>

          {/* Payment summary box */}
          <div className="w-52 shrink-0 rounded-xl p-4 text-xs" style={{ background: accent + '08', border: `1px solid ${accent}30` }}>
            <p className="mb-2 font-bold uppercase tracking-widest" style={{ color: accent }}>Payment Summary</p>
            <div className="space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-500">Total</span>
                <span className="font-semibold">{formatCurrency(bill.grandTotal, bill.currency)}</span>
              </div>
              <div className="flex justify-between text-emerald-600">
                <span>Paid</span>
                <span className="font-semibold">{formatCurrency(bill.amountPaid || 0, bill.currency)}</span>
              </div>
              <div className="flex justify-between border-t pt-1.5 font-bold" style={{ borderColor: accent + '40', color: accent }}>
                <span>Balance Due</span>
                <span>{formatCurrency(bill.balanceDue ?? bill.grandTotal, bill.currency)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Line Items ── */}
      <div className="px-12">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-white" style={{ background: accent }}>
              <th className="rounded-tl-lg px-4 py-2.5 text-left text-xs font-semibold">#</th>
              <th className="px-4 py-2.5 text-left text-xs font-semibold">Description</th>
              <th className="px-4 py-2.5 text-center text-xs font-semibold">Qty</th>
              <th className="px-4 py-2.5 text-right text-xs font-semibold">Rate</th>
              <th className="rounded-tr-lg px-4 py-2.5 text-right text-xs font-semibold">Amount</th>
            </tr>
          </thead>
          <tbody>
            {bill.items.map((item, i) => {
              const lineTotal = item.quantity * item.unitPrice
              return (
                <tr key={item.id} className={i % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                  <td className="px-4 py-2.5 text-xs text-slate-400">{i + 1}</td>
                  <td className="px-4 py-2.5 text-sm font-medium text-slate-800">{item.description}</td>
                  <td className="px-4 py-2.5 text-center text-sm">{item.quantity}</td>
                  <td className="px-4 py-2.5 text-right text-sm">{formatCurrency(item.unitPrice, bill.currency)}</td>
                  <td className="px-4 py-2.5 text-right text-sm font-semibold">{formatCurrency(lineTotal, bill.currency)}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* ── Totals ── */}
      <div className="flex justify-end px-12 pt-4">
        <div className="w-64 space-y-1.5 text-sm">
          <div className="flex justify-between text-slate-500">
            <span>Subtotal</span><span>{formatCurrency(subtotal, bill.currency)}</span>
          </div>
          {discountAmount > 0 && (
            <div className="flex justify-between text-emerald-600">
              <span>Discount ({bill.discountPercent}%)</span>
              <span>-{formatCurrency(discountAmount, bill.currency)}</span>
            </div>
          )}
          {taxAmount > 0 && (
            <div className="flex justify-between text-slate-500">
              <span>Tax / GST ({bill.taxPercent}%)</span>
              <span>{formatCurrency(taxAmount, bill.currency)}</span>
            </div>
          )}
          <div className="flex justify-between rounded-xl px-4 py-2.5 text-base font-bold text-white"
            style={{ background: accent }}>
            <span>Grand Total</span><span>{formatCurrency(grandTotal, bill.currency)}</span>
          </div>
          {(bill.amountPaid || 0) > 0 && (
            <>
              <div className="flex justify-between text-emerald-600">
                <span>Amount Paid</span><span>{formatCurrency(bill.amountPaid, bill.currency)}</span>
              </div>
              <div className="flex justify-between rounded-xl border-2 px-4 py-2 text-sm font-bold"
                style={{ borderColor: accent, color: accent }}>
                <span>Balance Due</span>
                <span>{formatCurrency(bill.balanceDue ?? 0, bill.currency)}</span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── Payment History ── */}
      {(bill.payments ?? []).length > 0 && (
        <div className="mx-12 mt-6 rounded-xl border p-4" style={{ borderColor: accent + '30', background: accent + '06' }}>
          <p className="mb-2 text-xs font-bold uppercase tracking-widest" style={{ color: accent }}>Payment History</p>
          <table className="w-full text-xs">
            <thead>
              <tr className="text-slate-400">
                <th className="pb-1 text-left font-semibold">Date</th>
                <th className="pb-1 text-left font-semibold">Mode</th>
                <th className="pb-1 text-left font-semibold">Reference</th>
                <th className="pb-1 text-right font-semibold">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(bill.payments ?? []).map((p) => (
                <tr key={p.id}>
                  <td className="py-1">{formatDate(p.date)}</td>
                  <td className="py-1">{p.mode}</td>
                  <td className="py-1 text-slate-400">{p.reference || '—'}</td>
                  <td className="py-1 text-right font-semibold text-emerald-600">
                    +{formatCurrency(p.amount, bill.currency)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Bank Details ── */}
      {bill.showBankDetails && bill.bankDetails?.bankName && (
        <div className="mx-12 mt-5 rounded-xl border p-4" style={{ borderColor: accent + '40', background: accent + '06' }}>
          <p className="mb-2 text-xs font-bold uppercase tracking-widest" style={{ color: accent }}>Bank / Payment Details</p>
          <div className="grid grid-cols-2 gap-x-8 gap-y-1 text-xs">
            {bill.bankDetails.bankName && <><span className="font-semibold text-slate-600">Bank Name</span><span className="text-slate-700">{bill.bankDetails.bankName}</span></>}
            {bill.bankDetails.accountName && <><span className="font-semibold text-slate-600">Account Name</span><span className="text-slate-700">{bill.bankDetails.accountName}</span></>}
            {bill.bankDetails.accountNumber && <><span className="font-semibold text-slate-600">Account Number</span><span className="font-mono text-slate-700">{bill.bankDetails.accountNumber}</span></>}
            {bill.bankDetails.ifscCode && <><span className="font-semibold text-slate-600">IFSC Code</span><span className="font-mono text-slate-700">{bill.bankDetails.ifscCode}</span></>}
            {bill.bankDetails.branchName && <><span className="font-semibold text-slate-600">Branch</span><span className="text-slate-700">{bill.bankDetails.branchName}</span></>}
            {bill.bankDetails.upiId && <><span className="font-semibold text-slate-600">UPI ID</span><span className="text-slate-700">{bill.bankDetails.upiId}</span></>}
          </div>
        </div>
      )}

      {/* ── Notes & Terms ── */}
      {(bill.notes || bill.terms) && (
        <div className="mt-5 grid gap-4 px-12 pb-10 sm:grid-cols-2">
          {bill.notes && (
            <div>
              <p className="mb-1 text-xs font-bold uppercase tracking-widest" style={{ color: accent }}>Notes</p>
              <p className="whitespace-pre-wrap text-xs text-slate-500">{bill.notes}</p>
            </div>
          )}
          {bill.terms && (
            <div>
              <p className="mb-1 text-xs font-bold uppercase tracking-widest" style={{ color: accent }}>Terms & Conditions</p>
              <p className="whitespace-pre-wrap text-xs text-slate-500">{bill.terms}</p>
            </div>
          )}
        </div>
      )}

      {/* ── Footer ── */}
      <div className="h-1.5 w-full" style={{ background: accent }} />
    </div>
  )
})
BillPreview.displayName = 'BillPreview'
