import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth/auth-config'
import { EvaluationEditor } from '@/components/features/Evaluation/EvaluationEditor'
import Link from 'next/link'
import { Role } from '@/types/enums'

interface Props {
  params: { id: string }
}

export default async function EvaluationDetailPage({ params }: Props) {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')
  if (session.user.role === Role.STUDENT) redirect('/dashboard/evaluations')

  return (
    <div>
      <div className="mb-6">
        <Link href="/dashboard/submissions" className="text-sm text-primary-600 hover:underline">
          ← Тайлан руу буцах
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 mt-2">Үнэлгээ засах / нийтлэх</h1>
      </div>
      <EvaluationEditor id={params.id} />
    </div>
  )
}
