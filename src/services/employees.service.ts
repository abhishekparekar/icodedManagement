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
import { COLLECTIONS, db } from '@/lib/firebase'
import { logActivity } from '@/services/activity.service'
import type { AppUser, Employee } from '@/types'

export function subscribeEmployees(
  tenantId: string,
  callback: (employees: Employee[]) => void,
): () => void {
  const q = query(collection(db, COLLECTIONS.employees), where('tenantId', '==', tenantId))
  return onSnapshot(q, (snap) => {
    const employees = snap.docs
      .map((d) => ({ id: d.id, ...d.data() }) as Employee)
      .sort((a, b) => a.name.localeCompare(b.name))
    callback(employees)
  })
}

export async function createEmployee(
  tenantId: string,
  data: Omit<Employee, 'id' | 'tenantId' | 'createdAt'>,
  actor: AppUser,
): Promise<string> {
  const now = new Date().toISOString()
  const ref = await addDoc(collection(db, COLLECTIONS.employees), {
    ...data,
    tenantId,
    createdAt: now,
  })
  await logActivity(
    tenantId,
    `Employee "${data.name}" was added`,
    actor.uid,
    actor.name,
    'employee',
    ref.id,
  )
  return ref.id
}

export async function updateEmployee(
  id: string,
  tenantId: string,
  data: Partial<Employee>,
  actor: AppUser,
): Promise<void> {
  const { id: _id, tenantId: _t, createdAt, ...payload } = data as Employee
  await updateDoc(doc(db, COLLECTIONS.employees, id), payload)
  await logActivity(
    tenantId,
    `Employee "${data.name ?? 'record'}" was updated`,
    actor.uid,
    actor.name,
    'employee',
    id,
  )
}

export async function deleteEmployee(
  id: string,
  tenantId: string,
  name: string,
  actor: AppUser,
): Promise<void> {
  await deleteDoc(doc(db, COLLECTIONS.employees, id))
  await logActivity(
    tenantId,
    `Employee "${name}" was removed`,
    actor.uid,
    actor.name,
    'employee',
    id,
  )
}
