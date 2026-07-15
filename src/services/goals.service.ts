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
import type { AppUser, Goal, Milestone } from '@/types'
import { generateId } from '@/lib/utils'

const COL = 'goals'

export function subscribeGoals(
  tenantId: string,
  callback: (goals: Goal[]) => void,
): () => void {
  const q = query(collection(db, COL), where('tenantId', '==', tenantId))
  return onSnapshot(
    q,
    (snap) => {
      const goals = snap.docs
        .filter((d) => d.id?.trim())
        .map((d) => ({ id: d.id, ...d.data() }) as Goal)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      callback(goals)
    },
    (err) => console.error('[subscribeGoals]', err),
  )
}

export async function createGoal(
  tenantId: string,
  data: Omit<Goal, 'id' | 'tenantId' | 'createdAt' | 'updatedAt'>,
  actor: AppUser,
): Promise<string> {
  const now = new Date().toISOString()
  const { id: _id, ...rest } = data as Goal
  const ref = await addDoc(collection(db, COL), {
    ...rest,
    tenantId,
    createdAt: now,
    updatedAt: now,
  })
  await logActivity(tenantId, `Goal "${data.title}" was created`, actor.uid, actor.name, 'goal', ref.id)
  return ref.id
}

export async function updateGoal(
  id: string,
  tenantId: string,
  data: Partial<Goal>,
  actor: AppUser,
): Promise<void> {
  if (!id?.trim()) throw new Error('Invalid goal ID')
  const { id: _id, tenantId: _t, createdAt: _c, ...payload } = data as Goal
  await updateDoc(doc(db, COL, id), { ...payload, updatedAt: new Date().toISOString() })
  await logActivity(tenantId, `Goal "${data.title ?? 'record'}" was updated`, actor.uid, actor.name, 'goal', id)
}

export async function deleteGoal(
  id: string,
  tenantId: string,
  title: string,
  actor: AppUser,
): Promise<void> {
  if (!id?.trim()) throw new Error('Invalid goal ID')
  await deleteDoc(doc(db, COL, id))
  await logActivity(tenantId, `Goal "${title}" was deleted`, actor.uid, actor.name, 'goal', id)
}

/** Toggle a milestone's completed state and optionally auto-update progress */
export async function toggleMilestone(
  goalId: string,
  _tenantId: string,
  goal: Goal,
  milestoneId: string,
  _actor: AppUser,
): Promise<void> {
  if (!goalId?.trim()) throw new Error('Invalid goal ID')

  const updatedMilestones: Milestone[] = goal.milestones.map((m) =>
    m.id === milestoneId
      ? { ...m, completed: !m.completed, completedAt: !m.completed ? new Date().toISOString() : undefined }
      : m,
  )

  let progress = goal.progress
  if (goal.autoProgress && updatedMilestones.length > 0) {
    const done = updatedMilestones.filter((m) => m.completed).length
    progress = Math.round((done / updatedMilestones.length) * 100)
  }

  // Auto-complete goal when all milestones done
  const allDone = updatedMilestones.length > 0 && updatedMilestones.every((m) => m.completed)
  const status = allDone ? 'completed' : goal.status === 'completed' ? 'in_progress' : goal.status

  await updateDoc(doc(db, COL, goalId), {
    milestones: updatedMilestones,
    progress,
    status,
    updatedAt: new Date().toISOString(),
  })
}

/** Update just the progress value */
export async function updateGoalProgress(
  goalId: string,
  progress: number,
  currentValue: number | undefined,
  _actor: AppUser,
  _tenantId: string,
): Promise<void> {
  if (!goalId?.trim()) throw new Error('Invalid goal ID')
  const update: Record<string, unknown> = { progress, updatedAt: new Date().toISOString() }
  if (currentValue !== undefined) update.currentValue = currentValue
  if (progress >= 100) update.status = 'completed'
  await updateDoc(doc(db, COL, goalId), update)
}

export function makeBlankGoal(uid: string, userName: string): Omit<Goal, 'id' | 'tenantId' | 'createdAt' | 'updatedAt'> {
  return {
    title: '',
    description: '',
    category: 'other',
    priority: 'medium',
    status: 'not_started',
    progress: 0,
    autoProgress: true,
    targetValue: undefined,
    currentValue: undefined,
    unit: '',
    startDate: new Date().toISOString().slice(0, 10),
    dueDate: new Date(Date.now() + 90 * 86400000).toISOString().slice(0, 10),
    assignedTo: [],
    milestones: [],
    notes: '',
    createdBy: uid,
    createdByName: userName,
  }
}

export function addMilestone(goal: Partial<Goal>, title: string, dueDate: string): Milestone[] {
  const milestones = goal.milestones ?? []
  return [...milestones, { id: generateId(), title, dueDate, completed: false }]
}
