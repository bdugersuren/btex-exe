import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth/auth-config'
import { Sidebar } from '@/components/layouts/Sidebar'
import { Navbar } from '@/components/layouts/Navbar'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar role={session.user.role} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Navbar user={session.user} />
        <main className="flex-1 overflow-auto p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
