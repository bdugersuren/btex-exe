import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth/auth-config'
import { VerifierManager } from '@/components/features/Assignment/VerifierManager'
import { Role } from '@/types/enums'
import Link from 'next/link'

interface Props {
  params: { id: string }
}

export default async function AssignmentDetailPage({ params }: Props) {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')
  if (session.user.role !== Role.ADMIN && session.user.role !== Role.LEAD_IV) {
    redirect('/dashboard/assignments')
  }

  return (
    <div>
      <div className="mb-6">
        <Link href="/dashboard/assignments" className="text-sm text-primary-600 hover:underline">
          ← Даалгаваруудад буцах
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 mt-2">Unit Удирдлага</h1>
        <p className="text-sm text-gray-500 mt-1">
          Удирдах багш болон Internal Verifier-ийг оноох
        </p>
      </div>
      <div className="max-w-xl">
        <VerifierManager assignmentId={params.id} />
      </div>
    </div>
  )
}
