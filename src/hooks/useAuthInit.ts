import { useEffect } from 'react'
import { subscribeAuth, getUserProfile } from '@/services/auth.service'
import { useAuthStore } from '@/stores/authStore'

export function useAuthInit() {
  const { setUser, setLoading, setInitialized } = useAuthStore()

  useEffect(() => {
    const unsub = subscribeAuth(async (firebaseUser) => {
      if (firebaseUser) {
        const profile = await getUserProfile(firebaseUser.uid)
        setUser(profile)
      } else {
        setUser(null)
      }
      setLoading(false)
      setInitialized(true)
    })
    return unsub
  }, [setUser, setLoading, setInitialized])
}
