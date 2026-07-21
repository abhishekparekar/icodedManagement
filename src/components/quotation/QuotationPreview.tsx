import { forwardRef } from 'react'
import type { Quotation } from '@/types'
import { SaaSQuotationTemplate } from './SaaSQuotationTemplate'

interface Props {
  quotation: Quotation
}

export const QuotationPreview = forwardRef<HTMLDivElement, Props>(({ quotation }, ref) => {
  return (
    <div className="w-full">
      <SaaSQuotationTemplate ref={ref} quotation={quotation} />
    </div>
  )
})

QuotationPreview.displayName = 'QuotationPreview'
