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
import type { AppUser, Expense } from '@/types'

const COL = 'expenses'

export function subscribeExpenses(
  tenantId: string,
  callback: (expenses: Expense[]) => void,
): () => void {
  const q = query(collection(db, COL), where('tenantId', '==', tenantId))
  return onSnapshot(
    q,
    (snap) => {
      const expenses = snap.docs
        .filter((d) => d.id?.trim())
        .map((d) => ({ id: d.id, ...d.data() }) as Expense)
        .sort((a, b) => b.date.localeCompare(a.date))
      callback(expenses)
    },
    (err) => console.error('[subscribeExpenses]', err),
  )
}

export async function createExpense(
  tenantId: string,
  data: Omit<Expense, 'id' | 'tenantId' | 'createdAt' | 'updatedAt'>,
  actor: AppUser,
): Promise<string> {
  const now = new Date().toISOString()
  const { id: _id, ...rest } = data as Expense
  const ref = await addDoc(collection(db, COL), {
    ...rest,
    tenantId,
    createdAt: now,
    updatedAt: now,
  })
  await logActivity(tenantId, `Expense "${data.title}" (${data.amount}) was created`, actor.uid, actor.name, 'expense', ref.id)
  return ref.id
}

export async function updateExpense(
  id: string,
  tenantId: string,
  data: Partial<Expense>,
  actor: AppUser,
): Promise<void> {
  if (!id?.trim()) throw new Error('Invalid expense ID')
  const { id: _id, tenantId: _t, createdAt: _c, ...payload } = data as Expense
  await updateDoc(doc(db, COL, id), { ...payload, updatedAt: new Date().toISOString() })
  await logActivity(tenantId, `Expense "${data.title ?? 'record'}" was updated`, actor.uid, actor.name, 'expense', id)
}

export async function deleteExpense(
  id: string,
  tenantId: string,
  title: string,
  actor: AppUser,
): Promise<void> {
  if (!id?.trim()) throw new Error('Invalid expense ID')
  await deleteDoc(doc(db, COL, id))
  await logActivity(tenantId, `Expense "${title}" was deleted`, actor.uid, actor.name, 'expense', id)
}
