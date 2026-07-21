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
import type { AppUser, InventoryItem } from '@/types'

const COL = 'inventory'

export function subscribeInventory(
  tenantId: string,
  callback: (inventory: InventoryItem[]) => void,
): () => void {
  const q = query(collection(db, COL), where('tenantId', '==', tenantId))
  return onSnapshot(
    q,
    (snap) => {
      const items = snap.docs
        .filter((d) => d.id?.trim())
        .map((d) => ({ id: d.id, ...d.data() }) as InventoryItem)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      callback(items)
    },
    (err) => console.error('[subscribeInventory]', err),
  )
}

export async function createInventoryItem(
  tenantId: string,
  data: Omit<InventoryItem, 'id' | 'tenantId' | 'createdAt' | 'updatedAt'>,
  actor: AppUser,
): Promise<string> {
  const now = new Date().toISOString()
  const { id: _id, ...rest } = data as InventoryItem
  const ref = await addDoc(collection(db, COL), {
    ...rest,
    tenantId,
    createdAt: now,
    updatedAt: now,
  })
  await logActivity(tenantId, `Inventory item "${data.name}" (${data.assetTag}) was added`, actor.uid, actor.name, 'inventory', ref.id)
  return ref.id
}

export async function updateInventoryItem(
  id: string,
  tenantId: string,
  data: Partial<InventoryItem>,
  actor: AppUser,
): Promise<void> {
  if (!id?.trim()) throw new Error('Invalid inventory item ID')
  const { id: _id, tenantId: _t, createdAt: _c, ...payload } = data as InventoryItem
  await updateDoc(doc(db, COL, id), { ...payload, updatedAt: new Date().toISOString() })
  await logActivity(tenantId, `Inventory item "${data.name ?? 'item'}" was updated`, actor.uid, actor.name, 'inventory', id)
}

export async function deleteInventoryItem(
  id: string,
  tenantId: string,
  name: string,
  actor: AppUser,
): Promise<void> {
  if (!id?.trim()) throw new Error('Invalid inventory item ID')
  await deleteDoc(doc(db, COL, id))
  await logActivity(tenantId, `Inventory item "${name}" was deleted`, actor.uid, actor.name, 'inventory', id)
}
