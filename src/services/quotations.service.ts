import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  query,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { logActivity } from '@/services/activity.service'
import type { AppUser, CompanyProfile, Quotation } from '@/types'

const COL = 'quotations'
const COMPANY_COL = 'company_profiles'

// ─── Quotations ────────────────────────────────────────────────────────────

export function subscribeQuotations(
  tenantId: string,
  callback: (quotations: Quotation[]) => void,
): () => void {
  // Only filter by tenantId — no orderBy to avoid composite index requirement.
  // Sort client-side by createdAt desc.
  const q = query(collection(db, COL), where('tenantId', '==', tenantId))
  return onSnapshot(
    q,
    (snap) => {
      const quotations = snap.docs
        .filter((d) => d.id && d.id.trim() !== '')   // skip any malformed docs
        .map((d) => ({ id: d.id, ...d.data() }) as Quotation)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      callback(quotations)
    },
    (err) => {
      console.error('[subscribeQuotations] Firestore error:', err)
    },
  )
}

export async function createQuotation(
  tenantId: string,
  data: Omit<Quotation, 'id' | 'tenantId' | 'createdAt' | 'updatedAt'>,
  actor: AppUser,
): Promise<string> {
  const now = new Date().toISOString()

  // Strip the empty id field before writing
  const { id: _id, ...rest } = data as Quotation

  const ref = await addDoc(collection(db, COL), {
    ...rest,
    tenantId,
    createdAt: now,
    updatedAt: now,
  })

  await logActivity(
    tenantId,
    `Quotation "${data.quotationNumber}" was created`,
    actor.uid,
    actor.name,
    'quotation',
    ref.id,
  )
  return ref.id
}

export async function updateQuotation(
  id: string,
  tenantId: string,
  data: Partial<Quotation>,
  actor: AppUser,
): Promise<void> {
  // Strip fields that must not be overwritten
  const { id: _id, tenantId: _t, createdAt: _c, ...payload } = data as Quotation

  await updateDoc(doc(db, COL, id), {
    ...payload,
    updatedAt: new Date().toISOString(),
  })

  await logActivity(
    tenantId,
    `Quotation "${data.quotationNumber ?? 'record'}" was updated`,
    actor.uid,
    actor.name,
    'quotation',
    id,
  )
}

export async function deleteQuotation(
  id: string,
  tenantId: string,
  number: string,
  actor: AppUser,
): Promise<void> {
  if (!id || !id.trim()) {
    throw new Error('Invalid quotation ID — cannot delete')
  }
  await deleteDoc(doc(db, COL, id))
  await logActivity(
    tenantId,
    `Quotation "${number}" was deleted`,
    actor.uid,
    actor.name,
    'quotation',
    id,
  )
}

/** Generate next quotation number like QT-2026-0042 */
export function generateQuotationNumber(existing: Quotation[]): string {
  const year = new Date().getFullYear()
  const nums = existing
    .map((q) => {
      const m = q.quotationNumber.match(/(\d+)$/)
      return m ? parseInt(m[1], 10) : 0
    })
    .filter((n) => !isNaN(n))
  const next = nums.length ? Math.max(...nums) + 1 : 1
  return `QT-${year}-${String(next).padStart(4, '0')}`
}

// ─── Company Profile ────────────────────────────────────────────────────────

/** One profile doc per tenant, stored at company_profiles/{tenantId} */
export async function getCompanyProfile(tenantId: string): Promise<CompanyProfile | null> {
  const snap = await getDoc(doc(db, COMPANY_COL, tenantId))
  if (!snap.exists()) return null
  return { id: snap.id, ...snap.data() } as CompanyProfile
}

export async function saveCompanyProfile(
  tenantId: string,
  profile: Omit<CompanyProfile, 'id' | 'tenantId' | 'updatedAt'>,
): Promise<void> {
  await setDoc(
    doc(db, COMPANY_COL, tenantId),
    { ...profile, tenantId, updatedAt: new Date().toISOString() },
    { merge: true },
  )
}
