import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { authOptions } from '@/lib/auth/auth-config'
import { Role } from '@/types/enums'
import { StudentSubmissionDetail } from '@/components/features/Submission/StudentSubmissionDetail'

export default async function MySubmissionDetailPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')
  if (session.user.role !== Role.STUDENT) redirect('/dashboard/submissions')

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Link
          href="/dashboard/my-submissions"
          className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
        >
          ← Тайлангууд
        </Link>
        <span className="text-gray-300">|</span>
        <h1 className="text-2xl font-bold text-gray-900">Тайлангийн дэлгэрэнгүй</h1>
      </div>
      <StudentSubmissionDetail id={params.id} />
    </div>
  )
}
