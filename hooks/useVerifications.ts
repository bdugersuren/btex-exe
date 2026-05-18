'use client'

import { useQuery, useMutation, useQueryClient } from 'react-query'
import { apiClient } from '@/lib/api/api-client'

interface Verifier {
  id:       string
  fullName: string
  email:    string
}

interface AssignmentVerifierRecord {
  id:           string
  assignmentId: string
  verifierId:   string
  createdAt:    string
  verifier:     Verifier
}

interface ApiEnvelope<T> {
  success:   boolean
  data:      T
  timestamp: string
}

export function useAssignmentVerifiers(assignmentId: string) {
  return useQuery<AssignmentVerifierRecord[]>(
    ['verifiers', assignmentId],
    async () => {
      const res = await apiClient.get<ApiEnvelope<AssignmentVerifierRecord[]>>(
        `/assignments/${assignmentId}/verifiers`
      )
      return res.data.data
    },
    { enabled: !!assignmentId }
  )
}

export function useAddVerifier(assignmentId: string) {
  const queryClient = useQueryClient()
  return useMutation(
    (verifierId: string) =>
      apiClient.post(`/assignments/${assignmentId}/verifiers`, { verifierId }),
    { onSuccess: () => queryClient.invalidateQueries(['verifiers', assignmentId]) }
  )
}

export function useRemoveVerifier(assignmentId: string) {
  const queryClient = useQueryClient()
  return useMutation(
    (verifierId: string) =>
      apiClient.delete(`/assignments/${assignmentId}/verifiers`, { data: { verifierId } }),
    { onSuccess: () => queryClient.invalidateQueries(['verifiers', assignmentId]) }
  )
}

export function useVerifyEvaluation(evaluationId: string) {
  const queryClient = useQueryClient()
  return useMutation(
    (note?: string) =>
      apiClient.post(`/evaluations/${evaluationId}/verify`, { note }),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['evaluation', evaluationId])
        queryClient.invalidateQueries(['submission'])
        queryClient.invalidateQueries('evaluations')
      },
    }
  )
}
