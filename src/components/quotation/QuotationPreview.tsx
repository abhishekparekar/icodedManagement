import { forwardRef } from 'react'
import type { Quotation } from '@/types'
import { TERMS_CLAUSES } from '@/lib/termsAndConditions'
import { calcQuotationTotals, formatCurrency, formatDate } from '@/lib/utils'

interface Props { quotation: Quotation }

export const QuotationPreview = forwardRef<HTMLDivElement, Props>(({ quotation }, ref) => {
  const { items, currency, theme, discountPercent, taxPercent } = quotation
  const { subtotal, discountAmount, taxAmount, grandTotal } = calcQuotationTotals(items, discountPercent, taxPercent)
  const t = theme ?? 'modern'
  const lp: LayoutProps = { q: quotation, subtotal, discountAmount, taxAmount, grandTotal, currency }

  return (
    <div 
      ref={ref} 
      className="quotation-print-container bg-white p-6 sm:p-12 w-full min-h-[1056px] flex flex-col justify-between shadow-lg rounded-2xl"
      style={{ color: '#000000', backgroundColor: '#ffffff' }}
    >
      <style>{`
        .quotation-print-container {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          color: #000000 !important;
          background-color: #ffffff !important;
        }

        /* Ensure Slate grey utilities render as solid visible borders and text */
        .quotation-print-container .text-slate-400, 
        .quotation-print-container .text-slate-500 {
          color: #64748b !important;
        }
        .quotation-print-container .text-slate-600, 
        .quotation-print-container .text-slate-700, 
        .quotation-print-container .text-slate-800 {
          color: #1e293b !important;
        }
        .quotation-print-container .text-slate-900,
        .quotation-print-container .text-slate-950 {
          color: #0f172a !important;
        }
        .quotation-print-container .border-slate-100, 
        .quotation-print-container .border-slate-200, 
        .quotation-print-container .border-slate-300 {
          border-color: #cbd5e1 !important;
        }
        .quotation-print-container .bg-slate-50, 
        .quotation-print-container .bg-slate-50\\/50 {
          background-color: #f8fafc !important;
        }
        
        @media print {
          body {
            background-color: #ffffff !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .quotation-print-container {
            padding: 15mm !important;
            box-shadow: none !important;
            border: none !important;
            min-height: 0 !important;
            width: 100% !important;
          }
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }
      `}</style>

      <div className="space-y-8 flex-grow">
        {t === 'modern'  && <ModernLayout  {...lp} />}
        {t === 'classic' && <ClassicLayout {...lp} />}
        {t === 'minimal' && <MinimalLayout {...lp} />}
        {t === 'bold'    && <BoldLayout    {...lp} />}
      </div>
    </div>
  )
})
QuotationPreview.displayName = 'QuotationPreview'

interface LayoutProps {
  q: Quotation
  subtotal: number
  discountAmount: number
  taxAmount: number
  grandTotal: number
  currency: string
}

// ─── Shared Premium Sub-components ──────────────────────────────────────────

function TimelineBar({ days, accent }: { days: number; accent: string }) {
  if (!days || days <= 0) return null
  const weeks = Math.ceil(days / 5)
  return (
    <div className="flex items-center gap-4 rounded-xl px-5 py-3 text-sm bg-slate-50 border border-slate-200">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white"
        style={{ background: accent }}>
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
      </div>
      <div>
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">
          Estimated Project Timeline
        </p>
        <p className="font-bold text-slate-900">
          {days} working day{days !== 1 ? 's' : ''}
          <span className="ml-2 text-xs font-normal text-slate-500">
            (approx. {weeks} week{weeks !== 1 ? 's' : ''})
          </span>
        </p>
      </div>
    </div>
  )
}

function ClientSection({ q, accent }: { q: Quotation; accent: string }) {
  return (
    <div className="space-y-3">
      <h3 className="text-xs font-black uppercase tracking-wider text-slate-950" style={{ color: accent }}>Prepared For</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 border border-slate-200 rounded-xl p-5 text-slate-950">
        <div>
          <p className="text-base font-bold text-slate-950">
            <span>{q.client.salutation ? q.client.salutation + ' ' : ''}{q.client.name}</span>
          </p>
          {q.client.company && (
            <p className="font-semibold text-slate-800 text-sm mt-0.5">
              <span>{q.client.company}</span>
            </p>
          )}
        </div>
        <div className="space-y-1 text-xs font-medium text-slate-900">
          {q.client.address && <p><span>{q.client.address}</span></p>}
          {q.client.city && <p><span>{q.client.city}</span></p>}
          <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1 font-semibold text-slate-950">
            {q.client.phone && <span>Phone: {q.client.phone}</span>}
            {q.client.email && <span>Email: {q.client.email}</span>}
          </div>
        </div>
      </div>
    </div>
  )
}

function OverviewSection({ q, accent }: { q: Quotation; accent: string }) {
  if (!q.notes?.trim()) return null
  return (
    <div className="space-y-2 border-l-4 pl-4 border-slate-950 py-1" style={{ borderLeftColor: accent }}>
      <h3 className="text-xs font-black uppercase tracking-wider text-slate-950" style={{ color: accent }}>Overview</h3>
      <p className="whitespace-pre-wrap text-sm text-slate-800 leading-relaxed font-normal">
        <span>{q.notes}</span>
      </p>
    </div>
  )
}

function ItemsTable({ q, currency: _currency, accent, theme }: { q: Quotation; currency: string; accent: string; theme: string }) {
  const isClassic = theme === 'classic'
  const isBold = theme === 'bold'
  const isMinimal = theme === 'minimal'

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 shadow-sm">
      <table className="w-full text-sm text-slate-900 border-collapse">
        <thead>
          <tr 
            className="text-slate-900 border-b-2 border-slate-950 font-bold"
            style={{ 
              background: isBold ? accent : (isClassic ? 'transparent' : 'rgba(15, 23, 42, 0.03)'),
              color: isBold ? '#ffffff' : '#000000',
              borderBottomColor: isMinimal ? '#e2e8f0' : '#000000'
            }}
          >
            <th className="px-4 py-3 text-center font-bold w-16" style={{ color: isBold ? '#ffffff' : '#000000' }}>Sr. No.</th>
            <th className="px-4 py-3 text-left font-bold w-64" style={{ color: isBold ? '#ffffff' : '#000000' }}>Module</th>
            <th className="px-4 py-3 text-left font-bold" style={{ color: isBold ? '#ffffff' : '#000000' }}>Description</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200">
          {q.items.map((item, i) => (
            <tr key={item.id} className={!isMinimal && i % 2 !== 0 ? 'bg-slate-50/50' : 'bg-white'}>
              <td className="px-4 py-3 text-center font-mono text-slate-500 font-medium">{i + 1}</td>
              <td className="px-4 py-3 font-bold text-slate-900">{item.moduleName || `Module ${i + 1}`}</td>
              <td className="px-4 py-3 font-semibold text-slate-700 whitespace-pre-wrap">{item.description}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function TotalsBlock({ subtotal, discountAmount, taxAmount, grandTotal, currency, q, accent }: LayoutProps & { accent: string }) {
  return (
    <div className="w-80 ml-auto space-y-2.5 text-sm text-slate-900 border-t-2 border-slate-950 pt-4" style={{ borderTopColor: accent }}>
      <div className="flex justify-between text-slate-600 font-medium">
        <span>Subtotal</span>
        <span className="font-mono">{formatCurrency(subtotal, currency)}</span>
      </div>
      {discountAmount > 0 && (
        <div className="flex justify-between text-emerald-700 font-semibold">
          <span>Discount ({q.discountPercent}%)</span>
          <span className="font-mono">-{formatCurrency(discountAmount, currency)}</span>
        </div>
      )}
      {taxAmount > 0 && (
        <div className="flex justify-between text-slate-600 font-medium">
          <span>Tax / GST ({q.taxPercent}%)</span>
          <span className="font-mono">{formatCurrency(taxAmount, currency)}</span>
        </div>
      )}
      <div className="flex justify-between border-t border-slate-200 pt-2.5 text-base font-black" style={{ color: accent }}>
        <span>Grand Total</span>
        <span className="font-mono text-lg">{formatCurrency(grandTotal, currency)}</span>
      </div>
    </div>
  )
}

function AboutCompanySection({ q, accent }: { q: Quotation; accent: string }) {
  if (!q.company.about?.trim()) return null
  return (
    <div className="space-y-2 bg-slate-50 border border-slate-200 rounded-xl p-5">
      <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 border-b pb-1 border-slate-200" style={{ color: accent }}>
        <span>About {q.company.name}</span>
      </h3>
      <p className="text-xs text-slate-800 leading-relaxed font-normal">
        <span>{q.company.about}</span>
      </p>
    </div>
  )
}

function BankDetailsSection({ q, accent }: { q: Quotation; accent: string }) {
  const hasBankDetails = q.showBankDetails && q.bankDetails &&
    (q.bankDetails.bankName || q.bankDetails.accountNumber)

  if (!hasBankDetails) return null

  return (
    <div className="space-y-3 bg-slate-50 border border-slate-200 rounded-xl p-5">
      <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 border-b pb-1 border-slate-200" style={{ color: accent }}>
        Bank &amp; Payment Details
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2.5 text-xs">
        {q.bankDetails.bankName && (
          <div className="flex justify-between sm:justify-start sm:gap-4 border-b border-slate-100 pb-1 sm:border-0 sm:pb-0">
            <span className="font-bold text-slate-500 w-32 shrink-0">Bank Name</span>
            <span className="text-slate-900 font-semibold">{q.bankDetails.bankName}</span>
          </div>
        )}
        {q.bankDetails.accountName && (
          <div className="flex justify-between sm:justify-start sm:gap-4 border-b border-slate-100 pb-1 sm:border-0 sm:pb-0">
            <span className="font-bold text-slate-500 w-32 shrink-0">Account Name</span>
            <span className="text-slate-900 font-semibold">{q.bankDetails.accountName}</span>
          </div>
        )}
        {q.bankDetails.accountNumber && (
          <div className="flex justify-between sm:justify-start sm:gap-4 border-b border-slate-100 pb-1 sm:border-0 sm:pb-0">
            <span className="font-bold text-slate-500 w-32 shrink-0">Account Number</span>
            <span className="font-mono text-slate-900 font-semibold">{q.bankDetails.accountNumber}</span>
          </div>
        )}
        {q.bankDetails.ifscCode && (
          <div className="flex justify-between sm:justify-start sm:gap-4 border-b border-slate-100 pb-1 sm:border-0 sm:pb-0">
            <span className="font-bold text-slate-500 w-32 shrink-0">IFSC Code</span>
            <span className="font-mono text-slate-900 font-semibold">{q.bankDetails.ifscCode}</span>
          </div>
        )}
        {q.bankDetails.branchName && (
          <div className="flex justify-between sm:justify-start sm:gap-4 border-b border-slate-100 pb-1 sm:border-0 sm:pb-0">
            <span className="font-bold text-slate-500 w-32 shrink-0">Branch</span>
            <span className="text-slate-900 font-semibold">{q.bankDetails.branchName}</span>
          </div>
        )}
        {q.bankDetails.upiId && (
          <div className="flex justify-between sm:justify-start sm:gap-4 border-b border-slate-100 pb-1 sm:border-0 sm:pb-0">
            <span className="font-bold text-slate-500 w-32 shrink-0">UPI ID</span>
            <span className="text-slate-900 font-semibold">{q.bankDetails.upiId}</span>
          </div>
        )}
      </div>
    </div>
  )
}

function TermsSection({ q, accent }: { q: Quotation; accent: string }) {
  const selected = TERMS_CLAUSES.filter((c) => q.selectedTerms?.includes(c.id))
  const hasCustom = q.customTerms?.trim()

  if (selected.length === 0 && !hasCustom) return null

  const byCategory: Record<string, typeof selected> = {}
  selected.forEach((c) => {
    if (!byCategory[c.category]) byCategory[c.category] = []
    byCategory[c.category].push(c)
  })

  let globalIndex = 0

  return (
    <div className="space-y-4">
      <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 border-b pb-1 border-slate-200" style={{ color: accent }}>
        Terms &amp; Conditions
      </h3>
      <div className="space-y-4">
        {Object.entries(byCategory).map(([cat, clauses]) => (
          <div key={cat} className="space-y-2">
            <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">{cat}</p>
            <ol className="space-y-2">
              {clauses.map((clause) => {
                globalIndex++
                return (
                  <li key={clause.id} className="flex gap-2 text-xs text-slate-800">
                    <span className="shrink-0 font-bold text-slate-500 w-4">{globalIndex}.</span>
                    <span>
                      <span className="font-bold text-slate-900">{clause.title}: </span>
                      {clause.text}
                    </span>
                  </li>
                )
              })}
            </ol>
          </div>
        ))}
        {hasCustom && (
          <div className="space-y-1">
            <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Additional Terms</p>
            <p className="whitespace-pre-wrap text-xs leading-relaxed text-slate-700">{q.customTerms}</p>
          </div>
        )}
      </div>
    </div>
  )
}

function QuotationFooter({ q }: { q: Quotation }) {
  return (
    <div className="border-t-2 border-slate-950 pt-6 mt-12 text-slate-900 print-border-black">
      <div className="flex flex-wrap items-center justify-between gap-4 text-xs font-bold">
        {q.company.phone && (
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 font-medium">Contact:</span>
            <span>{q.company.phone}</span>
          </div>
        )}
        {q.company.website && (
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 font-medium">Website:</span>
            <span>{q.company.website}</span>
          </div>
        )}
        {q.company.instagram && (
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 font-medium">Instagram:</span>
            <span>{q.company.instagram}</span>
          </div>
        )}
      </div>
      <p className="mt-4 text-[10px] text-center text-slate-400 font-semibold">
        Thank you for your business! Generated by {q.company.name}.
      </p>
    </div>
  )
}

// ─── MODERN LAYOUT ──────────────────────────────────────────────────────────

function ModernLayout({ q, subtotal, discountAmount, taxAmount, grandTotal, currency }: LayoutProps) {
  const accent = q.accentColor
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-6 pb-6 border-b border-slate-200">
        <div className="flex items-start gap-4">
          {q.company.logoUrl && (
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-white p-2 border border-slate-200 shadow-sm">
              <img src={q.company.logoUrl} alt="logo" className="max-h-full max-w-full object-contain logo-img-el" />
            </div>
          )}
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900" style={{ color: accent }}>
              <span>{q.company.name}</span>
            </h1>
            <div className="mt-1 space-y-0.5 text-xs text-slate-700 font-medium leading-relaxed">
              {q.company.address && <p><span>{q.company.address}</span></p>}
              {q.company.city && <p><span>{q.company.city}</span></p>}
              <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-1 text-slate-900">
                {q.company.phone && <span>Phone: {q.company.phone}</span>}
                {q.company.email && <span>Email: {q.company.email}</span>}
                {q.company.website && <span>Web: {q.company.website}</span>}
              </div>
              {q.company.taxId && <p className="font-semibold text-slate-900 mt-1"><span>GST / Tax ID: </span><span>{q.company.taxId}</span></p>}
            </div>
          </div>
        </div>
        <div className="text-right whitespace-nowrap">
          <div className="inline-block rounded-xl border border-slate-200 bg-slate-50 px-6 py-4 shadow-sm text-left">
            <p className="text-[10px] font-black uppercase tracking-wider" style={{ color: accent }}>Quotation</p>
            <p className="text-xl font-black tracking-tight text-slate-900 mt-0.5">
              <span>{q.quotationNumber}</span>
            </p>
            <div className="mt-3 space-y-1 text-xs text-slate-800 font-semibold">
              <p><span className="text-slate-500 font-medium">Issue Date: </span><span>{formatDate(q.issueDate)}</span></p>
              <p><span className="text-slate-500 font-medium">Valid Until: </span><span>{formatDate(q.validUntil)}</span></p>
            </div>
          </div>
        </div>
      </div>

      {/* Client Info */}
      <ClientSection q={q} accent={accent} />

      {/* Overview */}
      <OverviewSection q={q} accent={accent} />

      {/* Timeline */}
      {q.projectTimelineDays > 0 && (
        <TimelineBar days={q.projectTimelineDays} accent={accent} />
      )}

      {/* Line Items */}
      <div className="space-y-4">
        <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 border-b pb-1 border-slate-200" style={{ color: accent }}>Line Items</h3>
        <ItemsTable q={q} currency={currency} accent={accent} theme="modern" />
        <TotalsBlock subtotal={subtotal} discountAmount={discountAmount} taxAmount={taxAmount} grandTotal={grandTotal} currency={currency} q={q} accent={accent} />
      </div>

      {/* About Company */}
      <AboutCompanySection q={q} accent={accent} />

      {/* Bank Details */}
      <BankDetailsSection q={q} accent={accent} />

      {/* Terms & Conditions */}
      <TermsSection q={q} accent={accent} />

      {/* Footer */}
      <QuotationFooter q={q} />
    </div>
  )
}

// ─── CLASSIC LAYOUT ─────────────────────────────────────────────────────────

function ClassicLayout({ q, subtotal, discountAmount, taxAmount, grandTotal, currency }: LayoutProps) {
  const accent = q.accentColor
  return (
    <div className="space-y-8 font-serif" style={{ fontFamily: 'Georgia, Cambria, "Times New Roman", Times, serif' }}>
      {/* Header */}
      <div className="flex items-start justify-between pb-6 border-b-2" style={{ borderColor: accent }}>
        <div className="flex items-start gap-4">
          {q.company.logoUrl && (
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-white p-2 border border-slate-200">
              <img src={q.company.logoUrl} alt="logo" className="max-h-full max-w-full object-contain logo-img-el" />
            </div>
          )}
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900" style={{ color: accent }}>{q.company.name}</h1>
            <div className="mt-1 space-y-0.5 text-xs text-slate-700 font-medium leading-relaxed font-serif">
              {q.company.address && <p>{q.company.address}</p>}
              {q.company.city && <p>{q.company.city}</p>}
              <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-1 text-slate-900 font-serif">
                {q.company.phone && <span>Phone: {q.company.phone}</span>}
                {q.company.email && <span>Email: {q.company.email}</span>}
                {q.company.website && <span>Web: {q.company.website}</span>}
              </div>
              {q.company.taxId && <p className="font-semibold text-slate-900 mt-1 font-serif">GST / Tax ID: {q.company.taxId}</p>}
            </div>
          </div>
        </div>
        <div className="text-right font-serif whitespace-nowrap">
          <h2 className="text-3xl font-black uppercase tracking-widest" style={{ color: accent }}>Quotation</h2>
          <p className="text-xl font-bold text-slate-900 mt-1">{q.quotationNumber}</p>
          <div className="mt-3 space-y-1 text-xs text-slate-800 font-semibold font-serif">
            <p>Issue Date: {formatDate(q.issueDate)}</p>
            <p>Valid Until: {formatDate(q.validUntil)}</p>
          </div>
        </div>
      </div>

      {/* Client Info */}
      <ClientSection q={q} accent={accent} />

      {/* Overview */}
      <OverviewSection q={q} accent={accent} />

      {/* Timeline */}
      {q.projectTimelineDays > 0 && (
        <TimelineBar days={q.projectTimelineDays} accent={accent} />
      )}

      {/* Line Items */}
      <div className="space-y-4 font-serif">
        <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 border-b pb-1 border-slate-200" style={{ color: accent }}>Line Items</h3>
        <ItemsTable q={q} currency={currency} accent={accent} theme="classic" />
        <TotalsBlock subtotal={subtotal} discountAmount={discountAmount} taxAmount={taxAmount} grandTotal={grandTotal} currency={currency} q={q} accent={accent} />
      </div>

      {/* About Company */}
      <AboutCompanySection q={q} accent={accent} />

      {/* Bank Details */}
      <BankDetailsSection q={q} accent={accent} />

      {/* Terms & Conditions */}
      <TermsSection q={q} accent={accent} />

      {/* Footer */}
      <QuotationFooter q={q} />
    </div>
  )
}

// ─── MINIMAL LAYOUT ─────────────────────────────────────────────────────────

function MinimalLayout({ q, subtotal, discountAmount, taxAmount, grandTotal, currency }: LayoutProps) {
  const accent = q.accentColor
  return (
    <div className="space-y-8" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
      {/* Header */}
      <div className="flex items-start justify-between pb-6 border-b border-slate-200">
        <div className="flex items-start gap-4">
          {q.company.logoUrl && (
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-white p-1 border border-slate-100">
              <img src={q.company.logoUrl} alt="logo" className="max-h-full max-w-full object-contain logo-img-el" />
            </div>
          )}
          <div>
            <h1 className="text-lg font-bold text-slate-900">{q.company.name}</h1>
            <div className="mt-1 space-y-0.5 text-xs text-slate-600 font-medium">
              {q.company.address && <p>{q.company.address}</p>}
              {q.company.city && <p>{q.company.city}</p>}
              <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-1 text-slate-700">
                {q.company.phone && <span>Phone: {q.company.phone}</span>}
                {q.company.email && <span>Email: {q.company.email}</span>}
                {q.company.website && <span>Web: {q.company.website}</span>}
              </div>
              {q.company.taxId && <p className="font-semibold text-slate-800 mt-1">GST / Tax ID: {q.company.taxId}</p>}
            </div>
          </div>
        </div>
        <div className="text-right whitespace-nowrap">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Quotation</p>
          <p className="text-2xl font-light text-slate-900 mt-1">{q.quotationNumber}</p>
          <div className="mt-2 space-y-0.5 text-xs text-slate-500 whitespace-nowrap">
            <p>Date: {formatDate(q.issueDate)}</p>
            <p>Valid until {formatDate(q.validUntil)}</p>
          </div>
        </div>
      </div>

      {/* Client Info */}
      <ClientSection q={q} accent={accent} />

      {/* Overview */}
      <OverviewSection q={q} accent={accent} />

      {/* Timeline */}
      {q.projectTimelineDays > 0 && (
        <TimelineBar days={q.projectTimelineDays} accent={accent} />
      )}

      {/* Line Items */}
      <div className="space-y-4">
        <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 border-b pb-1 border-slate-200" style={{ color: accent }}>Line Items</h3>
        <ItemsTable q={q} currency={currency} accent={accent} theme="minimal" />
        <TotalsBlock subtotal={subtotal} discountAmount={discountAmount} taxAmount={taxAmount} grandTotal={grandTotal} currency={currency} q={q} accent={accent} />
      </div>

      {/* About Company */}
      <AboutCompanySection q={q} accent={accent} />

      {/* Bank Details */}
      <BankDetailsSection q={q} accent={accent} />

      {/* Terms & Conditions */}
      <TermsSection q={q} accent={accent} />

      {/* Footer */}
      <QuotationFooter q={q} />
    </div>
  )
}

// ─── BOLD LAYOUT ────────────────────────────────────────────────────────────

function BoldLayout({ q, subtotal, discountAmount, taxAmount, grandTotal, currency }: LayoutProps) {
  const accent = q.accentColor
  return (
    <div className="space-y-8" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
      {/* Header */}
      <div className="border-4 p-8 rounded-2xl flex items-start justify-between gap-6" style={{ borderColor: accent }}>
        <div className="flex items-start gap-4">
          {q.company.logoUrl && (
            <div className="flex h-14 shrink-0 items-center justify-center rounded-xl bg-white p-2 border border-slate-200">
              <img src={q.company.logoUrl} alt="logo" className="max-h-full max-w-full object-contain logo-img-el" />
            </div>
          )}
          <div>
            <h1 className="text-2xl font-black uppercase tracking-tight text-slate-950">{q.company.name}</h1>
            <div className="mt-2 space-y-0.5 text-xs text-slate-900 font-bold">
              {q.company.address && <p>{q.company.address}{q.company.city ? `, ${q.company.city}` : ''}</p>}
              <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1">
                {q.company.phone && <span>Phone: {q.company.phone}</span>}
                {q.company.email && <span>Email: {q.company.email}</span>}
                {q.company.website && <span>Web: {q.company.website}</span>}
              </div>
              {q.company.taxId && <p className="text-slate-950 mt-1">GST / Tax ID: {q.company.taxId}</p>}
            </div>
          </div>
        </div>
        <div className="text-right whitespace-nowrap">
          <p className="text-xs font-black uppercase tracking-[0.3em]" style={{ color: accent }}>Quotation</p>
          <p className="mt-1 text-3xl font-black text-slate-950">{q.quotationNumber}</p>
          <div className="mt-3 space-y-1 text-xs text-slate-900 font-bold whitespace-nowrap">
            <p>Issue Date: {formatDate(q.issueDate)}</p>
            <p>Valid Until: {formatDate(q.validUntil)}</p>
          </div>
        </div>
      </div>

      {/* Client Info */}
      <ClientSection q={q} accent={accent} />

      {/* Overview */}
      <OverviewSection q={q} accent={accent} />

      {/* Timeline */}
      {q.projectTimelineDays > 0 && (
        <TimelineBar days={q.projectTimelineDays} accent={accent} />
      )}

      {/* Line Items */}
      <div className="space-y-4">
        <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 border-b pb-1 border-slate-200" style={{ color: accent }}>Line Items</h3>
        <ItemsTable q={q} currency={currency} accent={accent} theme="bold" />
        <TotalsBlock subtotal={subtotal} discountAmount={discountAmount} taxAmount={taxAmount} grandTotal={grandTotal} currency={currency} q={q} accent={accent} />
      </div>

      {/* About Company */}
      <AboutCompanySection q={q} accent={accent} />

      {/* Bank Details */}
      <BankDetailsSection q={q} accent={accent} />

      {/* Terms & Conditions */}
      <TermsSection q={q} accent={accent} />

      {/* Footer */}
      <QuotationFooter q={q} />
    </div>
  )
}
