'use client'

import { signOut } from 'next-auth/react'
import { GRADE_LABELS } from '@/lib/constants'
import { Role } from '@/types/enums'

interface NavbarProps {
  user: { id: string; email: string; fullName: string; role: Role }
}

const roleLabels: Record<string, string> = {
  ADMIN:   'Администратор',
  LEAD_IV: 'Lead IV',
  IV:      'Internal Verifier',
  TEACHER: 'Багш',
  STUDENT: 'Сурагч',
}

export function Navbar({ user }: NavbarProps) {
  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
      <div />
      <div className="flex items-center gap-4">
        <div className="text-right">
          <p className="text-sm font-medium text-gray-900">{user.fullName}</p>
          <p className="text-xs text-gray-500">{roleLabels[user.role]}</p>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="text-sm text-gray-600 hover:text-gray-900 border border-gray-300 rounded-lg px-3 py-1.5 hover:bg-gray-50 transition-colors"
        >
          Гарах
        </button>
      </div>
    </header>
  )
}
