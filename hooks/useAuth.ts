'use client'

import { useSession, signOut } from 'next-auth/react'
import { useAuthStore } from '@/store/auth-store'
import { useEffect } from 'react'
import { Role } from '@/types/enums'

export function useAuth() {
  const { data: session, status } = useSession()
  const { setUser, clearUser } = useAuthStore()

  useEffect(() => {
    if (session?.user) {
      setUser({
        id:        session.user.id,
        email:     session.user.email!,
        fullName:  session.user.fullName,
        role:      session.user.role,
        createdAt: '',
        updatedAt: '',
      })
    } else {
      clearUser()
    }
  }, [session, setUser, clearUser])

  return {
    user:          session?.user ?? null,
    isLoading:     status === 'loading',
    isAuthenticated: status === 'authenticated',
    isTeacher:     session?.user?.role === Role.TEACHER,
    isStudent:     session?.user?.role === Role.STUDENT,
    isAdmin:       session?.user?.role === Role.ADMIN,
    isLeadIv:      session?.user?.role === Role.LEAD_IV,
    isIv:          session?.user?.role === Role.IV,
    signOut:       () => signOut({ callbackUrl: '/login' }),
  }
}
