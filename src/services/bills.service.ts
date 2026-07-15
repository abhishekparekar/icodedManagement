import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  updateDoc,
  where,
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { logActivity } from '@/services/activity.service'
import type { AppUser, Bill, BillPayment } from '@/types'
import { generateId } from '@/lib/utils'

const COL = 'bills'

export function subscribeBills(
  tenantId: string,
  callback: (bills: Bill[]) => void,
): () => void {
  const q = query(collection(db, COL), where('tenantId', '==', tenantId))
  return onSnapshot(
    q,
    (snap) => {
      const bills = snap.docs
        .filter((d) => d.id?.trim())
        .map((d) => ({ id: d.id, ...d.data() }) as Bill)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      callback(bills)
    },
    (err) => console.error('[subscribeBills]', err),
  )
}

export async function createBill(
  tenantId: string,
  data: Omit<Bill, 'id' | 'tenantId' | 'createdAt' | 'updatedAt'>,
  actor: AppUser,
): Promise<string> {
  const now = new Date().toISOString()
  const { id: _id, ...rest } = data as Bill
  const ref = await addDoc(collection(db, COL), {
    ...rest,
    tenantId,
    createdAt: now,
    updatedAt: now,
  })
  await logActivity(tenantId, `Bill "${data.billNumber}" was created`, actor.uid, actor.name, 'bill', ref.id)
  return ref.id
}

export async function updateBill(
  id: string,
  tenantId: string,
  data: Partial<Bill>,
  actor: AppUser,
): Promise<void> {
  if (!id?.trim()) throw new Error('Invalid bill ID')
  const { id: _id, tenantId: _t, createdAt: _c, ...payload } = data as Bill
  await updateDoc(doc(db, COL, id), { ...payload, updatedAt: new Date().toISOString() })
  await logActivity(tenantId, `Bill "${data.billNumber ?? 'record'}" was updated`, actor.uid, actor.name, 'bill', id)
}

export async function deleteBill(
  id: string,
  tenantId: string,
  number: string,
  actor: AppUser,
): Promise<void> {
  if (!id?.trim()) throw new Error('Invalid bill ID')
  await deleteDoc(doc(db, COL, id))
  await logActivity(tenantId, `Bill "${number}" was deleted`, actor.uid, actor.name, 'bill', id)
}

/** Record a payment against a bill — recomputes amountPaid, balanceDue, and status */
export async function recordPayment(
  bill: Bill,
  tenantId: string,
  payment: Omit<BillPayment, 'id'>,
  actor: AppUser,
): Promise<void> {
  if (!bill.id?.trim()) throw new Error('Invalid bill ID')

  const newPayment: BillPayment = { ...payment, id: generateId() }
  const payments = [...(bill.payments ?? []), newPayment]
  const amountPaid = payments.reduce((s, p) => s + p.amount, 0)
  const balanceDue = Math.max(0, bill.grandTotal - amountPaid)

  let status: Bill['status'] = bill.status
  if (balanceDue <= 0) status = 'paid'
  else if (amountPaid > 0) status = 'partial'

  await updateDoc(doc(db, COL, bill.id), {
    payments,
    amountPaid,
    balanceDue,
    status,
    updatedAt: new Date().toISOString(),
  })

  await logActivity(
    tenantId,
    `Payment of ${payment.amount} recorded for Bill "${bill.billNumber}"`,
    actor.uid,
    actor.name,
    'bill',
    bill.id,
  )
}

export async function deletePayment(
  bill: Bill,
  tenantId: string,
  paymentId: string,
  actor: AppUser,
): Promise<void> {
  if (!bill.id?.trim()) throw new Error('Invalid bill ID')

  const payments = (bill.payments ?? []).filter((p) => p.id !== paymentId)
  const amountPaid = payments.reduce((s, p) => s + p.amount, 0)
  const balanceDue = Math.max(0, bill.grandTotal - amountPaid)

  let status: Bill['status'] = bill.status
  if (balanceDue <= 0) status = 'paid'
  else if (amountPaid > 0) status = 'partial'
  else status = 'sent'

  await updateDoc(doc(db, COL, bill.id), {
    payments,
    amountPaid,
    balanceDue,
    status,
    updatedAt: new Date().toISOString(),
  })

  await logActivity(tenantId, `Payment deleted from Bill "${bill.billNumber}"`, actor.uid, actor.name, 'bill', bill.id)
}

/** Generate next bill number: INV-2026-0001 */
export function generateBillNumber(existing: Bill[]): string {
  const year = new Date().getFullYear()
  const nums = existing
    .map((b) => { const m = b.billNumber.match(/(\d+)$/); return m ? parseInt(m[1], 10) : 0 })
    .filter((n) => !isNaN(n))
  const next = nums.length ? Math.max(...nums) + 1 : 1
  return `INV-${year}-${String(next).padStart(4, '0')}`
}
