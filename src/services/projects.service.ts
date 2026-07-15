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
import type { AppUser, Project } from '@/types'

export function subscribeProjects(
  tenantId: string,
  callback: (projects: Project[]) => void,
): () => void {
  const q = query(collection(db, COLLECTIONS.projects), where('tenantId', '==', tenantId))
  return onSnapshot(q, (snap) => {
    const projects = snap.docs
      .map((d) => ({ id: d.id, ...d.data() }) as Project)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    callback(projects)
  })
}

export async function createProject(
  tenantId: string,
  data: Omit<Project, 'id' | 'tenantId' | 'createdAt'>,
  actor: AppUser,
): Promise<string> {
  const now = new Date().toISOString()
  const ref = await addDoc(collection(db, COLLECTIONS.projects), {
    ...data,
    tenantId,
    createdAt: now,
  })
  await logActivity(
    tenantId,
    `Project "${data.name}" was created`,
    actor.uid,
    actor.name,
    'project',
    ref.id,
  )
  return ref.id
}

export async function updateProject(
  id: string,
  tenantId: string,
  data: Partial<Project>,
  actor: AppUser,
): Promise<void> {
  // Strip read-only fields before writing
  const { id: _id, tenantId: _t, createdAt: _c, ...payload } = data as Project
  await updateDoc(doc(db, COLLECTIONS.projects, id), payload)
  await logActivity(
    tenantId,
    `Project "${data.name ?? 'record'}" was updated`,
    actor.uid,
    actor.name,
    'project',
    id,
  )
}

export async function deleteProject(
  id: string,
  tenantId: string,
  name: string,
  actor: AppUser,
): Promise<void> {
  await deleteDoc(doc(db, COLLECTIONS.projects, id))
  await logActivity(
    tenantId,
    `Project "${name}" was deleted`,
    actor.uid,
    actor.name,
    'project',
    id,
  )
}
