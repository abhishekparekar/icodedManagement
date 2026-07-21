import { forwardRef } from 'react'
import type { Quotation } from '@/types'
import { calcQuotationTotals, formatCurrency, formatDate } from '@/lib/utils'

interface Props {
  quotation: Quotation
}

export const SaaSQuotationTemplate = forwardRef<HTMLDivElement, Props>(({ quotation: q }, ref) => {
  const { items, currency, discountPercent, taxPercent } = q
  const { subtotal, discountAmount, taxAmount, grandTotal } = calcQuotationTotals(items, discountPercent, taxPercent)

  const hosting = q.hostingCharges ?? 13154
  const domain = q.domainCharges ?? 950
  const finalGrandTotal = grandTotal > 0 ? grandTotal : subtotal + hosting + domain - discountAmount + taxAmount

  return (
    <div
      ref={ref}
      className="saas-quotation-wrapper w-full bg-[#EAEEF4] text-[#1E293B] font-sans p-2 sm:p-6 space-y-8 select-none"
      style={{ fontFamily: "'Inter', 'Plus Jakarta Sans', system-ui, sans-serif" }}
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
          .quotation-page {
            box-shadow: none !important;
            border: none !important;
            margin-bottom: 0 !important;
            border-radius: 0 !important;
            page-break-after: always !important;
            break-after: page !important;
          }
        }
      `}</style>

      {/* ────────────────────────────────────────────────────────────────── */}
      {/* PAGE 1: COVER & QUOTATION SUMMARY & INVESTMENT TABLE              */}
      {/* ────────────────────────────────────────────────────────────────── */}
      <div className="quotation-page bg-white w-full max-w-[850px] mx-auto p-8 sm:p-12 shadow-xl border border-[#D1D5DB] rounded-none sm:rounded-lg space-y-7 text-[#1E293B] relative min-h-[1080px] flex flex-col justify-between">
        <div className="space-y-6">
          
          {/* Top Logo & Company Info Header */}
          <div className="flex items-start justify-between gap-6">
            <div>
              <img
                src={q.company.logoUrl || '/company_logo1.jpeg'}
                onError={(e) => {
                  ;(e.target as HTMLImageElement).src = '/company_logo1.jpeg'
                }}
                alt="iCoded Automation Logo"
                className="h-16 sm:h-20 w-auto object-contain"
              />
            </div>

            <div className="text-right text-xs text-[#475569] space-y-0.5 leading-tight font-medium">
              <h2 className="text-sm font-black text-[#0F172A] tracking-wider uppercase mb-1">
                {q.company.name || 'ICODED AUTOMATION PVT LTD'}
              </h2>
              <p>{q.company.address || 'Nisha Pride, 2nd Floor, Mondha Naka'}</p>
              <p>{q.company.city || 'Chh. Sambhajinagar, Maharashtra'}</p>
              <p>{q.company.email || 'company.icoded@gmail.com'}</p>
              <p>{q.company.phone || '+91 93703 29233'}</p>
            </div>
          </div>

          {/* Blue Top Divider Bar */}
          <div className="h-3 w-full bg-[#1D4ED8] rounded-xs" />

          {/* Quotation Title & Date/Valid Until Box */}
          <div className="flex items-start justify-between gap-4 pt-2">
            <div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-wider text-[#0F172A] uppercase">
                QUOTATION
              </h1>
            </div>

            <div className="bg-[#EFF6FF] border border-[#BFDBFE] rounded-lg p-3 px-6 text-xs text-right space-y-1 shrink-0">
              <div className="flex justify-between gap-6 font-bold text-[#475569]">
                <span>DATE</span>
                <span className="text-[#0F172A] font-mono">{formatDate(q.issueDate)}</span>
              </div>
              <div className="flex justify-between gap-6 font-bold text-[#475569]">
                <span>VALID UNTIL</span>
                <span className="text-[#0F172A] font-mono">{formatDate(q.validUntil)}</span>
              </div>
            </div>
          </div>

          {/* Prepared For & Project Timeline Row */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-6 pt-2 text-xs">
            <div className="sm:col-span-8 space-y-1">
              <p className="font-black uppercase text-[#1D4ED8] tracking-wider text-[11px]">PREPARED FOR</p>
              <p className="text-sm font-black text-[#0F172A]">{q.client.name || '[Client Name]'}</p>
              <p className="font-semibold text-[#475569]">
                [{q.client.company || 'Client Company Name'}] • [{q.client.city || 'Client City'}]
              </p>
              <p className="font-medium text-[#64748B]">
                [{q.client.email || 'client email'}] • [{q.client.phone || 'client phone'}]
              </p>
            </div>

            <div className="sm:col-span-4 space-y-1 text-left sm:text-right">
              <p className="font-black uppercase text-[#1D4ED8] tracking-wider text-[11px]">PROJECT TIMELINE</p>
              <p className="text-sm font-black text-[#0F172A]">{q.projectTimelineDays || 30} Working Days</p>
              <p className="font-semibold text-[#64748B] text-[11px]">(approx. {Math.ceil((q.projectTimelineDays || 30) / 5)} weeks)</p>
            </div>
          </div>

          {/* About Us */}
          <div className="space-y-1 pt-1 text-xs">
            <p className="font-black uppercase text-[#1D4ED8] tracking-wider text-[11px]">ABOUT US</p>
            <p className="text-[#334155] leading-relaxed font-normal">
              {q.company.about ||
                'iCoded Automation Pvt Ltd is a leading software development company with 85+ successful software products delivered and 70+ satisfied clients across India. We specialize in Web Development, App Development, Custom Software Development, Digital Marketing, and Business Automation Solutions, transforming ideas into powerful digital products.'}
            </p>
          </div>

          {/* Project Investment Table */}
          <div className="space-y-2 pt-2">
            <h3 className="font-black uppercase text-[#1D4ED8] tracking-wider text-xs border-b border-[#E2E8F0] pb-1">
              PROJECT INVESTMENT
            </h3>

            <div className="overflow-hidden border border-[#CBD5E1]">
              <table className="w-full text-xs text-[#1E293B] border-collapse">
                <thead>
                  <tr className="bg-[#1D4ED8] text-white font-black uppercase text-[11px]">
                    <th className="py-2.5 px-4 text-left border-r border-blue-600">DESCRIPTION</th>
                    <th className="py-2.5 px-2 text-center w-14 border-r border-blue-600">QTY</th>
                    <th className="py-2.5 px-4 text-right border-r border-blue-600">PRICE</th>
                    <th className="py-2.5 px-4 text-right">TOTAL</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E8F0]">
                  {items.map((item, idx) => (
                    <tr key={item.id || idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-[#F8FAFC]'}>
                      <td className="py-2.5 px-4 font-bold text-[#0F172A] border-r border-[#E2E8F0]">
                        {item.moduleName || item.description}
                      </td>
                      <td className="py-2.5 px-2 text-center font-bold font-mono border-r border-[#E2E8F0]">
                        {item.quantity}
                      </td>
                      <td className="py-2.5 px-4 text-right font-mono font-semibold text-[#334155] border-r border-[#E2E8F0]">
                        {item.unitPrice === 0 ? 'Included' : formatCurrency(item.unitPrice, currency)}
                      </td>
                      <td className="py-2.5 px-4 text-right font-mono font-black text-[#0F172A]">
                        {item.unitPrice === 0 ? '₹0.00' : formatCurrency(item.quantity * item.unitPrice, currency)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Total Project Investment Banner */}
              <div className="bg-[#1D4ED8] text-white px-5 py-3 flex items-center justify-between font-black text-xs">
                <span className="uppercase tracking-wider">TOTAL PROJECT INVESTMENT</span>
                <span className="text-base font-mono">₹{finalGrandTotal.toLocaleString('en-IN')}.00</span>
              </div>
            </div>
          </div>

          {/* Payment / Bank Details Container */}
          <div className="space-y-2 pt-2">
            <h3 className="font-black uppercase text-[#1D4ED8] tracking-wider text-xs border-b border-[#E2E8F0] pb-1">
              PAYMENT / BANK DETAILS
            </h3>

            <div className="bg-[#EFF6FF] border border-[#BFDBFE] rounded-md p-4 text-xs font-semibold text-[#1E293B]">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-2 gap-x-8">
                <div className="flex justify-between sm:justify-start sm:gap-6">
                  <span className="font-bold text-[#64748B] w-32 shrink-0">BANK NAME</span>
                  <span className="font-extrabold text-[#0F172A]">{q.bankDetails.bankName || 'Kotak Mahindra Bank'}</span>
                </div>
                <div className="flex justify-between sm:justify-start sm:gap-6">
                  <span className="font-bold text-[#64748B] w-32 shrink-0">ACCOUNT NAME</span>
                  <span className="font-extrabold text-[#0F172A]">{q.bankDetails.accountName || 'Rameshwar Narayan Shinde'}</span>
                </div>
                <div className="flex justify-between sm:justify-start sm:gap-6">
                  <span className="font-bold text-[#64748B] w-32 shrink-0">ACCOUNT NUMBER</span>
                  <span className="font-mono font-extrabold text-[#0F172A]">{q.bankDetails.accountNumber || '5647820806'}</span>
                </div>
                <div className="flex justify-between sm:justify-start sm:gap-6">
                  <span className="font-bold text-[#64748B] w-32 shrink-0">IFSC CODE</span>
                  <span className="font-mono font-extrabold text-[#0F172A]">{q.bankDetails.ifscCode || 'KKBK0001946'}</span>
                </div>
                <div className="flex justify-between sm:justify-start sm:gap-6">
                  <span className="font-bold text-[#64748B] w-32 shrink-0">BRANCH</span>
                  <span className="font-extrabold text-[#0F172A]">{q.bankDetails.branchName || 'Chh. Sambhajinagar'}</span>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Page 1 Footer */}
        <div className="pt-4 border-t border-[#E2E8F0] flex items-center justify-between text-[11px] font-semibold text-[#94A3B8]">
          <span>iCoded Automation Pvt. Ltd. • Confidential Quotation</span>
          <span>Page 1 of 5</span>
        </div>
      </div>

      {/* ────────────────────────────────────────────────────────────────── */}
      {/* PAGE 2: TERMS & CONDITIONS                                        */}
      {/* ────────────────────────────────────────────────────────────────── */}
      <div className="quotation-page bg-white w-full max-w-[850px] mx-auto p-8 sm:p-12 shadow-xl border border-[#D1D5DB] rounded-none sm:rounded-lg space-y-6 text-[#1E293B] relative min-h-[1080px] flex flex-col justify-between page-break">
        <div className="space-y-6">
          
          {/* Top Header */}
          <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-4">
            <img src={q.company.logoUrl || '/company_logo1.jpeg'} alt="Logo" className="h-10 w-auto object-contain" />
            <span className="text-xs font-black uppercase tracking-wider text-[#475569]">ICODED AUTOMATION PVT LTD</span>
          </div>

          <h2 className="text-lg font-black uppercase text-[#0F172A] tracking-wider border-b-2 border-[#1D4ED8] pb-1">
            TERMS & CONDITIONS
          </h2>

          <div className="space-y-5 text-xs text-[#334155] leading-relaxed">
            
            {/* Payment Terms */}
            <div className="space-y-1.5">
              <h4 className="font-black uppercase text-[#1D4ED8] tracking-wider text-[11px]">PAYMENT TERMS</h4>
              <ol className="space-y-1.5 list-decimal pl-4 font-normal">
                <li>
                  <strong className="text-[#0F172A]">50% Advance Payment:</strong> 50% of the total project cost is required as an advance payment before commencement of any development work. Work will begin only upon receipt and clearance of the advance payment.
                </li>
                <li>
                  <strong className="text-[#0F172A]">30% on Project Completion:</strong> 30% of the total project cost is due upon completion of the project and delivery of the final build for client review and testing.
                </li>
                <li>
                  <strong className="text-[#0F172A]">20% on Final Delivery:</strong> The remaining 20% of the total project cost is due upon final delivery, deployment, and handover of all project assets, source code, and documentation to the client.
                </li>
                <li>
                  <strong className="text-[#0F172A]">Taxes & GST:</strong> All prices quoted are exclusive of applicable taxes (GST/VAT/Service Tax). Taxes will be charged additionally as per prevailing government regulations at the time of invoicing.
                </li>
              </ol>
            </div>

            {/* Support & Maintenance */}
            <div className="space-y-1.5">
              <h4 className="font-black uppercase text-[#1D4ED8] tracking-wider text-[11px]">SUPPORT & MAINTENANCE</h4>
              <ol className="space-y-1.5 list-decimal pl-4 font-normal" start={5}>
                <li>
                  <strong className="text-[#0F172A]">1 Year Free Support:</strong> Free technical support is provided for a period of 1 (one) year from the date of project handover. This includes bug fixes, minor UI adjustments, and technical assistance related to the delivered scope of work.
                </li>
                <li>
                  <strong className="text-[#0F172A]">Bug Fixing (1 Year):</strong> Any bugs, errors, or defects directly attributable to our development work will be fixed at no additional charge within the 1-year support period. Bug reports must be submitted in writing via email or the designated support channel.
                </li>
                <li>
                  <strong className="text-[#0F172A]">Minor UI Changes (1 Year):</strong> Minor UI/UX adjustments such as color changes, text updates, layout tweaks, and small design modifications are included within the 1-year support period at no additional cost, subject to a reasonable usage limit.
                </li>
                <li>
                  <strong className="text-[#0F172A]">AMC After 1 Year:</strong> After the expiry of the 1-year free support period, ongoing technical support and maintenance services will be provided under a separate Annual Maintenance Contract (AMC). AMC charges will be calculated separately based on the scope of the project and communicated prior to renewal.
                </li>
              </ol>
            </div>

            {/* Scope & Change Requests */}
            <div className="space-y-1.5">
              <h4 className="font-black uppercase text-[#1D4ED8] tracking-wider text-[11px]">SCOPE & CHANGE REQUESTS</h4>
              <ol className="space-y-1.5 list-decimal pl-4 font-normal" start={9}>
                <li>
                  <strong className="text-[#0F172A]">New Features Billed Separately:</strong> Any new features, modules, or functionalities not included in the original agreed scope of work will be treated as a separate requirement, estimated, quoted, and billed independently based on complexity and effort.
                </li>
                <li>
                  <strong className="text-[#0F172A]">Third-Party Integrations:</strong> Integration with third-party APIs, payment gateways, or external services not specified in the original scope will be quoted and billed separately. Costs for third-party licenses, API subscriptions, or transaction fees are the client's responsibility.
                </li>
                <li>
                  <strong className="text-[#0F172A]">Change Request Process:</strong> Any changes to the agreed project scope, design, or functionality must be submitted as a formal Change Request (CR), assessed for impact on timeline and cost, and require written approval before implementation.
                </li>
              </ol>
            </div>

            {/* Intellectual Property */}
            <div className="space-y-1.5">
              <h4 className="font-black uppercase text-[#1D4ED8] tracking-wider text-[11px]">INTELLECTUAL PROPERTY</h4>
              <ol className="space-y-1.5 list-decimal pl-4 font-normal" start={12}>
                <li>
                  <strong className="text-[#0F172A]">IP Transfer on Full Payment:</strong> Full ownership and intellectual property rights of the developed website, source code, and all related assets will be transferred to the client only upon receipt of the complete final payment. Until then, all rights remain with the development company.
                </li>
              </ol>
            </div>

            {/* Project Timeline */}
            <div className="space-y-1.5">
              <h4 className="font-black uppercase text-[#1D4ED8] tracking-wider text-[11px]">PROJECT TIMELINE</h4>
              <ol className="space-y-1.5 list-decimal pl-4 font-normal" start={13}>
                <li>
                  <strong className="text-[#0F172A]">Timeline is Estimated:</strong> The project timeline provided is an estimate based on the current scope of work. Delays caused by late client feedback, scope changes, unavailability of required content/assets, or force majeure events will result in a proportional extension of the delivery timeline.
                </li>
              </ol>
            </div>

            {/* Red Note */}
            <div className="pt-2">
              <p className="text-red-600 font-bold text-xs">
                Note: Domain and hosting charges are recurring annual expenses and are not included as a one-time cost. These services must be renewed every year to ensure the uninterrupted operation, security, and maintenance of the software.
              </p>
            </div>
          </div>

        </div>

        {/* Page 2 Footer */}
        <div className="pt-4 border-t border-[#E2E8F0] flex items-center justify-between text-[11px] font-semibold text-[#94A3B8]">
          <span>iCoded Automation Pvt. Ltd. • Confidential Quotation</span>
          <span>Page 2 of 5</span>
        </div>
      </div>

      {/* ────────────────────────────────────────────────────────────────── */}
      {/* PAGE 3: ADDITIONAL TERMS & MODULES COVERED                       */}
      {/* ────────────────────────────────────────────────────────────────── */}
      <div className="quotation-page bg-white w-full max-w-[850px] mx-auto p-8 sm:p-12 shadow-xl border border-[#D1D5DB] rounded-none sm:rounded-lg space-y-6 text-[#1E293B] relative min-h-[1080px] flex flex-col justify-between page-break">
        <div className="space-y-6">
          
          {/* Top Header */}
          <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-4">
            <img src={q.company.logoUrl || '/company_logo1.jpeg'} alt="Logo" className="h-10 w-auto object-contain" />
            <span className="text-xs font-black uppercase tracking-wider text-[#475569]">ICODED AUTOMATION PVT LTD</span>
          </div>

          <h2 className="text-lg font-black uppercase text-[#0F172A] tracking-wider border-b-2 border-[#1D4ED8] pb-1">
            ADDITIONAL TERMS
          </h2>

          {/* Project Overview */}
          <div className="space-y-1.5 text-xs">
            <h4 className="font-black uppercase text-[#1D4ED8] tracking-wider text-[11px]">PROJECT OVERVIEW</h4>
            <p className="text-[#334155] leading-relaxed">
              The e-commerce website is a complete online store built for browsing products, managing a shopping cart, and processing orders and payments securely, along with an admin panel to manage products, orders, and customers.
            </p>
            <p className="text-[#334155] leading-relaxed pt-1">
              The storefront will allow customers to browse products by category, view detailed product pages with images, variants, pricing, and descriptions, search and filter products, add items to a cart or wishlist, apply coupon codes, and complete checkout with online payments or cash on delivery. Customers will be able to create an account, track their orders, view order history, and manage their saved addresses.
            </p>
            <p className="text-[#334155] leading-relaxed pt-1">
              The Admin will access a dedicated dashboard to manage the full product catalog (categories, variants, stock, pricing, images), process and update orders, manage coupons and offers, view customers, and track sales through basic reports and analytics.
            </p>
            <p className="text-[#334155] leading-relaxed pt-1">
              The platform will use React.js for the customer-facing storefront and admin panel, Node.js for backend APIs, and a self-hosted PostgreSQL database. The system will include secure authentication, responsive design for mobile and desktop, SEO-friendly product pages, and encrypted handling of payment and customer data.
            </p>
          </div>

          {/* Modules Covered in this Project */}
          <div className="space-y-3 pt-2 text-xs">
            <h4 className="font-black uppercase text-[#1D4ED8] tracking-wider text-[11px]">MODULES COVERED IN THIS PROJECT</h4>

            <div className="space-y-3 text-[#334155]">
              
              <div>
                <p className="font-black text-[#0F172A]">■ Home Page</p>
                <ul className="list-disc pl-5 space-y-0.5 text-[#475569] font-medium pt-0.5">
                  <li>Banner/offer carousel and promotional sections</li>
                  <li>Featured, bestseller and new-arrival product sections</li>
                  <li>Category-wise navigation menu</li>
                </ul>
              </div>

              <div>
                <p className="font-black text-[#0F172A]">■ Product Catalog & Listing</p>
                <ul className="list-disc pl-5 space-y-0.5 text-[#475569] font-medium pt-0.5">
                  <li>Category and sub-category pages</li>
                  <li>Filters (price, size, availability) and sorting</li>
                  <li>Search with auto-suggestions</li>
                </ul>
              </div>

              <div>
                <p className="font-black text-[#0F172A]">■ Product Detail Page</p>
                <ul className="list-disc pl-5 space-y-0.5 text-[#475569] font-medium pt-0.5">
                  <li>Multiple product images/gallery</li>
                  <li>Variants (size, color, pack) with price change</li>
                  <li>Stock status, ratings and customer reviews</li>
                  <li>Related and "you may also like" products</li>
                </ul>
              </div>

              <div>
                <p className="font-black text-[#0F172A]">■ Cart & Checkout</p>
                <ul className="list-disc pl-5 space-y-0.5 text-[#475569] font-medium pt-0.5">
                  <li>Add to cart / update quantity / remove item</li>
                  <li>Coupon and discount code application</li>
                  <li>Address entry and saved addresses</li>
                  <li>Order summary with tax and shipping calculation</li>
                </ul>
              </div>

              <div>
                <p className="font-black text-[#0F172A]">■ Payments</p>
                <ul className="list-disc pl-5 space-y-0.5 text-[#475569] font-medium pt-0.5">
                  <li>Razorpay / UPI online payment integration</li>
                  <li>Cash on Delivery (COD) option</li>
                  <li>Payment success/failure handling and order confirmation</li>
                </ul>
              </div>

              <div>
                <p className="font-black text-[#0F172A]">■ Customer Account</p>
                <ul className="list-disc pl-5 space-y-0.5 text-[#475569] font-medium pt-0.5">
                  <li>OTP/email-based login and signup</li>
                  <li>Order history and order tracking status</li>
                  <li>Wishlist management</li>
                  <li>Saved addresses and profile details</li>
                </ul>
              </div>

              <div>
                <p className="font-black text-[#0F172A]">■ Admin Dashboard</p>
                <ul className="list-disc pl-5 space-y-0.5 text-[#475569] font-medium pt-0.5">
                  <li>Product, category and inventory management</li>
                  <li>Order management with status updates</li>
                  <li>Coupon and offer management</li>
                  <li>Customer list and basic sales reports</li>
                </ul>
              </div>

              <div>
                <p className="font-black text-[#0F172A]">■ Notifications</p>
                <ul className="list-disc pl-5 space-y-0.5 text-[#475569] font-medium pt-0.5">
                  <li>Order confirmation and status update emails</li>
                  <li>Low-stock alerts for admin</li>
                </ul>
              </div>

            </div>
          </div>

        </div>

        {/* Page 3 Footer */}
        <div className="pt-4 border-t border-[#E2E8F0] flex items-center justify-between text-[11px] font-semibold text-[#94A3B8]">
          <span>iCoded Automation Pvt. Ltd. • Confidential Quotation</span>
          <span>Page 3 of 5</span>
        </div>
      </div>

      {/* ────────────────────────────────────────────────────────────────── */}
      {/* PAGE 4 & 5: TECHNOLOGY STACK & SIGNATORY                          */}
      {/* ────────────────────────────────────────────────────────────────── */}
      <div className="quotation-page bg-white w-full max-w-[850px] mx-auto p-8 sm:p-12 shadow-xl border border-[#D1D5DB] rounded-none sm:rounded-lg space-y-8 text-[#1E293B] relative min-h-[1080px] flex flex-col justify-between">
        <div className="space-y-6">
          
          {/* Top Header */}
          <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-4">
            <img src={q.company.logoUrl || '/company_logo1.jpeg'} alt="Logo" className="h-10 w-auto object-contain" />
            <span className="text-xs font-black uppercase tracking-wider text-[#475569]">ICODED AUTOMATION PVT LTD</span>
          </div>

          <h2 className="text-lg font-black uppercase text-[#0F172A] tracking-wider border-b-2 border-[#1D4ED8] pb-1">
            TECHNOLOGY STACK
          </h2>

          <div className="space-y-4 text-xs text-[#334155]">
            
            <div>
              <p className="font-black text-[#0F172A]">■ Frontend (Storefront & Admin Panel)</p>
              <ul className="list-disc pl-5 space-y-0.5 text-[#475569] font-medium pt-0.5">
                <li>React.js (Single Page Application)</li>
                <li>State Management: Redux Toolkit / Zustand</li>
                <li>Styling & UI Components: Tailwind CSS</li>
              </ul>
            </div>

            <div>
              <p className="font-black text-[#0F172A]">■ Backend & Business Logic</p>
              <ul className="list-disc pl-5 space-y-0.5 text-[#475569] font-medium pt-0.5">
                <li>Node.js with Express.js (REST API Layer)</li>
                <li>Runtime: Node.js (TypeScript/JavaScript)</li>
                <li>Authentication: JWT-based sessions</li>
              </ul>
            </div>

            <div>
              <p className="font-black text-[#0F172A]">■ Database & Storage</p>
              <ul className="list-disc pl-5 space-y-0.5 text-[#475569] font-medium pt-0.5">
                <li>PostgreSQL (Self-Hosted Relational Database)</li>
                <li>Connection Pooling: PgBouncer</li>
                <li>File/Image Storage: Self-hosted Object Storage (MinIO) or Local File System</li>
              </ul>
            </div>

            <div>
              <p className="font-black text-[#0F172A]">■ Integrations</p>
              <ul className="list-disc pl-5 space-y-0.5 text-[#475569] font-medium pt-0.5">
                <li>Payment Gateway: Razorpay (UPI, Cards, Netbanking) / COD</li>
                <li>Email Notifications: Nodemailer / SMTP</li>
              </ul>
            </div>

            <div>
              <p className="font-black text-[#0F172A]">■ Infrastructure & Security</p>
              <ul className="list-disc pl-5 space-y-0.5 text-[#475569] font-medium pt-0.5">
                <li>Hosting: Client's preferred VPS/Cloud server (self-hosted DB)</li>
                <li>Security: SSL/TLS encryption in transit, password hashing (bcrypt)</li>
                <li>Logging: Winston / Morgan (activity logging)</li>
                <li>Backups: Automated pg_dump cron jobs</li>
              </ul>
            </div>

          </div>

          {/* Closing Appreciation Line */}
          <div className="pt-8 space-y-6 border-t border-[#E2E8F0]">
            <p className="text-xs font-semibold text-[#475569]">
              We appreciate the opportunity to work with you and look forward to building a platform that helps grow your business.
            </p>

            <div className="pt-10 space-y-1">
              <p className="text-xs font-black text-[#0F172A]">For iCoded Automation</p>
              <p className="text-xs font-bold text-[#64748B] pt-8">Authorized Signatory</p>
            </div>
          </div>

        </div>

        {/* Page 5 Footer */}
        <div className="pt-4 border-t border-[#E2E8F0] flex items-center justify-between text-[11px] font-semibold text-[#94A3B8]">
          <span>iCoded Automation Pvt. Ltd. • Confidential Quotation</span>
          <span>Page 5 of 5</span>
        </div>
      </div>

    </div>
  )
})

SaaSQuotationTemplate.displayName = 'SaaSQuotationTemplate'
