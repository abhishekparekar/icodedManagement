import { forwardRef } from 'react'
import type { Quotation } from '@/types'
import { calcQuotationTotals, formatCurrency, formatDate } from '@/lib/utils'
import { Check, ShieldCheck, Sparkles } from 'lucide-react'

interface Props {
  quotation: Quotation
}

export const SaaSQuotationTemplate = forwardRef<HTMLDivElement, Props>(({ quotation: q }, ref) => {
  const { items, currency, discountPercent, taxPercent } = q
  const { subtotal, discountAmount, taxAmount, grandTotal } = calcQuotationTotals(items, discountPercent, taxPercent)

  const hosting = q.hostingCharges ?? 13154
  const domain = q.domainCharges ?? 950
  const finalGrandTotal = grandTotal > 0 ? grandTotal : subtotal + hosting + domain - discountAmount + taxAmount
  const advancePercent = q.advancePercent ?? 50
  const advanceAmount = (finalGrandTotal * advancePercent) / 100
  const remainingAmount = finalGrandTotal - advanceAmount

  // Status Styling Logic
  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'accepted':
        return { label: 'Accepted', bg: '#16A34A', text: '#FFFFFF', border: '#15803D' }
      case 'rejected':
        return { label: 'Rejected', bg: '#DC2626', text: '#FFFFFF', border: '#B91C1C' }
      case 'expired':
        return { label: 'Expired', bg: '#6B7280', text: '#FFFFFF', border: '#4B5563' }
      case 'pending':
      case 'sent':
      default:
        return { label: 'Pending', bg: '#F59E0B', text: '#FFFFFF', border: '#D97706' }
    }
  }

  const statusStyle = getStatusBadge(q.status)

  return (
    <div
      ref={ref}
      className="saas-quotation-wrapper w-full bg-[#F8FAFC] text-[#111827] font-sans p-4 sm:p-8 space-y-8"
      style={{ fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif" }}
    >
      <style>{`
        @media print {
          body {
            background-color: #ffffff !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .saas-quotation-wrapper {
            background-color: #ffffff !important;
            padding: 0 !important;
            box-shadow: none !important;
          }
          .page-break {
            page-break-after: always !important;
            break-after: page !important;
          }
        }
      `}</style>

      {/* ────────────────────────────────────────────────────────────────── */}
      {/* PAGE 1: COVER HEADER, CLIENT INFO, INVESTMENT TABLE & BANK DETAILS */}
      {/* ────────────────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-3xl border border-[#E5E7EB] p-6 sm:p-10 shadow-lg space-y-8 page-break">
        
        {/* Top Header Row */}
        <div className="flex flex-col sm:flex-row items-start justify-between gap-6 border-b border-[#E5E7EB] pb-6">
          
          {/* Left Side Header */}
          <div className="flex items-start gap-4">
            <img
              src={q.company.logoUrl || '/company_logo1.jpeg'}
              onError={(e) => {
                ;(e.target as HTMLImageElement).src = '/company_logo1.jpeg'
              }}
              alt="Logo"
              className="h-16 w-16 sm:h-20 sm:w-20 rounded-2xl object-cover border border-[#E5E7EB] shadow-md bg-white shrink-0"
            />
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-[#0F172A] tracking-tight uppercase">
                {q.company.name || 'ICODED AUTOMATION PRIVATE LIMITED'}
              </h1>
              <p className="text-xs font-bold text-[#2563EB] tracking-wide mt-0.5">
                {q.company.tagline || 'Building Business Through Technology'}
              </p>
              <div className="mt-2 text-xs text-[#6B7280] space-y-0.5 font-medium">
                <p>📍 {q.company.address || 'Nisha Pride, 2nd Floor, Mondha Naka'}</p>
                <p>{q.company.city || 'Chh. Sambhajinagar, Maharashtra - 431006'}</p>
                <p>📞 {q.company.phone || '+91 93703 29233'} | 📧 {q.company.email || 'company.icoded@gmail.com'}</p>
                <p>🌐 {q.company.website || 'www.icodedautomation.com'}</p>
              </div>
            </div>
          </div>

          {/* Right Side Header Info Box */}
          <div className="w-full sm:w-auto bg-[#F8FAFC] border border-[#E5E7EB] rounded-2xl p-4 sm:p-5 text-left sm:text-right shrink-0">
            <div className="flex items-center sm:justify-end gap-2 mb-2">
              <span className="text-xs font-black uppercase tracking-widest text-[#2563EB]">
                QUOTATION
              </span>
              <span
                className="px-3 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider shadow-sm"
                style={{ backgroundColor: statusStyle.bg, color: statusStyle.text }}
              >
                {statusStyle.label}
              </span>
            </div>

            <p className="text-lg font-black text-[#0F172A] font-mono">
              {q.quotationNumber || 'ICQ-2026-EW-052'}
            </p>

            <div className="mt-2 text-xs text-[#6B7280] space-y-1 font-semibold">
              <p>Issue Date: <span className="text-[#111827]">{formatDate(q.issueDate)}</span></p>
              <p>Valid Till: <span className="text-[#111827]">{formatDate(q.validUntil)}</span></p>
              <p>Prepared By: <span className="text-[#111827]">{q.salesPerson || q.createdByName || 'Abhishek Parekar (Sales Executive)'}</span></p>
              <p>Version: <span className="text-[#111827]">{q.version || '1.0'}</span></p>
            </div>
          </div>
        </div>

        {/* Prepared For & Project Timeline Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          
          {/* Client Card */}
          <div className="md:col-span-8 bg-[#F8FAFC] border border-[#E5E7EB] rounded-2xl p-5 space-y-2">
            <h3 className="text-xs font-black uppercase tracking-wider text-[#2563EB] flex items-center gap-1.5">
              <span>PREPARED FOR</span>
            </h3>
            <p className="text-base font-black text-[#0F172A]">
              {q.client.salutation ? q.client.salutation + ' ' : ''}{q.client.name || '[Client Name]'}
            </p>
            {q.client.company && (
              <p className="text-xs font-bold text-[#111827]">{q.client.company}</p>
            )}
            <div className="text-xs text-[#6B7280] space-y-1 pt-1 font-medium">
              {q.client.address && <p>📍 {q.client.address}</p>}
              {(q.client.city || q.client.state) && <p>{q.client.city}{q.client.state ? `, ${q.client.state}` : ''}</p>}
              <div className="flex flex-wrap gap-x-4 gap-y-1 font-semibold text-[#111827] pt-1">
                {q.client.email && <span>📧 {q.client.email}</span>}
                {q.client.phone && <span>📞 {q.client.phone}</span>}
                {q.client.gstNumber && <span>GSTIN: {q.client.gstNumber}</span>}
              </div>
            </div>
          </div>

          {/* Project Timeline & Quick Summary Card */}
          <div className="md:col-span-4 bg-[#F8FAFC] border border-[#E5E7EB] rounded-2xl p-5 space-y-3 flex flex-col justify-between">
            <div>
              <h3 className="text-xs font-black uppercase tracking-wider text-[#2563EB]">
                PROJECT TIMELINE
              </h3>
              <p className="text-xl font-black text-[#0F172A] mt-1">
                {q.projectTimelineDays || 30} Working Days
              </p>
              <p className="text-xs font-semibold text-[#6B7280]">
                (approx. {Math.ceil((q.projectTimelineDays || 30) / 5)} weeks)
              </p>
            </div>

            <div className="pt-2 border-t border-[#E5E7EB] text-xs text-[#6B7280] space-y-1">
              <p><strong className="text-[#111827]">Category:</strong> {q.projectCategory || 'Web & Mobile Solution'}</p>
              <p><strong className="text-[#111827]">Platform:</strong> {q.platform || 'Cross-Platform Web & Admin'}</p>
            </div>
          </div>
        </div>

        {/* About Company Brief */}
        <div className="bg-[#F8FAFC] border border-[#E5E7EB] rounded-2xl p-5 space-y-1">
          <h3 className="text-xs font-black uppercase tracking-wider text-[#2563EB]">ABOUT US</h3>
          <p className="text-xs text-[#4B5563] leading-relaxed">
            {q.company.about ||
              'iCoded Automation Pvt Ltd is a leading software development company with 85+ successful software products delivered and 70+ satisfied clients across India. We specialize in Web Development, App Development, Custom Software Development, Digital Marketing, and Business Automation Solutions, transforming ideas into powerful digital products.'}
          </p>
        </div>

        {/* ── Pricing Table (Project Investment) ── */}
        <div className="space-y-3">
          <h3 className="text-xs font-black uppercase tracking-wider text-[#2563EB]">
            PROJECT INVESTMENT
          </h3>

          <div className="overflow-hidden rounded-2xl border border-[#E5E7EB] shadow-xs">
            <table className="w-full text-xs text-[#111827] border-collapse">
              <thead>
                <tr className="bg-[#2563EB] text-white font-black uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4 text-left">DESCRIPTION</th>
                  <th className="py-3 px-3 text-center w-16">QTY</th>
                  <th className="py-3 px-4 text-right">PRICE</th>
                  <th className="py-3 px-4 text-right">TOTAL</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E7EB]">
                {items.map((item, idx) => (
                  <tr key={item.id || idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-[#F8FAFC]'}>
                    <td className="py-3 px-4 font-bold">
                      <p className="text-sm font-extrabold text-[#0F172A]">{item.moduleName || item.description}</p>
                      {item.moduleName && item.description && (
                        <p className="text-xs font-normal text-[#6B7280] mt-0.5 whitespace-pre-wrap">{item.description}</p>
                      )}
                    </td>
                    <td className="py-3 px-3 text-center font-bold font-mono">{item.quantity}</td>
                    <td className="py-3 px-4 text-right font-mono font-semibold">
                      {item.unitPrice === 0 ? 'Included' : formatCurrency(item.unitPrice, currency)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-black text-[#0F172A]">
                      {item.unitPrice === 0 ? '₹0.00' : formatCurrency(item.quantity * item.unitPrice, currency)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Total Project Investment Banner */}
            <div className="bg-[#2563EB] text-white p-4 flex items-center justify-between font-black">
              <span className="text-xs uppercase tracking-wider">TOTAL PROJECT INVESTMENT</span>
              <span className="text-xl font-mono">{formatCurrency(finalGrandTotal, currency)}</span>
            </div>
          </div>
        </div>

        {/* ── Payment & Bank Details Section ── */}
        <div className="bg-[#F8FAFC] border border-[#E5E7EB] rounded-2xl p-5 sm:p-6 space-y-4">
          <h3 className="text-xs font-black uppercase tracking-wider text-[#2563EB]">
            PAYMENT / BANK DETAILS
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2.5 text-xs">
            <div className="flex justify-between border-b border-[#E5E7EB] pb-1.5">
              <span className="font-bold text-[#6B7280]">BANK NAME</span>
              <span className="font-black text-[#0F172A]">{q.bankDetails.bankName || 'Kotak Mahindra Bank'}</span>
            </div>
            <div className="flex justify-between border-b border-[#E5E7EB] pb-1.5">
              <span className="font-bold text-[#6B7280]">ACCOUNT NAME</span>
              <span className="font-black text-[#0F172A]">{q.bankDetails.accountName || 'Rameshwar Narayan Shinde'}</span>
            </div>
            <div className="flex justify-between border-b border-[#E5E7EB] pb-1.5">
              <span className="font-bold text-[#6B7280]">ACCOUNT NUMBER</span>
              <span className="font-mono font-black text-[#0F172A]">{q.bankDetails.accountNumber || '5647820806'}</span>
            </div>
            <div className="flex justify-between border-b border-[#E5E7EB] pb-1.5">
              <span className="font-bold text-[#6B7280]">IFSC CODE</span>
              <span className="font-mono font-black text-[#0F172A]">{q.bankDetails.ifscCode || 'KKBK0001946'}</span>
            </div>
            <div className="flex justify-between border-b border-[#E5E7EB] pb-1.5">
              <span className="font-bold text-[#6B7280]">BRANCH</span>
              <span className="font-black text-[#0F172A]">{q.bankDetails.branchName || 'Chh. Sambhajinagar'}</span>
            </div>
            {q.bankDetails.upiId && (
              <div className="flex justify-between border-b border-[#E5E7EB] pb-1.5">
                <span className="font-bold text-[#6B7280]">UPI ID</span>
                <span className="font-black text-[#0F172A]">{q.bankDetails.upiId}</span>
              </div>
            )}
          </div>

          {/* Payment Terms Schedule */}
          <div className="pt-2 grid grid-cols-3 gap-3 text-center">
            <div className="bg-white p-3 rounded-xl border border-[#E5E7EB]">
              <p className="text-[10px] font-black uppercase text-[#6B7280]">ADVANCE REQUIRED (50%)</p>
              <p className="text-sm font-black font-mono text-[#2563EB] mt-0.5">{formatCurrency(advanceAmount, currency)}</p>
            </div>
            <div className="bg-white p-3 rounded-xl border border-[#E5E7EB]">
              <p className="text-[10px] font-black uppercase text-[#6B7280]">ON COMPLETION (30%)</p>
              <p className="text-sm font-black font-mono text-[#0F172A] mt-0.5">{formatCurrency((finalGrandTotal * 30) / 100, currency)}</p>
            </div>
            <div className="bg-white p-3 rounded-xl border border-[#E5E7EB]">
              <p className="text-[10px] font-black uppercase text-[#6B7280]">REMAINING BALANCE (50%)</p>
              <p className="text-sm font-black font-mono text-[#0F172A] mt-0.5">{formatCurrency(remainingAmount, currency)}</p>
            </div>
          </div>
        </div>

        {/* Footer Page Badge */}
        <div className="flex items-center justify-between text-[10px] font-bold text-[#6B7280] pt-4 border-t border-[#E5E7EB]">
          <span>{q.company.name || 'iCoded Automation Pvt. Ltd.'} • Confidential Quotation</span>
          <span>Page 1 of 4</span>
        </div>
      </div>

      {/* ────────────────────────────────────────────────────────────────── */}
      {/* PAGE 2: TERMS & CONDITIONS                                        */}
      {/* ────────────────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-3xl border border-[#E5E7EB] p-6 sm:p-10 shadow-lg space-y-6 page-break">
        <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-4">
          <h2 className="text-lg font-black uppercase text-[#0F172A] tracking-wider">
            TERMS & CONDITIONS
          </h2>
          <span className="text-xs font-bold text-[#6B7280]">{q.company.name}</span>
        </div>

        <div className="space-y-6 text-xs text-[#374151] leading-relaxed">
          
          {/* Payment Terms */}
          <div>
            <h4 className="font-black uppercase text-[#2563EB] mb-2 tracking-wider">PAYMENT TERMS</h4>
            <ol className="space-y-2 list-decimal pl-4 font-medium">
              <li>
                <strong className="text-[#111827]">50% Advance Payment:</strong> 50% of the total project cost is required as an advance payment before commencement of any development work. Work will begin only upon receipt and clearance of advance payment.
              </li>
              <li>
                <strong className="text-[#111827]">30% on Project Completion:</strong> 30% of the total project cost is due upon completion of the project and delivery of the final build for client review and testing.
              </li>
              <li>
                <strong className="text-[#111827]">20% on Final Delivery:</strong> The remaining 20% of the total project cost is due upon final delivery, deployment, and handover of all project assets, source code, and documentation.
              </li>
              <li>
                <strong className="text-[#111827]">Taxes & GST:</strong> All prices quoted are exclusive of applicable taxes (GST/Service Tax). Taxes will be charged additionally as per prevailing government regulations at time of invoicing.
              </li>
            </ol>
          </div>

          {/* Support & Maintenance */}
          <div>
            <h4 className="font-black uppercase text-[#2563EB] mb-2 tracking-wider">SUPPORT & MAINTENANCE</h4>
            <ol className="space-y-2 list-decimal pl-4 font-medium" start={5}>
              <li>
                <strong className="text-[#111827]">1 Year Free Support:</strong> Free technical support is provided for a period of 1 (one) year from the date of project handover. This includes bug fixes, minor UI adjustments, and technical assistance related to the delivered scope of work.
              </li>
              <li>
                <strong className="text-[#111827]">Bug Fixing (1 Year):</strong> Any bugs, errors, or defects directly attributable to our development work will be fixed at no additional charge within the 1-year support period.
              </li>
              <li>
                <strong className="text-[#111827]">Minor UI Changes (1 Year):</strong> Minor UI/UX adjustments such as color changes, text updates, and small design modifications are included within the 1-year support period subject to reasonable limits.
              </li>
              <li>
                <strong className="text-[#111827]">AMC After 1 Year:</strong> Ongoing technical support and maintenance services after 1 year will be provided under an Annual Maintenance Contract (AMC) charged separately.
              </li>
            </ol>
          </div>

          {/* Scope & Change Requests */}
          <div>
            <h4 className="font-black uppercase text-[#2563EB] mb-2 tracking-wider">SCOPE & CHANGE REQUESTS</h4>
            <ol className="space-y-2 list-decimal pl-4 font-medium" start={9}>
              <li>
                <strong className="text-[#111827]">New Features Billed Separately:</strong> Any new features, modules, or functionalities not included in the original agreed scope will be quoted and billed independently.
              </li>
              <li>
                <strong className="text-[#111827]">Third-Party Integrations:</strong> Costs for third-party licenses, API subscriptions, or transaction fees are the client's responsibility.
              </li>
            </ol>
          </div>

          {/* Intellectual Property */}
          <div>
            <h4 className="font-black uppercase text-[#2563EB] mb-2 tracking-wider">INTELLECTUAL PROPERTY</h4>
            <ol className="space-y-2 list-decimal pl-4 font-medium" start={11}>
              <li>
                <strong className="text-[#111827]">IP Transfer on Full Payment:</strong> Full ownership and intellectual property rights of the developed software and source code will be transferred to the client only upon receipt of complete final payment.
              </li>
            </ol>
          </div>

          {/* Important Note */}
          <div className="bg-[#FEF2F2] border border-[#FCA5A5] rounded-2xl p-4 text-[#991B1B] text-xs font-bold">
            Note: Domain and hosting charges are recurring annual expenses and are not included as a one-time cost. These services must be renewed every year to ensure uninterrupted operation.
          </div>
        </div>

        {/* Footer Page Badge */}
        <div className="flex items-center justify-between text-[10px] font-bold text-[#6B7280] pt-4 border-t border-[#E5E7EB]">
          <span>{q.company.name} • Confidential Quotation</span>
          <span>Page 2 of 4</span>
        </div>
      </div>

      {/* ────────────────────────────────────────────────────────────────── */}
      {/* PAGE 3: ADDITIONAL TERMS & MODULES COVERED                       */}
      {/* ────────────────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-3xl border border-[#E5E7EB] p-6 sm:p-10 shadow-lg space-y-6 page-break">
        <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-4">
          <h2 className="text-lg font-black uppercase text-[#0F172A] tracking-wider">
            PROJECT SCOPE & MODULES COVERED
          </h2>
          <span className="text-xs font-bold text-[#6B7280]">{q.company.name}</span>
        </div>

        {/* Project Overview */}
        <div className="space-y-2 bg-[#F8FAFC] border border-[#E5E7EB] rounded-2xl p-5">
          <h4 className="font-black uppercase text-[#2563EB] text-xs">PROJECT OVERVIEW</h4>
          <p className="text-xs text-[#4B5563] leading-relaxed">
            The solution is a complete digital system built for browsing products/services, managing orders/workflow, and processing payments securely, along with a dedicated admin dashboard panel.
          </p>
        </div>

        {/* Detailed Modules Grid */}
        <div className="space-y-4">
          <h4 className="font-black uppercase text-[#2563EB] text-xs">MODULES COVERED IN THIS PROJECT</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            {[
              {
                title: '■ Home Page & Landing Portal',
                points: ['Banner / offer carousel section', 'Featured products / services showcases', 'Category-wise navigation menu'],
              },
              {
                title: '■ Catalog & Product Listing',
                points: ['Category & sub-category filter pages', 'Price, size & availability sorting', 'Search with auto-suggestions'],
              },
              {
                title: '■ Detail & Detail Page',
                points: ['Multiple image gallery view', 'Variants & stock availability', 'Customer ratings and reviews'],
              },
              {
                title: '■ Cart & Checkout Module',
                points: ['Add to cart & quantity update', 'Coupon code & discount application', 'Order summary & tax calculation'],
              },
              {
                title: '■ Payment Gateway Integration',
                points: ['Razorpay / UPI / Cards online payment', 'Cash on Delivery (COD) option', 'Instant payment receipt generation'],
              },
              {
                title: '■ Admin Management Dashboard',
                points: ['Order & workflow status updates', 'Product & stock inventory control', 'Sales analytics and financial reports'],
              },
            ].map((module, i) => (
              <div key={i} className="bg-[#F8FAFC] border border-[#E5E7EB] rounded-2xl p-4 space-y-2">
                <h5 className="font-black text-[#0F172A]">{module.title}</h5>
                <ul className="space-y-1 text-[#6B7280]">
                  {module.points.map((pt, idx) => (
                    <li key={idx} className="flex items-center gap-1.5">
                      <Check className="h-3.5 w-3.5 text-[#16A34A] shrink-0" />
                      <span>{pt}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Footer Page Badge */}
        <div className="flex items-center justify-between text-[10px] font-bold text-[#6B7280] pt-4 border-t border-[#E5E7EB]">
          <span>{q.company.name} • Confidential Quotation</span>
          <span>Page 3 of 4</span>
        </div>
      </div>

      {/* ────────────────────────────────────────────────────────────────── */}
      {/* PAGE 4: TECHNOLOGY STACK & AUTHORIZED SIGNATORY                   */}
      {/* ────────────────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-3xl border border-[#E5E7EB] p-6 sm:p-10 shadow-lg space-y-6">
        <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-4">
          <h2 className="text-lg font-black uppercase text-[#0F172A] tracking-wider">
            TECHNOLOGY STACK & SIGNATORY
          </h2>
          <span className="text-xs font-bold text-[#6B7280]">{q.company.name}</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          {[
            {
              category: 'Frontend Architecture',
              tech: ['React.js (Single Page Application)', 'State Management: Zustand / Redux', 'Styling: Vanilla CSS & Tailwind CSS'],
            },
            {
              category: 'Backend & Business Logic',
              tech: ['Node.js with Express.js (REST API Layer)', 'TypeScript Runtime Environment', 'Authentication: JWT Sessions'],
            },
            {
              category: 'Database & Storage',
              tech: ['PostgreSQL Relational Database', 'Connection Pooling: PgBouncer', 'Object Storage for Media Assets'],
            },
            {
              category: 'Integrations & Infrastructure',
              tech: ['Payment Gateways: Razorpay, UPI', 'Email Notifications: Nodemailer / SMTP', 'Security: SSL/TLS Encryption, Backups'],
            },
          ].map((tBlock, i) => (
            <div key={i} className="bg-[#F8FAFC] border border-[#E5E7EB] rounded-2xl p-4 space-y-2">
              <h5 className="font-black text-[#2563EB] flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-[#2563EB]" />
                <span>{tBlock.category}</span>
              </h5>
              <ul className="space-y-1 text-[#374151] font-medium">
                {tBlock.tech.map((item, idx) => (
                  <li key={idx} className="flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#2563EB] shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Appreciation & Signatory Block */}
        <div className="pt-8 space-y-8 border-t border-[#E5E7EB]">
          <p className="text-xs font-semibold text-[#4B5563]">
            We appreciate the opportunity to work with you and look forward to building a powerful platform that helps grow your business.
          </p>

          <div className="flex items-end justify-between pt-6">
            <div className="text-xs text-[#6B7280] space-y-1">
              <p className="font-bold text-[#111827]">For {q.company.name}</p>
              <p className="text-[11px]">Authorized Corporate Proposal</p>
            </div>

            <div className="text-center space-y-2">
              <div className="h-12 border-b-2 border-dashed border-[#0F172A] w-48 mx-auto flex items-center justify-center">
                <ShieldCheck className="h-6 w-6 text-[#2563EB] opacity-60" />
              </div>
              <p className="text-xs font-black uppercase text-[#0F172A]">Authorized Signatory</p>
            </div>
          </div>
        </div>

        {/* Footer Page Badge */}
        <div className="flex items-center justify-between text-[10px] font-bold text-[#6B7280] pt-4 border-t border-[#E5E7EB]">
          <span>{q.company.name} • Confidential Quotation</span>
          <span>Page 4 of 4</span>
        </div>
      </div>
    </div>
  )
})

SaaSQuotationTemplate.displayName = 'SaaSQuotationTemplate'
