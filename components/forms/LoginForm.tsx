'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { loginSchema, LoginInput } from '@/lib/validators'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'
import Link from 'next/link'

export function LoginForm() {
  const router = useRouter()
  const [error, setError] = useState('')

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (data: LoginInput) => {
    setError('')
    const result = await signIn('credentials', {
      email:    data.email,
      password: data.password,
      redirect: false,
    })

    if (result?.error) {
      setError(
        result.error === 'INACTIVE_USER'
          ? 'Таны эрх идэвхжүүлэгдэлгүй байна. Lead IV-тэй холбогдоно уу.'
          : 'Имэйл эсвэл нууц үг буруу байна'
      )
      return
    }

    router.push('/dashboard/assignments')
    router.refresh()
  }

  return (
    <Card className="bg-white/95 backdrop-blur">
      <h2 className="text-xl font-bold text-gray-900 mb-6 text-center">Нэвтрэх</h2>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label="Имэйл хаяг"
          type="email"
          placeholder="email@example.com"
          error={errors.email?.message}
          {...register('email')}
        />
        <Input
          label="Нууц үг"
          type="password"
          placeholder="••••••••"
          error={errors.password?.message}
          {...register('password')}
        />
        <Button type="submit" isLoading={isSubmitting} className="w-full">
          Нэвтрэх
        </Button>
      </form>

      <p className="mt-4 text-center text-sm text-gray-600">
        Бүртгэл байхгүй юу?{' '}
        <Link href="/register" className="text-primary-600 hover:underline font-medium">
          Бүртгүүлэх
        </Link>
      </p>
    </Card>
  )
}
