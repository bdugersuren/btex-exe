'use client'

import { useQuery, useMutation, useQueryClient } from 'react-query'
import { apiClient } from '@/lib/api/api-client'
import { endpoints } from '@/lib/api/endpoints'
import { Evaluation } from '@/types/models'
import { ApiResponse, PaginatedResponse } from '@/types/api'

export function useEvaluations(page = 1, limit = 10, verifierMode = false) {
  return useQuery(['evaluations', page, limit, verifierMode], async () => {
    const params = new URLSearchParams({ page: String(page), limit: String(limit) })
    if (verifierMode) params.set('verifier', '1')
    const res = await apiClient.get<ApiResponse<PaginatedResponse<Evaluation>>>(
      `${endpoints.evaluations.list}?${params}`,
    )
    return res.data.data!
  })
}

export function useEvaluation(id: string) {
  return useQuery(['evaluation', id], async () => {
    const res = await apiClient.get<ApiResponse<Evaluation>>(endpoints.evaluations.get(id))
    return res.data.data!
  }, { enabled: !!id })
}

export function useEvaluate() {
  const qc = useQueryClient()
  return useMutation(
    async (submissionId: string) => {
      const res = await apiClient.post<ApiResponse<Evaluation>>(endpoints.evaluations.evaluate, { submissionId })
      return res.data.data!
    },
    {
      onSuccess: (_data, submissionId) => {
        qc.invalidateQueries(['evaluations'])
        qc.invalidateQueries(['submission', submissionId])
        qc.invalidateQueries(['submissions'])
      },
    },
  )
}

interface UpdateEvaluationInput {
  feedback?:     string
  strengths?:    string[]
  improvements?: string[]
}

export function useUpdateEvaluation(id: string) {
  const qc = useQueryClient()
  return useMutation(
    async (data: UpdateEvaluationInput) => {
      const res = await apiClient.put<ApiResponse<Evaluation>>(endpoints.evaluations.get(id), data)
      return res.data.data!
    },
    { onSuccess: () => qc.invalidateQueries(['evaluation', id]) },
  )
}

export function usePublishEvaluation() {
  const qc = useQueryClient()
  return useMutation(
    async (id: string) => {
      const res = await apiClient.post<ApiResponse<Evaluation>>(
        `${endpoints.evaluations.get(id)}/publish`,
        {},
      )
      return res.data.data!
    },
    {
      onSuccess: (_data, id) => {
        qc.invalidateQueries(['evaluation', id])
        qc.invalidateQueries(['evaluations'])
        qc.invalidateQueries(['submissions'])
      },
    },
  )
}
