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
import type { AppUser, Lead } from '@/types'

export function subscribeLeads(
  tenantId: string,
  callback: (leads: Lead[]) => void,
): () => void {
  const q = query(collection(db, COLLECTIONS.leads), where('tenantId', '==', tenantId))
  return onSnapshot(q, (snap) => {
    const leads = snap.docs
      .map((d) => ({ id: d.id, ...d.data() }) as Lead)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    callback(leads)
  })
}

export async function createLead(
  tenantId: string,
  data: Omit<Lead, 'id' | 'tenantId' | 'createdAt'>,
  actor: AppUser,
): Promise<string> {
  const now = new Date().toISOString()
  const ref = await addDoc(collection(db, COLLECTIONS.leads), {
    ...data,
    tenantId,
    createdAt: now,
  })
  await logActivity(
    tenantId,
    `Lead "${data.clientName}" was created`,
    actor.uid,
    actor.name,
    'lead',
    ref.id,
  )
  return ref.id
}

export async function updateLead(
  id: string,
  tenantId: string,
  data: Partial<Lead>,
  actor: AppUser,
): Promise<void> {
  const { id: _id, tenantId: _t, createdAt, ...payload } = data as Lead
  await updateDoc(doc(db, COLLECTIONS.leads, id), payload)
  await logActivity(
    tenantId,
    `Lead "${data.clientName ?? 'record'}" was updated`,
    actor.uid,
    actor.name,
    'lead',
    id,
  )
}

export async function deleteLead(
  id: string,
  tenantId: string,
  clientName: string,
  actor: AppUser,
): Promise<void> {
  await deleteDoc(doc(db, COLLECTIONS.leads, id))
  await logActivity(
    tenantId,
    `Lead "${clientName}" was deleted`,
    actor.uid,
    actor.name,
    'lead',
    id,
  )
}
