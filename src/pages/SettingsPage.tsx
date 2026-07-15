import { zodResolver } from '@hookform/resolvers/zod'
import { Building2, Moon, Sun, User } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { z } from 'zod'
import { Avatar } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'
import { Card, CardHeader } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Tabs } from '@/components/ui/Tabs'
import { updateDoc, doc } from 'firebase/firestore'
import { updateProfile } from 'firebase/auth'
import { auth, db, COLLECTIONS } from '@/lib/firebase'
import { useAuthStore } from '@/stores/authStore'
import { useThemeStore } from '@/stores/themeStore'

const profileSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  companyName: z.string().min(2, 'Company name is required'),
})
type ProfileForm = z.infer<typeof profileSchema>

const TABS = [
  { value: 'profile', label: 'Profile', icon: <User className="h-4 w-4" /> },
  { value: 'workspace', label: 'Workspace', icon: <Building2 className="h-4 w-4" /> },
]

export function SettingsPage() {
  const user = useAuthStore((s) => s.user)
  const setUser = useAuthStore((s) => s.setUser)
  const { dark, toggle } = useThemeStore()
  const [tab, setTab] = useState('profile')
  const [saving, setSaving] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user?.name ?? '',
      companyName: user?.companyName ?? '',
    },
  })

  const onSaveProfile = async (data: ProfileForm) => {
    if (!user) return
    setSaving(true)
    try {
      await updateDoc(doc(db, COLLECTIONS.users, user.uid), {
        name: data.name,
        companyName: data.companyName,
      })
      if (auth.currentUser) {
        await updateProfile(auth.currentUser, { displayName: data.name })
      }
      setUser({ ...user, name: data.name, companyName: data.companyName })
      toast.success('Profile updated')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Update failed')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Tabs tabs={TABS} active={tab} onChange={setTab} />

      {tab === 'profile' && (
        <Card>
          <CardHeader title="Profile" subtitle="Update your personal information" />
          <div className="mb-6 flex items-center gap-4">
            <Avatar name={user?.name ?? 'U'} size="lg" />
            <div>
              <p className="font-semibold text-slate-900 dark:text-white">{user?.name}</p>
              <p className="text-sm text-slate-500">{user?.email}</p>
              <span className="mt-1 inline-block rounded-full bg-brand-100 px-2 py-0.5 text-xs font-medium capitalize text-brand-700 dark:bg-brand-900/40 dark:text-brand-300">
                {user?.role}
              </span>
            </div>
          </div>
          <form onSubmit={handleSubmit(onSaveProfile)} className="space-y-4">
            <Input label="Full name" {...register('name')} error={errors.name?.message} />
            <Input
              label="Company name"
              {...register('companyName')}
              error={errors.companyName?.message}
            />
            <Input label="Email" value={user?.email ?? ''} disabled className="opacity-60" />
            <p className="text-xs text-slate-400">
              Email cannot be changed. Contact support if needed.
            </p>
            <div className="flex justify-end">
              <Button type="submit" loading={saving}>
                Save changes
              </Button>
            </div>
          </form>
        </Card>
      )}

      {tab === 'workspace' && (
        <div className="space-y-4">
          <Card>
            <CardHeader title="Appearance" subtitle="Customize your workspace look" />
            <div className="flex items-center justify-between rounded-lg border border-slate-200 p-4 dark:border-slate-700">
              <div className="flex items-center gap-3">
                {dark ? (
                  <Moon className="h-5 w-5 text-slate-500" />
                ) : (
                  <Sun className="h-5 w-5 text-slate-500" />
                )}
                <div>
                  <p className="font-medium text-slate-900 dark:text-white">
                    {dark ? 'Dark mode' : 'Light mode'}
                  </p>
                  <p className="text-sm text-slate-500">Toggle between light and dark theme</p>
                </div>
              </div>
              <button
                onClick={toggle}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  dark ? 'bg-brand-600' : 'bg-slate-200'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                    dark ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </Card>

          <Card>
            <CardHeader title="Workspace info" subtitle="Your tenant details" />
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">Company</span>
                <span className="font-medium text-slate-900 dark:text-white">
                  {user?.companyName}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Tenant ID</span>
                <span className="font-mono text-xs text-slate-500">{user?.tenantId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Your role</span>
                <span className="font-medium capitalize text-slate-900 dark:text-white">
                  {user?.role}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Member since</span>
                <span className="text-slate-900 dark:text-white">
                  {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : '—'}
                </span>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
