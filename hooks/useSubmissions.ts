'use client'

import { useQuery, useMutation, useQueryClient } from 'react-query'
import { apiClient } from '@/lib/api/api-client'
import { endpoints } from '@/lib/api/endpoints'
import { Submission } from '@/types/models'
import { ApiResponse, PaginatedResponse } from '@/types/api'

export function useSubmissions(page = 1, limit = 20, assignmentId?: string) {
  const params = new URLSearchParams({ page: String(page), limit: String(limit) })
  if (assignmentId) params.set('assignmentId', assignmentId)

  return useQuery(['submissions', page, limit, assignmentId], async () => {
    const res = await apiClient.get<ApiResponse<PaginatedResponse<Submission>>>(
      `${endpoints.submissions.list}?${params}`,
    )
    return res.data.data!
  })
}

export function useSubmission(id: string) {
  return useQuery(['submission', id], async () => {
    const res = await apiClient.get<ApiResponse<Submission>>(endpoints.submissions.get(id))
    return res.data.data!
  }, { enabled: !!id })
}

export function useApproveResubmit() {
  const qc = useQueryClient()
  return useMutation(
    async ({ id, deadlineDays }: { id: string; deadlineDays?: number }) => {
      const res = await apiClient.patch<ApiResponse<Submission>>(
        endpoints.submissions.get(id),
        { action: 'approve-resubmit', deadlineDays: deadlineDays ?? 7 },
      )
      return res.data.data!
    },
    {
      onSuccess: (_data, { id }) => {
        qc.invalidateQueries(['submission', id])
        qc.invalidateQueries(['submissions'])
      },
    },
  )
}

export function useRejectResubmit() {
  const qc = useQueryClient()
  return useMutation(
    async ({ id }: { id: string }) => {
      const res = await apiClient.patch<ApiResponse<Submission>>(
        endpoints.submissions.get(id),
        { action: 'reject-resubmit' },
      )
      return res.data.data!
    },
    {
      onSuccess: (_data, { id }) => {
        qc.invalidateQueries(['submission', id])
        qc.invalidateQueries(['submissions'])
      },
    },
  )
}
