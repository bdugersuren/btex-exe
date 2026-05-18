import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth/auth-config'
import { VerificationList } from '@/components/features/Evaluation/VerificationList'
import { Role } from '@/types/enums'

export default async function VerificationsPage() {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')
  if (session.user.role !== Role.IV && session.user.role !== Role.TEACHER) {
    redirect('/dashboard/assignments')
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Баталгаажуулалт</h1>
      <p className="text-sm text-gray-500 mb-6">
        Таны хариуцсан нэгжийн нийтлэгдсэн үнэлгээнүүдийг баталгаажуулна уу
      </p>
      <VerificationList />
    </div>
  )
}
