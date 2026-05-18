import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth/auth-config'
import { UserList } from '@/components/features/User/UserList'
import { Role } from '@/types/enums'

export default async function UsersPage() {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')
  if (session.user.role !== Role.ADMIN && session.user.role !== Role.LEAD_IV) {
    redirect('/dashboard/assignments')
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Хэрэглэгч удирдлага</h1>
      <p className="text-sm text-gray-500 mb-6">
        Багш, сурагч болон Internal Verifier-ийн эрх, бүртгэлийг удирдана уу.
        IV-г тодорхой хичээлд томилохын тулд <a href="/dashboard/assignments" className="text-primary-600 hover:underline">Даалгаварууд</a>-с assignment-ийн "👤 IV" товчийг дарна уу.
      </p>
      <UserList />
    </div>
  )
}
