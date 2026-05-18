import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/auth-config'
import { AssignmentList } from '@/components/features/Assignment/AssignmentList'

export default async function AssignmentsPage() {
  const session = await getServerSession(authOptions)

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Даалгаварууд</h1>
      <AssignmentList role={session!.user.role} />
    </div>
  )
}
