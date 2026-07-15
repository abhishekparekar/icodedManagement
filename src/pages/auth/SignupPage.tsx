import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { signupSchema, type SignupForm } from '@/schemas'
import { signUp } from '@/services/auth.service'
import { useAuthStore } from '@/stores/authStore'

export function SignupPage() {
  const navigate = useNavigate()
  const setUser = useAuthStore((s) => s.setUser)
  const [loading, setLoading] = useState(false)

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
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-brand-50 via-white to-indigo-50 p-4 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-xl dark:border-slate-800 dark:bg-slate-900">
        <div className="mb-8 flex flex-col items-center text-center">
          <img 
            src="/company_logo1.jpeg" 
            alt="OfficeFlow Logo" 
            className="mb-4 h-16 w-16 rounded-2xl object-cover border border-slate-200 shadow-md dark:border-slate-800"
          />
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Create workspace</h1>
          <p className="text-sm text-slate-500">Start your multi-tenant office management</p>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input label="Full name" {...register('name')} error={errors.name?.message} />
          <Input label="Company name" {...register('companyName')} error={errors.companyName?.message} />
          <Input label="Email" type="email" {...register('email')} error={errors.email?.message} />
          <Input label="Password" type="password" {...register('password')} error={errors.password?.message} />
          <Input
            label="Confirm password"
            type="password"
            {...register('confirmPassword')}
            error={errors.confirmPassword?.message}
          />
          <Button type="submit" className="w-full" loading={loading}>
            Create account
          </Button>
        </form>
        <p className="mt-6 text-center text-sm text-slate-500">
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-brand-600 hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
