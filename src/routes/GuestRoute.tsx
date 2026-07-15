import { Navigate, Outlet } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'

export function GuestRoute() {
  const { user, loading, initialized } = useAuthStore()

  if (!initialized || loading) return null
  if (user) return <Navigate to="/dashboard" replace />
  return <Outlet />
}
