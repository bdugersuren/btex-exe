'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Role } from '@/types/enums'

interface NavItem {
  href:   string
  label:  string
  icon:   string
  roles:  Role[]
}

const navItems: NavItem[] = [
  { href: '/dashboard/assignments',    label: 'Даалгаварууд',      icon: '📋', roles: [Role.ADMIN, Role.LEAD_IV, Role.IV, Role.TEACHER, Role.STUDENT] },
  { href: '/dashboard/submissions',    label: 'Тайлангууд',        icon: '📁', roles: [Role.ADMIN, Role.LEAD_IV, Role.IV, Role.TEACHER] },
  { href: '/dashboard/verifications',  label: 'Баталгаажуулалт',   icon: '✅', roles: [Role.IV, Role.TEACHER] },
  { href: '/dashboard/users',          label: 'Хэрэглэгчид',       icon: '👥', roles: [Role.ADMIN, Role.LEAD_IV] },
  { href: '/dashboard/upload',         label: 'Тайлан илгээх',     icon: '📤', roles: [Role.STUDENT] },
  { href: '/dashboard/my-submissions', label: 'Миний тайлангууд',  icon: '📝', roles: [Role.STUDENT] },
]

interface SidebarProps {
  role: Role
}

export function Sidebar({ role }: SidebarProps) {
  const pathname = usePathname()

  const filtered = navItems.filter((item) => item.roles.includes(role))

  return (
    <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
      <div className="p-6 border-b border-gray-200">
        <h1 className="text-lg font-bold text-primary-700">BTEC Evaluator</h1>
        <p className="text-xs text-gray-500 mt-1">IT Assignment System</p>
      </div>
      <nav className="flex-1 p-4 space-y-1">
        {filtered.map((item) => {
          const isActive = pathname.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-primary-50 text-primary-700'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <span>{item.icon}</span>
              {item.label}
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
