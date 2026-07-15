import { Database } from 'lucide-react'
import { useState } from 'react'
import toast from 'react-hot-toast'
import { Button } from '@/components/ui/Button'
import { seedDemoData } from '@/services/seed.service'
import { useAuthStore } from '@/stores/authStore'
import { useDataStore } from '@/stores/dataStore'

export function SeedDemoButton() {
  const user = useAuthStore((s) => s.user)
  const employees = useDataStore((s) => s.employees)
  const [loading, setLoading] = useState(false)

  if (!user || user.role !== 'admin' || employees.length > 1) return null

  const handleSeed = async () => {
    setLoading(true)
    try {
      await seedDemoData(user)
      toast.success('Demo data loaded!')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Seed failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button variant="secondary" onClick={handleSeed} loading={loading}>
      <Database className="h-4 w-4" />
      Load sample data
    </Button>
  )
}
