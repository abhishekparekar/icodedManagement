import { initializeApp } from 'firebase/app'
import { getAnalytics } from 'firebase/analytics'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import { getStorage } from 'firebase/storage'

const firebaseConfig = {
  apiKey: 'AIzaSyAnlfLSiMnw7CvmAyj4U8L4OHApRH3isy8',
  authDomain: 'digital-cards-38a1d.firebaseapp.com',
  projectId: 'digital-cards-38a1d',
  storageBucket: 'digital-cards-38a1d.firebasestorage.app',
  messagingSenderId: '73437948325',
  appId: '1:73437948325:web:1b5bb1ed7a1bd579a8604c',
  measurementId: 'G-2JB825Q0T5',
}

export const app = initializeApp(firebaseConfig)
export const analytics = typeof window !== 'undefined' ? getAnalytics(app) : null
export const auth = getAuth(app)
export const db = getFirestore(app)
export const storage = getStorage(app)

export const COLLECTIONS = {
  users: 'users',
  tenants: 'tenants',
  employees: 'employees',
  leads: 'leads',
  projects: 'projects',
  activityLogs: 'activity_logs',
} as const
