import { zodResolver } from '@hookform/resolvers/zod'
import { Building2, Eye, EyeOff, Lock, Mail, ShieldCheck, Sparkles, User } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { Button } from '@/components/ui/Button'
import { signupSchema, type SignupForm } from '@/schemas'
import { signUp } from '@/services/auth.service'
import { useAuthStore } from '@/stores/authStore'

export function SignupPage() {
  const navigate = useNavigate()
  const setUser = useAuthStore((s) => s.setUser)
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignupForm>({ resolver: zodResolver(signupSchema) })

  const onSubmit = async (data: SignupForm) => {
    setLoading(true)
    try {
      const profile = await signUp({
        email: data.email,
        password: data.password,
        name: data.name,
        companyName: data.companyName,
        role: 'admin',
      })
      setUser(profile)
      toast.success('Account created! Your company workspace is ready.')
      navigate('/dashboard')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Signup failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative flex min-h-screen w-full items-center justify-center overflow-y-auto bg-slate-950 px-3 py-6 sm:p-6 lg:p-8 font-sans selection:bg-brand-500 selection:text-white">
      
      {/* High-Tech Background Image */}
      <div 
        className="fixed inset-0 bg-cover bg-center bg-no-repeat transition-all duration-1000 scale-105"
        style={{ backgroundImage: "url('/login1.jpeg')" }}
      />

      {/* Dark Overlay Mask */}
      <div className="fixed inset-0 bg-gradient-to-tr from-slate-950/95 via-slate-950/85 to-slate-900/90 backdrop-blur-xs" />

      {/* Dynamic Animated Glow Orbs */}
      <div className="fixed -top-32 -left-32 h-80 sm:h-96 w-80 sm:w-96 rounded-full bg-brand-600/35 blur-[130px] animate-pulse-glow pointer-events-none" />
      <div className="fixed -bottom-32 -right-32 h-80 sm:h-96 w-80 sm:w-96 rounded-full bg-violet-600/35 blur-[130px] animate-pulse-glow delay-300 pointer-events-none" />

      {/* Main Responsive Card */}
      <div className="relative my-auto w-full max-w-[96vw] sm:max-w-md rounded-2xl sm:rounded-3xl border border-white/20 bg-slate-900/95 sm:bg-slate-900/90 p-5 sm:p-8 shadow-2xl backdrop-blur-2xl transition-all duration-300 animate-fade-in flex flex-col justify-between">
        
        <div>
          {/* Header */}
          <div className="mb-5 sm:mb-6 flex flex-col items-center text-center">
            <div className="relative mb-3 sm:mb-3.5 group">
              <div className="absolute -inset-2 rounded-3xl bg-gradient-to-r from-brand-500 via-indigo-500 to-pink-500 opacity-80 blur-md animate-spin-slow group-hover:opacity-100 transition duration-500" />
              <img
                src="/company_logo1.jpeg"
                onError={(e) => {
                  ;(e.target as HTMLImageElement).src = '/login1.jpeg'
                }}
                alt="Company Logo"
                className="relative h-14 w-14 sm:h-18 sm:w-18 rounded-2xl object-cover shadow-2xl border border-white/30 bg-slate-950 transition-transform duration-300 group-hover:scale-105"
              />
            </div>

            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white uppercase leading-snug text-center">
              ICODED AUTOMATION PVT LTD
            </h1>
            <p className="mt-1 text-[10px] sm:text-xs font-black uppercase tracking-widest text-brand-400 flex items-center justify-center gap-1 animate-pulse">
              <Sparkles className="h-3.5 w-3.5 text-brand-400 shrink-0" />
              CREATE WORKSPACE
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-3.5">
            
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                Full Name *
              </label>
              <div className="relative group">
                <User className="absolute left-3.5 top-3.5 h-4.5 w-4.5 text-slate-400 group-focus-within:text-brand-400 transition-colors pointer-events-none" />
                <input
                  type="text"
                  placeholder="e.g. John Doe"
                  {...register('name')}
                  className="w-full h-11 sm:h-12 rounded-xl border border-white/20 bg-slate-950/95 pl-11 pr-4 text-xs sm:text-sm font-semibold text-white placeholder:text-slate-500 focus:border-brand-500 focus:bg-slate-950 focus:scale-[1.01] focus:outline-none focus:ring-4 focus:ring-brand-500/20 transition-all duration-200"
                />
              </div>
              {errors.name?.message && (
                <p className="mt-1 text-[11px] font-bold text-red-400">{errors.name.message}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                Company Name *
              </label>
              <div className="relative group">
                <Building2 className="absolute left-3.5 top-3.5 h-4.5 w-4.5 text-slate-400 group-focus-within:text-brand-400 transition-colors pointer-events-none" />
                <input
                  type="text"
                  placeholder="e.g. Acme Corporation"
                  {...register('companyName')}
                  className="w-full h-11 sm:h-12 rounded-xl border border-white/20 bg-slate-950/95 pl-11 pr-4 text-xs sm:text-sm font-semibold text-white placeholder:text-slate-500 focus:border-brand-500 focus:bg-slate-950 focus:scale-[1.01] focus:outline-none focus:ring-4 focus:ring-brand-500/20 transition-all duration-200"
                />
              </div>
              {errors.companyName?.message && (
                <p className="mt-1 text-[11px] font-bold text-red-400">{errors.companyName.message}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                Work Email *
              </label>
              <div className="relative group">
                <Mail className="absolute left-3.5 top-3.5 h-4.5 w-4.5 text-slate-400 group-focus-within:text-brand-400 transition-colors pointer-events-none" />
                <input
                  type="email"
                  placeholder="admin@company.com"
                  {...register('email')}
                  className="w-full h-11 sm:h-12 rounded-xl border border-white/20 bg-slate-950/95 pl-11 pr-4 text-xs sm:text-sm font-semibold text-white placeholder:text-slate-500 focus:border-brand-500 focus:bg-slate-950 focus:scale-[1.01] focus:outline-none focus:ring-4 focus:ring-brand-500/20 transition-all duration-200"
                />
              </div>
              {errors.email?.message && (
                <p className="mt-1 text-[11px] font-bold text-red-400">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                Password *
              </label>
              <div className="relative group">
                <Lock className="absolute left-3.5 top-3.5 h-4.5 w-4.5 text-slate-400 group-focus-within:text-brand-400 transition-colors pointer-events-none" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  {...register('password')}
                  className="w-full h-11 sm:h-12 rounded-xl border border-white/20 bg-slate-950/95 pl-11 pr-11 text-xs sm:text-sm font-semibold text-white placeholder:text-slate-500 focus:border-brand-500 focus:bg-slate-950 focus:scale-[1.01] focus:outline-none focus:ring-4 focus:ring-brand-500/20 transition-all duration-200"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((p) => !p)}
                  className="absolute right-3.5 top-3 sm:top-3.5 text-slate-400 hover:text-white p-1 transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
                </button>
              </div>
              {errors.password?.message && (
                <p className="mt-1 text-[11px] font-bold text-red-400">{errors.password.message}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                Confirm Password *
              </label>
              <div className="relative group">
                <Lock className="absolute left-3.5 top-3.5 h-4.5 w-4.5 text-slate-400 group-focus-within:text-brand-400 transition-colors pointer-events-none" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  {...register('confirmPassword')}
                  className="w-full h-11 sm:h-12 rounded-xl border border-white/20 bg-slate-950/95 pl-11 pr-4 text-xs sm:text-sm font-semibold text-white placeholder:text-slate-500 focus:border-brand-500 focus:bg-slate-950 focus:scale-[1.01] focus:outline-none focus:ring-4 focus:ring-brand-500/20 transition-all duration-200"
                />
              </div>
              {errors.confirmPassword?.message && (
                <p className="mt-1 text-[11px] font-bold text-red-400">{errors.confirmPassword.message}</p>
              )}
            </div>

            <Button
              type="submit"
              loading={loading}
              className="w-full h-11 sm:h-12 text-xs sm:text-sm font-extrabold bg-gradient-to-r from-brand-600 via-indigo-600 to-violet-600 hover:from-brand-500 hover:to-violet-500 text-white rounded-xl shadow-xl shadow-brand-600/30 hover:shadow-brand-600/50 hover:scale-[1.01] active:scale-[0.99] transition-all duration-200 uppercase tracking-wider mt-3"
            >
              Create Company Workspace
            </Button>
          </form>
        </div>

        <div className="mt-5">
          <div className="text-center">
            <p className="text-xs sm:text-sm text-slate-300">
              Already have an account?{' '}
              <Link to="/login" className="font-extrabold text-brand-400 hover:text-brand-300 hover:underline transition-colors">
                Sign In
              </Link>
            </p>
          </div>

          <div className="mt-5 flex items-center justify-center gap-1.5 text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-widest pt-4 border-t border-white/10">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
            <span>Secure Multi-Tenant Cloud Architecture</span>
          </div>
        </div>
      </div>
    </div>
  )
}
