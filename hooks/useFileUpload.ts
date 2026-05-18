'use client'

import { useState } from 'react'
import { apiClient } from '@/lib/api/api-client'
import { endpoints } from '@/lib/api/endpoints'
import { ApiResponse } from '@/types/api'
import { Submission } from '@/types/models'

interface UploadOptions {
  assignmentId: string
  onSuccess?: (submission: Submission) => void
  onError?: (error: string) => void
}

export function useFileUpload({ assignmentId, onSuccess, onError }: UploadOptions) {
  const [isUploading, setIsUploading] = useState(false)
  const [progress, setProgress] = useState(0)

  const upload = async (file: File) => {
    setIsUploading(true)
    setProgress(0)

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('assignmentId', assignmentId)

      const res = await apiClient.post<ApiResponse<Submission>>(
        endpoints.submissions.create,
        formData,
        {
          headers: { 'Content-Type': 'multipart/form-data' },
          onUploadProgress: (e) => {
            if (e.total) setProgress(Math.round((e.loaded * 100) / e.total))
          },
        },
      )

      onSuccess?.(res.data.data!)
    } catch (err) {
      onError?.(err instanceof Error ? err.message : 'Файл upload хийхэд алдаа гарлаа')
    } finally {
      setIsUploading(false)
      setProgress(0)
    }
  }

  return { upload, isUploading, progress }
}
