import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { logActivity } from '@/services/activity.service'
import type { AppUser, Task } from '@/types'

function tasksCollection(projectId: string) {
  return collection(db, 'projects', projectId, 'tasks')
}

export function subscribeTasks(
  projectId: string,
  callback: (tasks: Task[]) => void,
): () => void {
  const q = query(tasksCollection(projectId), orderBy('createdAt', 'desc'))
  return onSnapshot(q, (snap) => {
    const tasks = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Task)
    callback(tasks)
  })
}

export async function createTask(
  projectId: string,
  tenantId: string,
  data: Omit<Task, 'id' | 'createdAt'>,
  actor: AppUser,
  projectName: string,
): Promise<string> {
  const now = new Date().toISOString()
  const ref = await addDoc(tasksCollection(projectId), { ...data, createdAt: now })
  await logActivity(
    tenantId,
    `Task "${data.title}" added to project "${projectName}"`,
    actor.uid,
    actor.name,
    'task',
    ref.id,
  )
  return ref.id
}

export async function updateTask(
  projectId: string,
  taskId: string,
  tenantId: string,
  data: Partial<Task>,
  actor: AppUser,
): Promise<void> {
  const { id: _id, createdAt, ...payload } = data as Task
  await updateDoc(doc(db, 'projects', projectId, 'tasks', taskId), payload)
  await logActivity(
    tenantId,
    `Task "${data.title ?? 'record'}" was updated`,
    actor.uid,
    actor.name,
    'task',
    taskId,
  )
}

export async function deleteTask(
  projectId: string,
  taskId: string,
  tenantId: string,
  title: string,
  actor: AppUser,
): Promise<void> {
  await deleteDoc(doc(db, 'projects', projectId, 'tasks', taskId))
  await logActivity(tenantId, `Task "${title}" was deleted`, actor.uid, actor.name, 'task', taskId)
}
