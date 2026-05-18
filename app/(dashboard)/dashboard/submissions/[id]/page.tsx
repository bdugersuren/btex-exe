import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth/auth-config'
import { SubmissionDetail } from '@/components/features/Submission/SubmissionDetail'
import Link from 'next/link'

interface Props {
  params: { id: string }
}

export default async function SubmissionDetailPage({ params }: Props) {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')

  return (
    <div>
      <div className="mb-6">
        <Link href="/dashboard/submissions" className="text-sm text-primary-600 hover:underline">
          ← Жагсаалт руу буцах
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 mt-2">Тайланы дэлгэрэнгүй</h1>
      </div>
      <SubmissionDetail id={params.id} />
    </div>
  )
}
