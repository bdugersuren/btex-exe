import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth/auth-config'
import { Role } from '@/types/enums'
import { StudentSubmissionList } from '@/components/features/Submission/StudentSubmissionList'

export default async function MySubmissionsPage() {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')
  if (session.user.role !== Role.STUDENT) redirect('/dashboard/submissions')

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Миний тайлангууд</h1>
      <StudentSubmissionList />
    </div>
  )
}
