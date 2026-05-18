'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Role } from '@/types/enums'
import { useUsers, useCreateUser, useToggleUserActive, useChangeUserRole, UserItem } from '@/hooks/useUsers'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'

// ─── Тогтмол утгууд ────────────────────────────────────────────────
const ROLE_LABELS: Record<string, string> = {
  TEACHER: 'Багш',
  STUDENT: 'Сурагч',
  IV:      'Internal Verifier',
}

const ROLE_BADGE: Record<string, string> = {
  TEACHER: 'bg-blue-100 text-blue-700',
  STUDENT: 'bg-green-100 text-green-700',
  IV:      'bg-purple-100 text-purple-700',
}

const TABS = [
  { label: 'Бүгд',               role: undefined       },
  { label: 'Багш нар',           role: Role.TEACHER    },
  { label: 'Сурагчид',           role: Role.STUDENT    },
  { label: 'Internal Verifier',  role: Role.IV         },
]

// ─── Хэрэглэгч үүсгэх форм ─────────────────────────────────────────
interface CreateFormState {
  fullName: string
  email:    string
  password: string
  role:     string
}

function CreateUserModal({ onClose }: { onClose: () => void }) {
  const createUser = useCreateUser()
  const [form, setForm] = useState<CreateFormState>({
    fullName: '',
    email:    '',
    password: '',
    role:     'TEACHER',
  })
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    try {
      await createUser.mutateAsync(form)
      onClose()
    } catch (err) {
      const msg = (err as { response?: { data?: { error?: { message?: string } } } })
        ?.response?.data?.error?.message
      setError(msg ?? 'Алдаа гарлаа')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="Бүтэн нэр"
        placeholder="Дорж Батаа"
        value={form.fullName}
        onChange={(e) => setForm({ ...form, fullName: e.target.value })}
        required
      />
      <Input
        label="Имэйл хаяг"
        type="email"
        placeholder="user@school.edu"
        value={form.email}
        onChange={(e) => setForm({ ...form, email: e.target.value })}
        required
      />
      <Input
        label="Нууц үг"
        type="password"
        placeholder="Хамгийн багадаа 8 тэмдэгт"
        value={form.password}
        onChange={(e) => setForm({ ...form, password: e.target.value })}
        required
      />
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Дүр</label>
        <select
          value={form.role}
          onChange={(e) => setForm({ ...form, role: e.target.value })}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          <option value="TEACHER">Багш</option>
          <option value="STUDENT">Сурагч</option>
          <option value="IV">Internal Verifier</option>
        </select>
      </div>
      {form.role !== 'IV' && (
        <p className="text-xs text-yellow-700 bg-yellow-50 border border-yellow-200 rounded-lg px-3 py-2">
          ⚠ Багш болон сурагчийн бүртгэл идэвхгүй байдлаар үүснэ. Та идэвхжүүлэлт хийснээр тухайн хэрэглэгч нэвтрэх боломжтой болно.
        </p>
      )}
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="flex gap-3 justify-end pt-2">
        <Button type="button" variant="secondary" onClick={onClose}>Болих</Button>
        <Button type="submit" isLoading={createUser.isLoading}>Үүсгэх</Button>
      </div>
    </form>
  )
}

// ─── Хэрэглэгчийн мөр ──────────────────────────────────────────────
function UserRow({ user }: { user: UserItem }) {
  const toggle     = useToggleUserActive()
  const changeRole = useChangeUserRole()
  const [roleEdit, setRoleEdit] = useState(false)
  const [newRole, setNewRole]   = useState(user.role)

  const handleRoleSave = async () => {
    if (newRole === user.role) { setRoleEdit(false); return }
    await changeRole.mutateAsync({ id: user.id, role: newRole })
    setRoleEdit(false)
  }

  return (
    <tr className="hover:bg-gray-50">
      {/* Нэр + имэйл */}
      <td className="px-4 py-3">
        <p className="font-medium text-gray-900">{user.fullName}</p>
        <p className="text-xs text-gray-400">{user.email}</p>
      </td>

      {/* Дүр */}
      <td className="px-4 py-3">
        {roleEdit ? (
          <div className="flex items-center gap-2">
            <select
              value={newRole}
              onChange={(e) => setNewRole(e.target.value as Role)}
              className="border border-gray-300 rounded px-2 py-1 text-xs"
            >
              <option value="TEACHER">Багш</option>
              <option value="STUDENT">Сурагч</option>
              <option value="IV">IV</option>
            </select>
            <button onClick={handleRoleSave} className="text-xs text-primary-600 font-medium">
              Хадгалах
            </button>
            <button onClick={() => setRoleEdit(false)} className="text-xs text-gray-400">
              Болих
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${ROLE_BADGE[user.role] ?? ''}`}>
              {ROLE_LABELS[user.role] ?? user.role}
            </span>
            <button
              onClick={() => setRoleEdit(true)}
              className="text-xs text-gray-400 hover:text-gray-600"
              title="Дүр өөрчлөх"
            >
              ✏
            </button>
          </div>
        )}
      </td>

      {/* IV томилолт холбоос */}
      <td className="px-4 py-3">
        {user.role === Role.IV ? (
          <span className="text-xs text-gray-400 italic">Assignments-аас томилно</span>
        ) : user.role === Role.TEACHER ? (
          <Link href="/dashboard/assignments" className="text-xs text-primary-600 hover:underline">
            Assignments харах →
          </Link>
        ) : (
          <span className="text-xs text-gray-300">—</span>
        )}
      </td>

      {/* Бүртгэлийн огноо */}
      <td className="px-4 py-3 text-sm text-gray-500">
        {new Date(user.createdAt).toLocaleDateString('mn-MN')}
      </td>

      {/* Төлөв */}
      <td className="px-4 py-3">
        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
          user.isActive ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
        }`}>
          {user.isActive ? 'Идэвхтэй' : 'Хүлээгдэж байна'}
        </span>
      </td>

      {/* Үйлдэл */}
      <td className="px-4 py-3">
        <button
          onClick={() => toggle.mutate({ id: user.id, isActive: !user.isActive })}
          disabled={toggle.isLoading}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors disabled:opacity-50 ${
            user.isActive
              ? 'bg-red-50 text-red-700 hover:bg-red-100 border border-red-200'
              : 'bg-green-50 text-green-700 hover:bg-green-100 border border-green-200'
          }`}
        >
          {user.isActive ? 'Хаах' : 'Идэвхжүүлэх'}
        </button>
      </td>
    </tr>
  )
}

// ─── Үндсэн компонент ───────────────────────────────────────────────
export function UserList() {
  const [activeRole, setActiveRole] = useState<Role | undefined>(undefined)
  const [page, setPage]             = useState(1)
  const [showCreate, setShowCreate] = useState(false)

  const { data, isLoading, error } = useUsers(activeRole, page)

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex gap-2 flex-wrap">
          {TABS.map((t) => (
            <button
              key={t.label}
              onClick={() => { setActiveRole(t.role); setPage(1) }}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeRole === t.role
                  ? 'bg-primary-600 text-white'
                  : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              {t.label}
              {data && t.role === undefined && (
                <span className="ml-2 text-xs opacity-70">({data.total})</span>
              )}
            </button>
          ))}
        </div>
        <Button onClick={() => setShowCreate(true)}>+ Шинэ хэрэглэгч</Button>
      </div>

      {/* Хүснэгт */}
      {isLoading ? (
        <div className="text-center py-12 text-gray-500">Ачаалж байна...</div>
      ) : error ? (
        <div className="text-center py-12 text-red-500">Алдаа гарлаа. Дахин оролдоно уу.</div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Нэр / Имэйл</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Дүр</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">IV / Хичээл</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Бүртгэлийн огноо</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Төлөв</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Үйлдэл</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {!data?.items.length && (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-gray-400">
                    Хэрэглэгч олдсонгүй
                  </td>
                </tr>
              )}
              {data?.items.map((user) => (
                <UserRow key={user.id} user={user} />
              ))}
            </tbody>
          </table>

          {data && data.totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 bg-gray-50">
              <span className="text-sm text-gray-500">Нийт {data.total} хэрэглэгч</span>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-3 py-1 rounded border border-gray-300 text-sm hover:bg-white disabled:opacity-40"
                >
                  Өмнөх
                </button>
                <span className="px-3 py-1 text-sm text-gray-700">{page} / {data.totalPages}</span>
                <button
                  onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))}
                  disabled={page === data.totalPages}
                  className="px-3 py-1 rounded border border-gray-300 text-sm hover:bg-white disabled:opacity-40"
                >
                  Дараах
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Хэрэглэгч үүсгэх modal */}
      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="Шинэ хэрэглэгч үүсгэх">
        <CreateUserModal onClose={() => setShowCreate(false)} />
      </Modal>
    </div>
  )
}
