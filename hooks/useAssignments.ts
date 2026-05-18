'use client'

import { useQuery, useMutation, useQueryClient } from 'react-query'
import { apiClient } from '@/lib/api/api-client'
import { endpoints } from '@/lib/api/endpoints'
import { Assignment } from '@/types/models'
import { ApiResponse, PaginatedResponse, CreateAssignmentRequest } from '@/types/api'

export function useAssignments(page = 1, limit = 10) {
  return useQuery(['assignments', page, limit], async () => {
    const res = await apiClient.get<ApiResponse<PaginatedResponse<Assignment>>>(
      `${endpoints.assignments.list}?page=${page}&limit=${limit}`,
    )
    return res.data.data!
  })
}

export function useAssignment(id: string) {
  return useQuery(['assignment', id], async () => {
    const res = await apiClient.get<ApiResponse<Assignment>>(endpoints.assignments.get(id))
    return res.data.data!
  }, { enabled: !!id })
}

export function useCreateAssignment() {
  const qc = useQueryClient()
  return useMutation(
    async (data: CreateAssignmentRequest) => {
      const res = await apiClient.post<ApiResponse<Assignment>>(endpoints.assignments.create, data)
      return res.data.data!
    },
    { onSuccess: () => qc.invalidateQueries(['assignments']) },
  )
}

export function useUpdateAssignment() {
  const qc = useQueryClient()
  return useMutation(
    async ({ id, data }: { id: string; data: Partial<CreateAssignmentRequest> }) => {
      const res = await apiClient.put<ApiResponse<Assignment>>(endpoints.assignments.update(id), data)
      return res.data.data!
    },
    {
      onSuccess: (_data, { id }) => {
        qc.invalidateQueries(['assignments'])
        qc.invalidateQueries(['assignment', id])
      },
    },
  )
}

export function useDeleteAssignment() {
  const qc = useQueryClient()
  return useMutation(
    async (id: string) => {
      await apiClient.delete(endpoints.assignments.delete(id))
    },
    { onSuccess: () => qc.invalidateQueries(['assignments']) },
  )
}
