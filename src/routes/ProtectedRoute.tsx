import { Navigate, Outlet } from 'react-router-dom'
import { hasPermission, type Permission } from '@/lib/permissions'
import { useAuthStore } from '@/stores/authStore'
import { TableSkeleton } from '@/components/ui/Skeleton'

interface ProtectedRouteProps {
  permission?: Permission
}

export function ProtectedRoute({ permission }: ProtectedRouteProps) {
  const { user, loading, initialized } = useAuthStore()

  if (!initialized || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-950">
        <TableSkeleton rows={3} />
      </div>
    )
  }

  if (!user) return <Navigate to="/login" replace />

  if (permission && !hasPermission(user, permission)) {
    return <Navigate to="/dashboard" replace />
  }

  return <Outlet />
}
