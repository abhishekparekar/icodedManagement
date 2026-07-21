import {
  Building2,
  Check,
  Copy,
  Landmark,
  Mail,
  Moon,
  Palette,
  ShieldCheck,
  Sun,
  User,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card, CardHeader } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Tabs } from '@/components/ui/Tabs'
import { updateDoc, doc } from 'firebase/firestore'
import { updateProfile } from 'firebase/auth'
import { auth, db, COLLECTIONS } from '@/lib/firebase'
import { getCompanyProfile, saveCompanyProfile } from '@/services/quotations.service'
import { useAuthStore } from '@/stores/authStore'
import { useThemeStore } from '@/stores/themeStore'
import type { CompanyProfile } from '@/types'

const TABS = [
  { value: 'profile',   label: 'Profile & Account', icon: <User className="h-4 w-4" /> },
  { value: 'company',   label: 'Company & Office', icon: <Building2 className="h-4 w-4" /> },
  { value: 'banking',   label: 'Bank & Financials', icon: <Landmark className="h-4 w-4" /> },
  { value: 'workspace', label: 'Theme & Security',  icon: <Palette className="h-4 w-4" /> },
]

export function SettingsPage() {
  const user = useAuthStore((s) => s.user)
  const setUser = useAuthStore((s) => s.setUser)
  const { dark, toggle } = useThemeStore()

  const [activeTab, setActiveTab] = useState('profile')
  const [savingProfile, setSavingProfile] = useState(false)
  const [savingCompany, setSavingCompany] = useState(false)
  const [copiedTenantId, setCopiedTenantId] = useState(false)

  // Profile Form State
  const [name, setName] = useState(user?.name ?? '')
  const [companyName, setCompanyName] = useState(user?.companyName ?? '')

  // Company & Banking State
  const [companyInfo, setCompanyInfo] = useState<Partial<CompanyProfile>>({
    name: user?.companyName ?? 'My Enterprise',
    address: '123 Tech Park, Off MG Road',
    city: 'Mumbai, Maharashtra',
    phone: '+91 98765 43210',
    email: user?.email ?? 'contact@enterprise.com',
    website: 'https://enterprise.in',
    taxId: '27AAAAA0000A1Z5',
    about: 'Leading Provider of Software & Technology Solutions',
    bankDetails: {
      bankName: 'HDFC Bank Ltd',
      accountName: user?.companyName ?? 'Enterprise Solutions Pvt Ltd',
      accountNumber: '50200012345678',
      ifscCode: 'HDFC0001234',
      branchName: 'BKC Branch, Mumbai',
      upiId: 'enterprise@hdfcbank',
    },
    defaultCurrency: 'INR',
  })

  // Fetch company profile on load
  useEffect(() => {
    if (!user?.tenantId) return
    getCompanyProfile(user.tenantId)
      .then((profile) => {
        if (profile) {
          setCompanyInfo(profile)
        }
      })
      .catch((err) => console.error('[SettingsPage] Error fetching company profile:', err))
  }, [user?.tenantId])

  // Save User Profile
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return
    if (!name.trim()) { toast.error('Name cannot be blank'); return }
    if (!companyName.trim()) { toast.error('Company name cannot be blank'); return }

    setSavingProfile(true)
    try {
      await updateDoc(doc(db, COLLECTIONS.users, user.uid), {
        name: name.trim(),
        companyName: companyName.trim(),
      })
      if (auth.currentUser) {
        await updateProfile(auth.currentUser, { displayName: name.trim() })
      }
      setUser({ ...user, name: name.trim(), companyName: companyName.trim() })
      toast.success('Profile updated successfully')
    } catch (err) {
      console.error(err)
      toast.error(err instanceof Error ? err.message : 'Failed to update profile')
    } finally {
      setSavingProfile(false)
    }
  }

  // Save Company & Banking Details
  const handleSaveCompany = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user?.tenantId) return

    setSavingCompany(true)
    try {
      await saveCompanyProfile(user.tenantId, {
        name: companyInfo.name || companyName || 'Enterprise',
        address: companyInfo.address || '',
        city: companyInfo.city || '',
        phone: companyInfo.phone || '',
        email: companyInfo.email || '',
        website: companyInfo.website || '',
        logoUrl: companyInfo.logoUrl || '',
        taxId: companyInfo.taxId || '',
        about: companyInfo.about || '',
        bankDetails: {
          bankName: companyInfo.bankDetails?.bankName || '',
          accountName: companyInfo.bankDetails?.accountName || '',
          accountNumber: companyInfo.bankDetails?.accountNumber || '',
          ifscCode: companyInfo.bankDetails?.ifscCode || '',
          branchName: companyInfo.bankDetails?.branchName || '',
          upiId: companyInfo.bankDetails?.upiId || '',
        },
        defaultCurrency: 'INR',
        defaultAccentColor: '#2563eb',
        defaultTheme: 'modern',
        defaultNotes: 'Thank you for your business.',
      })
      toast.success('Company & Financial settings saved successfully')
    } catch (err) {
      console.error(err)
      toast.error(err instanceof Error ? err.message : 'Failed to save settings')
    } finally {
      setSavingCompany(false)
    }
  }

  const copyTenantId = () => {
    if (!user?.tenantId) return
    navigator.clipboard.writeText(user.tenantId)
    setCopiedTenantId(true)
    toast.success('Tenant Security ID copied')
    setTimeout(() => setCopiedTenantId(false), 2000)
  }

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      
      {/* Top Header Card */}
      <Card className="!p-5 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white border-0 shadow-lg">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Avatar name={user?.name ?? 'U'} size="lg" className="h-14 w-14 ring-4 ring-white/10" />
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                {user?.name}
                <Badge className="bg-brand-500/20 text-brand-300 border border-brand-500/30 uppercase text-[10px] font-black">
                  {user?.role}
                </Badge>
              </h2>
              <p className="text-xs text-slate-300 flex items-center gap-1 mt-0.5">
                <Mail className="h-3.5 w-3.5 text-slate-400" /> {user?.email}
              </p>
              <p className="text-[11px] text-slate-400 mt-1">
                Workspace: <strong className="text-white">{user?.companyName}</strong>
              </p>
            </div>
          </div>

          <button
            onClick={copyTenantId}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-semibold text-white transition-all shrink-0"
          >
            {copiedTenantId ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5 text-slate-300" />}
            <span>ID: {user?.tenantId?.slice(0, 12)}...</span>
          </button>
        </div>
      </Card>

      {/* Tabs Switcher */}
      <Tabs tabs={TABS} active={activeTab} onChange={setActiveTab} />

      {/* ── 1. Profile & Account ── */}
      {activeTab === 'profile' && (
        <Card>
          <CardHeader title="Personal Profile Settings" subtitle="Update your display name and account details" />
          <form onSubmit={handleSaveProfile} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Full Name *"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your full name"
                required
              />
              <Input
                label="Company / Enterprise Name *"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="Company name"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Registered Account Email
              </label>
              <div className="relative">
                <Input value={user?.email ?? ''} disabled className="opacity-60 bg-slate-100 dark:bg-slate-800" />
                <Badge className="absolute right-3 top-2 bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 text-[10px] font-bold">
                  Verified
                </Badge>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Email address is linked to your Firebase Authentication login.
              </p>
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-100 dark:border-slate-800">
              <Button type="submit" loading={savingProfile} className="h-9 text-xs font-bold bg-gradient-to-r from-brand-600 to-violet-600 text-white shadow-md">
                Save Profile Changes
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* ── 2. Company & Office ── */}
      {activeTab === 'company' && (
        <Card>
          <CardHeader title="Company & Office Branding" subtitle="Organization details printed on bills and quotations" />
          <form onSubmit={handleSaveCompany} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Organization Name *"
                value={companyInfo.name || ''}
                onChange={(e) => setCompanyInfo({ ...companyInfo, name: e.target.value })}
                placeholder="Enterprise Solutions Pvt Ltd"
                required
              />
              <Input
                label="GST / Tax Identification Number (GSTIN)"
                value={companyInfo.taxId || ''}
                onChange={(e) => setCompanyInfo({ ...companyInfo, taxId: e.target.value })}
                placeholder="e.g. 27AAAAA0000A1Z5"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Contact Phone"
                value={companyInfo.phone || ''}
                onChange={(e) => setCompanyInfo({ ...companyInfo, phone: e.target.value })}
                placeholder="+91 98765 43210"
              />
              <Input
                label="Support / Billing Email"
                value={companyInfo.email || ''}
                onChange={(e) => setCompanyInfo({ ...companyInfo, email: e.target.value })}
                placeholder="billing@enterprise.com"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Office Street Address
              </label>
              <input
                type="text"
                value={companyInfo.address || ''}
                onChange={(e) => setCompanyInfo({ ...companyInfo, address: e.target.value })}
                placeholder="123 Tech Park, Off MG Road"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="City & State"
                value={companyInfo.city || ''}
                onChange={(e) => setCompanyInfo({ ...companyInfo, city: e.target.value })}
                placeholder="Mumbai, Maharashtra"
              />
              <Input
                label="Website URL"
                value={companyInfo.website || ''}
                onChange={(e) => setCompanyInfo({ ...companyInfo, website: e.target.value })}
                placeholder="https://enterprise.com"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Company Tagline / Invoice Header Note
              </label>
              <textarea
                rows={2}
                value={companyInfo.about || ''}
                onChange={(e) => setCompanyInfo({ ...companyInfo, about: e.target.value })}
                placeholder="Leading provider of IT & Corporate Management Services"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              />
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-100 dark:border-slate-800">
              <Button type="submit" loading={savingCompany} className="h-9 text-xs font-bold bg-gradient-to-r from-brand-600 to-violet-600 text-white shadow-md">
                Save Company Info
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* ── 3. Bank & Financials ── */}
      {activeTab === 'banking' && (
        <Card>
          <CardHeader title="Bank & UPI Payment Details" subtitle="Pre-filled on Bills, Invoices & Quotations for customer payments" />
          <form onSubmit={handleSaveCompany} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Bank Name *"
                value={companyInfo.bankDetails?.bankName || ''}
                onChange={(e) =>
                  setCompanyInfo({
                    ...companyInfo,
                    bankDetails: { ...(companyInfo.bankDetails as any), bankName: e.target.value },
                  })
                }
                placeholder="e.g. HDFC Bank Ltd"
              />
              <Input
                label="Account Beneficiary Name *"
                value={companyInfo.bankDetails?.accountName || ''}
                onChange={(e) =>
                  setCompanyInfo({
                    ...companyInfo,
                    bankDetails: { ...(companyInfo.bankDetails as any), accountName: e.target.value },
                  })
                }
                placeholder="e.g. Enterprise Solutions Pvt Ltd"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Bank Account Number *"
                value={companyInfo.bankDetails?.accountNumber || ''}
                onChange={(e) =>
                  setCompanyInfo({
                    ...companyInfo,
                    bankDetails: { ...(companyInfo.bankDetails as any), accountNumber: e.target.value },
                  })
                }
                placeholder="e.g. 50200012345678"
              />
              <Input
                label="IFSC Code *"
                value={companyInfo.bankDetails?.ifscCode || ''}
                onChange={(e) =>
                  setCompanyInfo({
                    ...companyInfo,
                    bankDetails: { ...(companyInfo.bankDetails as any), ifscCode: e.target.value },
                  })
                }
                placeholder="e.g. HDFC0001234"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Branch Location"
                value={companyInfo.bankDetails?.branchName || ''}
                onChange={(e) =>
                  setCompanyInfo({
                    ...companyInfo,
                    bankDetails: { ...(companyInfo.bankDetails as any), branchName: e.target.value },
                  })
                }
                placeholder="BKC Branch, Mumbai"
              />
              <Input
                label="UPI ID / VPA (for instant payments)"
                value={companyInfo.bankDetails?.upiId || ''}
                onChange={(e) =>
                  setCompanyInfo({
                    ...companyInfo,
                    bankDetails: { ...(companyInfo.bankDetails as any), upiId: e.target.value },
                  })
                }
                placeholder="enterprise@hdfcbank"
              />
            </div>

            <div className="rounded-2xl border border-slate-200/80 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-900/50 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Default Currency</p>
                <p className="text-[11px] text-slate-400">All prices and reports formatted in Indian Rupees</p>
              </div>
              <Badge className="bg-emerald-50 text-emerald-600 border border-emerald-200 dark:bg-emerald-950/40 text-xs font-black px-3 py-1">
                INR (₹) Rupees
              </Badge>
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-100 dark:border-slate-800">
              <Button type="submit" loading={savingCompany} className="h-9 text-xs font-bold bg-gradient-to-r from-brand-600 to-violet-600 text-white shadow-md">
                Save Bank Details
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* ── 4. Theme & Security ── */}
      {activeTab === 'workspace' && (
        <div className="space-y-4">
          <Card>
            <CardHeader title="Appearance & Dark Mode" subtitle="Customize UI theme preferences" />
            <div className="flex items-center justify-between rounded-2xl border border-slate-200/90 p-4 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-brand-50 dark:bg-slate-800">
                  {dark ? <Moon className="h-5 w-5 text-brand-600 dark:text-brand-400" /> : <Sun className="h-5 w-5 text-amber-500" />}
                </div>
                <div>
                  <p className="font-bold text-slate-900 dark:text-white text-xs">
                    {dark ? 'Dark Theme Active' : 'Light Theme Active'}
                  </p>
                  <p className="text-[11px] text-slate-400">Toggle dark mode interface styling</p>
                </div>
              </div>
              <button
                type="button"
                onClick={toggle}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  dark ? 'bg-brand-600' : 'bg-slate-300'
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
            <CardHeader title="Security & Tenant Authorization" subtitle="Security credentials and role access" />
            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-800">
                <span className="font-semibold text-slate-500">Tenant Workspace ID</span>
                <span className="font-mono text-xs font-bold text-slate-800 dark:text-slate-200">{user?.tenantId}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-800">
                <span className="font-semibold text-slate-500">Assigned Permission Role</span>
                <Badge className="uppercase text-[10px] font-black bg-brand-50 text-brand-600 border border-brand-200 dark:bg-brand-950/40 dark:text-brand-400">
                  {user?.role}
                </Badge>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-800">
                <span className="font-semibold text-slate-500">Security Encryption</span>
                <span className="font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <ShieldCheck className="h-4 w-4" /> Firebase Multi-Tenant Isolation
                </span>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
