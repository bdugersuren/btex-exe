import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth/auth-config'
import { SubmissionList } from '@/components/features/Submission/SubmissionList'
import { Role } from '@/types/enums'

interface Props {
  searchParams: { assignmentId?: string }
}

export default async function SubmissionsPage({ searchParams }: Props) {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')
  if (session.user.role === Role.STUDENT) redirect('/dashboard/upload')

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Тайлангуудын жагсаалт</h1>
      <SubmissionList assignmentId={searchParams.assignmentId} />
    </div>
  )
}
