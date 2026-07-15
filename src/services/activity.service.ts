import {
  addDoc,
  collection,
  limit,
  onSnapshot,
  orderBy,
  query,
  where,
} from 'firebase/firestore'
import { COLLECTIONS, db } from '@/lib/firebase'
import type { ActivityLog } from '@/types'

export async function logActivity(
  tenantId: string,
  action: string,
  userId: string,
  userName?: string,
  entityType?: string,
  entityId?: string,
): Promise<void> {
  await addDoc(collection(db, COLLECTIONS.activityLogs), {
    tenantId,
    action,
    userId,
    userName: userName ?? '',
    entityType: entityType ?? '',
    entityId: entityId ?? '',
    timestamp: new Date().toISOString(),
  })
}

export function subscribeActivityLogs(
  tenantId: string,
  callback: (logs: ActivityLog[]) => void,
  max = 50,
): () => void {
  const q = query(
    collection(db, COLLECTIONS.activityLogs),
    where('tenantId', '==', tenantId),
    orderBy('timestamp', 'desc'),
    limit(max),
  )

  return onSnapshot(q, (snap) => {
    const logs = snap.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as ActivityLog[]
    callback(logs)
  })
}
