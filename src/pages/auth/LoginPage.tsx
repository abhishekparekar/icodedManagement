import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { loginSchema, type LoginForm } from '@/schemas'
import { signIn } from '@/services/auth.service'
import { useAuthStore } from '@/stores/authStore'

export function LoginPage() {
  const navigate = useNavigate()
  const setUser = useAuthStore((s) => s.setUser)
  const [loading, setLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({ resolver: zodResolver(loginSchema) })

  const onSubmit = async (data: LoginForm) => {
    setLoading(true)
    try {
      const profile = await signIn(data.email, data.password)
      setUser(profile)
      toast.success('Welcome back!')
      navigate('/dashboard')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-brand-50 via-white to-indigo-50 p-4 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-xl dark:border-slate-800 dark:bg-slate-900">
        <div className="mb-8 flex flex-col items-center text-center">
          <img 
            src="/company_logo1.jpeg" 
            alt="OfficeFlow Logo" 
            className="mb-4 h-16 w-16 rounded-2xl object-cover border border-slate-200 shadow-md dark:border-slate-800"
          />
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">OfficeFlow</h1>
          <p className="text-sm text-slate-500">Sign in to your workspace</p>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input label="Email" type="email" {...register('email')} error={errors.email?.message} />
          <Input label="Password" type="password" {...register('password')} error={errors.password?.message} />
          <Button type="submit" className="w-full" loading={loading}>
            Sign in
          </Button>
        </form>
        <p className="mt-6 text-center text-sm text-slate-500">
          New company?{' '}
          <Link to="/signup" className="font-medium text-brand-600 hover:underline">
            Create account
          </Link>
        </p>
      </div>
    </div>
  )
}
