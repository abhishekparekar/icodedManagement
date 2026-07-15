import { useEffect } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { useAuthInit } from '@/hooks/useAuthInit'
import { useRealtimeData } from '@/hooks/useRealtimeData'
import { ActivityPage } from '@/pages/ActivityPage'
import { LoginPage } from '@/pages/auth/LoginPage'
import { SignupPage } from '@/pages/auth/SignupPage'
import { DashboardPage } from '@/pages/DashboardPage'
import { EmployeesPage } from '@/pages/EmployeesPage'
import { LeadsPage } from '@/pages/LeadsPage'
import { ProjectDetailPage } from '@/pages/ProjectDetailPage'
import { ProjectsPage } from '@/pages/ProjectsPage'
import { BillsPage } from '@/pages/BillsPage'
import { GoalsPage } from '@/pages/GoalsPage'
import { QuotationsPage } from '@/pages/QuotationsPage'
import { ReportsPage } from '@/pages/ReportsPage'
import { SettingsPage } from '@/pages/SettingsPage'
import { UsersPage } from '@/pages/UsersPage'
import { GuestRoute } from '@/routes/GuestRoute'
import { ProtectedRoute } from '@/routes/ProtectedRoute'
import { useThemeStore } from '@/stores/themeStore'

function AppProviders() {
  useAuthInit()
  useRealtimeData()
  const dark = useThemeStore((s) => s.dark)

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark)
  }, [dark])

  return (
    <>
      <Toaster position="top-right" toastOptions={{ duration: 4000 }} />
      <Routes>
        {/* Guest routes */}
        <Route element={<GuestRoute />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
        </Route>

        {/* Protected routes inside dashboard layout */}
        <Route element={<ProtectedRoute permission="dashboard:read" />}>
          <Route element={<DashboardLayout />}>
            <Route path="/dashboard" element={<DashboardPage />} />
          </Route>
        </Route>

        <Route element={<ProtectedRoute permission="employees:read" />}>
          <Route element={<DashboardLayout />}>
            <Route path="/employees" element={<EmployeesPage />} />
          </Route>
        </Route>

        <Route element={<ProtectedRoute permission="leads:read" />}>
          <Route element={<DashboardLayout />}>
            <Route path="/leads" element={<LeadsPage />} />
          </Route>
        </Route>

        <Route element={<ProtectedRoute permission="projects:read" />}>
          <Route element={<DashboardLayout />}>
            <Route path="/projects" element={<ProjectsPage />} />
            <Route path="/projects/:id" element={<ProjectDetailPage />} />
          </Route>
        </Route>

        <Route element={<ProtectedRoute permission="activity:read" />}>
          <Route element={<DashboardLayout />}>
            <Route path="/activity" element={<ActivityPage />} />
          </Route>
        </Route>

        {/* Reports — managers and admins */}
        <Route element={<ProtectedRoute permission="dashboard:full" />}>
          <Route element={<DashboardLayout />}>
            <Route path="/reports" element={<ReportsPage />} />
          </Route>
        </Route>

        {/* Goals — admin & manager write, employee read */}
        <Route element={<ProtectedRoute permission="goals:read" />}>
          <Route element={<DashboardLayout />}>
            <Route path="/goals" element={<GoalsPage />} />
          </Route>
        </Route>

        {/* Quotations — admin & manager write, employee read */}
        <Route element={<ProtectedRoute permission="quotations:read" />}>
          <Route element={<DashboardLayout />}>
            <Route path="/quotations" element={<QuotationsPage />} />
          </Route>
        </Route>

        {/* Bills — admin & manager write, employee read */}
        <Route element={<ProtectedRoute permission="bills:read" />}>
          <Route element={<DashboardLayout />}>
            <Route path="/bills" element={<BillsPage />} />
          </Route>
        </Route>

        {/* Users management — admin only */}
        <Route element={<ProtectedRoute permission="employees:write" />}>
          <Route element={<DashboardLayout />}>
            <Route path="/users" element={<UsersPage />} />
          </Route>
        </Route>

        {/* Settings — all authenticated users */}
        <Route element={<ProtectedRoute />}>
          <Route element={<DashboardLayout />}>
            <Route path="/settings" element={<SettingsPage />} />
          </Route>
        </Route>

        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AppProviders />
    </BrowserRouter>
  )
}
