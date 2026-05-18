'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { useAssignmentVerifiers, useAddVerifier, useRemoveVerifier } from '@/hooks/useVerifications'
import { useUsers } from '@/hooks/useUsers'
import { useUpdateAssignment } from '@/hooks/useAssignments'
import { useAssignment } from '@/hooks/useAssignments'
import { Role } from '@/types/enums'
import { Badge } from '@/components/ui/Badge'

interface VerifierManagerProps {
  assignmentId: string
}

export function VerifierManager({ assignmentId }: VerifierManagerProps) {
  const [selectedVerifierId, setSelectedVerifierId] = useState('')
  const [selectedTeacherId,  setSelectedTeacherId]  = useState('')
  const [verifierError, setVerifierError] = useState('')
  const [teacherError,  setTeacherError]  = useState('')

  const { data: assignment, isLoading: assignmentLoading } = useAssignment(assignmentId)
  const { data: verifiers, isLoading: verifiersLoading }   = useAssignmentVerifiers(assignmentId)
  const { data: ivUsers }     = useUsers(Role.IV)
  const { data: teacherUsers} = useUsers(Role.TEACHER)
  const addVerifier            = useAddVerifier(assignmentId)
  const removeVerifier         = useRemoveVerifier(assignmentId)
  const updateAssignment       = useUpdateAssignment()

  const assignedIds  = new Set(verifiers?.map((v) => v.verifierId) ?? [])
  const availableIvs = ivUsers?.items.filter((u) => u.isActive && !assignedIds.has(u.id)) ?? []
  const availableTeachersAsVerifiers =
    teacherUsers?.items.filter((u) => u.isActive && !assignedIds.has(u.id)) ?? []
  const availableForVerifier = [...availableIvs, ...availableTeachersAsVerifiers]

  const activeTeachers = teacherUsers?.items.filter((t) => t.isActive) ?? []

  const handleAddVerifier = async () => {
    if (!selectedVerifierId) return
    setVerifierError('')
    try {
      await addVerifier.mutateAsync(selectedVerifierId)
      setSelectedVerifierId('')
    } catch (e) {
      setVerifierError((e as Error).message)
    }
  }

  const handleAssignTeacher = async () => {
    setTeacherError('')
    try {
      await updateAssignment.mutateAsync({
        id:   assignmentId,
        data: { assignedTeacherId: selectedTeacherId || null },
      })
      setSelectedTeacherId('')
    } catch (e) {
      setTeacherError((e as Error).message)
    }
  }

  if (assignmentLoading || verifiersLoading) {
    return <p className="text-sm text-gray-500">Ачааллаж байна...</p>
  }

  return (
    <div className="space-y-6">
      {/* Assign managing teacher */}
      <Card title="Удирдах багш оноох">
        <div className="mb-3">
          {assignment?.assignedTeacher ? (
            <div className="flex items-center gap-3 bg-blue-50 rounded-lg px-3 py-2">
              <span className="text-sm font-medium text-gray-900">
                {assignment.assignedTeacher.fullName}
              </span>
              <span className="text-xs text-gray-500">{assignment.assignedTeacher.email}</span>
              <Badge label="Одоогийн" variant="info" />
            </div>
          ) : (
            <p className="text-sm text-gray-400">Удирдах багш оноогдоогүй байна</p>
          )}
        </div>

        <div className="flex gap-2">
          <select
            value={selectedTeacherId}
            onChange={(e) => setSelectedTeacherId(e.target.value)}
            className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="">— Багш сонгох (хасахын тулд хоослох) —</option>
            {activeTeachers.map((t) => (
              <option key={t.id} value={t.id}>
                {t.fullName} ({t.email})
              </option>
            ))}
          </select>
          <Button
            onClick={handleAssignTeacher}
            isLoading={updateAssignment.isLoading}
            size="sm"
          >
            Хадгалах
          </Button>
        </div>
        {teacherError && <p className="text-sm text-red-600 mt-2">{teacherError}</p>}
      </Card>

      {/* Assign internal verifiers */}
      <Card title="Internal Verifier томилох">
        {verifiers && verifiers.length > 0 ? (
          <ul className="space-y-2 mb-4">
            {verifiers.map((v) => (
              <li key={v.id} className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2">
                <div>
                  <span className="text-sm font-medium text-gray-900">{v.verifier.fullName}</span>
                  <span className="text-xs text-gray-500 ml-2">{v.verifier.email}</span>
                </div>
                <button
                  onClick={() => removeVerifier.mutate(v.verifierId)}
                  disabled={removeVerifier.isLoading}
                  className="text-xs text-red-600 hover:text-red-800 disabled:opacity-40"
                >
                  Хасах
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-gray-400 mb-4">IV томилогдоогүй байна</p>
        )}

        {availableForVerifier.length > 0 && (
          <div className="flex gap-2">
            <select
              value={selectedVerifierId}
              onChange={(e) => setSelectedVerifierId(e.target.value)}
              className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">Баталгаажуулагч сонгох...</option>
              {availableIvs.length > 0 && (
                <optgroup label="IV хэрэглэгчид">
                  {availableIvs.map((u) => (
                    <option key={u.id} value={u.id}>{u.fullName} ({u.email})</option>
                  ))}
                </optgroup>
              )}
              {availableTeachersAsVerifiers.length > 0 && (
                <optgroup label="Багш нар">
                  {availableTeachersAsVerifiers.map((u) => (
                    <option key={u.id} value={u.id}>{u.fullName} ({u.email})</option>
                  ))}
                </optgroup>
              )}
            </select>
            <Button onClick={handleAddVerifier} isLoading={addVerifier.isLoading} size="sm">
              Томилох
            </Button>
          </div>
        )}
        {availableForVerifier.length === 0 && !verifiers?.length && (
          <p className="text-sm text-gray-400">Томилох хэрэглэгч байхгүй байна</p>
        )}
        {verifierError && <p className="text-sm text-red-600 mt-2">{verifierError}</p>}
      </Card>
    </div>
  )
}
