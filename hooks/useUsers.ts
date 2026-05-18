'use client'

import { useQuery, useMutation, useQueryClient } from 'react-query'
import { apiClient } from '@/lib/api/api-client'
import { Role } from '@/types/enums'

export interface UserItem {
  id:        string
  fullName:  string
  email:     string
  role:      Role
  isActive:  boolean
  createdAt: string
}

interface UsersResponse {
  items:      UserItem[]
  total:      number
  page:       number
  limit:      number
  totalPages: number
}

interface ApiEnvelope<T> {
  success:   boolean
  data:      T
  timestamp: string
}

export function useUsers(role?: Role, page = 1, limit = 20) {
  return useQuery<UsersResponse>(
    ['users', role, page],
    async () => {
      const params = new URLSearchParams({ page: String(page), limit: String(limit) })
      if (role) params.set('role', role)
      const res = await apiClient.get<ApiEnvelope<UsersResponse>>(`/users?${params}`)
      return res.data.data
    },
    { keepPreviousData: true }
  )
}

export function useCreateUser() {
  const queryClient = useQueryClient()
  return useMutation(
    (payload: { fullName: string; email: string; password: string; role: string }) =>
      apiClient.post<ApiEnvelope<UserItem>>('/users', payload),
    { onSuccess: () => queryClient.invalidateQueries('users') }
  )
}

export function useToggleUserActive() {
  const queryClient = useQueryClient()
  return useMutation(
    ({ id, isActive }: { id: string; isActive: boolean }) =>
      apiClient.patch<ApiEnvelope<UserItem>>(`/users/${id}`, { isActive }),
    { onSuccess: () => queryClient.invalidateQueries('users') }
  )
}

export function useChangeUserRole() {
  const queryClient = useQueryClient()
  return useMutation(
    ({ id, role }: { id: string; role: string }) =>
      apiClient.patch<ApiEnvelope<UserItem>>(`/users/${id}`, { role }),
    { onSuccess: () => queryClient.invalidateQueries('users') }
  )
}
