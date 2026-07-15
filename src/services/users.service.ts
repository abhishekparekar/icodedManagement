import {
  collection,
  doc,
  onSnapshot,
  query,
  updateDoc,
  where,
} from 'firebase/firestore'
import { COLLECTIONS, db } from '@/lib/firebase'
import { logActivity } from '@/services/activity.service'
import type { AppUser, UserRole } from '@/types'

export function subscribeUsers(
  tenantId: string,
  callback: (users: AppUser[]) => void,
): () => void {
  const q = query(collection(db, COLLECTIONS.users), where('tenantId', '==', tenantId))
  return onSnapshot(q, (snap) => {
    const users = snap.docs
      .map((d) => ({ uid: d.id, ...d.data() }) as AppUser)
      .sort((a, b) => a.name.localeCompare(b.name))
    callback(users)
  })
}

export async function updateUserRole(
  uid: string,
  tenantId: string,
  role: UserRole,
  actor: AppUser,
): Promise<void> {
  await updateDoc(doc(db, COLLECTIONS.users, uid), { role })
  await logActivity(
    tenantId,
    `User role updated to "${role}"`,
    actor.uid,
    actor.name,
    'user',
    uid,
  )
}
