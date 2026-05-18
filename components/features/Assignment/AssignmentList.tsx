'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useAssignments, useDeleteAssignment } from '@/hooks/useAssignments'
import { Role } from '@/types/enums'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { AssignmentForm } from '@/components/forms/AssignmentForm'
import { formatDate } from '@/lib/utils'
import { Assignment } from '@/types/models'

interface AssignmentListProps {
  role: Role
}

export function AssignmentList({ role }: AssignmentListProps) {
  const [page, setPage] = useState(1)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Assignment | null>(null)

  const { data, isLoading, error } = useAssignments(page)
  const deleteAssignment = useDeleteAssignment()

  const isTeacher   = role === Role.TEACHER || role === Role.ADMIN
  const isLeadAdmin = role === Role.ADMIN || role === Role.LEAD_IV
  const isIv        = role === Role.IV
  const isLeadIv    = role === Role.LEAD_IV

  if (isLoading) return <div className="text-gray-500">Ачааллаж байна...</div>
  if (error)     return <div className="text-red-600">Алдаа: {(error as Error).message}</div>

  return (
    <div>
      {(isTeacher || isLeadIv) && (
        <div className="mb-4 flex justify-end">
          <Button onClick={() => setShowForm(true)}>
            {isLeadIv ? '+ Шинэ unit' : '+ Шинэ даалгавар'}
          </Button>
        </div>
      )}

      <div className="grid gap-4">
        {data?.items.map((assignment) => {
          const isAssignedToMe = role === Role.TEACHER && assignment.assignedTeacherId === undefined
          return (
            <Card key={assignment.id} className="hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold text-gray-900">{assignment.title}</h3>
                    {assignment.assignedTeacher && (
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                        Багш: {assignment.assignedTeacher.fullName}
                      </span>
                    )}
                    {!assignment.assignedTeacherId && isLeadIv && (
                      <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">
                        Багш оноогүй
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mt-1 line-clamp-2">{assignment.description}</p>
                  <div className="flex items-center gap-3 mt-3 text-xs text-gray-500 flex-wrap">
                    {!isLeadIv && <span>Үүсгэсэн: {assignment.teacher?.fullName}</span>}
                    {assignment.deadline && <span>Дуусах: {formatDate(assignment.deadline)}</span>}
                    <Badge label={`${assignment._count?.submissions ?? 0} тайлан`} variant="info" />
                    {(assignment.rubric?.criteria?.length ?? 0) === 0 && (
                      <span className="text-orange-500">⚠ Шалгуур нэмэгдээгүй</span>
                    )}
                  </div>
                </div>

                <div className="flex gap-2 ml-4 flex-wrap justify-end">
                  {/* Тайлан харах — ADMIN, TEACHER, LEAD_IV, IV */}
                  {(isTeacher || isLeadAdmin || isIv) && (
                    <Link href={`/dashboard/submissions?assignmentId=${assignment.id}`}>
                      <Button variant="ghost" size="sm">📁 Тайлангууд</Button>
                    </Link>
                  )}

                  {/* IV томилох + багш оноох — ADMIN, LEAD_IV */}
                  {isLeadAdmin && (
                    <Link href={`/dashboard/assignments/${assignment.id}`}>
                      <Button variant="ghost" size="sm">⚙ Удирдах</Button>
                    </Link>
                  )}

                  {/* Засах — TEACHER (өөрийнх), ADMIN, LEAD_IV */}
                  {(isTeacher || isLeadIv) && (
                    <Button variant="secondary" size="sm" onClick={() => setEditing(assignment)}>
                      Засах
                    </Button>
                  )}

                  {/* Устгах — TEACHER (өөрийнх), ADMIN */}
                  {isTeacher && !isAssignedToMe && (
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => deleteAssignment.mutate(assignment.id)}
                      isLoading={deleteAssignment.isLoading}
                    >
                      Устгах
                    </Button>
                  )}

                  {/* Тайлан илгээх — зөвхөн STUDENT */}
                  {!isTeacher && !isLeadAdmin && !isIv && (
                    <Link href={`/dashboard/upload?assignmentId=${assignment.id}`}>
                      <Button variant="secondary" size="sm">📤 Тайлан илгээх</Button>
                    </Link>
                  )}
                </div>
              </div>
            </Card>
          )
        })}

        {data?.items.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            {isTeacher || isLeadIv
              ? 'Даалгавар байхгүй байна. Шинэ даалгавар нэмнэ үү.'
              : 'Одоогоор даалгавар байхгүй байна.'}
          </div>
        )}
      </div>

      {data && data.totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-6">
          <Button variant="secondary" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>
            Өмнөх
          </Button>
          <span className="text-sm text-gray-600 self-center">{page} / {data.totalPages}</span>
          <Button variant="secondary" size="sm" disabled={page === data.totalPages} onClick={() => setPage(p => p + 1)}>
            Дараах
          </Button>
        </div>
      )}

      <Modal
        isOpen={showForm || !!editing}
        onClose={() => { setShowForm(false); setEditing(null) }}
        title={editing ? 'Даалгавар засах' : isLeadIv ? 'Шинэ unit' : 'Шинэ даалгавар'}
      >
        <AssignmentForm
          defaultValues={editing ?? undefined}
          onSuccess={() => { setShowForm(false); setEditing(null) }}
          role={role}
        />
      </Modal>
    </div>
  )
}
