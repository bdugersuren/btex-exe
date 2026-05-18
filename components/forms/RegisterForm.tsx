'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { registerSchema, RegisterInput } from '@/lib/validators'
import { apiClient } from '@/lib/api/api-client'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'
import Link from 'next/link'

export function RegisterForm() {
  const router = useRouter()
  const [error, setError] = useState('')

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
  })

  const onSubmit = async (data: RegisterInput) => {
    setError('')
    try {
      await apiClient.post('/auth/register', data)
      router.push('/login?registered=1')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Бүртгэл үүсгэхэд алдаа гарлаа')
    }
  }

  return (
    <Card className="bg-white/95 backdrop-blur">
      <h2 className="text-xl font-bold text-gray-900 mb-6 text-center">Бүртгүүлэх</h2>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label="Бүтэн нэр"
          placeholder="Овог нэр"
          error={errors.fullName?.message}
          {...register('fullName')}
        />
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
          placeholder="Хамгийн багадаа 8 тэмдэгт"
          error={errors.password?.message}
          {...register('password')}
        />
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Үүрэг</label>
          <select
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            {...register('role')}
          >
            <option value="STUDENT">Сурагч</option>
            <option value="TEACHER">Багш</option>
          </select>
        </div>
        <Button type="submit" isLoading={isSubmitting} className="w-full">
          Бүртгүүлэх
        </Button>
      </form>

      <p className="mt-4 text-center text-sm text-gray-600">
        Аль хэдийн бүртгэлтэй юу?{' '}
        <Link href="/login" className="text-primary-600 hover:underline font-medium">
          Нэвтрэх
        </Link>
      </p>
    </Card>
  )
}
