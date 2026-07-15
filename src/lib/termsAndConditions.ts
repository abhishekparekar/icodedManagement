export interface TermsClause {
  id: string
  category: string
  title: string
  text: string
  defaultSelected: boolean
}

export const TERMS_CLAUSES: TermsClause[] = [
  // ── Payment Terms ──────────────────────────────────────────────────────────
  {
    id: 'payment_advance',
    category: 'Payment Terms',
    title: '50% Advance Payment',
    text: '50% of the total project cost is required as an advance payment before commencement of any development work. Work will begin only upon receipt and clearance of the advance payment.',
    defaultSelected: true,
  },
  {
    id: 'payment_milestone',
    category: 'Payment Terms',
    title: '30% on Project Completion',
    text: '30% of the total project cost is due upon completion of the project and delivery of the final build for client review and testing.',
    defaultSelected: true,
  },
  {
    id: 'payment_delivery',
    category: 'Payment Terms',
    title: '20% on Final Delivery',
    text: 'The remaining 20% of the total project cost is due upon final delivery, deployment, and handover of all project assets, source code, and documentation to the client.',
    defaultSelected: true,
  },
  {
    id: 'payment_overdue',
    category: 'Payment Terms',
    title: 'Late Payment Penalty',
    text: 'Invoices not paid within 15 days of the due date will attract a late payment fee of 2% per month on the outstanding amount. We reserve the right to suspend services until overdue amounts are settled.',
    defaultSelected: false,
  },
  {
    id: 'payment_gst',
    category: 'Payment Terms',
    title: 'Taxes & GST',
    text: 'All prices quoted are exclusive of applicable taxes (GST/VAT/Service Tax). Taxes will be charged additionally as per prevailing government regulations at the time of invoicing.',
    defaultSelected: true,
  },

  // ── Support & Maintenance ──────────────────────────────────────────────────
  {
    id: 'support_free_1yr',
    category: 'Support & Maintenance',
    title: '1 Year Free Support',
    text: 'Free technical support is provided for a period of 1 (one) year from the date of project handover. This includes bug fixes, minor UI adjustments, and technical assistance related to the delivered scope of work.',
    defaultSelected: true,
  },
  {
    id: 'support_bug_fix',
    category: 'Support & Maintenance',
    title: 'Bug Fixing (1 Year)',
    text: 'Any bugs, errors, or defects directly attributable to our development work will be fixed at no additional charge within the 1-year support period. Bug reports must be submitted in writing via email or the designated support channel.',
    defaultSelected: true,
  },
  {
    id: 'support_minor_ui',
    category: 'Support & Maintenance',
    title: 'Minor UI Changes (1 Year)',
    text: 'Minor UI/UX adjustments such as color changes, text updates, layout tweaks, and small design modifications are included within the 1-year support period at no additional cost, subject to a reasonable usage limit.',
    defaultSelected: true,
  },
  {
    id: 'support_amc',
    category: 'Support & Maintenance',
    title: 'AMC After 1 Year',
    text: 'After the expiry of the 1-year free support period, ongoing technical support and maintenance services will be provided under a separate Annual Maintenance Contract (AMC). AMC charges will be calculated separately based on the scope of the project and will be communicated prior to renewal.',
    defaultSelected: true,
  },
  {
    id: 'support_hosting',
    category: 'Support & Maintenance',
    title: 'Hosting & Server Support',
    text: 'Server setup, hosting configuration, and deployment assistance are included in the project scope. Post-handover server maintenance, renewals, and third-party hosting charges are the responsibility of the client unless covered under a separate AMC agreement.',
    defaultSelected: false,
  },

  // ── Scope & Change Requests ────────────────────────────────────────────────
  {
    id: 'scope_new_features',
    category: 'Scope & Change Requests',
    title: 'New Features Billed Separately',
    text: 'Any new features, modules, or functionalities not included in the original agreed scope of work will be treated as a separate requirement. These will be estimated, quoted, and billed independently based on the complexity and effort involved.',
    defaultSelected: true,
  },
  {
    id: 'scope_integrations',
    category: 'Scope & Change Requests',
    title: 'Third-Party Integrations',
    text: 'Integration with third-party APIs, payment gateways, CRMs, or external services not specified in the original scope will be quoted and billed separately. Costs for third-party licenses, API subscriptions, or service fees are the client\'s responsibility.',
    defaultSelected: true,
  },
  {
    id: 'scope_change_request',
    category: 'Scope & Change Requests',
    title: 'Change Request Process',
    text: 'Any changes to the agreed project scope, design, or functionality must be submitted as a formal Change Request (CR). Each CR will be assessed for impact on timeline and cost, and will require written approval before implementation.',
    defaultSelected: true,
  },
  {
    id: 'scope_revisions',
    category: 'Scope & Change Requests',
    title: 'Design Revisions',
    text: 'Up to 2 rounds of design revisions are included in the quoted price. Additional revision rounds beyond this limit will be billed at our standard hourly rate.',
    defaultSelected: false,
  },

  // ── Intellectual Property ──────────────────────────────────────────────────
  {
    id: 'ip_ownership',
    category: 'Intellectual Property',
    title: 'IP Transfer on Full Payment',
    text: 'Full ownership and intellectual property rights of the developed software, source code, and all related assets will be transferred to the client only upon receipt of the complete final payment. Until then, all rights remain with the development company.',
    defaultSelected: true,
  },
  {
    id: 'ip_portfolio',
    category: 'Intellectual Property',
    title: 'Portfolio Rights',
    text: 'We reserve the right to showcase the completed project in our portfolio, case studies, and marketing materials unless the client requests confidentiality in writing prior to project commencement.',
    defaultSelected: false,
  },

  // ── Project Timeline ───────────────────────────────────────────────────────
  {
    id: 'timeline_estimate',
    category: 'Project Timeline',
    title: 'Timeline is Estimated',
    text: 'The project timeline provided is an estimate based on the current scope of work. Delays caused by late client feedback, scope changes, unavailability of required content/assets, or force majeure events will result in a proportional extension of the delivery timeline.',
    defaultSelected: true,
  },
  {
    id: 'timeline_client_delay',
    category: 'Project Timeline',
    title: 'Client Delay Policy',
    text: 'If the client fails to provide required feedback, approvals, content, or access within 7 business days of a request, the project timeline will be extended accordingly. Prolonged delays of more than 30 days may result in the project being placed on hold and re-scoped.',
    defaultSelected: false,
  },

  // ── Confidentiality ────────────────────────────────────────────────────────
  {
    id: 'confidentiality',
    category: 'Confidentiality',
    title: 'Non-Disclosure',
    text: 'Both parties agree to maintain strict confidentiality regarding all proprietary information, business data, technical specifications, and trade secrets shared during the course of this project. This obligation survives the termination of this agreement.',
    defaultSelected: true,
  },

  // ── Liability ──────────────────────────────────────────────────────────────
  {
    id: 'liability_limit',
    category: 'Liability',
    title: 'Limitation of Liability',
    text: 'Our total liability for any claims arising from this project shall not exceed the total amount paid by the client under this quotation. We are not liable for any indirect, incidental, or consequential damages including loss of business, data, or revenue.',
    defaultSelected: true,
  },
  {
    id: 'liability_data',
    category: 'Liability',
    title: 'Data Loss Disclaimer',
    text: 'We are not responsible for any loss of data, business interruption, or damages resulting from server failures, third-party service outages, or events beyond our reasonable control. Clients are advised to maintain regular data backups.',
    defaultSelected: false,
  },

  // ── Cancellation ──────────────────────────────────────────────────────────
  {
    id: 'cancellation',
    category: 'Cancellation',
    title: 'Cancellation Policy',
    text: 'In the event of project cancellation by the client, the advance payment is non-refundable. Payment for all work completed up to the date of cancellation will be due and payable. Any work-in-progress deliverables will be handed over upon receipt of outstanding payments.',
    defaultSelected: true,
  },

  // ── Validity ───────────────────────────────────────────────────────────────
  {
    id: 'validity',
    category: 'Validity',
    title: 'Quotation Validity',
    text: 'This quotation is valid for the period stated on the document. After the validity date, prices and timelines are subject to revision. Acceptance of this quotation must be communicated in writing (email or signed copy) before the validity date.',
    defaultSelected: true,
  },
  {
    id: 'governing_law',
    category: 'Validity',
    title: 'Governing Law',
    text: 'This agreement shall be governed by and construed in accordance with the laws of the jurisdiction in which the service provider is registered. Any disputes shall be subject to the exclusive jurisdiction of the courts in that jurisdiction.',
    defaultSelected: false,
  },
]

export const DEFAULT_SELECTED_TERMS = TERMS_CLAUSES
  .filter((c) => c.defaultSelected)
  .map((c) => c.id)

export const TERMS_CATEGORIES = [...new Set(TERMS_CLAUSES.map((c) => c.category))]
