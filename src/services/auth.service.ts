import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  type User,
} from 'firebase/auth'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { auth, COLLECTIONS, db } from '@/lib/firebase'
import { generateId } from '@/lib/utils'
import type { AppUser, UserRole } from '@/types'

export function subscribeAuth(callback: (user: User | null) => void): () => void {
  return onAuthStateChanged(auth, callback)
}

export async function getUserProfile(uid: string): Promise<AppUser | null> {
  const snap = await getDoc(doc(db, COLLECTIONS.users, uid))
  if (!snap.exists()) return null
  return { uid, ...snap.data() } as AppUser
}

export async function signUp(params: {
  email: string
  password: string
  name: string
  companyName: string
  role?: UserRole
}): Promise<AppUser> {
  const cred = await createUserWithEmailAndPassword(auth, params.email, params.password)
  await updateProfile(cred.user, { displayName: params.name })

  const tenantId = generateId()
  const now = new Date().toISOString()
  const role = params.role ?? 'admin'

  await setDoc(doc(db, COLLECTIONS.tenants, tenantId), {
    name: params.companyName,
    createdAt: now,
  })

  const profile: AppUser = {
    uid: cred.user.uid,
    name: params.name,
    email: params.email,
    role,
    tenantId,
    companyName: params.companyName,
    createdAt: now,
  }

  await setDoc(doc(db, COLLECTIONS.users, cred.user.uid), profile)
  return profile
}

export async function signIn(email: string, password: string): Promise<AppUser> {
  const cred = await signInWithEmailAndPassword(auth, email, password)
  const profile = await getUserProfile(cred.user.uid)
  if (!profile) throw new Error('User profile not found. Contact your administrator.')
  return profile
}

export async function logout(): Promise<void> {
  await signOut(auth)
}
